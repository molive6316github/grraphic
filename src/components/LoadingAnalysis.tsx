import React, { useState, useEffect } from 'react';
import { Eye, Palette, Layout, Sparkles, Target, Camera, Cpu } from 'lucide-react';

const characters = [
  { id: 1, icon: Eye, color: 'from-blue-500 to-cyan-500', name: 'Scout' },
  { id: 2, icon: Palette, color: 'from-purple-500 to-pink-500', name: 'Artist' },
  { id: 3, icon: Layout, color: 'from-green-500 to-emerald-500', name: 'Architect' },
  { id: 4, icon: Target, color: 'from-orange-500 to-red-500', name: 'Analyzer' },
];

const steps = [
  { label: 'Capturing screenshot...', icon: Camera, progress: 0 },
  { label: 'Processing image data...', icon: Cpu, progress: 25 },
  { label: 'Analyzing visual design...', icon: Eye, progress: 50 },
  { label: 'Evaluating UX patterns...', icon: Layout, progress: 75 },
  { label: 'Generating insights...', icon: Sparkles, progress: 95 },
];

export function LoadingAnalysis() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    return () => clearInterval(stepInterval);
  }, []);

  useEffect(() => {
    const targetProgress = steps[currentStep].progress;
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < targetProgress) {
          return Math.min(prev + 1, targetProgress);
        }
        return prev;
      });
    }, 30);

    return () => clearInterval(progressInterval);
  }, [currentStep]);

  const CurrentStepIcon = steps[currentStep].icon;

  return (
    <div className="glass-effect rounded-xl smooth-shadow-lg p-8 animate-scale-in overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-pulse"></div>

      <div className="relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full mb-6 shadow-2xl relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 opacity-20 animate-ping"></div>
            <CurrentStepIcon size={40} className="text-blue-600 dark:text-blue-400 animate-bounce" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Analyzing Your Design
          </h2>
          <p className="text-gray-700 dark:text-gray-200 text-lg font-medium">
            {steps[currentStep].label}
          </p>
        </div>

        <div className="mb-8">
          <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
              style={{ width: `${progress}%` }}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-lg animate-pulse"></div>
            </div>
          </div>
          <div className="text-right mt-2">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{progress}%</span>
          </div>
        </div>

        <div className="relative h-32 mb-6 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

          {characters.map((char, index) => {
            const CharIcon = char.icon;
            const position = ((progress * 2 + index * 20) % 100);
            const yOffset = Math.sin((progress + index * 30) * 0.1) * 10;

            return (
              <div
                key={char.id}
                className="absolute transition-all duration-300 ease-linear"
                style={{
                  left: `${position}%`,
                  bottom: `${20 + yOffset}px`,
                  transform: position > 95 ? 'scaleX(-1)' : 'scaleX(1)',
                }}
              >
                <div className={`relative w-12 h-12 bg-gradient-to-br ${char.color} rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform`}>
                  <CharIcon size={24} className="text-white" />
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-2 py-1 rounded text-xs font-bold whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                    {char.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isComplete = progress > step.progress;

            return (
              <div
                key={index}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 border-2
                  ${isActive
                    ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500 dark:border-blue-400 scale-105'
                    : isComplete
                    ? 'bg-green-500/10 border-green-500 dark:border-green-400'
                    : 'bg-gray-50 dark:bg-gray-800/50 border-transparent'
                  }
                `}
              >
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full shadow-md transition-all duration-300
                  ${isActive
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse'
                    : isComplete
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                    : 'bg-gray-300 dark:bg-gray-700'
                  }
                `}>
                  <StepIcon size={16} className="text-white" />
                </div>
                <span className={`text-xs font-semibold ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {step.label.replace('...', '')}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
            <Sparkles size={16} className="animate-spin" />
            AI is working its magic...
            <Sparkles size={16} className="animate-spin" style={{ animationDirection: 'reverse' }} />
          </p>
        </div>
      </div>
    </div>
  );
}
