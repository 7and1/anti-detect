import { describe, it, expect, beforeEach, vi } from 'vitest';
import { collectCanvas } from '../collectors/canvas';

describe('Canvas Collector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate a canvas fingerprint', async () => {
    const result = await collectCanvas();

    expect(result).toBeDefined();
    expect(result.hash).toBeDefined();
    expect(typeof result.hash).toBe('string');
    expect(result.hash.length).toBeGreaterThan(0);
  });

  it('should include canvas support flag', async () => {
    const result = await collectCanvas();

    expect('supported' in result).toBe(true);
    expect(typeof result.supported).toBe('boolean');
  });

  it('should generate consistent hash for same browser', async () => {
    const result1 = await collectCanvas();
    const result2 = await collectCanvas();

    expect(result1.hash).toBe(result2.hash);
  });

  it('should detect canvas noise/protection', async () => {
    const result = await collectCanvas();

    if ('noiseDetected' in result) {
      expect(typeof result.noiseDetected).toBe('boolean');
    }
  });

  it('should handle canvas creation failure gracefully', async () => {
    // Mock canvas creation to fail
    const originalCreateElement = document.createElement;
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'canvas') {
        throw new Error('Canvas creation failed');
      }
      return originalCreateElement.call(document, tagName);
    });

    await expect(collectCanvas()).resolves.toBeDefined();

    // Restore
    document.createElement = originalCreateElement;
  });

  it('should include timestamp or metrics if available', async () => {
    const result = await collectCanvas();

    // Check if performance metrics are included
    if ('renderTime' in result) {
      expect(typeof result.renderTime).toBe('number');
    }
  });

  it('should produce different hashes with noise injection', async () => {
    // This test simulates what happens with canvas noise extensions
    // First call
    const result1 = await collectCanvas();

    // Simulate random noise by modifying canvas methods
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function () {
      // Add random noise to simulate protection
      const data = originalToDataURL.call(this);
      return data + Math.random().toString();
    };

    const result2 = await collectCanvas();

    // Restore
    HTMLCanvasElement.prototype.toDataURL = originalToDataURL;

    // With noise, hashes should be different
    expect(result1.hash).not.toBe(result2.hash);
  });
});
