import type { CanvasData } from '@anti-detect/types';

export async function collectCanvas(): Promise<CanvasData> {
  const getNow = () => (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now());
  const start = getNow();

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return {
        hash: 'not-available',
        isNoisyCanvas: false,
        noiseDetected: false,
        supported: false,
      };
    }

    // Draw test pattern
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 200, 50);
    ctx.fillStyle = '#069';
    ctx.fillText('Anti-detect.com', 2, 2);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Canvas Test', 4, 17);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL();

    // Generate hash
    const hash = await hashCanvasData(dataUrl);

    // Detect noise (canvas protection)
    const noiseDetected = detectCanvasNoise(imageData);

    const renderTime = getNow() - start;

    return {
      hash,
      isNoisyCanvas: noiseDetected,
      noiseDetected,
      imageData: dataUrl,
      supported: true,
      renderTime,
    };
  } catch {
    return {
      hash: 'canvas-error',
      isNoisyCanvas: false,
      noiseDetected: false,
      supported: false,
    };
  }
}

async function hashCanvasData(dataUrl: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(dataUrl);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function detectCanvasNoise(imageData: ImageData): boolean {
  // Create a second canvas with the same drawing
  const canvas2 = document.createElement('canvas');
  canvas2.width = 200;
  canvas2.height = 50;
  const ctx2 = canvas2.getContext('2d');

  if (!ctx2) return false;

  // Redraw the same pattern
  ctx2.textBaseline = 'top';
  ctx2.font = '14px Arial';
  ctx2.fillStyle = '#f60';
  ctx2.fillRect(0, 0, 200, 50);
  ctx2.fillStyle = '#069';
  ctx2.fillText('Anti-detect.com', 2, 2);
  ctx2.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx2.fillText('Canvas Test', 4, 17);

  const imageData2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);

  // Compare pixels
  let differences = 0;
  for (let i = 0; i < imageData.data.length; i++) {
    if (imageData.data[i] !== imageData2.data[i]) {
      differences++;
    }
  }

  // If there are differences, canvas noise is being applied
  return differences > 10;
}
