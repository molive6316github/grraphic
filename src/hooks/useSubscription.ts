import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface UserSubscription {
  subscription_status: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
  payment_method_brand?: string;
  payment_method_last4?: string;
}

export function useSubscription(userId: string | undefined) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchSubscription();
    }
  }, [userId]);

  const fetchSubscription = async () => {
    if (!userId || !isSupabaseConfigured()) return;
    
    setLoading(true);
    try {
      // The stripe_user_subscriptions view is already scoped to the
      // signed-in user (it joins stripe_customers on auth.uid()) and has
      // no user_id column to filter on.
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Warning fetching subscription:', error);
      }
      
      setSubscription(data as unknown as UserSubscription | null);
    } catch (error) {
      console.warn('Warning fetching subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    subscription,
    loading,
    refreshSubscription: fetchSubscription,
  };
}
