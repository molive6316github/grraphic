import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface UserCredits {
  subscription_tier: 'free' | 'pro' | 'enterprise';
  is_admin: boolean;
}

export function useCredits(userId: string | undefined) {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchCredits();
    }
  }, [userId]);

  const fetchCredits = async () => {
    if (!userId || !isSupabaseConfigured()) return;
    
    setLoading(true);
    try {
      // Check if this is the special user with permanent Pro access
      const { data: userData } = await supabase.auth.getUser();
      const isSpecialUser = userData?.user?.email === 'maxolive6316@gmail.com';
      
      // Fetch user profile
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier, is_admin')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist, create default
        if (error.code === 'PGRST116') {
          setCredits({
            subscription_tier: isSpecialUser ? 'pro' : 'free',
            is_admin: isSpecialUser
          });
          return;
        }
        throw error;
      }
      
      // Check for active Stripe subscription
      let hasActiveSubscription = false;
      if (!isSpecialUser) {
        try {
          const { data: subscriptionData } = await supabase
            .from('stripe_user_subscriptions')
            .select('subscription_status')
            .maybeSingle();
          
          hasActiveSubscription = subscriptionData?.subscription_status === 'active';
        } catch {
          // Stripe tables don't exist or user has no subscription
          hasActiveSubscription = false;
        }
      }
      
      // Determine final subscription tier
      let tier = data.subscription_tier || 'free';
      if (isSpecialUser || hasActiveSubscription) {
        tier = 'pro';
      }
      
      setCredits({
        subscription_tier: tier as 'free' | 'pro' | 'enterprise',
        is_admin: data.is_admin || isSpecialUser
      });
    } catch (error) {
      console.error('Error fetching credits:', error);
      setCredits(null);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has pro access
  const hasProCredits = credits ? (
    credits.subscription_tier === 'pro' || 
    credits.subscription_tier === 'enterprise' ||
    credits.is_admin
  ) : false;

  return {
    credits,
    loading,
    hasProCredits,
    refreshCredits: fetchCredits,
  };
}
