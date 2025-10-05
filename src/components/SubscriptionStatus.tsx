import React from 'react';
import { Crown, Calendar, CreditCard } from 'lucide-react';

interface SubscriptionStatusProps {
  subscription: {
    status: string;
    current_period_end: number;
    cancel_at_period_end: boolean;
    payment_method_brand?: string;
    payment_method_last4?: string;
  } | null;
  loading: boolean;
}

export function SubscriptionStatus({ subscription, loading }: SubscriptionStatusProps) {
  if (loading) {
    return (
      <div className="bg-white/90 dark:bg-white/10 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/20 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>
    );
  }

  if (!subscription || subscription.status !== 'active') {
    return null;
  }

  const endDate = new Date(subscription.current_period_end * 1000);
  const isExpiringSoon = endDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days

  return (
    <div className="bg-white/90 dark:bg-white/10 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/20 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Crown size={20} className="text-yellow-500" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Grraphic Pro</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center space-x-1">
                <Calendar size={14} />
                <span>
                  {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} {endDate.toLocaleDateString()}
                </span>
              </div>
              {subscription.payment_method_brand && subscription.payment_method_last4 && (
                <div className="flex items-center space-x-1">
                  <CreditCard size={14} />
                  <span>
                    {subscription.payment_method_brand.toUpperCase()} •••• {subscription.payment_method_last4}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
            subscription.cancel_at_period_end 
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          }`}>
            {subscription.cancel_at_period_end ? 'Canceling' : 'Active'}
          </span>
          {isExpiringSoon && !subscription.cancel_at_period_end && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              Renewing soon
            </p>
          )}
        </div>
      </div>
    </div>
  );
}