import React from 'react';
import { Sparkles, Check, Zap, Target, Palette, TrendingUp } from 'lucide-react';

interface DesignHelpLandingProps {
  onGetStarted: () => void;
  onShowAuth: () => void;
  user: any;
}

export function DesignHelpLanding({ onGetStarted, onShowAuth, user }: DesignHelpLandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl mb-6 shadow-lg">
            <Sparkles size={40} className="text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Professional Design Help
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 mt-2">
              Powered by AI
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Get instant, expert feedback on your graphic designs. Upload your work and receive comprehensive analysis on composition, colors, typography, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
              >
                Start Analyzing Designs
              </button>
            ) : (
              <>
                <button
                  onClick={onGetStarted}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
                >
                  Try Free Now
                </button>
                <button
                  onClick={onShowAuth}
                  className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold rounded-lg transition-all duration-300 hover:bg-emerald-50 dark:hover:bg-gray-700 text-lg"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4">
              <Target size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Instant Analysis
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Upload your design and get comprehensive feedback in seconds. No waiting, no complexity.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
              <Palette size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Expert Insights
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Get professional-level critiques on color theory, composition, typography, and visual hierarchy.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Improve Your Skills
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Learn from detailed feedback and watch your design skills improve with every analysis.
            </p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            What You'll Get
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              'Detailed composition analysis',
              'Color harmony evaluation',
              'Typography review',
              'Visual hierarchy assessment',
              'Contrast and accessibility checks',
              'Actionable improvement suggestions',
              'Save and track your progress',
              'Share your best work publicly'
            ].map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mt-0.5">
                  <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl p-8 text-center text-white shadow-xl">
          <Zap size={48} className="mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">
            Ready to Improve Your Designs?
          </h2>
          <p className="text-xl mb-6 text-emerald-50">
            Join thousands of designers getting professional feedback instantly
          </p>
          <button
            onClick={user ? onGetStarted : onShowAuth}
            className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-lg hover:bg-gray-50"
          >
            {user ? 'Start Now' : 'Get Started Free'}
          </button>
        </div>
      </div>
    </div>
  );
}
