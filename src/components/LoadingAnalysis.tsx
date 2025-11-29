import React, { useState, useEffect } from 'react';
import { Eye, Palette, Layout, Sparkles, Target, Camera, Cpu, Zap, ImageIcon, Lightbulb } from 'lucide-react';

interface LoadingAnalysisProps {
  mode?: 'design' | 'ui';
}

const designHumans = [
  { id: 1, emoji: '🎨', name: 'Designer', speed: 1.2 },
  { id: 2, emoji: '👁️', name: 'Critic', speed: 0.8 },
  { id: 3, emoji: '✨', name: 'Creator', speed: 1.5 },
  { id: 4, emoji: '🖌️', name: 'Artist', speed: 1.0 },
  { id: 5, emoji: '🎭', name: 'Stylist', speed: 1.3 },
];

const uiHumans = [
  { id: 1, emoji: '🏃', name: 'Tester', speed: 1.4 },
  { id: 2, emoji: '👩‍💻', name: 'Developer', speed: 0.9 },
  { id: 3, emoji: '🔍', name: 'Inspector', speed: 1.1 },
  { id: 4, emoji: '🚀', name: 'Deployer', speed: 1.6 },
  { id: 5, emoji: '⚡', name: 'Optimizer', speed: 1.2 },
];

const designSteps = [
  { label: 'Analyzing composition...', icon: Eye, progress: 0 },
  { label: 'Evaluating color harmony...', icon: Palette, progress: 25 },
  { label: 'Checking typography...', icon: Layout, progress: 50 },
  { label: 'Assessing balance...', icon: Target, progress: 75 },
  { label: 'Generating feedback...', icon: Sparkles, progress: 95 },
];

const uiSteps = [
  { label: 'Capturing screenshot...', icon: Camera, progress: 0 },
  { label: 'Processing visual data...', icon: Cpu, progress: 25 },
  { label: 'Analyzing UX patterns...', icon: Layout, progress: 50 },
  { label: 'Evaluating accessibility...', icon: Eye, progress: 75 },
  { label: 'Generating insights...', icon: Lightbulb, progress: 95 },
];

export function LoadingAnalysis({ mode = 'design' }: LoadingAnalysisProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [humans, setHumans] = useState<Array<{
    id: number;
    emoji: string;
    name: string;
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    isJumping: boolean;
    direction: 'left' | 'right';
  }>>([]);

  const steps = mode === 'ui' ? uiSteps : designSteps;
  const humanData = mode === 'ui' ? uiHumans : designHumans;
  const modeColor = mode === 'ui'
    ? 'from-green-600 via-blue-600 to-purple-600'
    : 'from-pink-600 via-purple-600 to-blue-600';
  const modeTitle = mode === 'ui' ? 'Analyzing Website UI' : 'Analyzing Your Design';

  useEffect(() => {
    const initialHumans = humanData.map((human, index) => ({
      ...human,
      x: (index * 20) % 100,
      y: 50,
      velocityX: human.speed * (Math.random() > 0.5 ? 1 : -1),
      velocityY: 0,
      isJumping: false,
      direction: (Math.random() > 0.5 ? 'right' : 'left') as 'left' | 'right',
    }));
    setHumans(initialHumans);
  }, [mode]);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    return () => clearInterval(stepInterval);
  }, [steps.length]);

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
  }, [currentStep, steps]);

  useEffect(() => {
    const animationInterval = setInterval(() => {
      setHumans((prevHumans) =>
        prevHumans.map((human) => {
          let newX = human.x + human.velocityX * 0.5;
          let newY = human.y + human.velocityY;
          let newVelocityX = human.velocityX;
          let newVelocityY = human.velocityY;
          let newIsJumping = human.isJumping;
          let newDirection = human.direction;

          if (newX <= 0 || newX >= 95) {
            newVelocityX = -newVelocityX;
            newDirection = newVelocityX > 0 ? 'right' : 'left';
          }

          if (!human.isJumping && Math.random() > 0.97) {
            newIsJumping = true;
            newVelocityY = -8;
          }

          if (human.isJumping) {
            newVelocityY += 0.5;
            if (newY >= 50) {
              newY = 50;
              newVelocityY = 0;
              newIsJumping = false;
            }
          }

          return {
            ...human,
            x: Math.max(0, Math.min(95, newX)),
            y: Math.max(0, Math.min(50, newY)),
            velocityX: newVelocityX,
            velocityY: newVelocityY,
            isJumping: newIsJumping,
            direction: newDirection,
          };
        })
      );
    }, 50);

    return () => clearInterval(animationInterval);
  }, []);

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
          <h2 className={`text-3xl font-bold bg-gradient-to-r ${modeColor} bg-clip-text text-transparent mb-3`}>
            {modeTitle}
          </h2>
          <p className="text-gray-700 dark:text-gray-200 text-lg font-medium">
            {steps[currentStep].label}
          </p>
        </div>

        <div className="mb-8">
          <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
            <div
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${modeColor} rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2`}
              style={{ width: `${progress}%` }}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-lg animate-pulse"></div>
            </div>
          </div>
          <div className="text-right mt-2">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{progress}%</span>
          </div>
        </div>

        <div className="relative h-40 mb-6 bg-gradient-to-b from-sky-100 via-sky-50 to-green-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-green-200/50 to-transparent dark:from-green-900/30"></div>

          <div className="absolute top-4 left-4">
            <div className="w-12 h-12 bg-yellow-300 rounded-full shadow-lg"></div>
          </div>

          <div className="absolute bottom-4 left-0 right-0 h-1 bg-green-600 dark:bg-green-800"></div>

          {humans.map((human) => (
            <div
              key={human.id}
              className="absolute transition-all duration-100 ease-linear"
              style={{
                left: `${human.x}%`,
                bottom: `${100 - human.y}px`,
                transform: human.direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
              }}
            >
              <div className="relative group cursor-pointer">
                <div className={`text-5xl ${human.isJumping ? 'animate-bounce' : ''}`}>
                  {human.emoji}
                </div>

                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10">
                  {human.name}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-white"></div>
                </div>
              </div>
            </div>
          ))}
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
                    ? mode === 'ui'
                      ? 'bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500 dark:border-green-400 scale-105'
                      : 'bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-pink-500 dark:border-pink-400 scale-105'
                    : isComplete
                    ? 'bg-green-500/10 border-green-500 dark:border-green-400'
                    : 'bg-gray-50 dark:bg-gray-800/50 border-transparent'
                  }
                `}
              >
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full shadow-md transition-all duration-300
                  ${isActive
                    ? mode === 'ui'
                      ? 'bg-gradient-to-br from-green-500 to-blue-600 animate-pulse'
                      : 'bg-gradient-to-br from-pink-500 to-purple-600 animate-pulse'
                    : isComplete
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                    : 'bg-gray-300 dark:bg-gray-700'
                  }
                `}>
                  <StepIcon size={16} className="text-white" />
                </div>
                <span className={`text-xs font-semibold ${
                  isActive
                    ? mode === 'ui'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-pink-600 dark:text-pink-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
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
