-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  key_prefix VARCHAR(12) NOT NULL, -- First 8 chars for display (grphc_xxx...)
  scopes TEXT[] DEFAULT ARRAY['read', 'write'],
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Usage tracking (daily quotas)
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  endpoint VARCHAR(100) NOT NULL,
  method VARCHAR(10) NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint, usage_date)
);

-- API Rate Limits (per minute tracking)
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(100) NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(api_key_id, endpoint, window_start)
);

-- User sessions for enhanced auth
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Magic link tokens
CREATE TABLE IF NOT EXISTS magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Two-factor authentication
CREATE TABLE IF NOT EXISTS user_2fa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  secret_encrypted TEXT NOT NULL,
  backup_codes TEXT[], -- Hashed backup codes
  is_enabled BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add email_verified column to users if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'email_verified') THEN
    ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'two_factor_enabled') THEN
    ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_date ON api_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint_date ON api_usage(endpoint, usage_date);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_key_window ON api_rate_limits(api_key_id, window_start);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_2fa ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_keys
DROP POLICY IF EXISTS "Users can view own API keys" ON api_keys;
CREATE POLICY "Users can view own API keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own API keys" ON api_keys;
CREATE POLICY "Users can create own API keys" ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own API keys" ON api_keys;
CREATE POLICY "Users can update own API keys" ON api_keys
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own API keys" ON api_keys;
CREATE POLICY "Users can delete own API keys" ON api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for api_usage
DROP POLICY IF EXISTS "Users can view own API usage" ON api_usage;
CREATE POLICY "Users can view own API usage" ON api_usage
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert API usage" ON api_usage;
CREATE POLICY "System can insert API usage" ON api_usage
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update API usage" ON api_usage;
CREATE POLICY "System can update API usage" ON api_usage
  FOR UPDATE USING (true);

-- RLS Policies for user_sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own sessions" ON user_sessions;
CREATE POLICY "Users can manage own sessions" ON user_sessions
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for email_verifications
DROP POLICY IF EXISTS "Users can view own verifications" ON email_verifications;
CREATE POLICY "Users can view own verifications" ON email_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for user_2fa
DROP POLICY IF EXISTS "Users can manage own 2FA" ON user_2fa;
CREATE POLICY "Users can manage own 2FA" ON user_2fa
  FOR ALL USING (auth.uid() = user_id);

-- Function to clean up expired data (run daily via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_api_data()
RETURNS void AS $$
BEGIN
  -- Delete expired sessions
  DELETE FROM user_sessions WHERE expires_at < NOW();
  
  -- Delete expired email verifications
  DELETE FROM email_verifications WHERE expires_at < NOW() AND verified_at IS NULL;
  
  -- Delete expired magic links
  DELETE FROM magic_links WHERE expires_at < NOW() AND used_at IS NULL;
  
  -- Delete old rate limit records (older than 1 hour)
  DELETE FROM api_rate_limits WHERE window_start < NOW() - INTERVAL '1 hour';
  
  -- Delete old usage records (keep 90 days for analytics)
  DELETE FROM api_usage WHERE usage_date < CURRENT_DATE - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get daily usage count for a user
CREATE OR REPLACE FUNCTION get_daily_usage(p_user_id UUID, p_endpoint VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COALESCE(request_count, 0) INTO v_count
  FROM api_usage
  WHERE user_id = p_user_id 
    AND endpoint = p_endpoint 
    AND usage_date = CURRENT_DATE;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_api_usage(p_user_id UUID, p_api_key_id UUID, p_endpoint VARCHAR, p_method VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO api_usage (user_id, api_key_id, endpoint, method, usage_date, request_count)
  VALUES (p_user_id, p_api_key_id, p_endpoint, p_method, CURRENT_DATE, 1)
  ON CONFLICT (user_id, endpoint, usage_date)
  DO UPDATE SET 
    request_count = api_usage.request_count + 1,
    updated_at = NOW()
  RETURNING request_count INTO v_count;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
