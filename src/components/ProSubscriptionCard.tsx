import React from 'react';
import { Crown, Check, Zap } from 'lucide-react';
import { STRIPE_PRODUCTS } from '../stripe-config';

interface ProSubscriptionCardProps {
  onSubscribe: () => void;
  loading?: boolean;
}

export function ProSubscriptionCard({ onSubscribe, loading }: ProSubscriptionCardProps) {
  const product = STRIPE_PRODUCTS.grraphicPro;
  
  const proFeatures = [
    'Unlimited large file uploads (no size limits)',
    'AI-powered autofix suggestions',
    'Priority analysis processing',
    'Advanced design insights',
    'Export detailed reports',
    'Priority customer support'
  ];

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-xl shadow-xl border border-purple-200 dark:border-purple-500/30 p-6 transition-colors duration-300">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg mb-4 shadow-lg">
          <Crown size={24} className="text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {product.name}
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          {product.description}
        </p>
        <div className="mt-4">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {product.currencySymbol}{product.price}
          </span>
          <span className="text-gray-600 dark:text-gray-300 ml-1">/month</span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {proFeatures.map((feature, index) => (
          <div key={index} className="flex items-center space-x-3">
            <Check size={16} className="text-green-500 flex-shrink-0" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onSubscribe}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
      >
        <Zap size={20} />
        <span>{loading ? 'Processing...' : `Subscribe for ${product.currencySymbol}${product.price}/month`}</span>
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
        Cancel anytime • Secure payment via Stripe
      </p>
    </div>
  );
}