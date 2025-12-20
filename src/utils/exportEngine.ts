export interface ExportOptions {
  format: 'png' | 'jpg' | 'webp' | 'svg' | 'mp4' | 'webm' | 'gif';
  quality?: number;
  width?: number;
  height?: number;
  fps?: number;
  backgroundColor?: string;
  transparent?: boolean;
}

export interface ExportProgress {
  progress: number;
  stage: string;
  estimatedTime?: number;
}

export class ExportEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: true })!;
  }

  async exportImage(
    element: HTMLElement,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<Blob> {
    onProgress?.({ progress: 0, stage: 'Capturing element' });

    const { width = 1920, height = 1080, quality = 0.95, backgroundColor, transparent = true } = options;

    this.canvas.width = width;
    this.canvas.height = height;

    if (!transparent && backgroundColor) {
      this.ctx.fillStyle = backgroundColor;
      this.ctx.fillRect(0, 0, width, height);
    }

    onProgress?.({ progress: 30, stage: 'Rendering content' });

    await this.captureElement(element, width, height);

    onProgress?.({ progress: 80, stage: 'Encoding image' });

    const blob = await this.canvasToBlob(options.format, quality);

    onProgress?.({ progress: 100, stage: 'Complete' });

    return blob;
  }

  async exportVideo(
    renderFrame: (time: number) => Promise<void>,
    duration: number,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<Blob> {
    const { width = 1920, height = 1080, fps = 30, format = 'webm' } = options;

    this.canvas.width = width;
    this.canvas.height = height;

    const totalFrames = Math.ceil(duration * fps);
    this.recordedChunks = [];

    onProgress?.({ progress: 0, stage: 'Initializing recorder', estimatedTime: duration });

    const stream = this.canvas.captureStream(fps);
    const mimeType = format === 'webm' ? 'video/webm;codecs=vp9' : 'video/webm';

    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8000000
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    return new Promise((resolve, reject) => {
      this.mediaRecorder!.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        resolve(blob);
      };

      this.mediaRecorder!.onerror = (error) => {
        reject(error);
      };

      this.mediaRecorder!.start();

      let currentFrame = 0;
      const frameInterval = 1000 / fps;

      const renderNextFrame = async () => {
        if (currentFrame >= totalFrames) {
          this.mediaRecorder!.stop();
          onProgress?.({ progress: 100, stage: 'Finalizing video' });
          return;
        }

        const time = currentFrame / fps;
        await renderFrame(time);

        currentFrame++;
        const progress = Math.round((currentFrame / totalFrames) * 100);
        const remaining = ((totalFrames - currentFrame) / fps);

        onProgress?.({
          progress,
          stage: `Rendering frame ${currentFrame}/${totalFrames}`,
          estimatedTime: remaining
        });

        setTimeout(renderNextFrame, frameInterval);
      };

      renderNextFrame();
    });
  }

  async exportGif(
    renderFrame: (time: number) => Promise<void>,
    duration: number,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<Blob> {
    const { width = 800, height = 600, fps = 15 } = options;

    this.canvas.width = width;
    this.canvas.height = height;

    const totalFrames = Math.ceil(duration * fps);
    const frames: ImageData[] = [];

    onProgress?.({ progress: 0, stage: 'Capturing frames' });

    for (let i = 0; i < totalFrames; i++) {
      const time = i / fps;
      await renderFrame(time);

      const imageData = this.ctx.getImageData(0, 0, width, height);
      frames.push(imageData);

      const progress = Math.round((i / totalFrames) * 80);
      onProgress?.({ progress, stage: `Capturing frame ${i + 1}/${totalFrames}` });
    }

    onProgress?.({ progress: 85, stage: 'Encoding GIF' });

    const gif = await this.createGif(frames, 1000 / fps);

    onProgress?.({ progress: 100, stage: 'Complete' });

    return gif;
  }

  private async captureElement(element: HTMLElement, width: number, height: number): Promise<void> {
    const scale = Math.min(width / element.offsetWidth, height / element.offsetHeight);
    const x = (width - element.offsetWidth * scale) / 2;
    const y = (height - element.offsetHeight * scale) / 2;

    this.ctx.save();
    this.ctx.scale(scale, scale);
    this.ctx.translate(x / scale, y / scale);

    await this.drawElement(element);

    this.ctx.restore();
  }

  private async drawElement(element: HTMLElement): Promise<void> {
    const computedStyle = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      this.ctx.fillStyle = computedStyle.backgroundColor;
      this.ctx.fillRect(0, 0, rect.width, rect.height);
    }

    if (element.tagName === 'IMG') {
      const img = element as HTMLImageElement;
      try {
        await this.drawImage(img, 0, 0, rect.width, rect.height);
      } catch (error) {
        console.error('Error drawing image:', error);
      }
    }

    if (element.tagName === 'CANVAS') {
      const canvas = element as HTMLCanvasElement;
      this.ctx.drawImage(canvas, 0, 0, rect.width, rect.height);
    }

    if (element.tagName === 'VIDEO') {
      const video = element as HTMLVideoElement;
      this.ctx.drawImage(video, 0, 0, rect.width, rect.height);
    }

    const text = element.textContent?.trim();
    if (text && !element.children.length) {
      this.ctx.font = computedStyle.font;
      this.ctx.fillStyle = computedStyle.color;
      this.ctx.textAlign = computedStyle.textAlign as CanvasTextAlign;
      this.ctx.fillText(text, 0, parseFloat(computedStyle.fontSize));
    }

    for (const child of Array.from(element.children)) {
      this.ctx.save();
      const childRect = child.getBoundingClientRect();
      this.ctx.translate(childRect.left - rect.left, childRect.top - rect.top);
      await this.drawElement(child as HTMLElement);
      this.ctx.restore();
    }
  }

  private drawImage(img: HTMLImageElement, x: number, y: number, width: number, height: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (img.complete) {
        this.ctx.drawImage(img, x, y, width, height);
        resolve();
      } else {
        img.onload = () => {
          this.ctx.drawImage(img, x, y, width, height);
          resolve();
        };
        img.onerror = reject;
      }
    });
  }

  private canvasToBlob(format: string, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
      this.canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        mimeType,
        quality
      );
    });
  }

  private async createGif(frames: ImageData[], delay: number): Promise<Blob> {
    const encoder = new GIFEncoder(frames[0].width, frames[0].height);
    encoder.setRepeat(0);
    encoder.setDelay(delay);
    encoder.setQuality(10);

    encoder.start();

    for (const frame of frames) {
      encoder.addFrame(frame.data);
    }

    encoder.finish();

    const buffer = encoder.stream().getData();
    return new Blob([buffer], { type: 'image/gif' });
  }

  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async captureToDataURL(element: HTMLElement, options: ExportOptions = { format: 'png' }): Promise<string> {
    const blob = await this.exportImage(element, options);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

class GIFEncoder {
  private width: number;
  private height: number;
  private repeat: number = 0;
  private delay: number = 0;
  private quality: number = 10;
  private data: number[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  setRepeat(repeat: number): void {
    this.repeat = repeat;
  }

  setDelay(delay: number): void {
    this.delay = delay;
  }

  setQuality(quality: number): void {
    this.quality = quality;
  }

  start(): void {
    this.data = [];
    this.writeHeader();
  }

  addFrame(pixels: Uint8ClampedArray): void {
    this.writeFrame(pixels);
  }

  finish(): void {
    this.writeByte(0x3b);
  }

  stream(): { getData: () => Uint8Array } {
    return {
      getData: () => new Uint8Array(this.data)
    };
  }

  private writeHeader(): void {
    this.writeString('GIF89a');
    this.writeShort(this.width);
    this.writeShort(this.height);
    this.writeByte(0xf7);
    this.writeByte(0x00);
    this.writeByte(0x00);

    for (let i = 0; i < 256; i++) {
      this.writeByte(i);
      this.writeByte(i);
      this.writeByte(i);
    }

    this.writeByte(0x21);
    this.writeByte(0xff);
    this.writeByte(0x0b);
    this.writeString('NETSCAPE2.0');
    this.writeByte(0x03);
    this.writeByte(0x01);
    this.writeShort(this.repeat);
    this.writeByte(0x00);
  }

  private writeFrame(pixels: Uint8ClampedArray): void {
    this.writeByte(0x21);
    this.writeByte(0xf9);
    this.writeByte(0x04);
    this.writeByte(0x00);
    this.writeShort(this.delay / 10);
    this.writeByte(0x00);
    this.writeByte(0x00);

    this.writeByte(0x2c);
    this.writeShort(0);
    this.writeShort(0);
    this.writeShort(this.width);
    this.writeShort(this.height);
    this.writeByte(0x00);

    this.writeByte(0x08);

    const indices: number[] = [];
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const gray = Math.floor((r + g + b) / 3);
      indices.push(gray);
    }

    this.writeLZW(indices);
    this.writeByte(0x00);
  }

  private writeLZW(indices: number[]): void {
    const minCodeSize = 8;
    let codeSize = minCodeSize + 1;
    const clearCode = 1 << minCodeSize;
    const endCode = clearCode + 1;

    let code = endCode + 1;
    const maxCode = 1 << codeSize;

    this.writeByte(minCodeSize);

    let buffer = clearCode;
    let bitsInBuffer = codeSize;
    const output: number[] = [];

    for (const index of indices) {
      buffer |= index << bitsInBuffer;
      bitsInBuffer += codeSize;

      while (bitsInBuffer >= 8) {
        output.push(buffer & 0xff);
        buffer >>= 8;
        bitsInBuffer -= 8;
      }

      code++;
      if (code >= maxCode && codeSize < 12) {
        codeSize++;
      }
    }

    buffer |= endCode << bitsInBuffer;
    bitsInBuffer += codeSize;

    while (bitsInBuffer > 0) {
      output.push(buffer & 0xff);
      buffer >>= 8;
      bitsInBuffer -= 8;
    }

    for (let i = 0; i < output.length; i += 255) {
      const chunk = output.slice(i, i + 255);
      this.writeByte(chunk.length);
      for (const byte of chunk) {
        this.writeByte(byte);
      }
    }
  }

  private writeString(str: string): void {
    for (let i = 0; i < str.length; i++) {
      this.writeByte(str.charCodeAt(i));
    }
  }

  private writeByte(byte: number): void {
    this.data.push(byte & 0xff);
  }

  private writeShort(short: number): void {
    this.writeByte(short & 0xff);
    this.writeByte((short >> 8) & 0xff);
  }
}

export const exportEngine = new ExportEngine();
