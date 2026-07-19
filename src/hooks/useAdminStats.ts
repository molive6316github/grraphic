import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AdminStats {
  totalUsers: number;
  totalAnalyses: number;
  proSubscribers: number;
  totalRevenue: number;
  recentUsers: Array<{
    id: string;
    email: string;
    username: string;
    created_at: string;
    subscription_tier: string;
  }>;
  recentAnalyses: Array<{
    id: string;
    file_name: string;
    created_at: string;
    user_email: string;
  }>;
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [
        { count: totalUsers },
        { count: totalAnalyses },
        { count: proSubscribers },
        { data: recentUsers },
        { data: recentAnalyses }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('design_analyses').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_tier', 'pro'),
        supabase
          .from('profiles')
          .select('id, email, username, created_at, subscription_tier')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('design_analyses')
          .select('id, file_name, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      const analysesWithUsers = await Promise.all(
        (recentAnalyses || []).map(async (analysis) => {
          const { data: user } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', analysis.user_id)
            .maybeSingle();

          return {
            ...analysis,
            user_email: user?.email || 'Unknown'
          };
        })
      );

      setStats({
        totalUsers: totalUsers || 0,
        totalAnalyses: totalAnalyses || 0,
        proSubscribers: proSubscribers || 0,
        totalRevenue: 0,
        recentUsers: (recentUsers || []) as any,
        recentAnalyses: analysesWithUsers
      });
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refetch: fetchStats };
}
