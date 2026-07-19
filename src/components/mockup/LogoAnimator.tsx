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
  | 'ripple'
  | 'cinematic-logo-reveal'
  | 'neon-city'
  | 'particle-explosion'
  | 'glitch-distortion'
  | 'liquid-metal'
  | 'fire-reveal'
  | 'ice-shatter'
  | 'smoke-reveal'
  | 'electric-surge'
  | 'hologram-3d'
  | 'minimal-fade'
  | 'line-draw'
  | 'dot-matrix'
  | 'split-reveal'
  | 'zoom-blur'
  | 'luxury-gold'
  | 'diamond-sparkle'
  | 'space-nebula';

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
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; color: string; angle: number }>>([]);
  const [glitchOffset, setGlitchOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (currentTime < config.delay) {
      setAnimationPhase('waiting');
    } else if (currentTime < config.delay + config.duration) {
      setAnimationPhase('animating');
    } else {
      setAnimationPhase('complete');
    }
  }, [currentTime, config.delay, config.duration]);

  // Particle generation for various effects
  useEffect(() => {
    const particleAnimations = ['particles', 'explosion', 'particle-explosion', 'diamond-sparkle', 'luxury-gold', 'fire-reveal', 'smoke-reveal', 'ice-shatter', 'space-nebula'];
    if (particleAnimations.includes(config.animation)) {
      const count = config.particleCount || 80;
      const colors = config.animation === 'luxury-gold' 
        ? ['#ffd700', '#ffb700', '#fff4b3', '#d4af37']
        : config.animation === 'diamond-sparkle'
        ? ['#ffffff', '#e0e0ff', '#c0c0ff', '#a0a0ff']
        : config.animation === 'ice-shatter'
        ? ['#a0e0ff', '#80d0ff', '#60c0ff', '#ffffff']
        : config.animation === 'fire-reveal'
        ? ['#ff4500', '#ff6600', '#ff8800', '#ffaa00', '#ffcc00']
        : config.animation === 'space-nebula'
        ? ['#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#6366f1']
        : [config.color || '#ffffff'];
      
      const newParticles = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 20,
        y: 50 + (Math.random() - 0.5) * 20,
        size: Math.random() * 12 + 3,
        delay: Math.random() * 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * 360
      }));
      setParticles(newParticles);
    }
  }, [config.animation, config.particleCount, config.color]);

  // Glitch effect
  useEffect(() => {
    if (config.animation === 'glitch' || config.animation === 'glitch-distortion') {
      const interval = setInterval(() => {
        if (animationPhase === 'animating') {
          setGlitchOffset({
            x: (Math.random() - 0.5) * 20,
            y: (Math.random() - 0.5) * 10
          });
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [config.animation, animationPhase]);

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
        case 'minimal-fade':
          return { ...baseStyles, opacity: 0 };
        case 'zoom-in':
        case 'cinematic-logo-reveal':
          return { ...baseStyles, opacity: 0, transform: `scale(${0.1 * intensity})` };
        case 'zoom-out':
        case 'zoom-blur':
          return { ...baseStyles, opacity: 0, transform: `scale(${3 + intensity})`, filter: 'blur(20px)' };
        case 'slide-up':
          return { ...baseStyles, opacity: 0, transform: `translateY(${150 * intensity}px)` };
        case 'slide-down':
          return { ...baseStyles, opacity: 0, transform: `translateY(${-150 * intensity}px)` };
        case 'slide-left':
          return { ...baseStyles, opacity: 0, transform: `translateX(${150 * intensity}px)` };
        case 'slide-right':
          return { ...baseStyles, opacity: 0, transform: `translateX(${-150 * intensity}px)` };
        case 'rotate-in':
          return { ...baseStyles, opacity: 0, transform: `rotate(${360 * intensity}deg) scale(0.1)` };
        case 'flip-x':
        case 'split-reveal':
          return { ...baseStyles, opacity: 0, transform: 'rotateX(90deg)', transformStyle: 'preserve-3d' };
        case 'flip-y':
          return { ...baseStyles, opacity: 0, transform: 'rotateY(90deg)', transformStyle: 'preserve-3d' };
        case 'bounce':
          return { ...baseStyles, opacity: 0, transform: `translateY(${-80 * intensity}px)` };
        case 'elastic':
          return { ...baseStyles, opacity: 0, transform: `scale(0) rotate(${90 * intensity}deg)` };
        case 'glitch':
        case 'glitch-distortion':
          return { ...baseStyles, opacity: 0, filter: 'blur(20px) saturate(0)' };
        case '3d-flip':
        case 'hologram-3d':
          return { ...baseStyles, opacity: 0, transform: 'perspective(800px) rotateY(-180deg) rotateX(20deg)', transformStyle: 'preserve-3d' };
        case 'neon-glow':
        case 'neon-city':
        case 'electric-surge':
          return { ...baseStyles, opacity: 0, filter: 'brightness(0) blur(10px)' };
        case 'stroke-draw':
        case 'line-draw':
          return { ...baseStyles, opacity: 1, clipPath: 'inset(0 100% 0 0)' };
        case 'dot-matrix':
          return { ...baseStyles, opacity: 0, filter: 'blur(20px)', transform: 'scale(0.5)' };
        case 'wave':
          return { ...baseStyles, opacity: 0, transform: 'scaleY(0) scaleX(0.5)' };
        case 'ripple':
          return { ...baseStyles, opacity: 0, transform: 'scale(0.3)' };
        case 'liquid-metal':
          return { ...baseStyles, opacity: 0, transform: 'scaleX(0) scaleY(1.5)', filter: 'blur(10px)' };
        case 'fire-reveal':
        case 'smoke-reveal':
        case 'ice-shatter':
          return { ...baseStyles, opacity: 0, transform: 'scale(0.8)', filter: 'blur(15px)' };
        case 'luxury-gold':
        case 'diamond-sparkle':
          return { ...baseStyles, opacity: 0, transform: 'scale(0.9)', filter: 'brightness(2) blur(5px)' };
        case 'space-nebula':
          return { ...baseStyles, opacity: 0, transform: 'scale(0.5) rotate(-10deg)', filter: 'blur(20px) hue-rotate(-30deg)' };
        case 'particle-explosion':
        case 'explosion':
          return { ...baseStyles, opacity: 0, transform: 'scale(0)' };
        default:
          return { ...baseStyles, opacity: 0 };
      }
    }

    const animatingStyles: React.CSSProperties = {
      opacity: 1,
      transform: 'none',
      filter: 'none'
    };

    // Special animation states
    if ((config.animation === 'neon-glow' || config.animation === 'neon-city' || config.animation === 'electric-surge')) {
      const glowColor = config.color || '#00ffff';
      const glowIntensity = config.glowIntensity || 30;
      animatingStyles.filter = `drop-shadow(0 0 ${glowIntensity}px ${glowColor}) drop-shadow(0 0 ${glowIntensity * 2}px ${glowColor}) drop-shadow(0 0 ${glowIntensity * 3}px ${glowColor})`;
    }

    if ((config.animation === 'glitch' || config.animation === 'glitch-distortion') && animationPhase === 'animating') {
      animatingStyles.transform = `translate(${glitchOffset.x}px, ${glitchOffset.y}px)`;
    }

    if ((config.animation === 'stroke-draw' || config.animation === 'line-draw')) {
      animatingStyles.clipPath = 'inset(0 0 0 0)';
    }

    if (config.animation === 'hologram-3d') {
      animatingStyles.filter = `drop-shadow(0 0 10px ${config.color || '#00ffff'}) drop-shadow(0 0 20px ${config.color || '#00ffff'})`;
      animatingStyles.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
    }

    if ((config.animation === 'luxury-gold' || config.animation === 'diamond-sparkle')) {
      const sparkleColor = config.animation === 'luxury-gold' ? '#ffd700' : '#ffffff';
      animatingStyles.filter = `drop-shadow(0 0 15px ${sparkleColor}) drop-shadow(0 0 30px ${sparkleColor})`;
    }

    if (config.animation === 'space-nebula') {
      animatingStyles.filter = 'drop-shadow(0 0 20px #8b5cf6) drop-shadow(0 0 40px #a855f7)';
    }

    return { ...baseStyles, ...animatingStyles };
  };

  const renderGlitchEffect = () => {
    if ((config.animation !== 'glitch' && config.animation !== 'glitch-distortion') || animationPhase === 'waiting') return null;

    return (
      <>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,0,0.03) 2px, rgba(255,0,0,0.03) 4px)`,
              animation: 'glitchScan 0.1s linear infinite'
            }}
          />
          {/* RGB split effect */}
          <div
            className="absolute inset-0 mix-blend-screen"
            style={{
              background: `linear-gradient(90deg, rgba(255,0,0,0.1) 0%, transparent 50%, rgba(0,255,255,0.1) 100%)`,
              animation: 'rgbShift 0.2s ease-in-out infinite alternate'
            }}
          />
        </div>
        <style>{`
          @keyframes glitchScan {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }
          @keyframes rgbShift {
            0% { transform: translateX(-5px); }
            100% { transform: translateX(5px); }
          }
        `}</style>
      </>
    );
  };

  const renderParticles = () => {
    const particleAnimations = ['particles', 'explosion', 'particle-explosion', 'diamond-sparkle', 'luxury-gold', 'fire-reveal', 'smoke-reveal', 'ice-shatter', 'space-nebula'];
    if (!particleAnimations.includes(config.animation) || animationPhase === 'waiting') return null;

    const isExplosion = ['explosion', 'particle-explosion', 'fire-reveal', 'ice-shatter'].includes(config.animation);
    const isGathering = ['luxury-gold', 'diamond-sparkle', 'smoke-reveal'].includes(config.animation);

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => {
          const explosionX = isExplosion ? (particle.x - 50) * progress * 8 : isGathering ? (particle.x - 50) * (1 - progress) * 3 : 0;
          const explosionY = isExplosion ? (particle.y - 50) * progress * 8 : isGathering ? (particle.y - 50) * (1 - progress) * 3 : 0;
          
          return (
            <div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                opacity: isExplosion ? (1 - progress * 0.8) : (progress * 0.9),
                transform: `translate(${explosionX}px, ${explosionY}px) scale(${isExplosion ? 1 - progress * 0.5 : 0.5 + progress * 0.5}) rotate(${particle.angle + progress * 360}deg)`,
                transition: `all ${config.duration}s ${config.easing}`,
                transitionDelay: `${particle.delay}s`,
                boxShadow: `0 0 ${particle.size * 3}px ${particle.color}, 0 0 ${particle.size * 6}px ${particle.color}`
              }}
            />
          );
        })}
      </div>
    );
  };

  const renderElectricEffect = () => {
    if ((config.animation !== 'electric' && config.animation !== 'electric-surge') || animationPhase !== 'animating') return null;

    return (
      <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
        {Array.from({ length: 8 }).map((_, i) => {
          const startX = 50 + (Math.random() - 0.5) * 60;
          const points = Array.from({ length: 6 }, (_, j) => ({
            x: startX + (Math.random() - 0.5) * 40,
            y: (j / 5) * 100
          }));
          
          return (
            <path
              key={i}
              d={`M ${points[0].x}% ${points[0].y}% ${points.slice(1).map(p => `L ${p.x}% ${p.y}%`).join(' ')}`}
              stroke={config.color || '#00ffff'}
              strokeWidth="3"
              fill="none"
              opacity={0.3 + Math.random() * 0.7}
              style={{
                filter: `drop-shadow(0 0 10px ${config.color || '#00ffff'})`,
                animation: `electricFlicker ${0.05 + Math.random() * 0.1}s linear infinite`
              }}
            />
          );
        })}
        <style>{`
          @keyframes electricFlicker {
            0%, 100% { opacity: 1; }
            25% { opacity: 0.2; }
            50% { opacity: 0.8; }
            75% { opacity: 0.4; }
          }
        `}</style>
      </svg>
    );
  };

  const renderNeonCityBackground = () => {
    if (config.animation !== 'neon-city' || animationPhase === 'waiting') return null;

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Grid lines */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(90deg, transparent 0%, rgba(255,0,255,0.1) 1%, transparent 2%),
              linear-gradient(0deg, transparent 0%, rgba(0,255,255,0.1) 1%, transparent 2%)
            `,
            backgroundSize: '50px 50px',
            transform: `perspective(500px) rotateX(60deg) translateY(${progress * 100}px)`,
            transformOrigin: 'bottom'
          }}
        />
        {/* Horizon glow */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1/3"
          style={{
            background: 'linear-gradient(to top, rgba(255,0,255,0.3), transparent)',
            opacity: progress
          }}
        />
      </div>
    );
  };

  const renderSpaceNebulaBackground = () => {
    if (config.animation !== 'space-nebula' || animationPhase === 'waiting') return null;

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Stars */}
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              opacity: progress * (0.3 + Math.random() * 0.7),
              animation: `twinkle ${1 + Math.random() * 2}s ease-in-out infinite`
            }}
          />
        ))}
        {/* Nebula clouds */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 30% 40%, rgba(139,92,246,${progress * 0.3}) 0%, transparent 50%),
                        radial-gradient(ellipse at 70% 60%, rgba(168,85,247,${progress * 0.3}) 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 80%, rgba(217,70,239,${progress * 0.2}) 0%, transparent 40%)`
          }}
        />
        <style>{`
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </div>
    );
  };

  const getBackgroundGradient = () => {
    switch (config.animation) {
      case 'neon-city':
        return 'linear-gradient(to bottom, #0a0012 0%, #1a0030 50%, #0a0a20 100%)';
      case 'fire-reveal':
        return 'linear-gradient(to bottom, #1a0500 0%, #2a0800 50%, #0a0500 100%)';
      case 'ice-shatter':
        return 'linear-gradient(to bottom, #001020 0%, #002040 50%, #001030 100%)';
      case 'space-nebula':
        return 'linear-gradient(to bottom, #0a0015 0%, #100020 50%, #050010 100%)';
      case 'luxury-gold':
        return 'linear-gradient(to bottom, #0a0800 0%, #1a1000 50%, #0a0500 100%)';
      default:
        return backgroundColor;
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center overflow-hidden"
      style={{ width, height, background: getBackgroundGradient() }}
    >
      {renderNeonCityBackground()}
      {renderSpaceNebulaBackground()}
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
            className="text-5xl md:text-6xl font-black tracking-tight"
            style={{
              color: config.color || '#ffffff',
              textShadow: (config.animation === 'neon-glow' || config.animation === 'neon-city' || config.animation === 'electric-surge') && animationPhase !== 'waiting'
                ? `0 0 20px ${config.color || '#00ffff'}, 0 0 40px ${config.color || '#00ffff'}, 0 0 60px ${config.color || '#00ffff'}`
                : config.animation === 'luxury-gold' && animationPhase !== 'waiting'
                ? '0 0 20px #ffd700, 0 0 40px #ffb700'
                : config.animation === 'hologram-3d' && animationPhase !== 'waiting'
                ? '0 0 10px #00ffff, 0 2px 0 #00cccc'
                : 'none',
              fontFamily: config.animation === 'luxury-gold' || config.animation === 'diamond-sparkle' 
                ? 'Georgia, serif' 
                : 'system-ui, sans-serif'
            }}
          >
            {logoText}
          </div>
        ) : (
          <div className="text-gray-500 text-lg">Upload Logo or Enter Text</div>
        )}
      </div>

      {/* Ripple effect */}
      {config.animation === 'ripple' && animationPhase === 'animating' && (
        <>
          {[0, 0.2, 0.4].map((delay, i) => (
            <div
              key={i}
              className="absolute rounded-full border-2 pointer-events-none"
              style={{
                borderColor: config.color || '#ffffff',
                width: `${Math.max(0, (progress - delay) * 3) * 100}%`,
                height: `${Math.max(0, (progress - delay) * 3) * 100}%`,
                opacity: Math.max(0, 1 - (progress - delay) * 1.5),
                transition: `all ${config.duration}s ${config.easing}`
              }}
            />
          ))}
        </>
      )}

      {/* Lens flare for cinematic */}
      {config.animation === 'cinematic-logo-reveal' && animationPhase !== 'waiting' && (
        <div 
          className="absolute pointer-events-none"
          style={{
            width: '200%',
            height: '200%',
            background: `radial-gradient(ellipse at center, rgba(255,255,255,${progress * 0.3}) 0%, transparent 50%)`,
            transform: `translate(-25%, -25%) rotate(${progress * 45}deg)`,
            mixBlendMode: 'overlay'
          }}
        />
      )}
    </div>
  );
}

// Enhanced animation presets with proper configs for each intro template
export const logoAnimationPresets: Record<string, LogoAnimationConfig> = {
  'cinematic-logo-reveal': {
    animation: 'cinematic-logo-reveal',
    duration: 2.5,
    delay: 0.5,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    intensity: 100,
    color: '#ffffff'
  },
  'neon-city': {
    animation: 'neon-city',
    duration: 2,
    delay: 0.3,
    easing: 'ease-out',
    intensity: 100,
    color: '#ff00ff',
    secondaryColor: '#00ffff',
    glowIntensity: 40
  },
  'particle-explosion': {
    animation: 'particle-explosion',
    duration: 2,
    delay: 0,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    intensity: 100,
    color: '#ffd700',
    particleCount: 100
  },
  'glitch-distortion': {
    animation: 'glitch-distortion',
    duration: 1.5,
    delay: 0.2,
    easing: 'steps(20)',
    intensity: 100,
    color: '#00ff00'
  },
  'liquid-metal': {
    animation: 'liquid-metal',
    duration: 2,
    delay: 0.3,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    intensity: 100,
    color: '#c0c0c0'
  },
  'fire-reveal': {
    animation: 'fire-reveal',
    duration: 2.5,
    delay: 0,
    easing: 'ease-out',
    intensity: 100,
    color: '#ff4500',
    particleCount: 80
  },
  'ice-shatter': {
    animation: 'ice-shatter',
    duration: 2,
    delay: 0.2,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    intensity: 100,
    color: '#80d0ff',
    particleCount: 60
  },
  'smoke-reveal': {
    animation: 'smoke-reveal',
    duration: 3,
    delay: 0,
    easing: 'ease-in-out',
    intensity: 80,
    color: '#888888',
    particleCount: 50
  },
  'electric-surge': {
    animation: 'electric-surge',
    duration: 1.5,
    delay: 0.2,
    easing: 'ease-out',
    intensity: 100,
    color: '#00ffff',
    glowIntensity: 35
  },
  'hologram-3d': {
    animation: 'hologram-3d',
    duration: 2,
    delay: 0.3,
    easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    intensity: 100,
    color: '#00ffff',
    glowIntensity: 25
  },
  'minimal-fade': {
    animation: 'minimal-fade',
    duration: 1.5,
    delay: 0.5,
    easing: 'ease-out',
    intensity: 100,
    color: '#ffffff'
  },
  'line-draw': {
    animation: 'line-draw',
    duration: 2,
    delay: 0.3,
    easing: 'ease-in-out',
    intensity: 100,
    color: '#ffffff'
  },
  'dot-matrix': {
    animation: 'dot-matrix',
    duration: 1.8,
    delay: 0.2,
    easing: 'ease-out',
    intensity: 100,
    color: '#00ff00'
  },
  'split-reveal': {
    animation: 'split-reveal',
    duration: 1.2,
    delay: 0.3,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    intensity: 100,
    color: '#ffffff'
  },
  'zoom-blur': {
    animation: 'zoom-blur',
    duration: 0.8,
    delay: 0.2,
    easing: 'ease-out',
    intensity: 100,
    color: '#ffffff'
  },
  'luxury-gold': {
    animation: 'luxury-gold',
    duration: 2.5,
    delay: 0.3,
    easing: 'ease-out',
    intensity: 100,
    color: '#ffd700',
    particleCount: 60
  },
  'diamond-sparkle': {
    animation: 'diamond-sparkle',
    duration: 2,
    delay: 0.2,
    easing: 'ease-out',
    intensity: 100,
    color: '#ffffff',
    particleCount: 70
  },
  'space-nebula': {
    animation: 'space-nebula',
    duration: 3,
    delay: 0,
    easing: 'ease-in-out',
    intensity: 100,
    color: '#8b5cf6',
    particleCount: 40
  },
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
    glowIntensity: 30
  },
  'glitch-intro': {
    animation: 'glitch',
    duration: 0.8,
    delay: 0.2,
    easing: 'steps(10)',
    intensity: 80
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
