import { describe, it, expect, beforeEach, vi } from 'vitest';
import { collectCanvasFingerprint } from '../collectors/canvas';

describe('Canvas Collector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate a canvas fingerprint', () => {
    const result = collectCanvasFingerprint();

    expect(result).toBeDefined();
    expect(result.hash).toBeDefined();
    expect(typeof result.hash).toBe('string');
    expect(result.hash.length).toBeGreaterThan(0);
  });

  it('should include canvas support flag', () => {
    const result = collectCanvasFingerprint();

    expect('supported' in result).toBe(true);
    expect(typeof result.supported).toBe('boolean');
  });

  it('should generate consistent hash for same browser', () => {
    const result1 = collectCanvasFingerprint();
    const result2 = collectCanvasFingerprint();

    expect(result1.hash).toBe(result2.hash);
  });

  it('should detect canvas noise/protection', () => {
    const result = collectCanvasFingerprint();

    if ('noiseDetected' in result) {
      expect(typeof result.noiseDetected).toBe('boolean');
    }
  });

  it('should handle canvas creation failure gracefully', () => {
    // Mock canvas creation to fail
    const originalCreateElement = document.createElement;
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'canvas') {
        throw new Error('Canvas creation failed');
      }
      return originalCreateElement.call(document, tagName);
    });

    expect(() => collectCanvasFingerprint()).not.toThrow();

    // Restore
    document.createElement = originalCreateElement;
  });

  it('should include timestamp or metrics if available', () => {
    const result = collectCanvasFingerprint();

    // Check if performance metrics are included
    if ('renderTime' in result) {
      expect(typeof result.renderTime).toBe('number');
    }
  });

  it('should produce different hashes with noise injection', () => {
    // This test simulates what happens with canvas noise extensions
    const mockGetContext = vi.fn();
    const mockCanvas = document.createElement('canvas');

    // First call
    const result1 = collectCanvasFingerprint();

    // Simulate random noise by modifying canvas methods
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function () {
      // Add random noise to simulate protection
      const data = originalToDataURL.call(this);
      return data + Math.random().toString();
    };

    const result2 = collectCanvasFingerprint();

    // Restore
    HTMLCanvasElement.prototype.toDataURL = originalToDataURL;

    // With noise, hashes should be different
    expect(result1.hash).not.toBe(result2.hash);
  });
});
