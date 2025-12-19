import React, { useState, useEffect, useRef } from 'react';

export type LogoAnimation =
  | 'fade-in'
  | 'zoom-in'
  | 'zoom-out'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'rotate-in'
  | 'flip-x'
  | 'flip-y'
  | 'bounce'
  | 'elastic'
  | 'glitch'
  | 'particles'
  | 'shatter'
  | 'liquid'
  | 'neon-glow'
  | 'typewriter'
  | 'stroke-draw'
  | 'morph'
  | '3d-flip'
  | 'explosion'
  | 'smoke'
  | 'fire'
  | 'electric'
  | 'wave'
  | 'ripple';

export interface LogoAnimationConfig {
  animation: LogoAnimation;
  duration: number;
  delay: number;
  easing: string;
  intensity: number;
  color?: string;
  secondaryColor?: string;
  particleCount?: number;
  glowIntensity?: number;
}

interface LogoAnimatorProps {
  logoUrl?: string;
  logoText?: string;
  config: LogoAnimationConfig;
  isPlaying: boolean;
  currentTime: number;
  backgroundColor?: string;
  width?: number;
  height?: number;
}

export function LogoAnimator({
  logoUrl,
  logoText,
  config,
  isPlaying,
  currentTime,
  backgroundColor = '#0a0a0a',
  width = 400,
  height = 300
}: LogoAnimatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [animationPhase, setAnimationPhase] = useState<'waiting' | 'animating' | 'complete'>('waiting');
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([]);

  useEffect(() => {
    if (currentTime < config.delay) {
      setAnimationPhase('waiting');
    } else if (currentTime < config.delay + config.duration) {
      setAnimationPhase('animating');
    } else {
      setAnimationPhase('complete');
    }
  }, [currentTime, config.delay, config.duration]);

  useEffect(() => {
    if (config.animation === 'particles' || config.animation === 'explosion') {
      const count = config.particleCount || 50;
      const newParticles = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 8 + 2,
        delay: Math.random() * 0.5
      }));
      setParticles(newParticles);
    }
  }, [config.animation, config.particleCount]);

  const getAnimationProgress = () => {
    if (animationPhase === 'waiting') return 0;
    if (animationPhase === 'complete') return 1;
    return Math.min(1, (currentTime - config.delay) / config.duration);
  };

  const progress = getAnimationProgress();

  const getAnimationStyles = (): React.CSSProperties => {
    const intensity = config.intensity / 100;

    const baseStyles: React.CSSProperties = {
      transition: `all ${config.duration}s ${config.easing}`,
      willChange: 'transform, opacity, filter'
    };

    if (animationPhase === 'waiting') {
      switch (config.animation) {
        case 'fade-in':
          return { ...baseStyles, opacity: 0 };
        case 'zoom-in':
          return { ...baseStyles, opacity: 0, transform: `scale(${0.3 * intensity})` };
        case 'zoom-out':
          return { ...baseStyles, opacity: 0, transform: `scale(${2 + intensity})` };
        case 'slide-up':
          return { ...baseStyles, opacity: 0, transform: `translateY(${100 * intensity}px)` };
        case 'slide-down':
          return { ...baseStyles, opacity: 0, transform: `translateY(${-100 * intensity}px)` };
        case 'slide-left':
          return { ...baseStyles, opacity: 0, transform: `translateX(${100 * intensity}px)` };
        case 'slide-right':
          return { ...baseStyles, opacity: 0, transform: `translateX(${-100 * intensity}px)` };
        case 'rotate-in':
          return { ...baseStyles, opacity: 0, transform: `rotate(${180 * intensity}deg) scale(0.5)` };
        case 'flip-x':
          return { ...baseStyles, opacity: 0, transform: 'rotateX(90deg)', transformStyle: 'preserve-3d' };
        case 'flip-y':
          return { ...baseStyles, opacity: 0, transform: 'rotateY(90deg)', transformStyle: 'preserve-3d' };
        case 'bounce':
          return { ...baseStyles, opacity: 0, transform: `translateY(${-50 * intensity}px)` };
        case 'elastic':
          return { ...baseStyles, opacity: 0, transform: `scale(0) rotate(${45 * intensity}deg)` };
        case 'glitch':
          return { ...baseStyles, opacity: 0, filter: 'blur(10px)' };
        case '3d-flip':
          return { ...baseStyles, opacity: 0, transform: 'perspective(600px) rotateY(-180deg)', transformStyle: 'preserve-3d' };
        case 'neon-glow':
          return { ...baseStyles, opacity: 0, filter: 'brightness(0)' };
        case 'stroke-draw':
          return { ...baseStyles, opacity: 1, clipPath: 'inset(0 100% 0 0)' };
        case 'wave':
          return { ...baseStyles, opacity: 0, transform: 'scaleY(0)' };
        case 'ripple':
          return { ...baseStyles, opacity: 0, transform: 'scale(0.8)' };
        default:
          return { ...baseStyles, opacity: 0 };
      }
    }

    const animatingStyles: React.CSSProperties = {
      opacity: 1,
      transform: 'none',
      filter: 'none'
    };

    if (config.animation === 'neon-glow' && (animationPhase === 'animating' || animationPhase === 'complete')) {
      const glowColor = config.color || '#00ffff';
      const glowIntensity = config.glowIntensity || 20;
      animatingStyles.filter = `drop-shadow(0 0 ${glowIntensity}px ${glowColor}) drop-shadow(0 0 ${glowIntensity * 2}px ${glowColor})`;
    }

    if (config.animation === 'stroke-draw' && (animationPhase === 'animating' || animationPhase === 'complete')) {
      animatingStyles.clipPath = 'inset(0 0 0 0)';
    }

    return { ...baseStyles, ...animatingStyles };
  };

  const renderGlitchEffect = () => {
    if (config.animation !== 'glitch' || animationPhase === 'waiting') return null;

    return (
      <>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(transparent 0%, rgba(255,0,0,${0.03 * config.intensity / 100}) 50%, transparent 100%)`,
            animation: animationPhase === 'animating' ? 'glitchScan 0.1s linear infinite' : 'none'
          }}
        />
        <style>{`
          @keyframes glitchScan {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }
        `}</style>
      </>
    );
  };

  const renderParticles = () => {
    if ((config.animation !== 'particles' && config.animation !== 'explosion') || animationPhase === 'waiting') return null;

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              backgroundColor: config.color || '#ffffff',
              opacity: animationPhase === 'animating' ? 1 - progress : 0,
              transform: animationPhase === 'animating'
                ? `translate(${(particle.x - 50) * progress * 3}px, ${(particle.y - 50) * progress * 3}px) scale(${1 - progress * 0.5})`
                : 'none',
              transition: `all ${config.duration}s ${config.easing}`,
              transitionDelay: `${particle.delay}s`,
              boxShadow: `0 0 ${particle.size * 2}px ${config.color || '#ffffff'}`
            }}
          />
        ))}
      </div>
    );
  };

  const renderElectricEffect = () => {
    if (config.animation !== 'electric' || animationPhase !== 'animating') return null;

    return (
      <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
        {Array.from({ length: 5 }).map((_, i) => (
          <path
            key={i}
            d={`M ${50 + Math.random() * 20 - 10}% 0%
                L ${50 + Math.random() * 40 - 20}% ${25 + Math.random() * 10}%
                L ${50 + Math.random() * 30 - 15}% ${50 + Math.random() * 10}%
                L ${50 + Math.random() * 40 - 20}% ${75 + Math.random() * 10}%
                L ${50 + Math.random() * 20 - 10}% 100%`}
            stroke={config.color || '#00ffff'}
            strokeWidth="2"
            fill="none"
            opacity={0.5 + Math.random() * 0.5}
            style={{
              filter: `drop-shadow(0 0 5px ${config.color || '#00ffff'})`,
              animation: `electricFlicker ${0.1 + Math.random() * 0.2}s linear infinite`
            }}
          />
        ))}
        <style>{`
          @keyframes electricFlicker {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </svg>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center overflow-hidden"
      style={{ width, height, backgroundColor }}
    >
      {renderGlitchEffect()}
      {renderParticles()}
      {renderElectricEffect()}

      <div style={getAnimationStyles()} className="relative z-10">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            className="max-w-full max-h-full object-contain"
            style={{ maxWidth: width * 0.6, maxHeight: height * 0.6 }}
          />
        ) : logoText ? (
          <div
            className="text-4xl font-bold"
            style={{
              color: config.color || '#ffffff',
              textShadow: config.animation === 'neon-glow' && animationPhase !== 'waiting'
                ? `0 0 20px ${config.color || '#00ffff'}, 0 0 40px ${config.color || '#00ffff'}`
                : 'none'
            }}
          >
            {logoText}
          </div>
        ) : (
          <div className="text-slate-500">Upload Logo</div>
        )}
      </div>

      {config.animation === 'ripple' && animationPhase === 'animating' && (
        <div
          className="absolute rounded-full border-2 pointer-events-none"
          style={{
            borderColor: config.color || '#ffffff',
            width: `${progress * 200}%`,
            height: `${progress * 200}%`,
            opacity: 1 - progress,
            transition: `all ${config.duration}s ${config.easing}`
          }}
        />
      )}
    </div>
  );
}

export const logoAnimationPresets: Record<string, LogoAnimationConfig> = {
  'elegant-fade': {
    animation: 'fade-in',
    duration: 1.5,
    delay: 0.5,
    easing: 'ease-out',
    intensity: 100
  },
  'dramatic-zoom': {
    animation: 'zoom-in',
    duration: 1,
    delay: 0.3,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    intensity: 80
  },
  'cinematic-reveal': {
    animation: 'zoom-out',
    duration: 2,
    delay: 0,
    easing: 'ease-out',
    intensity: 60
  },
  'bounce-in': {
    animation: 'bounce',
    duration: 0.8,
    delay: 0.2,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    intensity: 100
  },
  'neon-reveal': {
    animation: 'neon-glow',
    duration: 1.2,
    delay: 0.3,
    easing: 'ease-in-out',
    intensity: 100,
    color: '#00ffff',
    glowIntensity: 25
  },
  'glitch-intro': {
    animation: 'glitch',
    duration: 0.8,
    delay: 0.2,
    easing: 'steps(10)',
    intensity: 80
  },
  'particle-burst': {
    animation: 'particles',
    duration: 1.5,
    delay: 0,
    easing: 'ease-out',
    intensity: 100,
    color: '#ffd700',
    particleCount: 60
  },
  '3d-reveal': {
    animation: '3d-flip',
    duration: 1,
    delay: 0.3,
    easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    intensity: 100
  },
  'electric-shock': {
    animation: 'electric',
    duration: 1.5,
    delay: 0,
    easing: 'ease-out',
    intensity: 100,
    color: '#00ffff'
  },
  'wave-reveal': {
    animation: 'wave',
    duration: 1.2,
    delay: 0.2,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    intensity: 100
  }
};
