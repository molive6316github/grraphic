import React, { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, Calendar, DollarSign, Ticket } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Subscription {
  id: string;
  customer_id: string;
  subscription_id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  payment_method_brand: string;
  payment_method_last4: string;
}

interface SubscriptionWithUser extends Subscription {
  user_email: string;
}

export function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    canceled: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data: subsData, error } = await supabase
        .from('stripe_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const subscriptionsWithUsers = await Promise.all(
        (subsData || []).map(async (sub) => {
          const { data: customer } = await supabase
            .from('stripe_customers')
            .select('user_id')
            .eq('customer_id', sub.customer_id)
            .maybeSingle();

          let userEmail = 'Unknown';
          if (customer?.user_id) {
            const { data: user } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', customer.user_id)
              .maybeSingle();
            userEmail = user?.email || 'Unknown';
          }

          return {
            ...sub,
            user_email: userEmail
          };
        })
      );

      setSubscriptions(subscriptionsWithUsers);

      const activeCount = subscriptionsWithUsers.filter(s => s.status === 'active').length;
      const canceledCount = subscriptionsWithUsers.filter(s => s.cancel_at_period_end).length;

      setStats({
        active: activeCount,
        canceled: canceledCount,
        monthlyRevenue: activeCount * 9.99
      });
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Subscriptions</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp size={24} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Canceled</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.canceled}</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Calendar size={24} className="text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monthly Revenue</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">${stats.monthlyRevenue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">All Subscriptions</h2>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <CreditCard size={20} className="text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{sub.user_email}</p>
                    {sub.payment_method_brand && sub.payment_method_last4 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {sub.payment_method_brand} •••• {sub.payment_method_last4}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Payment info pending
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                    sub.status === 'active'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                  }`}>
                    {sub.status.toUpperCase()}
                  </span>
                  {sub.cancel_at_period_end && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">Cancels at period end</p>
                  )}
                </div>
              </div>
              {sub.current_period_start && sub.current_period_end && (
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <span>Period: {new Date(sub.current_period_start * 1000).toLocaleDateString()} - {new Date(sub.current_period_end * 1000).toLocaleDateString()}</span>
                  {sub.subscription_id && <span className="font-mono">{sub.subscription_id}</span>}
                </div>
              )}
            </div>
          ))}
          {subscriptions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No subscriptions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
