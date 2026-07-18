import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface UserCredits {
  subscription_tier: 'free' | 'pro' | 'enterprise';
  is_admin: boolean;
  is_pro_subscriber: boolean;
  pro_credits_remaining: number;
  pro_credits_reset_date: string;
}

function nextMonthStart(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
}

export function useCredits(userId: string | undefined) {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCredits = useCallback(async () => {
    if (!userId || !isSupabaseConfigured()) return;

    setLoading(true);
    try {
      const [{ data: userRow, error: userError }, { data: adminFlag }] = await Promise.all([
        supabase
          .from('users')
          .select('is_pro_subscriber, pro_subscription_expires_at, pro_credits_remaining, pro_credits_reset_date')
          .eq('id', userId)
          .maybeSingle(),
        supabase.rpc('is_user_admin', { check_user_id: userId }),
      ]);

      if (userError) throw userError;

      const isAdmin = adminFlag === true;

      const proActive = !!userRow?.is_pro_subscriber &&
        (!userRow.pro_subscription_expires_at || new Date(userRow.pro_subscription_expires_at) > new Date());

      // Also honor an active Stripe subscription
      let stripeActive = false;
      try {
        const { data: subscriptionData } = await supabase
          .from('stripe_user_subscriptions')
          .select('subscription_status')
          .maybeSingle();
        stripeActive = subscriptionData?.subscription_status === 'active';
      } catch {
        stripeActive = false;
      }

      const isPro = proActive || stripeActive || isAdmin;

      setCredits({
        subscription_tier: isPro ? 'pro' : 'free',
        is_admin: isAdmin,
        is_pro_subscriber: isPro,
        pro_credits_remaining: userRow?.pro_credits_remaining ?? 10,
        pro_credits_reset_date: userRow?.pro_credits_reset_date ?? nextMonthStart(),
      });
    } catch (error) {
      console.error('Error fetching credits:', error);
      setCredits(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchCredits();
    } else {
      setCredits(null);
    }
  }, [userId, fetchCredits]);

  // Spend one pro credit (free users only — pros and admins are unlimited)
  const useProCredit = useCallback(async (): Promise<boolean> => {
    if (!userId || !credits) return false;
    if (credits.is_pro_subscriber || credits.is_admin) return true;
    if (credits.pro_credits_remaining <= 0) return false;

    const { error } = await supabase
      .from('users')
      .update({ pro_credits_remaining: credits.pro_credits_remaining - 1 })
      .eq('id', userId);

    if (error) {
      console.error('Error using pro credit:', error);
      return false;
    }

    setCredits({ ...credits, pro_credits_remaining: credits.pro_credits_remaining - 1 });
    return true;
  }, [userId, credits]);

  // Check if user has pro access (subscription, admin, or credits left)
  const hasProCredits = credits ? (
    credits.is_pro_subscriber ||
    credits.is_admin ||
    credits.pro_credits_remaining > 0
  ) : false;

  return {
    credits,
    loading,
    hasProCredits,
    useProCredit,
    refreshCredits: fetchCredits,
  };
}
