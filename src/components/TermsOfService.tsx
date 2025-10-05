import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export function TermsOfService({ onBack }: TermsOfServiceProps) {
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Terms of Service</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">Last updated: October 5, 2025</p>

          <div className="prose prose-blue dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Agreement to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300">
                By accessing or using Grraphic, you agree to be bound by these Terms of Service. If you disagree
                with any part of these terms, you may not access the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Description of Service</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Grraphic is an AI-powered design analysis tool that provides feedback on graphic designs. The service
                uses artificial intelligence to analyze uploaded designs and provide insights on composition, color theory,
                typography, and other design elements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">User Accounts</h2>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Account Creation</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the security of your account</li>
                <li>You must be at least 13 years old to use this service</li>
                <li>One person or legal entity may maintain no more than one free account</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 mt-4">Account Responsibilities</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>You are responsible for all activity under your account</li>
                <li>You must notify us immediately of any unauthorized access</li>
                <li>We reserve the right to terminate accounts that violate these terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Subscription and Payment</h2>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Free Tier</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Free accounts include 10 design analyses per month and support files up to 3MB.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 mt-4">Pro Subscription</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Pro subscriptions are billed monthly</li>
                <li>Subscriptions automatically renew unless cancelled</li>
                <li>You can cancel your subscription at any time</li>
                <li>Refunds are not provided for partial months</li>
                <li>All fees are exclusive of taxes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Acceptable Use</h2>
              <p className="text-gray-700 dark:text-gray-300">You agree not to:</p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Upload content that is illegal, harmful, or violates others' rights</li>
                <li>Upload content containing malware or viruses</li>
                <li>Use the service for unauthorized commercial purposes</li>
                <li>Attempt to circumvent usage limits or restrictions</li>
                <li>Reverse engineer or attempt to extract the source code</li>
                <li>Use automated systems to access the service excessively</li>
                <li>Impersonate others or misrepresent your affiliation</li>
                <li>Harass, abuse, or harm other users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Content and Intellectual Property</h2>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Your Content</h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>You retain all rights to the designs you upload</li>
                <li>You grant us a license to process and store your designs for providing the service</li>
                <li>You are responsible for having the right to upload and analyze the content</li>
                <li>Public analyses can be viewed by anyone with the link</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 mt-4">Our Content</h3>
              <p className="text-gray-700 dark:text-gray-300">
                The service, including its design, features, and functionality, is owned by Grraphic and protected
                by copyright, trademark, and other laws. You may not copy, modify, or create derivative works without permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">AI-Generated Analysis</h2>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                <li>Analysis is generated by AI and should be used as guidance, not absolute truth</li>
                <li>We do not guarantee the accuracy, completeness, or reliability of any analysis</li>
                <li>You should not rely solely on AI analysis for professional decisions</li>
                <li>Results may vary based on image quality and other factors</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Disclaimers</h2>
              <p className="text-gray-700 dark:text-gray-300">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Limitation of Liability</h2>
              <p className="text-gray-700 dark:text-gray-300">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Termination</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We may terminate or suspend your account immediately, without prior notice, for any reason, including
                violation of these Terms. Upon termination, your right to use the service will cease immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Changes to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300">
                We reserve the right to modify these terms at any time. We will notify users of any material changes
                by posting a notice on the service. Continued use of the service after changes constitutes acceptance
                of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Governing Law</h2>
              <p className="text-gray-700 dark:text-gray-300">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which
                Grraphic operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Contact</h2>
              <p className="text-gray-700 dark:text-gray-300">
                If you have any questions about these Terms, please contact us at:
              </p>
              <p className="text-blue-600 dark:text-blue-400 mt-2">
                legal@grraphic.com
              </p>
            </section>

            <section className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                By using Grraphic, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
