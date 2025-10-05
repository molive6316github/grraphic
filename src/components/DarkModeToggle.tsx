import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface DarkModeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export function DarkModeToggle({ isDark, onToggle }: DarkModeToggleProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={onToggle}
        className="group relative flex items-center justify-center w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <div className="relative w-6 h-6">
          <Sun 
            size={24} 
            className={`absolute inset-0 text-yellow-500 transition-all duration-300 ${
              isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
            }`}
          />
          <Moon 
            size={24} 
            className={`absolute inset-0 text-blue-500 transition-all duration-300 ${
              isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
            }`}
          />
        </div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          {isDark ? 'Light mode' : 'Dark mode'}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
        </div>
      </button>
    </div>
  );
}