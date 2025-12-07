import { describe, it, expect, beforeEach } from 'vitest';
import { collectScreen } from '../collectors/screen';

describe('Screen Collector', () => {
  beforeEach(() => {
    // Reset any mocks
  });

  it('should collect screen dimensions', async () => {
    const result = await collectScreen();

    expect(result).toBeDefined();
    expect(result.width).toBeDefined();
    expect(result.height).toBeDefined();
    expect(typeof result.width).toBe('number');
    expect(typeof result.height).toBe('number');
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });

  it('should collect available dimensions', async () => {
    const result = await collectScreen();

    expect(result.availWidth).toBeDefined();
    expect(result.availHeight).toBeDefined();
    expect(typeof result.availWidth).toBe('number');
    expect(typeof result.availHeight).toBe('number');
  });

  it('should collect color depth', async () => {
    const result = await collectScreen();

    expect(result.colorDepth).toBeDefined();
    expect(typeof result.colorDepth).toBe('number');
    // Common values are 24 or 32
    expect([24, 30, 32, 48]).toContain(result.colorDepth);
  });

  it('should collect pixel depth', async () => {
    const result = await collectScreen();

    expect(result.pixelDepth).toBeDefined();
    expect(typeof result.pixelDepth).toBe('number');
  });

  it('should collect device pixel ratio', async () => {
    const result = await collectScreen();

    expect(result.devicePixelRatio).toBeDefined();
    expect(typeof result.devicePixelRatio).toBe('number');
    expect(result.devicePixelRatio).toBeGreaterThan(0);
  });

  it('should collect orientation information', async () => {
    const result = await collectScreen();

    if ('orientation' in result) {
      expect(result.orientation).toBeDefined();
    }
  });

  it('availWidth should be less than or equal to width', async () => {
    const result = await collectScreen();

    expect(result.availWidth).toBeLessThanOrEqual(result.width);
  });

  it('availHeight should be less than or equal to height', async () => {
    const result = await collectScreen();

    expect(result.availHeight).toBeLessThanOrEqual(result.height);
  });

  it('should handle edge cases', async () => {
    await expect(collectScreen()).resolves.toBeDefined();
  });
});
