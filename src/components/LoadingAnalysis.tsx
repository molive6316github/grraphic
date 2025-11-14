import React from 'react';
import { Zap, Eye, Palette, Layout, Type, Target } from 'lucide-react';

const analysisSteps = [
  { icon: Eye, label: 'Analyzing composition', delay: 0 },
  { icon: Palette, label: 'Evaluating color harmony', delay: 300 },
  { icon: Type, label: 'Reviewing typography', delay: 600 },
  { icon: Layout, label: 'Checking hierarchy', delay: 900 },
  { icon: Target, label: 'Assessing contrast', delay: 1200 },
  { icon: Zap, label: 'Generating insights', delay: 1500 }
];

export function LoadingAnalysis() {
  return (
    <div className="glass-effect rounded-xl smooth-shadow-lg p-8 animate-scale-in">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-full mb-6 shadow-2xl animate-pulse">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Analyzing Your Design</h2>
        <p className="text-gray-700 dark:text-gray-200 text-lg font-medium">Our AI is reviewing your graphic design across multiple criteria</p>
      </div>

      <div className="space-y-4">
        {analysisSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={index}
              className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${step.delay}ms` }}
            >
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500/30 to-purple-600/30 rounded-full shadow-lg">
                <Icon size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-gray-800 dark:text-gray-100 font-semibold flex-1">{step.label}</span>
              <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 rounded-full"
                  style={{
                    animation: `loading ${2000 + step.delay}ms ease-in-out infinite`,
                    animationDelay: `${step.delay}ms`
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes loading {
          0%, 100% { width: 20%; }
          50% { width: 100%; }
        }
        
        .animate-fade-in {
          opacity: 0;
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}