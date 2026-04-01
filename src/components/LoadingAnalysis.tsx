import React, { useState, useEffect } from 'react';
import { Eye, Palette, Layout, Sparkles, Target, Camera, Cpu, Lightbulb, Zap, CheckCircle2, Loader2 } from 'lucide-react';

interface LoadingAnalysisProps {
  mode?: 'design' | 'ui';
}

const designSteps = [
  { label: 'Analyzing composition', icon: Eye, description: 'Examining visual hierarchy and layout structure' },
  { label: 'Evaluating colors', icon: Palette, description: 'Checking color harmony and contrast ratios' },
  { label: 'Reviewing typography', icon: Layout, description: 'Assessing font choices and readability' },
  { label: 'Measuring balance', icon: Target, description: 'Analyzing visual weight distribution' },
  { label: 'Generating insights', icon: Sparkles, description: 'Compiling actionable feedback' },
];

const uiSteps = [
  { label: 'Capturing interface', icon: Camera, description: 'Taking a high-resolution screenshot' },
  { label: 'Processing visuals', icon: Cpu, description: 'Analyzing visual elements and patterns' },
  { label: 'Evaluating UX', icon: Layout, description: 'Checking usability and user flow' },
  { label: 'Testing accessibility', icon: Eye, description: 'Verifying WCAG compliance' },
  { label: 'Generating report', icon: Lightbulb, description: 'Creating detailed recommendations' },
];

export function LoadingAnalysis({ mode = 'design' }: LoadingAnalysisProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [pulseIntensity, setPulseIntensity] = useState(0);

  const steps = mode === 'ui' ? uiSteps : designSteps;
  const accentColor = mode === 'ui' ? 'blue' : 'purple';

  useEffect(() => {
    const stepDuration = 2500;
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, stepDuration);

    return () => clearInterval(stepInterval);
  }, [steps.length]);

  useEffect(() => {
    const progressPerStep = 100 / steps.length;
    const targetProgress = Math.min((currentStep + 1) * progressPerStep, 95);
    
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < targetProgress) {
          return Math.min(prev + 0.5, targetProgress);
        }
        return prev;
      });
    }, 30);

    return () => clearInterval(progressInterval);
  }, [currentStep, steps.length]);

  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseIntensity((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(pulseInterval);
  }, []);

  const CurrentIcon = steps[currentStep]?.icon || Sparkles;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-white/10 p-8 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Animated background glow */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: mode === 'ui' 
              ? `radial-gradient(ellipse at 50% 0%, rgba(59, 130, 246, ${0.1 + pulseIntensity * 0.001}) 0%, transparent 60%)`
              : `radial-gradient(ellipse at 50% 0%, rgba(168, 85, 247, ${0.1 + pulseIntensity * 0.001}) 0%, transparent 60%)`
          }}
        />

        {/* Main content */}
        <div className="relative z-10">
          {/* Header with animated icon */}
          <div className="text-center mb-10">
            <div className="relative inline-flex items-center justify-center mb-6">
              {/* Outer pulse ring */}
              <div 
                className={`absolute w-28 h-28 rounded-2xl ${mode === 'ui' ? 'bg-blue-500' : 'bg-purple-500'} opacity-20 animate-ping`}
                style={{ animationDuration: '2s' }}
              />
              {/* Inner glow */}
              <div className={`absolute w-24 h-24 rounded-2xl ${mode === 'ui' ? 'bg-blue-500/30' : 'bg-purple-500/30'} blur-xl`} />
              {/* Icon container */}
              <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center ${
                mode === 'ui' 
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
              } shadow-lg`}>
                <CurrentIcon size={36} className="text-white" />
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {mode === 'ui' ? 'Analyzing Website' : 'Analyzing Design'}
            </h2>
            <p className="text-gray-400 text-lg">
              {steps[currentStep]?.description}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">Progress</span>
              <span className="text-sm font-bold text-white">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  mode === 'ui' 
                    ? 'bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500' 
                    : 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500'
                }`}
                style={{ 
                  width: `${progress}%`,
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s linear infinite'
                }}
              />
            </div>
          </div>

          {/* Step indicators */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isComplete = index < currentStep;
              const isActive = index === currentStep;
              const isPending = index > currentStep;

              return (
                <div 
                  key={index}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? mode === 'ui'
                        ? 'bg-blue-500/10 border border-blue-500/30'
                        : 'bg-purple-500/10 border border-purple-500/30'
                      : isComplete
                      ? 'bg-green-500/5 border border-green-500/20'
                      : 'bg-white/5 border border-transparent'
                  }`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    isComplete 
                      ? 'bg-green-500/20' 
                      : isActive 
                      ? mode === 'ui' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                      : 'bg-white/5'
                  }`}>
                    {isComplete ? (
                      <CheckCircle2 size={20} className="text-green-400" />
                    ) : isActive ? (
                      <Loader2 size={20} className={`${mode === 'ui' ? 'text-blue-400' : 'text-purple-400'} animate-spin`} />
                    ) : (
                      <StepIcon size={20} className="text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      isComplete 
                        ? 'text-green-400' 
                        : isActive 
                        ? 'text-white' 
                        : 'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                  {isActive && (
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div 
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${mode === 'ui' ? 'bg-blue-400' : 'bg-purple-400'}`}
                          style={{
                            animation: 'bounce 1s ease-in-out infinite',
                            animationDelay: `${i * 0.15}s`
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer message */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <Zap size={14} className={mode === 'ui' ? 'text-blue-400' : 'text-purple-400'} />
              <span className="text-sm text-gray-400">AI is analyzing your {mode === 'ui' ? 'interface' : 'design'}...</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
