import { DesignAnalysis } from '../types';

// Design analysis runs through our own same-origin edge function (api/analyze),
// which proxies to Hack Club AI. The proxy is used because Hack Club's endpoint
// sends no CORS headers (so the browser can't call it directly) and because it
// keeps the API key on the server instead of in the client bundle.
const ANALYZE_ENDPOINT = '/api/analyze';

export async function analyzeDesignWithHackClub(imageFile: File): Promise<DesignAnalysis> {
  const imageDataUrl = await fileToDataUrl(imageFile);

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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
