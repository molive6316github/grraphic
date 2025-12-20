export interface BackgroundRemovalOptions {
  quality?: 'low' | 'medium' | 'high';
  edgeRefinement?: boolean;
  featherAmount?: number;
}

export interface BackgroundRemovalResult {
  imageUrl: string;
  maskUrl?: string;
  processingTime: number;
}

export class AIBackgroundRemoval {
  private static readonly API_ENDPOINTS = {
    removeBackground: 'https://api.remove.bg/v1.0/removebg',
    clipdrop: 'https://clipdrop-api.co/remove-background/v1'
  };

  static async removeBackground(
    imageFile: File | string,
    options: BackgroundRemovalOptions = {}
  ): Promise<BackgroundRemovalResult> {
    const startTime = Date.now();

    try {
      const result = await this.clientSideRemoval(imageFile, options);
      const processingTime = Date.now() - startTime;

      return {
        imageUrl: result,
        processingTime
      };
    } catch (error) {
      console.error('Background removal failed:', error);
      throw new Error('Failed to remove background. Please try again.');
    }
  }

  private static async clientSideRemoval(
    imageFile: File | string,
    options: BackgroundRemovalOptions
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const img = await this.loadImage(imageFile);

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const processedData = this.processImageData(imageData, options);

    ctx.putImageData(processedData, 0, 0);

    return canvas.toDataURL('image/png');
  }

  private static async loadImage(source: File | string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => resolve(img);
      img.onerror = reject;

      if (typeof source === 'string') {
        img.src = source;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(source);
      }
    });
  }

  private static processImageData(
    imageData: ImageData,
    options: BackgroundRemovalOptions
  ): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    const bgColor = this.detectBackgroundColor(imageData);
    const threshold = options.quality === 'high' ? 30 : options.quality === 'medium' ? 50 : 70;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const distance = Math.sqrt(
        Math.pow(r - bgColor.r, 2) +
        Math.pow(g - bgColor.g, 2) +
        Math.pow(b - bgColor.b, 2)
      );

      if (distance < threshold) {
        data[i + 3] = 0;
      } else if (options.edgeRefinement && distance < threshold * 1.5) {
        const alpha = ((distance - threshold) / (threshold * 0.5)) * 255;
        data[i + 3] = Math.min(255, alpha);
      }
    }

    if (options.featherAmount && options.featherAmount > 0) {
      return this.featherEdges(imageData, options.featherAmount);
    }

    return imageData;
  }

  private static detectBackgroundColor(imageData: ImageData): { r: number; g: number; b: number } {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    const edgePixels: number[][] = [];

    for (let x = 0; x < width; x++) {
      const topI = x * 4;
      const bottomI = ((height - 1) * width + x) * 4;
      edgePixels.push([data[topI], data[topI + 1], data[topI + 2]]);
      edgePixels.push([data[bottomI], data[bottomI + 1], data[bottomI + 2]]);
    }

    for (let y = 0; y < height; y++) {
      const leftI = y * width * 4;
      const rightI = (y * width + width - 1) * 4;
      edgePixels.push([data[leftI], data[leftI + 1], data[leftI + 2]]);
      edgePixels.push([data[rightI], data[rightI + 1], data[rightI + 2]]);
    }

    const avgR = edgePixels.reduce((sum, p) => sum + p[0], 0) / edgePixels.length;
    const avgG = edgePixels.reduce((sum, p) => sum + p[1], 0) / edgePixels.length;
    const avgB = edgePixels.reduce((sum, p) => sum + p[2], 0) / edgePixels.length;

    return { r: avgR, g: avgG, b: avgB };
  }

  private static featherEdges(imageData: ImageData, amount: number): ImageData {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = new Uint8ClampedArray(data);

    const kernelSize = Math.floor(amount);
    const kernel = this.createGaussianKernel(kernelSize);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;

        if (data[i + 3] === 0 || data[i + 3] === 255) continue;

        let alphaSum = 0;
        let kernelSum = 0;

        for (let ky = -kernelSize; ky <= kernelSize; ky++) {
          for (let kx = -kernelSize; kx <= kernelSize; kx++) {
            const px = Math.max(0, Math.min(width - 1, x + kx));
            const py = Math.max(0, Math.min(height - 1, y + ky));
            const pi = (py * width + px) * 4;

            const kernelValue = kernel[ky + kernelSize][kx + kernelSize];
            alphaSum += data[pi + 3] * kernelValue;
            kernelSum += kernelValue;
          }
        }

        output[i + 3] = Math.round(alphaSum / kernelSum);
      }
    }

    imageData.data.set(output);
    return imageData;
  }

  private static createGaussianKernel(size: number): number[][] {
    const sigma = size / 3;
    const kernel: number[][] = [];

    for (let y = -size; y <= size; y++) {
      const row: number[] = [];
      for (let x = -size; x <= size; x++) {
        const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma)) / (2 * Math.PI * sigma * sigma);
        row.push(value);
      }
      kernel.push(row);
    }

    return kernel;
  }

  static createMask(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          data[i] = data[i + 1] = data[i + 2] = alpha;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  static async replaceBackground(
    foregroundUrl: string,
    backgroundColor: string | HTMLImageElement
  ): Promise<string> {
    const fg = await this.loadImage(foregroundUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width = fg.width;
    canvas.height = fg.height;

    if (typeof backgroundColor === 'string') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(backgroundColor, 0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(fg, 0, 0);

    return canvas.toDataURL('image/png');
  }

  static async smartCrop(imageUrl: string, aspectRatio: number): Promise<string> {
    const img = await this.loadImage(imageUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const targetRatio = aspectRatio;
    const currentRatio = img.width / img.height;

    let cropWidth = img.width;
    let cropHeight = img.height;
    let cropX = 0;
    let cropY = 0;

    if (currentRatio > targetRatio) {
      cropWidth = img.height * targetRatio;
      cropX = (img.width - cropWidth) / 2;
    } else {
      cropHeight = img.width / targetRatio;
      cropY = (img.height - cropHeight) / 2;
    }

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    return canvas.toDataURL('image/png');
  }
}
