import React from 'react';
import { DeviceMockup, DeviceConfig, deviceConfigs } from './DeviceMockup';
import { LogoAnimator, LogoAnimationConfig } from './LogoAnimator';
import { TextAnimator, TextAnimationConfig } from './TextAnimator';

export type SceneType =
  | 'device-showcase'
  | 'logo-reveal'
  | 'text-animation'
  | 'product-demo'
  | 'social-post'
  | 'slideshow'
  | 'split-screen'
  | 'multi-device'
  | 'testimonial'
  | 'promo-banner'
  | 'intro-outro'
  | 'call-to-action';

export interface SceneElement {
  id: string;
  type: 'device' | 'logo' | 'text' | 'image' | 'shape' | 'video';
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  opacity: number;
  zIndex: number;
  data: any;
}

export interface SceneBackground {
  type: 'solid' | 'gradient' | 'image' | 'video' | 'pattern';
  value: string;
  gradientAngle?: number;
  gradientColors?: string[];
  overlay?: { color: string; opacity: number };
}

export interface SceneConfig {
  id: string;
  name: string;
  type: SceneType;
  duration: number;
  width: number;
  height: number;
  background: SceneBackground;
  elements: SceneElement[];
  transition?: {
    type: 'fade' | 'slide' | 'zoom' | 'wipe' | 'dissolve';
    duration: number;
  };
}

interface SceneBuilderProps {
  scene: SceneConfig;
  currentTime: number;
  isPlaying: boolean;
  onElementSelect?: (element: SceneElement | null) => void;
  selectedElementId?: string | null;
  editable?: boolean;
  scale?: number;
}

export function SceneBuilder({
  scene,
  currentTime,
  isPlaying,
  onElementSelect,
  selectedElementId,
  editable = false,
  scale = 1
}: SceneBuilderProps) {

  const renderBackground = () => {
    const { background } = scene;

    let bgStyle: React.CSSProperties = {};

    switch (background.type) {
      case 'solid':
        bgStyle.backgroundColor = background.value;
        break;
      case 'gradient':
        if (background.gradientColors && background.gradientColors.length >= 2) {
          bgStyle.background = `linear-gradient(${background.gradientAngle || 180}deg, ${background.gradientColors.join(', ')})`;
        }
        break;
      case 'image':
        bgStyle.backgroundImage = `url(${background.value})`;
        bgStyle.backgroundSize = 'cover';
        bgStyle.backgroundPosition = 'center';
        break;
      case 'pattern':
        bgStyle.backgroundImage = `url(${background.value})`;
        bgStyle.backgroundRepeat = 'repeat';
        break;
    }

    return (
      <div className="absolute inset-0" style={bgStyle}>
        {background.overlay && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: background.overlay.color,
              opacity: background.overlay.opacity
            }}
          />
        )}
      </div>
    );
  };

  const renderElement = (element: SceneElement) => {
    const isSelected = selectedElementId === element.id;

    const wrapperStyle: React.CSSProperties = {
      position: 'absolute',
      left: element.position.x,
      top: element.position.y,
      width: element.size.width,
      height: element.size.height,
      transform: `rotate(${element.rotation}deg)`,
      opacity: element.opacity,
      zIndex: element.zIndex,
      cursor: editable ? 'move' : 'default'
    };

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (editable && onElementSelect) {
        onElementSelect(element);
      }
    };

    const content = (() => {
      switch (element.type) {
        case 'device':
          const deviceConfig = deviceConfigs.find(d => d.id === element.data.deviceId) || deviceConfigs[0];
          return (
            <DeviceMockup
              device={deviceConfig}
              screenContent={
                element.data.screenImage ? (
                  <img
                    src={element.data.screenImage}
                    alt="Screen"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
                )
              }
              angle={element.data.angle || { x: 0, y: 0, z: 0 }}
              shadow={element.data.shadow !== false}
              shadowIntensity={element.data.shadowIntensity || 50}
              reflection={element.data.reflection}
              glare={element.data.glare}
              environment={element.data.environment || 'none'}
              scale={element.data.scale || 1}
            />
          );

        case 'logo':
          return (
            <LogoAnimator
              logoUrl={element.data.logoUrl}
              logoText={element.data.logoText}
              config={element.data.config as LogoAnimationConfig}
              isPlaying={isPlaying}
              currentTime={currentTime}
              backgroundColor="transparent"
              width={element.size.width}
              height={element.size.height}
            />
          );

        case 'text':
          return (
            <TextAnimator
              text={element.data.text}
              config={element.data.config as TextAnimationConfig}
              isPlaying={isPlaying}
              currentTime={currentTime}
              width={element.size.width}
              height={element.size.height}
            />
          );

        case 'image':
          return (
            <img
              src={element.data.src}
              alt={element.data.alt || ''}
              className="w-full h-full object-cover"
              style={{ borderRadius: element.data.borderRadius || 0 }}
            />
          );

        case 'shape':
          const shapeStyle: React.CSSProperties = {
            width: '100%',
            height: '100%',
            backgroundColor: element.data.fill || '#ffffff',
            border: element.data.stroke ? `${element.data.strokeWidth || 2}px solid ${element.data.stroke}` : 'none',
            borderRadius: element.data.shape === 'circle' ? '50%' : element.data.borderRadius || 0
          };
          return <div style={shapeStyle} />;

        case 'video':
          return (
            <video
              src={element.data.src}
              className="w-full h-full object-cover"
              autoPlay={isPlaying}
              loop={element.data.loop}
              muted={element.data.muted !== false}
            />
          );

        default:
          return null;
      }
    })();

    return (
      <div
        key={element.id}
        style={wrapperStyle}
        onClick={handleClick}
        className={isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      >
        {content}
        {editable && isSelected && (
          <>
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize" />
          </>
        )}
      </div>
    );
  };

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: scene.width * scale,
        height: scene.height * scale,
        transform: `scale(${scale})`,
        transformOrigin: 'top left'
      }}
      onClick={() => editable && onElementSelect && onElementSelect(null)}
    >
      {renderBackground()}
      {scene.elements
        .sort((a, b) => a.zIndex - b.zIndex)
        .map(element => renderElement(element))}
    </div>
  );
}

export const sceneTemplates: SceneConfig[] = [
  {
    id: 'iphone-showcase',
    name: 'iPhone App Showcase',
    type: 'device-showcase',
    duration: 5,
    width: 1920,
    height: 1080,
    background: {
      type: 'gradient',
      value: '',
      gradientAngle: 135,
      gradientColors: ['#1a1a2e', '#16213e', '#0f3460']
    },
    elements: [
      {
        id: 'device-1',
        type: 'device',
        position: { x: 760, y: 100 },
        size: { width: 400, height: 800 },
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        data: {
          deviceId: 'iphone-15-pro-max',
          angle: { x: 5, y: -10, z: 0 },
          shadow: true,
          shadowIntensity: 60,
          glare: true,
          environment: 'floating'
        }
      }
    ]
  },
  {
    id: 'multi-device',
    name: 'Multi-Device Display',
    type: 'multi-device',
    duration: 6,
    width: 1920,
    height: 1080,
    background: {
      type: 'gradient',
      value: '',
      gradientAngle: 180,
      gradientColors: ['#0f0f0f', '#1a1a1a', '#2a2a2a']
    },
    elements: [
      {
        id: 'laptop-1',
        type: 'device',
        position: { x: 400, y: 200 },
        size: { width: 600, height: 400 },
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        data: {
          deviceId: 'macbook-pro-16',
          angle: { x: 5, y: 0, z: 0 },
          shadow: true,
          shadowIntensity: 40
        }
      },
      {
        id: 'phone-1',
        type: 'device',
        position: { x: 1100, y: 300 },
        size: { width: 200, height: 400 },
        rotation: 5,
        opacity: 1,
        zIndex: 2,
        data: {
          deviceId: 'iphone-15-pro',
          angle: { x: 0, y: -15, z: 0 },
          shadow: true,
          shadowIntensity: 50,
          glare: true
        }
      },
      {
        id: 'tablet-1',
        type: 'device',
        position: { x: 1350, y: 250 },
        size: { width: 350, height: 450 },
        rotation: -5,
        opacity: 1,
        zIndex: 1,
        data: {
          deviceId: 'ipad-air',
          angle: { x: 5, y: 10, z: 0 },
          shadow: true,
          shadowIntensity: 45
        }
      }
    ]
  },
  {
    id: 'logo-intro',
    name: 'Logo Intro',
    type: 'logo-reveal',
    duration: 4,
    width: 1920,
    height: 1080,
    background: {
      type: 'solid',
      value: '#0a0a0a'
    },
    elements: [
      {
        id: 'logo-1',
        type: 'logo',
        position: { x: 560, y: 340 },
        size: { width: 800, height: 400 },
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        data: {
          logoText: 'Your Brand',
          config: {
            animation: 'neon-glow',
            duration: 1.5,
            delay: 0.5,
            easing: 'ease-out',
            intensity: 100,
            color: '#00ffff',
            glowIntensity: 30
          }
        }
      }
    ]
  },
  {
    id: 'text-promo',
    name: 'Text Promo',
    type: 'promo-banner',
    duration: 5,
    width: 1920,
    height: 1080,
    background: {
      type: 'gradient',
      value: '',
      gradientAngle: 135,
      gradientColors: ['#667eea', '#764ba2']
    },
    elements: [
      {
        id: 'headline',
        type: 'text',
        position: { x: 160, y: 300 },
        size: { width: 1600, height: 200 },
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        data: {
          text: 'AMAZING DEALS',
          config: {
            animation: 'kinetic-pop',
            duration: 1,
            delay: 0.3,
            staggerDelay: 0.05,
            easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            color: '#ffffff',
            fontSize: 120,
            fontWeight: 900,
            fontFamily: 'Inter, sans-serif',
            textAlign: 'center',
            letterSpacing: 10,
            lineHeight: 1.2
          }
        }
      },
      {
        id: 'subheadline',
        type: 'text',
        position: { x: 160, y: 520 },
        size: { width: 1600, height: 100 },
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        data: {
          text: 'Up to 50% off everything',
          config: {
            animation: 'fade-in-up',
            duration: 0.8,
            delay: 1.2,
            staggerDelay: 0,
            easing: 'ease-out',
            color: 'rgba(255,255,255,0.9)',
            fontSize: 48,
            fontWeight: 400,
            fontFamily: 'Inter, sans-serif',
            textAlign: 'center',
            letterSpacing: 2,
            lineHeight: 1.4
          }
        }
      }
    ]
  },
  {
    id: 'social-instagram',
    name: 'Instagram Story',
    type: 'social-post',
    duration: 8,
    width: 1080,
    height: 1920,
    background: {
      type: 'gradient',
      value: '',
      gradientAngle: 180,
      gradientColors: ['#833ab4', '#fd1d1d', '#fcb045']
    },
    elements: []
  },
  {
    id: 'youtube-intro',
    name: 'YouTube Intro',
    type: 'intro-outro',
    duration: 5,
    width: 1920,
    height: 1080,
    background: {
      type: 'solid',
      value: '#0a0a0a'
    },
    elements: [
      {
        id: 'channel-logo',
        type: 'logo',
        position: { x: 660, y: 290 },
        size: { width: 600, height: 500 },
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        data: {
          logoText: 'CHANNEL',
          config: {
            animation: '3d-flip',
            duration: 1.2,
            delay: 0.3,
            easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            intensity: 100,
            color: '#ff0000'
          }
        }
      }
    ]
  }
];
