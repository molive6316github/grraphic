import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface UserCredits {
  pro_credits_remaining: number;
  pro_credits_reset_date: string;
  is_pro_subscriber: boolean;
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
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const isSpecialUser = userData?.user?.email === 'maxolive6316@gmail.com';
      
      // First, check if user exists and fetch current credits
      const { data, error } = await supabase
        .from('users')
        .select('pro_credits_remaining, pro_credits_reset_date')
        .eq('id', userId)
        .single();

      if (error) {
        // If user doesn't exist, create them
        if (error.code === 'PGRST116') {
          if (userError || !userData.user) {
            console.error('Error getting user data:', userError);
            setCredits(null);
            return;
          }
          
          try {
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: userData.user.email,
              });
            
            if (insertError) {
              console.error('Error creating user:', insertError);
              setCredits(null);
              return;
            }
            
            // After creating user, reset monthly credits and fetch
            await supabase.rpc('reset_monthly_credits');
            
            const { data: newUserData, error: fetchError } = await supabase
              .from('users')
              .select('pro_credits_remaining, pro_credits_reset_date')
              .eq('id', userId)
              .single();
            
            if (fetchError) {
              console.error('Error fetching new user credits:', fetchError);
              setCredits(null);
              return;
            }
            
            setCredits({
              ...newUserData,
              is_pro_subscriber: isSpecialUser
            });
            return;
          } catch (createError) {
            console.error('Error in user creation process:', createError);
            setCredits(null);
            return;
          }
        }
        throw error;
      }
      
      // User exists, reset monthly credits if needed then set credits
      await supabase.rpc('reset_monthly_credits');
      
      // Check for active Stripe subscription separately if tables exist
      let hasActiveSubscription = false;
      if (!isSpecialUser) {
        try {
          const { data: subscriptionData } = await supabase
            .from('stripe_user_subscriptions')
            .select('subscription_status')
            .maybeSingle();
          
          hasActiveSubscription = subscriptionData?.subscription_status === 'active';
        } catch (subscriptionError) {
          // Stripe tables don't exist or user has no subscription, continue without error
          hasActiveSubscription = false;
        }
      }
      
      const isProSubscriber = isSpecialUser || hasActiveSubscription;
      setCredits({
        pro_credits_remaining: data.pro_credits_remaining,
        pro_credits_reset_date: data.pro_credits_reset_date,
        is_pro_subscriber: isProSubscriber
      });
    } catch (error) {
      console.error('Error fetching credits:', error);
      setCredits(null);
    } finally {
      setLoading(false);
    }
  };

  const useProCredit = async (): Promise<boolean> => {
    if (!userId || !isSupabaseConfigured() || !credits) return false;

    // Special user doesn't consume credits
    const { data: userData } = await supabase.auth.getUser();
    const isSpecialUser = userData?.user?.email === 'maxolive6316@gmail.com';
    
    if (isSpecialUser) {
      return true; // Always allow for special user without consuming credits
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ 
          pro_credits_remaining: Math.max(0, credits.pro_credits_remaining - 1) 
        })
        .eq('id', userId)
        .select('pro_credits_remaining, pro_credits_reset_date')
        .single();

      if (error) throw error;
      
      // Check for active subscription again after credit use
      let hasActiveSubscription = false;
      if (!isSpecialUser) {
        try {
          const { data: subscriptionData } = await supabase
            .from('stripe_user_subscriptions')
            .select('subscription_status')
            .maybeSingle();
          
          hasActiveSubscription = subscriptionData?.subscription_status === 'active';
        } catch (subscriptionError) {
          hasActiveSubscription = false;
        }
      }
      
      const isProSubscriber = isSpecialUser || hasActiveSubscription;
      setCredits({
        pro_credits_remaining: data.pro_credits_remaining,
        pro_credits_reset_date: data.pro_credits_reset_date,
        is_pro_subscriber: isProSubscriber
      });
      return true;
    } catch (error) {
      console.error('Error using pro credit:', error);
      return false;
    }
  };

  // Check if user has pro access (either through subscription, credits, or special status)
  const hasProCredits = credits ? (credits.is_pro_subscriber || credits.pro_credits_remaining > 0) : false;

  return {
    credits,
    loading,
    hasProCredits,
    useProCredit,
    refreshCredits: fetchCredits,
  };
}