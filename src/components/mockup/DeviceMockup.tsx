import React from 'react';

export interface DeviceConfig {
  id: string;
  name: string;
  type: 'phone' | 'tablet' | 'laptop' | 'desktop' | 'watch';
  brand: string;
  width: number;
  height: number;
  screenWidth: number;
  screenHeight: number;
  screenX: number;
  screenY: number;
  borderRadius: number;
  bezelColor: string;
  hasNotch?: boolean;
  hasDynamicIsland?: boolean;
  hasHomeButton?: boolean;
}

export const deviceConfigs: DeviceConfig[] = [
  {
    id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    type: 'phone',
    brand: 'Apple',
    width: 240,
    height: 490,
    screenWidth: 220,
    screenHeight: 476,
    screenX: 10,
    screenY: 7,
    borderRadius: 44,
    bezelColor: '#1a1a1a',
    hasDynamicIsland: true
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    type: 'phone',
    brand: 'Apple',
    width: 220,
    height: 450,
    screenWidth: 200,
    screenHeight: 436,
    screenX: 10,
    screenY: 7,
    borderRadius: 40,
    bezelColor: '#2a2a2a',
    hasDynamicIsland: true
  },
  {
    id: 'samsung-s24-ultra',
    name: 'Samsung S24 Ultra',
    type: 'phone',
    brand: 'Samsung',
    width: 230,
    height: 480,
    screenWidth: 214,
    screenHeight: 466,
    screenX: 8,
    screenY: 7,
    borderRadius: 36,
    bezelColor: '#1f1f1f'
  },
  {
    id: 'pixel-8-pro',
    name: 'Pixel 8 Pro',
    type: 'phone',
    brand: 'Google',
    width: 225,
    height: 470,
    screenWidth: 209,
    screenHeight: 456,
    screenX: 8,
    screenY: 7,
    borderRadius: 38,
    bezelColor: '#232323'
  },
  {
    id: 'ipad-pro-13',
    name: 'iPad Pro 13"',
    type: 'tablet',
    brand: 'Apple',
    width: 400,
    height: 540,
    screenWidth: 380,
    screenHeight: 520,
    screenX: 10,
    screenY: 10,
    borderRadius: 24,
    bezelColor: '#1a1a1a'
  },
  {
    id: 'ipad-air',
    name: 'iPad Air',
    type: 'tablet',
    brand: 'Apple',
    width: 360,
    height: 480,
    screenWidth: 340,
    screenHeight: 460,
    screenX: 10,
    screenY: 10,
    borderRadius: 20,
    bezelColor: '#2a2a2a'
  },
  {
    id: 'macbook-pro-16',
    name: 'MacBook Pro 16"',
    type: 'laptop',
    brand: 'Apple',
    width: 600,
    height: 380,
    screenWidth: 560,
    screenHeight: 350,
    screenX: 20,
    screenY: 15,
    borderRadius: 12,
    bezelColor: '#1a1a1a',
    hasNotch: true
  },
  {
    id: 'macbook-air',
    name: 'MacBook Air',
    type: 'laptop',
    brand: 'Apple',
    width: 520,
    height: 320,
    screenWidth: 480,
    screenHeight: 290,
    screenX: 20,
    screenY: 15,
    borderRadius: 10,
    bezelColor: '#2a2a2a'
  },
  {
    id: 'imac-24',
    name: 'iMac 24"',
    type: 'desktop',
    brand: 'Apple',
    width: 560,
    height: 480,
    screenWidth: 520,
    screenHeight: 320,
    screenX: 20,
    screenY: 20,
    borderRadius: 20,
    bezelColor: '#f0f0f0'
  },
  {
    id: 'studio-display',
    name: 'Studio Display',
    type: 'desktop',
    brand: 'Apple',
    width: 600,
    height: 420,
    screenWidth: 560,
    screenHeight: 340,
    screenX: 20,
    screenY: 20,
    borderRadius: 16,
    bezelColor: '#1a1a1a'
  },
  {
    id: 'apple-watch-ultra',
    name: 'Apple Watch Ultra',
    type: 'watch',
    brand: 'Apple',
    width: 120,
    height: 140,
    screenWidth: 90,
    screenHeight: 110,
    screenX: 15,
    screenY: 15,
    borderRadius: 24,
    bezelColor: '#3a3a3a'
  }
];

interface DeviceMockupProps {
  device: DeviceConfig;
  screenContent: React.ReactNode;
  angle?: { x: number; y: number; z: number };
  shadow?: boolean;
  shadowIntensity?: number;
  reflection?: boolean;
  glare?: boolean;
  environment?: 'none' | 'desk' | 'hand' | 'floating' | 'studio';
  scale?: number;
  className?: string;
}

export function DeviceMockup({
  device,
  screenContent,
  angle = { x: 0, y: 0, z: 0 },
  shadow = true,
  shadowIntensity = 50,
  reflection = false,
  glare = false,
  environment = 'none',
  scale = 1,
  className = ''
}: DeviceMockupProps) {
  const transform = `
    perspective(1200px)
    rotateX(${angle.x}deg)
    rotateY(${angle.y}deg)
    rotateZ(${angle.z}deg)
    scale(${scale})
  `;

  const shadowStyle = shadow
    ? `0 ${20 + shadowIntensity * 0.5}px ${40 + shadowIntensity}px rgba(0,0,0,${0.15 + shadowIntensity * 0.003}),
       0 ${10 + shadowIntensity * 0.3}px ${20 + shadowIntensity * 0.5}px rgba(0,0,0,${0.1 + shadowIntensity * 0.002})`
    : 'none';

  const renderDevice = () => {
    if (device.type === 'laptop') {
      return (
        <div className="relative">
          <div
            className="relative rounded-t-xl overflow-hidden"
            style={{
              width: device.width,
              height: device.height - 20,
              backgroundColor: device.bezelColor,
              borderRadius: `${device.borderRadius}px ${device.borderRadius}px 0 0`
            }}
          >
            {device.hasNotch && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10"></div>
            )}
            <div
              className="absolute overflow-hidden bg-black"
              style={{
                left: device.screenX,
                top: device.screenY,
                width: device.screenWidth,
                height: device.screenHeight,
                borderRadius: device.borderRadius - 4
              }}
            >
              {screenContent}
              {glare && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)'
                  }}
                />
              )}
            </div>
          </div>
          <div
            className="relative h-5 rounded-b-lg"
            style={{
              width: device.width + 40,
              marginLeft: -20,
              backgroundColor: device.bezelColor,
              background: `linear-gradient(180deg, ${device.bezelColor} 0%, #0a0a0a 100%)`
            }}
          >
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-slate-600 rounded-full"></div>
          </div>
          <div
            className="h-2 rounded-b-xl"
            style={{
              width: device.width + 80,
              marginLeft: -40,
              backgroundColor: '#2a2a2a',
              background: 'linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 100%)'
            }}
          />
        </div>
      );
    }

    if (device.type === 'desktop') {
      return (
        <div className="relative">
          <div
            className="relative overflow-hidden"
            style={{
              width: device.width,
              height: device.screenHeight + 40,
              backgroundColor: device.bezelColor,
              borderRadius: device.borderRadius
            }}
          >
            <div
              className="absolute overflow-hidden bg-black"
              style={{
                left: device.screenX,
                top: device.screenY,
                width: device.screenWidth,
                height: device.screenHeight,
                borderRadius: device.borderRadius - 8
              }}
            >
              {screenContent}
              {glare && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%)'
                  }}
                />
              )}
            </div>
            <div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-medium"
              style={{ color: device.bezelColor === '#f0f0f0' ? '#666' : '#666' }}
            >
              {device.brand}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div
              className="w-8 h-16"
              style={{ backgroundColor: device.bezelColor }}
            />
            <div
              className="w-32 h-3 rounded-full"
              style={{ backgroundColor: device.bezelColor }}
            />
          </div>
        </div>
      );
    }

    return (
      <div
        className="relative overflow-hidden"
        style={{
          width: device.width,
          height: device.height,
          backgroundColor: device.bezelColor,
          borderRadius: device.borderRadius,
          border: device.type === 'phone' ? '3px solid #0a0a0a' : 'none'
        }}
      >
        {device.hasDynamicIsland && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-10 flex items-center justify-center gap-6">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
            <div className="w-3 h-3 rounded-full bg-slate-900 ring-1 ring-slate-700"></div>
          </div>
        )}
        {device.hasNotch && device.type === 'phone' && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-10"></div>
        )}
        {device.hasHomeButton && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-2 border-slate-600 z-10"></div>
        )}
        <div
          className="absolute overflow-hidden bg-black"
          style={{
            left: device.screenX,
            top: device.screenY,
            width: device.screenWidth,
            height: device.screenHeight,
            borderRadius: device.borderRadius - 6
          }}
        >
          {screenContent}
          {glare && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(255,255,255,0.03) 100%)'
              }}
            />
          )}
        </div>
        {device.type === 'phone' && (
          <>
            <div className="absolute right-[-3px] top-24 w-1 h-8 bg-slate-700 rounded-l"></div>
            <div className="absolute right-[-3px] top-36 w-1 h-16 bg-slate-700 rounded-l"></div>
            <div className="absolute left-[-3px] top-28 w-1 h-12 bg-slate-700 rounded-r"></div>
            <div className="absolute left-[-3px] top-44 w-1 h-12 bg-slate-700 rounded-r"></div>
          </>
        )}
      </div>
    );
  };

  const renderEnvironment = () => {
    if (environment === 'desk') {
      return (
        <div className="absolute inset-0 -z-10">
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-amber-900/20 to-transparent"></div>
          <div className="absolute bottom-4 left-1/4 w-16 h-3 bg-amber-800/30 rounded-full blur-sm"></div>
          <div className="absolute bottom-6 right-1/4 w-20 h-4 bg-slate-700/30 rounded blur-sm"></div>
        </div>
      );
    }

    if (environment === 'floating') {
      return (
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full blur-xl"
            style={{
              background: `radial-gradient(ellipse, rgba(0,0,0,${0.2 + shadowIntensity * 0.003}) 0%, transparent 70%)`
            }}
          />
        </div>
      );
    }

    if (environment === 'studio') {
      return (
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-100 via-slate-50 to-white">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/80 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-slate-200/50 to-transparent"></div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {renderEnvironment()}
      <div
        style={{
          transform,
          transformStyle: 'preserve-3d',
          boxShadow: shadowStyle,
          transition: 'transform 0.3s ease-out'
        }}
      >
        {renderDevice()}
      </div>
      {reflection && (
        <div
          className="absolute top-full left-0 right-0 pointer-events-none"
          style={{
            transform: 'scaleY(-1) translateY(-10px)',
            opacity: 0.15,
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 50%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 50%)'
          }}
        >
          {renderDevice()}
        </div>
      )}
    </div>
  );
}
