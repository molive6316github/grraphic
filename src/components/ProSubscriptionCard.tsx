import React, { useState } from 'react';
import { Crown, Check, Zap, Tag } from 'lucide-react';
import { STRIPE_PRODUCTS } from '../stripe-config';
import { supabase } from '../lib/supabase';

interface ProSubscriptionCardProps {
  onSubscribe: (discountCode?: string) => void;
  loading?: boolean;
}

export function ProSubscriptionCard({ onSubscribe, loading }: ProSubscriptionCardProps) {
  const product = STRIPE_PRODUCTS.grraphicPro;
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [discountDetails, setDiscountDetails] = useState<{
    percent: number;
    amount: number;
  } | null>(null);
  
  const proFeatures = [
    'Unlimited large file uploads (no size limits)',
    'AI-powered improvement ideas',
    'Priority analysis processing',
    'Advanced design insights',
    'Export detailed reports',
    'Priority customer support'
  ];

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }

    setValidatingDiscount(true);
    setDiscountError('');

    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        setDiscountError('Error validating discount code');
        setValidatingDiscount(false);
        return;
      }

      if (!data) {
        setDiscountError('Invalid discount code');
        setValidatingDiscount(false);
        return;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setDiscountError('This discount code has expired');
        setValidatingDiscount(false);
        return;
      }

      // Check if max uses reached
      if (data.max_uses && data.current_uses >= data.max_uses) {
        setDiscountError('This discount code has reached its maximum uses');
        setValidatingDiscount(false);
        return;
      }

      // Valid discount
      setDiscountApplied(true);
      setDiscountDetails({
        percent: data.discount_percent,
        amount: data.discount_amount
      });
      setDiscountError('');
    } catch (err) {
      console.error('Error applying discount:', err);
      setDiscountError('Failed to apply discount code');
    } finally {
      setValidatingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountCode('');
    setDiscountApplied(false);
    setDiscountDetails(null);
    setDiscountError('');
  };

  const handleSubscribe = () => {
    if (discountApplied && discountCode) {
      onSubscribe(discountCode);
    } else {
      onSubscribe();
    }
  };

  const calculateDiscountedPrice = () => {
    if (!discountDetails) return product.price;

    let finalPrice = parseFloat(product.price);

    if (discountDetails.percent > 0) {
      finalPrice = finalPrice * (1 - discountDetails.percent / 100);
    } else if (discountDetails.amount > 0) {
      finalPrice = finalPrice - (discountDetails.amount / 100);
    }

    return Math.max(0, finalPrice).toFixed(2);
  };

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
          {discountApplied ? (
            <div>
              <div className="text-lg text-gray-500 dark:text-gray-400 line-through">
                {product.currencySymbol}{product.price}
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {product.currencySymbol}{calculateDiscountedPrice()}
                </span>
                <span className="text-gray-600 dark:text-gray-300">/month</span>
              </div>
              {discountDetails && discountDetails.percent > 0 && (
                <div className="mt-1 text-sm font-semibold text-green-600 dark:text-green-400">
                  Save {discountDetails.percent}%!
                </div>
              )}
              {discountDetails && discountDetails.amount > 0 && (
                <div className="mt-1 text-sm font-semibold text-green-600 dark:text-green-400">
                  Save ${(discountDetails.amount / 100).toFixed(2)}!
                </div>
              )}
            </div>
          ) : (
            <div>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {product.currencySymbol}{product.price}
              </span>
              <span className="text-gray-600 dark:text-gray-300 ml-1">/month</span>
            </div>
          )}
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

      {/* Discount Code Section */}
      <div className="mb-4">
        {!discountApplied ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Have a discount code?
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleApplyDiscount()}
                placeholder="Enter code"
                disabled={loading || validatingDiscount}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
              <button
                onClick={handleApplyDiscount}
                disabled={loading || validatingDiscount || !discountCode.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <Tag size={16} />
                <span>{validatingDiscount ? 'Checking...' : 'Apply'}</span>
              </button>
            </div>
            {discountError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{discountError}</p>
            )}
          </div>
        ) : (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tag size={16} className="text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Discount code "{discountCode}" applied
                </span>
              </div>
              <button
                onClick={handleRemoveDiscount}
                className="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
      >
        <Zap size={20} />
        <span>
          {loading ? 'Processing...' : discountApplied
            ? `Subscribe for ${product.currencySymbol}${calculateDiscountedPrice()}/month`
            : `Subscribe for ${product.currencySymbol}${product.price}/month`
          }
        </span>
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
        Cancel anytime • Secure payment via Stripe
      </p>
    </div>
  );
}