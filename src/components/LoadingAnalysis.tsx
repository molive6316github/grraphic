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
    <div className="bg-white/90 dark:bg-white/10 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-white/20 p-8 transition-colors duration-300">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full mb-4 shadow-lg">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Analyzing Your Design</h2>
        <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">Our AI is reviewing your graphic design across multiple criteria</p>
      </div>

      <div className="space-y-4">
        {analysisSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div
              key={index}
              className="flex items-center space-x-3 animate-fade-in"
              style={{ animationDelay: `${step.delay}ms` }}
            >
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full shadow-sm">
                <Icon size={16} className="text-blue-500" />
              </div>
              <span className="text-gray-700 dark:text-gray-200 font-medium transition-colors duration-300">{step.label}</span>
              <div className="flex-1 flex justify-end">
                <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden transition-colors duration-300">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"
                    style={{ 
                      animation: `loading ${2000 + step.delay}ms ease-in-out infinite`,
                      animationDelay: `${step.delay}ms`
                    }}
                  ></div>
                </div>
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