import React from 'react';
import { Sparkles, Info, Lightbulb, BookOpen, Award, ArrowRight } from 'lucide-react';

interface DesignInfoLandingProps {
  onGetStarted: () => void;
  onShowAuth: () => void;
  user: any;
}

export function DesignInfoLanding({ onGetStarted, onShowAuth, user }: DesignInfoLandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl mb-6 shadow-lg">
            <Info size={40} className="text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Design Information
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 mt-2">
              You Need to Know
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Unlock professional design insights with AI-powered analysis. Learn what makes great design work and how to improve your own creations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
              >
                Analyze Your Design
              </button>
            ) : (
              <>
                <button
                  onClick={onGetStarted}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
                >
                  Try It Free
                </button>
                <button
                  onClick={onShowAuth}
                  className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-purple-500 text-purple-600 dark:text-purple-400 font-semibold rounded-lg transition-all duration-300 hover:bg-purple-50 dark:hover:bg-gray-700 text-lg"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <BookOpen size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Learn Design Principles
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Discover the fundamental principles that make designs effective through detailed AI analysis.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mb-4">
              <Lightbulb size={24} className="text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Get Smart Insights
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Receive intelligent feedback that helps you understand why certain design choices work better than others.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
              <Award size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Grow Your Expertise
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Build your design knowledge with every analysis and become a better designer over time.
            </p>
          </div>
        </div>

        {/* Key Information Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Essential Design Information
          </h2>
          <div className="space-y-4">
            {[
              {
                title: 'Composition & Layout',
                description: 'Learn how elements are arranged and how balance affects visual impact'
              },
              {
                title: 'Color Theory',
                description: 'Understand color harmony, contrast, and psychological effects'
              },
              {
                title: 'Typography Mastery',
                description: 'Discover best practices for font selection, sizing, and spacing'
              },
              {
                title: 'Visual Hierarchy',
                description: 'See how to guide viewer attention through strategic design choices'
              },
              {
                title: 'Accessibility Standards',
                description: 'Ensure your designs work for everyone with contrast and readability checks'
              },
              {
                title: 'Professional Best Practices',
                description: 'Get insights aligned with industry standards and modern trends'
              }
            ].map((item, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <ArrowRight className="flex-shrink-0 text-purple-600 dark:text-purple-400 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Upload</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Drop your design file or click to browse
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Analyze</h3>
              <p className="text-gray-600 dark:text-gray-300">
                AI examines every aspect of your design
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Learn</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get detailed insights and actionable advice
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-8 text-center text-white shadow-xl">
          <Sparkles size={48} className="mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">
            Start Learning Today
          </h2>
          <p className="text-xl mb-6 text-purple-50">
            Get the design information you need to create stunning work
          </p>
          <button
            onClick={user ? onGetStarted : onShowAuth}
            className="px-8 py-4 bg-white text-purple-600 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-lg hover:bg-gray-50"
          >
            {user ? 'Start Analyzing' : 'Get Started Free'}
          </button>
        </div>
      </div>
    </div>
  );
}
