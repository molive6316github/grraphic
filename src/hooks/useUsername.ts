import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useUsername(userId: string | undefined) {
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUsername();
    }
  }, [userId]);

  const fetchUsername = async () => {
    if (!userId || !isSupabaseConfigured()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setUsername(data.username || '');
      }
    } catch (err) {
      console.error('Error fetching username:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUsername = async (newUsername: string) => {
    if (!userId || !isSupabaseConfigured()) return false;

    // Validate username
    const trimmedUsername = newUsername.trim();
    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    if (trimmedUsername.length > 20) {
      setError('Username must be less than 20 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: trimmedUsername })
        .eq('id', userId);

      if (error) {
        if (error.code === '23505') {
          setError('Username already taken');
        } else {
          throw error;
        }
        return false;
      }

      setUsername(trimmedUsername);
      return true;
    } catch (err) {
      console.error('Error updating username:', err);
      setError('Failed to update username');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    username,
    loading,
    error,
    updateUsername,
    clearError: () => setError(null),
  };
}
