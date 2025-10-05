import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">Last updated: October 5, 2025</p>

          <div className="prose prose-blue dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Introduction</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Welcome to Grraphic. We respect your privacy and are committed to protecting your personal data.
                This privacy policy explains how we collect, use, and safeguard your information when you use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Information We Collect</h2>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Personal Information</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Email address (for authentication)</li>
                <li>Username (optional, chosen by you)</li>
                <li>Authentication data (password hash, OAuth tokens)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 mt-4">Usage Data</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Design files you upload for analysis</li>
                <li>Analysis history and results</li>
                <li>Subscription and payment information</li>
                <li>Usage statistics and preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 mt-4">Technical Data</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>IP address</li>
                <li>Cookies and similar technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">How We Use Your Information</h2>
              <p className="text-gray-700 dark:text-gray-300">We use your information to:</p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Provide and maintain our service</li>
                <li>Process your design analyses using AI</li>
                <li>Manage your account and subscription</li>
                <li>Send important service updates</li>
                <li>Improve our service and user experience</li>
                <li>Prevent fraud and abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Data Storage and Security</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Your data is stored securely using industry-standard encryption. We use Supabase for our database,
                which employs row-level security to ensure your data is protected. Passwords are hashed and never
                stored in plain text.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-3">
                Design files are processed through Google's Gemini AI and are not permanently stored by Google.
                Analysis results are saved to your account for your reference.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Data Sharing</h2>
              <p className="text-gray-700 dark:text-gray-300">We share your data with:</p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li><strong>Google Gemini AI</strong> - For processing design analysis</li>
                <li><strong>Supabase</strong> - For secure data storage and authentication</li>
                <li><strong>Stripe</strong> - For payment processing (if you subscribe)</li>
                <li><strong>Google OAuth</strong> - If you sign in with Google</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-3">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Your Rights</h2>
              <p className="text-gray-700 dark:text-gray-300">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
                <li>Opt out of marketing communications</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Public Sharing</h2>
              <p className="text-gray-700 dark:text-gray-300">
                You can choose to make your design analyses public. When you do, the analysis results and associated
                design file become accessible via a unique URL that anyone can view. You can toggle this setting on or
                off at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Cookies</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We use cookies and similar technologies to maintain your session, remember your preferences (like dark mode),
                and analyze usage patterns. You can control cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Children's Privacy</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal
                information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Changes to This Policy</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We may update this privacy policy from time to time. We will notify you of any changes by posting the
                new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Contact Us</h2>
              <p className="text-gray-700 dark:text-gray-300">
                If you have questions about this privacy policy or your personal data, please contact us at:
              </p>
              <p className="text-blue-600 dark:text-blue-400 mt-2">
                privacy@grraphic.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
