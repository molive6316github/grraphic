export interface ColorInfo {
  hex: string;
  rgb: [number, number, number];
  frequency: number;
  luminance: number;
}

export interface AnalysisMetrics {
  colorPalette: ColorInfo[];
  colorCount: number;
  colorHarmony: number;
  averageContrast: number;
  textContrast: number;
  dominantColors: ColorInfo[];
  edgeDensity: number;
  symmetryScore: number;
  visualWeight: number;
  whitespaceRatio: number;
  complexityScore: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function colorDistance(c1: [number, number, number], c2: [number, number, number]): number {
  return Math.sqrt(
    Math.pow(c1[0] - c2[0], 2) +
    Math.pow(c1[1] - c2[1], 2) +
    Math.pow(c1[2] - c2[2], 2)
  );
}

function quantizeColors(imageData: ImageData, sampleRate: number = 10): Map<string, ColorInfo> {
  const colorMap = new Map<string, ColorInfo>();
  const { data, width, height } = imageData;

  for (let y = 0; y < height; y += sampleRate) {
    for (let x = 0; x < width; x += sampleRate) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 128) continue;

      const roundedR = Math.round(r / 15) * 15;
      const roundedG = Math.round(g / 15) * 15;
      const roundedB = Math.round(b / 15) * 15;

      const hex = rgbToHex(roundedR, roundedG, roundedB);

      if (colorMap.has(hex)) {
        colorMap.get(hex)!.frequency++;
      } else {
        colorMap.set(hex, {
          hex,
          rgb: [roundedR, roundedG, roundedB],
          frequency: 1,
          luminance: getLuminance(roundedR, roundedG, roundedB)
        });
      }
    }
  }

  return colorMap;
}

function analyzeColorHarmony(colors: ColorInfo[]): number {
  if (colors.length < 2) return 0;

  let harmonyScore = 0;
  const topColors = colors.slice(0, Math.min(10, colors.length));

  for (let i = 0; i < topColors.length; i++) {
    for (let j = i + 1; j < topColors.length; j++) {
      const c1 = topColors[i].rgb;
      const c2 = topColors[j].rgb;
      const distance = colorDistance(c1, c2);

      const idealDistances = [60, 120, 180];
      const closestIdeal = idealDistances.reduce((prev, curr) =>
        Math.abs(curr - distance) < Math.abs(prev - distance) ? curr : prev
      );

      const deviation = Math.abs(distance - closestIdeal);
      harmonyScore += Math.max(0, 100 - deviation);
    }
  }

  const maxPairs = (topColors.length * (topColors.length - 1)) / 2;
  return Math.min(100, harmonyScore / maxPairs);
}

function analyzeContrast(colors: ColorInfo[]): { average: number; textContrast: number } {
  if (colors.length < 2) return { average: 0, textContrast: 0 };

  const sortedByFreq = [...colors].sort((a, b) => b.frequency - a.frequency);
  const background = sortedByFreq[0];

  let contrastSum = 0;
  let textContrastScore = 0;
  const topColors = sortedByFreq.slice(1, Math.min(6, sortedByFreq.length));

  topColors.forEach(color => {
    const ratio = getContrastRatio(background.luminance, color.luminance);
    contrastSum += ratio;

    if (ratio >= 4.5) textContrastScore += 30;
    else if (ratio >= 3.0) textContrastScore += 15;
  });

  return {
    average: Math.min(100, (contrastSum / topColors.length) * 10),
    textContrast: Math.min(100, textContrastScore)
  };
}

function detectEdges(imageData: ImageData): number {
  const { data, width, height } = imageData;
  let edgeCount = 0;
  const threshold = 30;
  const sampleRate = 5;

  for (let y = sampleRate; y < height - sampleRate; y += sampleRate) {
    for (let x = sampleRate; x < width - sampleRate; x += sampleRate) {
      const i = (y * width + x) * 4;
      const gx = Math.abs(
        data[i] - data[i - 4] +
        data[i + width * 4] - data[i + width * 4 - 4]
      );
      const gy = Math.abs(
        data[i] - data[i - width * 4] +
        data[i + 4] - data[i - width * 4 + 4]
      );

      if (Math.sqrt(gx * gx + gy * gy) > threshold) {
        edgeCount++;
      }
    }
  }

  const sampledPixels = ((height / sampleRate) * (width / sampleRate));
  return Math.min(100, (edgeCount / sampledPixels) * 500);
}

function analyzeSymmetry(imageData: ImageData): number {
  const { data, width, height } = imageData;
  let differenceSum = 0;
  const sampleRate = 10;
  let samples = 0;

  for (let y = 0; y < height; y += sampleRate) {
    for (let x = 0; x < width / 2; x += sampleRate) {
      const leftIndex = (y * width + x) * 4;
      const rightIndex = (y * width + (width - 1 - x)) * 4;

      const leftGray = (data[leftIndex] + data[leftIndex + 1] + data[leftIndex + 2]) / 3;
      const rightGray = (data[rightIndex] + data[rightIndex + 1] + data[rightIndex + 2]) / 3;

      differenceSum += Math.abs(leftGray - rightGray);
      samples++;
    }
  }

  const avgDifference = differenceSum / samples;
  return Math.max(0, 100 - avgDifference / 2.55);
}

function calculateWhitespace(imageData: ImageData, colors: ColorInfo[]): number {
  const lightColors = colors.filter(c => c.luminance > 0.8);
  const totalFrequency = colors.reduce((sum, c) => sum + c.frequency, 0);
  const lightFrequency = lightColors.reduce((sum, c) => sum + c.frequency, 0);

  return Math.min(100, (lightFrequency / totalFrequency) * 100);
}

function calculateComplexity(edgeDensity: number, colorCount: number): number {
  const edgeComplexity = edgeDensity / 100;
  const colorComplexity = Math.min(1, colorCount / 20);

  return Math.min(100, (edgeComplexity * 50 + colorComplexity * 50));
}

export async function analyzeImageMetrics(file: File): Promise<AnalysisMetrics> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = 800;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);

        const colorMap = quantizeColors(imageData);
        const colorPalette = Array.from(colorMap.values())
          .sort((a, b) => b.frequency - a.frequency);

        const dominantColors = colorPalette.slice(0, 5);
        const colorHarmony = analyzeColorHarmony(colorPalette);
        const { average: averageContrast, textContrast } = analyzeContrast(colorPalette);
        const edgeDensity = detectEdges(imageData);
        const symmetryScore = analyzeSymmetry(imageData);
        const whitespaceRatio = calculateWhitespace(imageData, colorPalette);
        const complexityScore = calculateComplexity(edgeDensity, colorPalette.length);

        const visualWeight = 100 - whitespaceRatio;

        resolve({
          colorPalette,
          colorCount: colorPalette.length,
          colorHarmony,
          averageContrast,
          textContrast,
          dominantColors,
          edgeDensity,
          symmetryScore,
          visualWeight,
          whitespaceRatio,
          complexityScore
        });
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
