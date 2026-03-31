import React from 'react';

interface FooterProps {
  onPrivacyClick: () => void;
  onTermsClick: () => void;
}

export function Footer({ onPrivacyClick, onTermsClick }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/10 mt-auto">
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-sm text-gray-400">
              {currentYear} Grraphic. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-8 text-sm">
            <button
              onClick={onPrivacyClick}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              Privacy
            </button>
            <button
              onClick={onTermsClick}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              Terms
            </button>
            <a
              href="mailto:support@grraphic.com"
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
