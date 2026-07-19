import { supabase } from '../lib/supabase';

// Password strength validation
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return { valid: errors.length === 0, errors };
}

export function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  if (score <= 2) return { score, label: 'Weak', color: 'red' };
  if (score <= 4) return { score, label: 'Medium', color: 'yellow' };
  return { score, label: 'Strong', color: 'green' };
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Username validation
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  if (username.length > 30) {
    return { valid: false, error: 'Username must be less than 30 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
}

// Check if username is available (RPC avoids exposing user rows to anon)
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { data } = await supabase.rpc('is_username_available', { p_username: username });
  return data !== false;
}

// Request magic link (passwordless login)
export async function sendMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to send magic link' };
  }
}

// Session listing UI was never shipped and the user_sessions table does
// not exist; Supabase Auth manages sessions itself.
export async function getActiveSessions(): Promise<any[]> {
  return [];
}

export async function revokeSession(_sessionId: string): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Session management is handled by Supabase Auth' };
}

// Change password
export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  // Validate new password
  const validation = validatePassword(newPassword);
  if (!validation.valid) {
    return { success: false, error: validation.errors[0] };
  }
  
  // Update password
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

// Delete account
export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false, error: 'Not authenticated' };
  
  // Delete all user data (cascading deletes should handle related records)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', session.user.id);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  // Sign out
  await supabase.auth.signOut();
  
  return { success: true };
}

// Supabase Auth tracks sessions itself; nothing extra to record.
export async function trackLogin(_userId: string): Promise<void> {}

// Export session for use elsewhere
export { supabase };
