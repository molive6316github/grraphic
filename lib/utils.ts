import type { CSSProperties } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Theme } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildProfileStyles(theme: Theme): CSSProperties {
  const base: CSSProperties = {
    color: theme.textColor,
    minHeight: '100vh',
  }

  if (theme.backgroundType === 'solid') {
    base.backgroundColor = theme.backgroundColor
  } else if (theme.backgroundType === 'gradient') {
    base.background = `linear-gradient(${theme.gradientDirection}, ${theme.gradientFrom}, ${theme.gradientTo})`
  } else if (theme.backgroundType === 'image' && theme.backgroundImage) {
    base.backgroundImage = `url(${theme.backgroundImage})`
    base.backgroundSize = 'cover'
    base.backgroundPosition = 'center'
    base.backgroundAttachment = 'fixed'
  }

  return base
}

export function buildCardStyles(theme: Theme): CSSProperties {
  const shadowMap = {
    none: 'none',
    sm: '0 1px 3px rgba(0,0,0,0.3)',
    md: '0 4px 16px rgba(0,0,0,0.4)',
    lg: '0 8px 32px rgba(0,0,0,0.5)',
  }

  return {
    borderRadius: `${theme.cardBorderRadius}px`,
    border: `1px solid ${theme.cardBorderColor}`,
    boxShadow: shadowMap[theme.cardShadow],
    ...(theme.cardGlass
      ? {
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        }
      : { backgroundColor: 'rgba(255,255,255,0.04)' }),
  }
}

export function getFontClass(font: Theme['font']): string {
  const fontMap: Record<Theme['font'], string> = {
    inter: 'font-inter',
    playfair: 'font-playfair',
    mono: 'font-mono',
    nunito: 'font-nunito',
    lora: 'font-lora',
  }
  return fontMap[font] ?? 'font-inter'
}

export function getAnimationVariants(
  style: Theme['animationStyle'],
  speed: Theme['animationSpeed']
) {
  const durations = { slow: 0.8, normal: 0.5, fast: 0.3 }
  const duration = durations[speed] ?? 0.5

  const variants = {
    none: { hidden: {}, visible: {} },
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration } },
    },
    slide: {
      hidden: { opacity: 0, y: 24 },
      visible: { opacity: 1, y: 0, transition: { duration, ease: 'easeOut' } },
    },
    pop: {
      hidden: { opacity: 0, scale: 0.88 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { duration, type: 'spring', bounce: 0.35 },
      },
    },
  }

  return variants[style] ?? variants.fade
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
