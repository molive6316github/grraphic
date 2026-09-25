import { DesignAnalysis } from '../types';

// Design analysis runs through our own same-origin edge function (api/analyze),
// which proxies to Hack Club AI. The proxy is used because Hack Club's endpoint
// sends no CORS headers (so the browser can't call it directly) and because it
// keeps the API key on the server instead of in the client bundle.
const ANALYZE_ENDPOINT = '/api/analyze';

// Images are downscaled before upload. Full-resolution designs produce
// multi-megabyte base64 payloads that the upstream proxy resets mid-upload
// (ECONNRESET) and that exceed the edge function's request-body limit. Vision
// models don't benefit from more than ~1.5k px on the long edge, so this keeps
// quality while shrinking the payload to a few hundred KB.
const MAX_DIMENSION = 1568;
const JPEG_QUALITY = 0.9;

export async function analyzeDesignWithHackClub(imageFile: File): Promise<DesignAnalysis> {
  const imageDataUrl = await toUploadDataUrl(imageFile);

  let response: Response;
  try {
    response = await fetch(ANALYZE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageDataUrl }),
    });
  } catch (error) {
    console.error('Design analysis request failed:', error);
    throw new Error('Network error: Unable to reach the analysis service. Check your connection.');
  }

  if (!response.ok) {
    let message = `Analysis failed (${response.status}).`;
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {
      // Non-JSON error body — keep the generic message.
    }
    throw new Error(message);
  }

  const data = await response.json();
  if (!data?.analysis) {
    throw new Error('Invalid response from the analysis service.');
  }
  return data.analysis as DesignAnalysis;
}

// Downscale to a JPEG data URL. Transparent areas are flattened onto white so
// logos/PNGs read correctly. Falls back to the original bytes if the browser
// can't decode/re-encode the file (e.g. exotic formats).
async function toUploadDataUrl(file: File): Promise<string> {
  try {
    const bitmap = await loadImage(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, targetW, targetH);
    if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close();

    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    // Guard against a degenerate result; fall back to the raw file if needed.
    if (dataUrl && dataUrl.length > 'data:image/jpeg;base64,'.length + 100) {
      return dataUrl;
    }
  } catch (error) {
    console.warn('Image downscale failed; sending original file.', error);
  }
  return fileToDataUrl(file);
}

// Prefer createImageBitmap (fast, off-thread); fall back to an <img> decode.
async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall through to the <img> path.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image failed to load'));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
