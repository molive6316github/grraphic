import React from 'react';
import { Crown, Calendar, Info } from 'lucide-react';
import { UserCredits } from '../hooks/useCredits';

interface CreditsDisplayProps {
  credits: UserCredits | null;
  loading: boolean;
}

export function CreditsDisplay({ credits, loading }: CreditsDisplayProps) {
  if (loading) {
    return (
      <div className="bg-white/90 dark:bg-white/10 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/20 p-3 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      </div>
    );
  }

  if (!credits) return null;

  if (credits.is_pro_subscriber || credits.is_admin) {
    return (
      <div className="bg-white/90 dark:bg-white/10 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/20 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown size={16} className="text-yellow-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {credits.is_admin ? 'Pro (Lifetime)' : 'Pro Subscriber'}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
            <span>Unlimited large files</span>
          </div>
        </div>
      </div>
    );
  }

  const resetDate = new Date(credits.pro_credits_reset_date);
  const daysUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-white/90 dark:bg-white/10 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/20 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Crown size={16} className="text-yellow-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Pro Credits: {credits.pro_credits_remaining}/10
          </span>
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
          <Calendar size={12} />
          <span>{daysUntilReset}d until reset</span>
        </div>
      </div>
      
      {credits.pro_credits_remaining === 0 && (
        <div className="mt-2 flex items-start space-x-2 p-2 bg-yellow-50 dark:bg-yellow-500/20 rounded border border-yellow-200 dark:border-yellow-500/30">
          <Info size={14} className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            No pro credits remaining. Files over 3MB will be rejected until next month.
          </p>
        </div>
      )}
    </div>
  );
}