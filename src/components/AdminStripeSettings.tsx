import React, { useState, useEffect } from 'react';
import { Settings, Copy, Check, AlertCircle } from 'lucide-react';

interface StripeKey {
  name: string;
  value: string;
  isSensitive: boolean;
}

export function AdminStripeSettings() {
  const [stripeKeys, setStripeKeys] = useState<StripeKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    // Load Stripe keys from environment or display placeholder
    const keys: StripeKey[] = [
      { name: 'STRIPE_SECRET_KEY', value: process.env.STRIPE_SECRET_KEY || 'Not configured', isSensitive: true },
      { name: 'STRIPE_PUBLISHABLE_KEY', value: process.env.STRIPE_PUBLISHABLE_KEY || 'Not configured', isSensitive: false },
      { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', value: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'Not configured', isSensitive: false },
    ];
    setStripeKeys(keys);
    setLoading(false);
  }, []);

  const copyToClipboard = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskValue = (value: string, isSensitive: boolean) => {
    if (!isSensitive || value === 'Not configured') return value;
    return value.slice(0, 7) + '•'.repeat(Math.max(0, value.length - 11)) + value.slice(-4);
  };

  if (loading) {
    return <div className="text-center py-8">Loading Stripe configuration...</div>;
  }

  const isConfigured = stripeKeys.every(k => k.value !== 'Not configured');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings size={24} className="text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Stripe Configuration</h2>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isConfigured 
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
        }`}>
          {isConfigured ? '✓ Configured' : '⚠ Not Configured'}
        </div>
      </div>

      {!isConfigured && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start space-x-3">
          <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">Setup Required</h3>
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
              Add your Stripe API keys to enable payments. Get these from your Stripe Dashboard.
            </p>
            <button
              onClick={() => setShowSetup(!showSetup)}
              className="text-sm text-amber-700 dark:text-amber-300 hover:underline mt-2"
            >
              {showSetup ? 'Hide' : 'Show'} Setup Instructions
            </button>
          </div>
        </div>
      )}

      {showSetup && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100">How to get your Stripe keys:</h4>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
            <li>Go to <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">Stripe Dashboard</a></li>
            <li>Click on "Developers" in the left menu</li>
            <li>Click on "API Keys"</li>
            <li>Copy your "Secret key" and "Publishable key"</li>
            <li>Add them to your Vercel environment variables</li>
          </ol>
        </div>
      )}

      <div className="grid gap-4">
        {stripeKeys.map((key) => (
          <div key={key.name} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{key.name}</label>
              {key.value !== 'Not configured' && (
                <button
                  onClick={() => copyToClipboard(key.name, key.value)}
                  className="flex items-center space-x-1 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 transition-colors"
                >
                  {copiedKey === key.name ? (
                    <>
                      <Check size={14} />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded font-mono text-sm text-gray-600 dark:text-gray-400 break-all">
              {maskValue(key.value, key.isSensitive)}
            </div>
            {key.value === 'Not configured' && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                Add {key.name} to your Vercel environment variables
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Stripe Features</h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-center space-x-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            <span>Checkout with Stripe Embedded Session</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className={isConfigured ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>✓</span>
            <span>Subscription management</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className={isConfigured ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>✓</span>
            <span>Discount code support</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className={isConfigured ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>✓</span>
            <span>Customer management</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className={isConfigured ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>✓</span>
            <span>Payment history tracking</span>
          </li>
        </ul>
      </div>

      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Test Mode</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          Use Stripe's test card numbers to test your integration:
        </p>
        <div className="space-y-1 text-xs font-mono bg-white dark:bg-gray-800 p-3 rounded">
          <div>Success: <span className="text-blue-600 dark:text-blue-400">4242 4242 4242 4242</span></div>
          <div>Decline: <span className="text-red-600 dark:text-red-400">4000 0000 0000 0002</span></div>
          <div>Any future expiry date and any CVC</div>
        </div>
      </div>
    </div>
  );
}
