import React from 'react';
import { CheckCircle, Crown, ArrowRight } from 'lucide-react';

interface CheckoutSuccessProps {
  onContinue: () => void;
}

export function CheckoutSuccess({ onContinue }: CheckoutSuccessProps) {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white/90 dark:bg-white/10 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-white/20 p-8 text-center transition-colors duration-300">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
          <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to Grraphic Pro!
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Your subscription is now active. You can now enjoy unlimited large file uploads,
          AI-powered improvement ideas, and priority support.
        </p>
        
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-2 text-purple-600 dark:text-purple-400 mb-2">
            <Crown size={20} />
            <span className="font-semibold">Pro Features Unlocked</span>
          </div>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>✓ Unlimited large file uploads</li>
            <li>✓ AI improvement ideas</li>
            <li>✓ Priority analysis processing</li>
            <li>✓ Advanced design insights</li>
          </ul>
        </div>
        
        <button
          onClick={onContinue}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
        >
          <span>Start Analyzing Designs</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}