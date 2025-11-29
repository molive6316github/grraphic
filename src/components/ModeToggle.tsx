import React from 'react';
import { Palette, Monitor } from 'lucide-react';
import { AnalysisMode } from '../types';

interface ModeToggleProps {
  mode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="glass-effect rounded-xl p-2 inline-flex gap-1 smooth-shadow animate-fade-in">
      <button
        onClick={() => onModeChange('design')}
        className={`
          flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300
          ${mode === 'design'
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }
        `}
      >
        <Palette size={20} />
        <span>Design Mode</span>
      </button>
      <button
        onClick={() => onModeChange('ui')}
        className={`
          flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300
          ${mode === 'ui'
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }
        `}
      >
        <Monitor size={20} />
        <span>UI Mode</span>
      </button>
    </div>
  );
}
