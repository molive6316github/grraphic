import React, { useState, useEffect } from 'react';

export type TextAnimation =
  | 'typewriter'
  | 'fade-in'
  | 'fade-in-up'
  | 'fade-in-down'
  | 'fade-in-left'
  | 'fade-in-right'
  | 'zoom-in'
  | 'bounce-in'
  | 'flip-in'
  | 'rotate-in'
  | 'slide-reveal'
  | 'blur-in'
  | 'letter-by-letter'
  | 'word-by-word'
  | 'wave'
  | 'glitch'
  | 'neon-flicker'
  | 'gradient-reveal'
  | 'stroke-fill'
  | 'split-reveal'
  | 'scramble'
  | 'kinetic-pop'
  | 'elastic-bounce';

export interface TextAnimationConfig {
  animation: TextAnimation;
  duration: number;
  delay: number;
  staggerDelay: number;
  easing: string;
  color: string;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
  textShadow?: string;
  gradient?: { from: string; to: string; angle: number };
  outline?: { color: string; width: number };
}

interface TextAnimatorProps {
  text: string;
  config: TextAnimationConfig;
  isPlaying: boolean;
  currentTime: number;
  width?: number;
  height?: number;
}

export function TextAnimator({
  text,
  config,
  isPlaying,
  currentTime,
  width = 600,
  height = 200
}: TextAnimatorProps) {
  const [displayText, setDisplayText] = useState('');
  const [scrambledText, setScrambledText] = useState('');
  const characters = text.split('');
  const words = text.split(' ');

  const animationStarted = currentTime >= config.delay;
  const animationProgress = animationStarted
    ? Math.min(1, (currentTime - config.delay) / config.duration)
    : 0;

  useEffect(() => {
    if (config.animation === 'typewriter' && animationStarted) {
      const charCount = Math.floor(animationProgress * text.length);
      setDisplayText(text.substring(0, charCount));
    } else if (config.animation === 'scramble' && animationStarted) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      const revealedCount = Math.floor(animationProgress * text.length);
      let scrambled = '';
      for (let i = 0; i < text.length; i++) {
        if (i < revealedCount) {
          scrambled += text[i];
        } else if (text[i] === ' ') {
          scrambled += ' ';
        } else {
          scrambled += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      setScrambledText(scrambled);
    }
  }, [text, config.animation, animationProgress, animationStarted]);

  const getCharacterStyle = (index: number): React.CSSProperties => {
    const charDelay = config.delay + (index * config.staggerDelay);
    const charStarted = currentTime >= charDelay;
    const charProgress = charStarted
      ? Math.min(1, (currentTime - charDelay) / (config.duration / characters.length * 2))
      : 0;

    const baseStyle: React.CSSProperties = {
      display: 'inline-block',
      transition: `all ${config.duration / characters.length}s ${config.easing}`,
      whiteSpace: 'pre'
    };

    if (!charStarted) {
      switch (config.animation) {
        case 'letter-by-letter':
        case 'fade-in':
          return { ...baseStyle, opacity: 0 };
        case 'fade-in-up':
          return { ...baseStyle, opacity: 0, transform: 'translateY(20px)' };
        case 'fade-in-down':
          return { ...baseStyle, opacity: 0, transform: 'translateY(-20px)' };
        case 'wave':
          return { ...baseStyle, transform: `translateY(${Math.sin(index * 0.5) * 20}px)` };
        case 'zoom-in':
          return { ...baseStyle, opacity: 0, transform: 'scale(0)' };
        case 'rotate-in':
          return { ...baseStyle, opacity: 0, transform: 'rotate(90deg)' };
        case 'flip-in':
          return { ...baseStyle, opacity: 0, transform: 'rotateX(90deg)', transformStyle: 'preserve-3d' };
        case 'blur-in':
          return { ...baseStyle, opacity: 0, filter: 'blur(10px)' };
        case 'kinetic-pop':
          return { ...baseStyle, opacity: 0, transform: 'scale(2) rotate(-10deg)' };
        case 'elastic-bounce':
          return { ...baseStyle, opacity: 0, transform: 'translateY(-100px) scale(0.5)' };
        default:
          return { ...baseStyle, opacity: 0 };
      }
    }

    return {
      ...baseStyle,
      opacity: 1,
      transform: 'none',
      filter: 'none'
    };
  };

  const getWordStyle = (index: number): React.CSSProperties => {
    const wordDelay = config.delay + (index * config.staggerDelay * 3);
    const wordStarted = currentTime >= wordDelay;

    const baseStyle: React.CSSProperties = {
      display: 'inline-block',
      transition: `all ${config.duration / words.length}s ${config.easing}`,
      marginRight: '0.3em'
    };

    if (!wordStarted) {
      switch (config.animation) {
        case 'word-by-word':
          return { ...baseStyle, opacity: 0, transform: 'translateY(20px)' };
        case 'split-reveal':
          return {
            ...baseStyle,
            opacity: 0,
            transform: index % 2 === 0 ? 'translateX(-50px)' : 'translateX(50px)'
          };
        default:
          return { ...baseStyle, opacity: 0 };
      }
    }

    return { ...baseStyle, opacity: 1, transform: 'none' };
  };

  const getContainerStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      fontSize: config.fontSize,
      fontWeight: config.fontWeight,
      fontFamily: config.fontFamily,
      textAlign: config.textAlign,
      letterSpacing: config.letterSpacing,
      lineHeight: config.lineHeight,
      color: config.color,
      textShadow: config.textShadow,
      transition: `all ${config.duration}s ${config.easing}`
    };

    if (config.gradient) {
      baseStyle.background = `linear-gradient(${config.gradient.angle}deg, ${config.gradient.from}, ${config.gradient.to})`;
      baseStyle.WebkitBackgroundClip = 'text';
      baseStyle.WebkitTextFillColor = 'transparent';
      baseStyle.backgroundClip = 'text';
    }

    if (config.outline) {
      baseStyle.WebkitTextStroke = `${config.outline.width}px ${config.outline.color}`;
    }

    if (!animationStarted) {
      switch (config.animation) {
        case 'fade-in':
          return { ...baseStyle, opacity: 0 };
        case 'fade-in-up':
          return { ...baseStyle, opacity: 0, transform: 'translateY(30px)' };
        case 'fade-in-down':
          return { ...baseStyle, opacity: 0, transform: 'translateY(-30px)' };
        case 'fade-in-left':
          return { ...baseStyle, opacity: 0, transform: 'translateX(50px)' };
        case 'fade-in-right':
          return { ...baseStyle, opacity: 0, transform: 'translateX(-50px)' };
        case 'zoom-in':
          return { ...baseStyle, opacity: 0, transform: 'scale(0.5)' };
        case 'bounce-in':
          return { ...baseStyle, opacity: 0, transform: 'scale(0.3)' };
        case 'slide-reveal':
          return { ...baseStyle, clipPath: 'inset(0 100% 0 0)' };
        case 'gradient-reveal':
          return { ...baseStyle, opacity: 0, filter: 'saturate(0)' };
        case 'neon-flicker':
          return { ...baseStyle, opacity: 0 };
        default:
          return baseStyle;
      }
    }

    const completedStyle = { ...baseStyle, opacity: 1, transform: 'none', clipPath: 'none', filter: 'none' };

    if (config.animation === 'neon-flicker' && animationStarted) {
      completedStyle.textShadow = `0 0 10px ${config.color}, 0 0 20px ${config.color}, 0 0 40px ${config.color}`;
    }

    return completedStyle;
  };

  const renderText = () => {
    if (config.animation === 'typewriter') {
      return (
        <span style={getContainerStyle()}>
          {displayText}
          {animationStarted && animationProgress < 1 && (
            <span className="animate-pulse">|</span>
          )}
        </span>
      );
    }

    if (config.animation === 'scramble') {
      return <span style={getContainerStyle()}>{scrambledText || text}</span>;
    }

    if (config.animation === 'letter-by-letter' || config.animation === 'wave' ||
        config.animation === 'blur-in' || config.animation === 'kinetic-pop' ||
        config.animation === 'elastic-bounce' || config.animation === 'flip-in' ||
        config.animation === 'rotate-in' || config.animation === 'zoom-in') {
      return (
        <span style={{ ...getContainerStyle(), display: 'inline' }}>
          {characters.map((char, index) => (
            <span key={index} style={getCharacterStyle(index)}>
              {char}
            </span>
          ))}
        </span>
      );
    }

    if (config.animation === 'word-by-word' || config.animation === 'split-reveal') {
      return (
        <span style={{ ...getContainerStyle(), display: 'inline' }}>
          {words.map((word, index) => (
            <span key={index} style={getWordStyle(index)}>
              {word}
            </span>
          ))}
        </span>
      );
    }

    return <span style={getContainerStyle()}>{text}</span>;
  };

  return (
    <div
      className="flex items-center justify-center p-4"
      style={{ width, height }}
    >
      {renderText()}
    </div>
  );
}

export const textAnimationPresets: Record<string, Partial<TextAnimationConfig>> = {
  'simple-fade': {
    animation: 'fade-in',
    duration: 1,
    delay: 0,
    staggerDelay: 0,
    easing: 'ease-out'
  },
  'elegant-rise': {
    animation: 'fade-in-up',
    duration: 0.8,
    delay: 0.2,
    staggerDelay: 0,
    easing: 'cubic-bezier(0.33, 1, 0.68, 1)'
  },
  'typewriter-classic': {
    animation: 'typewriter',
    duration: 2,
    delay: 0.3,
    staggerDelay: 0.05,
    easing: 'linear'
  },
  'letter-cascade': {
    animation: 'letter-by-letter',
    duration: 1.5,
    delay: 0,
    staggerDelay: 0.05,
    easing: 'ease-out'
  },
  'word-reveal': {
    animation: 'word-by-word',
    duration: 1.2,
    delay: 0.2,
    staggerDelay: 0.1,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  },
  'wave-motion': {
    animation: 'wave',
    duration: 1,
    delay: 0,
    staggerDelay: 0.03,
    easing: 'ease-in-out'
  },
  'neon-sign': {
    animation: 'neon-flicker',
    duration: 0.5,
    delay: 0.2,
    staggerDelay: 0,
    easing: 'ease-in-out'
  },
  'cinematic-reveal': {
    animation: 'slide-reveal',
    duration: 1.5,
    delay: 0,
    staggerDelay: 0,
    easing: 'cubic-bezier(0.77, 0, 0.175, 1)'
  },
  'pop-in': {
    animation: 'kinetic-pop',
    duration: 0.6,
    delay: 0,
    staggerDelay: 0.04,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },
  'scramble-decode': {
    animation: 'scramble',
    duration: 1.5,
    delay: 0.2,
    staggerDelay: 0,
    easing: 'linear'
  },
  'bounce-letters': {
    animation: 'elastic-bounce',
    duration: 0.8,
    delay: 0,
    staggerDelay: 0.05,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },
  'split-entry': {
    animation: 'split-reveal',
    duration: 0.8,
    delay: 0.3,
    staggerDelay: 0.08,
    easing: 'ease-out'
  }
};

export const fontOptions = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Playfair Display', value: 'Playfair Display, serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  { name: 'Oswald', value: 'Oswald, sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
  { name: 'Bebas Neue', value: 'Bebas Neue, sans-serif' },
  { name: 'Lato', value: 'Lato, sans-serif' },
  { name: 'Open Sans', value: 'Open Sans, sans-serif' },
  { name: 'Raleway', value: 'Raleway, sans-serif' }
];
