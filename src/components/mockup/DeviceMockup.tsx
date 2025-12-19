import React from 'react';

export interface DeviceConfig {
  id: string;
  name: string;
  type: 'phone' | 'tablet' | 'laptop' | 'desktop' | 'watch' | 'tv' | 'gaming';
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
    id: 'iphone-15',
    name: 'iPhone 15',
    type: 'phone',
    brand: 'Apple',
    width: 218,
    height: 445,
    screenWidth: 198,
    screenHeight: 431,
    screenX: 10,
    screenY: 7,
    borderRadius: 38,
    bezelColor: '#f5f5f7',
    hasDynamicIsland: true
  },
  {
    id: 'iphone-14',
    name: 'iPhone 14',
    type: 'phone',
    brand: 'Apple',
    width: 216,
    height: 440,
    screenWidth: 196,
    screenHeight: 426,
    screenX: 10,
    screenY: 7,
    borderRadius: 36,
    bezelColor: '#1a1a1a',
    hasNotch: true
  },
  {
    id: 'iphone-se',
    name: 'iPhone SE',
    type: 'phone',
    brand: 'Apple',
    width: 200,
    height: 400,
    screenWidth: 180,
    screenHeight: 320,
    screenX: 10,
    screenY: 40,
    borderRadius: 32,
    bezelColor: '#f5f5f7',
    hasHomeButton: true
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
    id: 'samsung-s24',
    name: 'Samsung S24',
    type: 'phone',
    brand: 'Samsung',
    width: 215,
    height: 450,
    screenWidth: 199,
    screenHeight: 436,
    screenX: 8,
    screenY: 7,
    borderRadius: 34,
    bezelColor: '#232323'
  },
  {
    id: 'samsung-fold-5',
    name: 'Samsung Fold 5',
    type: 'phone',
    brand: 'Samsung',
    width: 280,
    height: 400,
    screenWidth: 264,
    screenHeight: 386,
    screenX: 8,
    screenY: 7,
    borderRadius: 24,
    bezelColor: '#1a1a1a'
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
    id: 'pixel-8',
    name: 'Pixel 8',
    type: 'phone',
    brand: 'Google',
    width: 215,
    height: 450,
    screenWidth: 199,
    screenHeight: 436,
    screenX: 8,
    screenY: 7,
    borderRadius: 36,
    bezelColor: '#f5ebe0'
  },
  {
    id: 'oneplus-12',
    name: 'OnePlus 12',
    type: 'phone',
    brand: 'OnePlus',
    width: 228,
    height: 475,
    screenWidth: 212,
    screenHeight: 461,
    screenX: 8,
    screenY: 7,
    borderRadius: 40,
    bezelColor: '#1a1a1a'
  },
  {
    id: 'xiaomi-14-ultra',
    name: 'Xiaomi 14 Ultra',
    type: 'phone',
    brand: 'Xiaomi',
    width: 230,
    height: 478,
    screenWidth: 214,
    screenHeight: 464,
    screenX: 8,
    screenY: 7,
    borderRadius: 42,
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
    id: 'ipad-pro-11',
    name: 'iPad Pro 11"',
    type: 'tablet',
    brand: 'Apple',
    width: 360,
    height: 500,
    screenWidth: 340,
    screenHeight: 480,
    screenX: 10,
    screenY: 10,
    borderRadius: 22,
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
    id: 'ipad-mini',
    name: 'iPad Mini',
    type: 'tablet',
    brand: 'Apple',
    width: 300,
    height: 420,
    screenWidth: 280,
    screenHeight: 400,
    screenX: 10,
    screenY: 10,
    borderRadius: 18,
    bezelColor: '#f5f5f7'
  },
  {
    id: 'samsung-tab-s9',
    name: 'Samsung Tab S9 Ultra',
    type: 'tablet',
    brand: 'Samsung',
    width: 420,
    height: 560,
    screenWidth: 404,
    screenHeight: 544,
    screenX: 8,
    screenY: 8,
    borderRadius: 20,
    bezelColor: '#1a1a1a'
  },
  {
    id: 'surface-pro-9',
    name: 'Surface Pro 9',
    type: 'tablet',
    brand: 'Microsoft',
    width: 440,
    height: 300,
    screenWidth: 424,
    screenHeight: 284,
    screenX: 8,
    screenY: 8,
    borderRadius: 12,
    bezelColor: '#1a1a1a'
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
    id: 'macbook-pro-14',
    name: 'MacBook Pro 14"',
    type: 'laptop',
    brand: 'Apple',
    width: 540,
    height: 350,
    screenWidth: 500,
    screenHeight: 320,
    screenX: 20,
    screenY: 15,
    borderRadius: 12,
    bezelColor: '#1a1a1a',
    hasNotch: true
  },
  {
    id: 'macbook-air-15',
    name: 'MacBook Air 15"',
    type: 'laptop',
    brand: 'Apple',
    width: 560,
    height: 340,
    screenWidth: 520,
    screenHeight: 310,
    screenX: 20,
    screenY: 15,
    borderRadius: 10,
    bezelColor: '#f5f5f7'
  },
  {
    id: 'macbook-air-13',
    name: 'MacBook Air 13"',
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
    id: 'dell-xps-15',
    name: 'Dell XPS 15',
    type: 'laptop',
    brand: 'Dell',
    width: 580,
    height: 360,
    screenWidth: 544,
    screenHeight: 340,
    screenX: 18,
    screenY: 10,
    borderRadius: 8,
    bezelColor: '#1a1a1a'
  },
  {
    id: 'thinkpad-x1',
    name: 'ThinkPad X1 Carbon',
    type: 'laptop',
    brand: 'Lenovo',
    width: 570,
    height: 355,
    screenWidth: 534,
    screenHeight: 335,
    screenX: 18,
    screenY: 10,
    borderRadius: 6,
    bezelColor: '#1a1a1a'
  },
  {
    id: 'surface-laptop-5',
    name: 'Surface Laptop 5',
    type: 'laptop',
    brand: 'Microsoft',
    width: 560,
    height: 350,
    screenWidth: 520,
    screenHeight: 320,
    screenX: 20,
    screenY: 15,
    borderRadius: 10,
    bezelColor: '#f0f0f0'
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
    id: 'pro-display-xdr',
    name: 'Pro Display XDR',
    type: 'desktop',
    brand: 'Apple',
    width: 640,
    height: 440,
    screenWidth: 600,
    screenHeight: 360,
    screenX: 20,
    screenY: 20,
    borderRadius: 12,
    bezelColor: '#1a1a1a'
  },
  {
    id: 'lg-ultrafine-5k',
    name: 'LG UltraFine 5K',
    type: 'desktop',
    brand: 'LG',
    width: 620,
    height: 430,
    screenWidth: 584,
    screenHeight: 360,
    screenX: 18,
    screenY: 18,
    borderRadius: 10,
    bezelColor: '#1a1a1a'
  },
  {
    id: 'dell-ultrasharp-32',
    name: 'Dell UltraSharp 32"',
    type: 'desktop',
    brand: 'Dell',
    width: 640,
    height: 450,
    screenWidth: 604,
    screenHeight: 380,
    screenX: 18,
    screenY: 18,
    borderRadius: 8,
    bezelColor: '#1a1a1a'
  },
  {
    id: 'apple-watch-ultra-2',
    name: 'Apple Watch Ultra 2',
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
  },
  {
    id: 'apple-watch-series-9',
    name: 'Apple Watch Series 9',
    type: 'watch',
    brand: 'Apple',
    width: 100,
    height: 120,
    screenWidth: 74,
    screenHeight: 94,
    screenX: 13,
    screenY: 13,
    borderRadius: 28,
    bezelColor: '#1a1a1a'
  },
  {
    id: 'apple-watch-se',
    name: 'Apple Watch SE',
    type: 'watch',
    brand: 'Apple',
    width: 95,
    height: 115,
    screenWidth: 70,
    screenHeight: 90,
    screenX: 12.5,
    screenY: 12.5,
    borderRadius: 26,
    bezelColor: '#f5f5f7'
  },
  {
    id: 'samsung-watch-6',
    name: 'Samsung Galaxy Watch 6',
    type: 'watch',
    brand: 'Samsung',
    width: 110,
    height: 110,
    screenWidth: 84,
    screenHeight: 84,
    screenX: 13,
    screenY: 13,
    borderRadius: 55,
    bezelColor: '#2a2a2a'
  },
  {
    id: 'lg-oled-c3-65',
    name: 'LG OLED C3 65"',
    type: 'tv',
    brand: 'LG',
    width: 700,
    height: 420,
    screenWidth: 680,
    screenHeight: 382,
    screenX: 10,
    screenY: 10,
    borderRadius: 8,
    bezelColor: '#0a0a0a'
  },
  {
    id: 'samsung-qled-55',
    name: 'Samsung QLED 55"',
    type: 'tv',
    brand: 'Samsung',
    width: 650,
    height: 390,
    screenWidth: 630,
    screenHeight: 354,
    screenX: 10,
    screenY: 10,
    borderRadius: 6,
    bezelColor: '#1a1a1a'
  },
  {
    id: 'sony-bravia-65',
    name: 'Sony Bravia XR 65"',
    type: 'tv',
    brand: 'Sony',
    width: 700,
    height: 420,
    screenWidth: 680,
    screenHeight: 382,
    screenX: 10,
    screenY: 10,
    borderRadius: 4,
    bezelColor: '#232323'
  },
  {
    id: 'apple-tv-4k',
    name: 'Apple TV 4K Setup',
    type: 'tv',
    brand: 'Apple',
    width: 680,
    height: 410,
    screenWidth: 660,
    screenHeight: 371,
    screenX: 10,
    screenY: 10,
    borderRadius: 8,
    bezelColor: '#1a1a1a'
  },
  {
    id: 'steam-deck',
    name: 'Steam Deck',
    type: 'gaming',
    brand: 'Valve',
    width: 420,
    height: 180,
    screenWidth: 200,
    screenHeight: 126,
    screenX: 110,
    screenY: 27,
    borderRadius: 24,
    bezelColor: '#1a1a1a'
  },
  {
    id: 'nintendo-switch',
    name: 'Nintendo Switch',
    type: 'gaming',
    brand: 'Nintendo',
    width: 400,
    height: 160,
    screenWidth: 180,
    screenHeight: 110,
    screenX: 110,
    screenY: 25,
    borderRadius: 16,
    bezelColor: '#2d2d2d'
  },
  {
    id: 'playstation-portal',
    name: 'PlayStation Portal',
    type: 'gaming',
    brand: 'Sony',
    width: 380,
    height: 170,
    screenWidth: 200,
    screenHeight: 120,
    screenX: 90,
    screenY: 25,
    borderRadius: 20,
    bezelColor: '#1a1a1a'
  },
  {
    id: 'rog-ally',
    name: 'ROG Ally',
    type: 'gaming',
    brand: 'ASUS',
    width: 400,
    height: 175,
    screenWidth: 190,
    screenHeight: 120,
    screenX: 105,
    screenY: 27.5,
    borderRadius: 22,
    bezelColor: '#f5f5f5'
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
  clayMode?: boolean;
  clayColor?: string;
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
  className = '',
  clayMode = false,
  clayColor = '#e2e8f0'
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

  const bezelColorFinal = clayMode ? clayColor : device.bezelColor;

  const renderDevice = () => {
    if (device.type === 'laptop') {
      return (
        <div className="relative">
          <div
            className="relative rounded-t-xl overflow-hidden"
            style={{
              width: device.width,
              height: device.height - 20,
              backgroundColor: bezelColorFinal,
              borderRadius: `${device.borderRadius}px ${device.borderRadius}px 0 0`,
              boxShadow: clayMode ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : undefined
            }}
          >
            {device.hasNotch && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10" style={{ backgroundColor: clayMode ? `color-mix(in srgb, ${clayColor} 80%, black)` : undefined }}></div>
            )}
            <div
              className="absolute overflow-hidden"
              style={{
                left: device.screenX,
                top: device.screenY,
                width: device.screenWidth,
                height: device.screenHeight,
                borderRadius: device.borderRadius - 4,
                backgroundColor: clayMode ? '#1a1a1a' : 'black'
              }}
            >
              {screenContent}
              {glare && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)'
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
              backgroundColor: bezelColorFinal,
              background: clayMode ? bezelColorFinal : `linear-gradient(180deg, ${bezelColorFinal} 0%, #0a0a0a 100%)`
            }}
          >
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-24 h-1.5 rounded-full" style={{ backgroundColor: clayMode ? `color-mix(in srgb, ${clayColor} 70%, black)` : '#666' }}></div>
          </div>
          <div
            className="h-2 rounded-b-xl"
            style={{
              width: device.width + 80,
              marginLeft: -40,
              backgroundColor: clayMode ? `color-mix(in srgb, ${clayColor} 85%, black)` : '#2a2a2a',
              background: clayMode ? undefined : 'linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 100%)'
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
              backgroundColor: bezelColorFinal,
              borderRadius: device.borderRadius,
              boxShadow: clayMode ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : undefined
            }}
          >
            <div
              className="absolute overflow-hidden"
              style={{
                left: device.screenX,
                top: device.screenY,
                width: device.screenWidth,
                height: device.screenHeight,
                borderRadius: device.borderRadius - 8,
                backgroundColor: clayMode ? '#1a1a1a' : 'black'
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
              style={{ color: clayMode ? `color-mix(in srgb, ${clayColor} 50%, black)` : '#666' }}
            >
              {device.brand}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div
              className="w-8 h-16"
              style={{ backgroundColor: bezelColorFinal }}
            />
            <div
              className="w-32 h-3 rounded-full"
              style={{ backgroundColor: bezelColorFinal }}
            />
          </div>
        </div>
      );
    }

    if (device.type === 'tv') {
      return (
        <div className="relative">
          <div
            className="relative overflow-hidden"
            style={{
              width: device.width,
              height: device.height,
              backgroundColor: bezelColorFinal,
              borderRadius: device.borderRadius,
              boxShadow: clayMode ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : undefined
            }}
          >
            <div
              className="absolute overflow-hidden"
              style={{
                left: device.screenX,
                top: device.screenY,
                width: device.screenWidth,
                height: device.screenHeight,
                borderRadius: Math.max(0, device.borderRadius - 4),
                backgroundColor: clayMode ? '#1a1a1a' : 'black'
              }}
            >
              {screenContent}
              {glare && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)'
                  }}
                />
              )}
            </div>
          </div>
          <div className="flex flex-col items-center mt-2">
            <div
              className="w-6 h-8"
              style={{ backgroundColor: bezelColorFinal }}
            />
            <div
              className="w-48 h-2 rounded-full"
              style={{ backgroundColor: bezelColorFinal }}
            />
          </div>
        </div>
      );
    }

    if (device.type === 'gaming') {
      return (
        <div
          className="relative overflow-hidden"
          style={{
            width: device.width,
            height: device.height,
            backgroundColor: bezelColorFinal,
            borderRadius: device.borderRadius,
            boxShadow: clayMode ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : undefined
          }}
        >
          <div
            className="absolute top-1/2 left-4 -translate-y-1/2 w-16 h-16 rounded-full"
            style={{ backgroundColor: clayMode ? `color-mix(in srgb, ${clayColor} 85%, black)` : '#333' }}
          >
            <div className="absolute inset-2 rounded-full" style={{ backgroundColor: clayMode ? `color-mix(in srgb, ${clayColor} 70%, black)` : '#444' }}></div>
          </div>
          <div
            className="absolute top-1/2 right-4 -translate-y-1/2 w-16 h-16 rounded-full"
            style={{ backgroundColor: clayMode ? `color-mix(in srgb, ${clayColor} 85%, black)` : '#333' }}
          >
            <div className="absolute inset-2 rounded-full" style={{ backgroundColor: clayMode ? `color-mix(in srgb, ${clayColor} 70%, black)` : '#444' }}></div>
          </div>
          <div
            className="absolute overflow-hidden"
            style={{
              left: device.screenX,
              top: device.screenY,
              width: device.screenWidth,
              height: device.screenHeight,
              borderRadius: Math.max(0, device.borderRadius - 8),
              backgroundColor: clayMode ? '#1a1a1a' : 'black'
            }}
          >
            {screenContent}
            {glare && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, transparent 40%)'
                }}
              />
            )}
          </div>
          <div className="absolute bottom-3 left-24 flex gap-1.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: clayMode ? `color-mix(in srgb, ${clayColor} 60%, black)` : '#555' }}></div>
            ))}
          </div>
          <div className="absolute bottom-3 right-24 flex gap-1.5">
            {['#ef4444', '#22c55e', '#3b82f6', '#eab308'].map((color, i) => (
              <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: clayMode ? `color-mix(in srgb, ${clayColor} 60%, black)` : color }}></div>
            ))}
          </div>
        </div>
      );
    }

    if (device.type === 'watch') {
      return (
        <div
          className="relative overflow-hidden"
          style={{
            width: device.width,
            height: device.height,
            backgroundColor: bezelColorFinal,
            borderRadius: device.borderRadius,
            boxShadow: clayMode ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : undefined
          }}
        >
          <div
            className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-3 h-10 rounded-r-lg"
            style={{ backgroundColor: clayMode ? `color-mix(in srgb, ${clayColor} 80%, black)` : '#555' }}
          />
          <div
            className="absolute overflow-hidden"
            style={{
              left: device.screenX,
              top: device.screenY,
              width: device.screenWidth,
              height: device.screenHeight,
              borderRadius: device.borderRadius - 8,
              backgroundColor: clayMode ? '#1a1a1a' : 'black'
            }}
          >
            {screenContent}
            {glare && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)'
                }}
              />
            )}
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
          backgroundColor: bezelColorFinal,
          borderRadius: device.borderRadius,
          border: device.type === 'phone' ? `3px solid ${clayMode ? `color-mix(in srgb, ${clayColor} 70%, black)` : '#0a0a0a'}` : 'none',
          boxShadow: clayMode ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : undefined
        }}
      >
        {device.hasDynamicIsland && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-8 rounded-full z-10 flex items-center justify-center gap-6" style={{ backgroundColor: clayMode ? `color-mix(in srgb, ${clayColor} 40%, black)` : 'black' }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: clayMode ? `color-mix(in srgb, ${clayColor} 60%, black)` : '#333' }}></div>
            <div className="w-3 h-3 rounded-full ring-1" style={{ backgroundColor: clayMode ? `color-mix(in srgb, ${clayColor} 50%, black)` : '#222', borderColor: clayMode ? `color-mix(in srgb, ${clayColor} 60%, black)` : '#444' }}></div>
          </div>
        )}
        {device.hasNotch && device.type === 'phone' && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 rounded-b-2xl z-10" style={{ backgroundColor: clayMode ? `color-mix(in srgb, ${clayColor} 40%, black)` : 'black' }}></div>
        )}
        {device.hasHomeButton && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-2 z-10" style={{ borderColor: clayMode ? `color-mix(in srgb, ${clayColor} 60%, black)` : '#666' }}></div>
        )}
        <div
          className="absolute overflow-hidden"
          style={{
            left: device.screenX,
            top: device.screenY,
            width: device.screenWidth,
            height: device.screenHeight,
            borderRadius: device.borderRadius - 6,
            backgroundColor: clayMode ? '#1a1a1a' : 'black'
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
            <div className="absolute right-[-3px] top-24 w-1 h-8 rounded-l" style={{ backgroundColor: clayMode ? `color-mix(in srgb, ${clayColor} 70%, black)` : '#555' }}></div>
            <div className="absolute right-[-3px] top-36 w-1 h-16 rounded-l" style={{ backgroundColor: clayMode ? `color-mix(in srgb, ${clayColor} 70%, black)` : '#555' }}></div>
            <div className="absolute left-[-3px] top-28 w-1 h-12 rounded-r" style={{ backgroundColor: clayMode ? `color-mix(in srgb, ${clayColor} 70%, black)` : '#555' }}></div>
            <div className="absolute left-[-3px] top-44 w-1 h-12 rounded-r" style={{ backgroundColor: clayMode ? `color-mix(in srgb, ${clayColor} 70%, black)` : '#555' }}></div>
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
