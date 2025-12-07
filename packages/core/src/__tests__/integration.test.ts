import { describe, it, expect } from 'vitest';
import { collectAll } from '../collect';

describe('Fingerprint Collection Integration', () => {
  it('should collect complete fingerprint', async () => {
    const fingerprint = await collectAll();

    expect(fingerprint).toBeDefined();
    expect(typeof fingerprint).toBe('object');
  });

  it('should include navigator information', async () => {
    const fingerprint = await collectAll();

    expect(fingerprint.navigator).toBeDefined();
    expect(fingerprint.navigator.userAgent).toBeDefined();
    expect(fingerprint.navigator.platform).toBeDefined();
  });

  it('should include screen information', async () => {
    const fingerprint = await collectAll();

    expect(fingerprint.screen).toBeDefined();
    expect(fingerprint.screen.width).toBeDefined();
    expect(fingerprint.screen.height).toBeDefined();
  });

  it('should include canvas fingerprint', async () => {
    const fingerprint = await collectAll();

    expect(fingerprint.canvas).toBeDefined();
    expect(fingerprint.canvas.hash).toBeDefined();
  });

  it('should include timezone information', async () => {
    const fingerprint = await collectAll();

    expect(fingerprint.timezone).toBeDefined();
    expect(fingerprint.timezone.name).toBeDefined();
  });

  it('should include automation detection', async () => {
    const fingerprint = await collectAll();

    expect(fingerprint.automation).toBeDefined();
    expect(typeof fingerprint.automation.webdriver).toBe('boolean');
  });

  it('should produce consistent navigator + canvas data in same session', async () => {
    const fingerprint1 = await collectAll();
    const fingerprint2 = await collectAll();

    expect(fingerprint1.navigator.userAgent).toBe(fingerprint2.navigator.userAgent);
    expect(fingerprint1.canvas.hash).toBe(fingerprint2.canvas.hash);
  });

  it('should complete collection in reasonable time', async () => {
    const startTime = Date.now();
    await collectAll();
    const endTime = Date.now();

    // Should complete in under 5 seconds
    expect(endTime - startTime).toBeLessThan(5000);
  });

  it('should handle missing APIs gracefully', async () => {
    await expect(collectAll()).resolves.toBeDefined();
  });

  it('should include plugin information when available', async () => {
    const fingerprint = await collectAll();

    if (fingerprint.plugins) {
      expect(Array.isArray(fingerprint.plugins)).toBe(true);
    }
  });

  it('should serialize to JSON without errors', async () => {
    const fingerprint = await collectAll();

    expect(() => JSON.stringify(fingerprint)).not.toThrow();

    const json = JSON.stringify(fingerprint);
    expect(json.length).toBeGreaterThan(0);
  });

  it('should be reproducible from JSON', async () => {
    const fingerprint = await collectAll();
    const json = JSON.stringify(fingerprint);
    const parsed = JSON.parse(json);

    expect(parsed).toEqual(fingerprint);
  });
});
