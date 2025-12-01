/*
  # Create Gradi Chat Sessions

  1. New Tables
    - `gradi_chat_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text) - Auto-generated or user-set chat title
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `gradi_messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to gradi_chat_sessions)
      - `user_id` (uuid, foreign key to auth.users)
      - `role` (text) - 'user' or 'assistant'
      - `content` (text) - Message content
      - `image_url` (text, optional) - Attached image
      - `code_snippet` (text, optional) - Code from coding tools
      - `created_at` (timestamptz)

    - `gradi_usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `message_count` (integer) - Total messages sent this month
      - `last_reset` (timestamptz) - Last time counter was reset
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own chat sessions
    - Users can only see their own messages
    - Users can only see their own usage stats

  3. Indexes
    - Index on user_id for fast lookups
    - Index on session_id for message retrieval
    - Index on created_at for sorting
*/

-- Create gradi_chat_sessions table
CREATE TABLE IF NOT EXISTS gradi_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'New Chat',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create gradi_messages table
CREATE TABLE IF NOT EXISTS gradi_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES gradi_chat_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  image_url text,
  code_snippet text,
  created_at timestamptz DEFAULT now()
);

-- Create gradi_usage table
CREATE TABLE IF NOT EXISTS gradi_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  message_count integer DEFAULT 0,
  last_reset timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE gradi_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gradi_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE gradi_usage ENABLE ROW LEVEL SECURITY;

-- Policies for gradi_chat_sessions
CREATE POLICY "Users can view own chat sessions"
  ON gradi_chat_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions"
  ON gradi_chat_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON gradi_chat_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
  ON gradi_chat_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for gradi_messages
CREATE POLICY "Users can view own messages"
  ON gradi_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own messages"
  ON gradi_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON gradi_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for gradi_usage
CREATE POLICY "Users can view own usage"
  ON gradi_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON gradi_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON gradi_usage FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gradi_chat_sessions_user_id ON gradi_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_gradi_chat_sessions_created_at ON gradi_chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gradi_messages_session_id ON gradi_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_gradi_messages_user_id ON gradi_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_gradi_messages_created_at ON gradi_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_gradi_usage_user_id ON gradi_usage(user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_gradi_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on gradi_chat_sessions
DROP TRIGGER IF EXISTS update_gradi_chat_sessions_updated_at ON gradi_chat_sessions;
CREATE TRIGGER update_gradi_chat_sessions_updated_at
  BEFORE UPDATE ON gradi_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_gradi_session_updated_at();
