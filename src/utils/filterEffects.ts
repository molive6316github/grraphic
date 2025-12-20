export interface Filter {
  id: string;
  name: string;
  category: string;
  cssFilter?: string;
  canvasFilter?: (imageData: ImageData) => ImageData;
  params?: FilterParam[];
}

export interface FilterParam {
  name: string;
  type: 'number' | 'color' | 'boolean' | 'select';
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

export interface Effect {
  id: string;
  name: string;
  type: 'shadow' | 'glow' | 'blur' | 'outline' | 'gradient' | 'noise' | 'vignette' | 'chromatic-aberration';
  params: Record<string, any>;
}

export const filterPresets: Filter[] = [
  {
    id: 'grayscale',
    name: 'Grayscale',
    category: 'Basic',
    cssFilter: 'grayscale(100%)'
  },
  {
    id: 'sepia',
    name: 'Sepia',
    category: 'Basic',
    cssFilter: 'sepia(100%)'
  },
  {
    id: 'invert',
    name: 'Invert',
    category: 'Basic',
    cssFilter: 'invert(100%)'
  },
  {
    id: 'blur',
    name: 'Blur',
    category: 'Basic',
    cssFilter: 'blur(5px)',
    params: [{
      name: 'intensity',
      type: 'number',
      value: 5,
      min: 0,
      max: 20,
      step: 1
    }]
  },
  {
    id: 'brightness',
    name: 'Brightness',
    category: 'Adjust',
    cssFilter: 'brightness(1.2)',
    params: [{
      name: 'amount',
      type: 'number',
      value: 1.2,
      min: 0,
      max: 2,
      step: 0.1
    }]
  },
  {
    id: 'contrast',
    name: 'Contrast',
    category: 'Adjust',
    cssFilter: 'contrast(1.3)',
    params: [{
      name: 'amount',
      type: 'number',
      value: 1.3,
      min: 0,
      max: 2,
      step: 0.1
    }]
  },
  {
    id: 'saturate',
    name: 'Saturation',
    category: 'Adjust',
    cssFilter: 'saturate(1.5)',
    params: [{
      name: 'amount',
      type: 'number',
      value: 1.5,
      min: 0,
      max: 3,
      step: 0.1
    }]
  },
  {
    id: 'hue-rotate',
    name: 'Hue Rotate',
    category: 'Adjust',
    cssFilter: 'hue-rotate(90deg)',
    params: [{
      name: 'degrees',
      type: 'number',
      value: 90,
      min: 0,
      max: 360,
      step: 1
    }]
  },
  {
    id: 'vintage',
    name: 'Vintage',
    category: 'Artistic',
    cssFilter: 'sepia(50%) contrast(1.2) brightness(0.9) saturate(0.8)'
  },
  {
    id: 'warm',
    name: 'Warm',
    category: 'Artistic',
    cssFilter: 'sepia(30%) saturate(1.3) brightness(1.05)'
  },
  {
    id: 'cool',
    name: 'Cool',
    category: 'Artistic',
    cssFilter: 'brightness(1.1) contrast(1.1) saturate(0.9) hue-rotate(180deg) saturate(1.2) hue-rotate(-180deg)'
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    category: 'Artistic',
    cssFilter: 'contrast(1.5) brightness(0.85) saturate(1.3)'
  },
  {
    id: 'fade',
    name: 'Fade',
    category: 'Artistic',
    cssFilter: 'contrast(0.85) brightness(1.2) saturate(0.7)'
  },
  {
    id: 'noir',
    name: 'Film Noir',
    category: 'Artistic',
    cssFilter: 'grayscale(100%) contrast(1.5) brightness(0.9)'
  }
];

export class FilterEngine {
  static applyFilter(imageData: ImageData, filter: Filter): ImageData {
    if (filter.canvasFilter) {
      return filter.canvasFilter(imageData);
    }

    return imageData;
  }

  static grayscale(imageData: ImageData): ImageData {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
    return imageData;
  }

  static sepia(imageData: ImageData): ImageData {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
      data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
      data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    }
    return imageData;
  }

  static invert(imageData: ImageData): ImageData {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
    return imageData;
  }

  static brightness(imageData: ImageData, amount: number): ImageData {
    const data = imageData.data;
    const adjust = (amount - 1) * 255;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] + adjust));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + adjust));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + adjust));
    }
    return imageData;
  }

  static contrast(imageData: ImageData, amount: number): ImageData {
    const data = imageData.data;
    const factor = (259 * (amount * 255 + 255)) / (255 * (259 - amount * 255));

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
    }
    return imageData;
  }

  static saturate(imageData: ImageData, amount: number): ImageData {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;

      data[i] = Math.max(0, Math.min(255, gray + amount * (r - gray)));
      data[i + 1] = Math.max(0, Math.min(255, gray + amount * (g - gray)));
      data[i + 2] = Math.max(0, Math.min(255, gray + amount * (b - gray)));
    }
    return imageData;
  }

  static noise(imageData: ImageData, amount: number = 0.1): ImageData {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * amount * 255;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    return imageData;
  }

  static vignette(
    imageData: ImageData,
    intensity: number = 0.5,
    radius: number = 0.7
  ): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const vignette = 1 - Math.pow(dist / maxDist / radius, 2) * intensity;

        data[i] *= vignette;
        data[i + 1] *= vignette;
        data[i + 2] *= vignette;
      }
    }
    return imageData;
  }

  static chromaticAberration(
    imageData: ImageData,
    amount: number = 5
  ): ImageData {
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;

        const rX = Math.max(0, Math.min(width - 1, x - amount));
        const rI = (y * width + rX) * 4;
        imageData.data[i] = data[rI];

        const bX = Math.max(0, Math.min(width - 1, x + amount));
        const bI = (y * width + bX) * 4;
        imageData.data[i + 2] = data[bI + 2];
      }
    }
    return imageData;
  }

  static sharpen(imageData: ImageData, amount: number = 1): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = new Uint8ClampedArray(data);

    const kernel = [
      0, -amount, 0,
      -amount, 1 + 4 * amount, -amount,
      0, -amount, 0
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const i = ((y + ky) * width + (x + kx)) * 4 + c;
              sum += data[i] * kernel[(ky + 1) * 3 + (kx + 1)];
            }
          }
          output[(y * width + x) * 4 + c] = Math.max(0, Math.min(255, sum));
        }
      }
    }

    imageData.data.set(output);
    return imageData;
  }

  static combineFilters(filters: string[]): string {
    return filters.join(' ');
  }

  static parseFilterString(filterString: string): Record<string, number> {
    const filters: Record<string, number> = {};
    const regex = /(\w+)\(([^)]+)\)/g;
    let match;

    while ((match = regex.exec(filterString)) !== null) {
      const [, name, value] = match;
      filters[name] = parseFloat(value);
    }

    return filters;
  }
}

export const effectPresets: Record<string, Effect> = {
  'drop-shadow': {
    id: 'drop-shadow',
    name: 'Drop Shadow',
    type: 'shadow',
    params: {
      color: 'rgba(0,0,0,0.5)',
      blur: 10,
      offsetX: 5,
      offsetY: 5
    }
  },
  'inner-shadow': {
    id: 'inner-shadow',
    name: 'Inner Shadow',
    type: 'shadow',
    params: {
      color: 'rgba(0,0,0,0.5)',
      blur: 10,
      offsetX: 0,
      offsetY: 0,
      inset: true
    }
  },
  'outer-glow': {
    id: 'outer-glow',
    name: 'Outer Glow',
    type: 'glow',
    params: {
      color: '#ffffff',
      blur: 15,
      spread: 5
    }
  },
  'inner-glow': {
    id: 'inner-glow',
    name: 'Inner Glow',
    type: 'glow',
    params: {
      color: '#ffffff',
      blur: 15,
      spread: 5,
      inset: true
    }
  },
  'gaussian-blur': {
    id: 'gaussian-blur',
    name: 'Gaussian Blur',
    type: 'blur',
    params: {
      radius: 5
    }
  },
  'outline': {
    id: 'outline',
    name: 'Outline',
    type: 'outline',
    params: {
      color: '#000000',
      width: 2
    }
  }
};
