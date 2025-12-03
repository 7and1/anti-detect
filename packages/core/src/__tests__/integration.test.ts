import { describe, it, expect } from 'vitest';
import { collectFingerprint } from '../index';

describe('Fingerprint Collection Integration', () => {
  it('should collect complete fingerprint', async () => {
    const fingerprint = await collectFingerprint();

    expect(fingerprint).toBeDefined();
    expect(typeof fingerprint).toBe('object');
  });

  it('should include navigator information', async () => {
    const fingerprint = await collectFingerprint();

    expect(fingerprint.navigator).toBeDefined();
    expect(fingerprint.navigator.userAgent).toBeDefined();
    expect(fingerprint.navigator.platform).toBeDefined();
  });

  it('should include screen information', async () => {
    const fingerprint = await collectFingerprint();

    expect(fingerprint.screen).toBeDefined();
    expect(fingerprint.screen.width).toBeDefined();
    expect(fingerprint.screen.height).toBeDefined();
  });

  it('should include canvas fingerprint', async () => {
    const fingerprint = await collectFingerprint();

    expect(fingerprint.canvas).toBeDefined();
    expect(fingerprint.canvas.hash).toBeDefined();
  });

  it('should include timezone information', async () => {
    const fingerprint = await collectFingerprint();

    expect(fingerprint.timezone).toBeDefined();
    expect(fingerprint.timezone.timezone).toBeDefined();
  });

  it('should include automation detection', async () => {
    const fingerprint = await collectFingerprint();

    expect(fingerprint.automation).toBeDefined();
    expect(fingerprint.automation.automationDetected).toBeDefined();
  });

  it('should generate consistent fingerprint hash', async () => {
    const fingerprint1 = await collectFingerprint();
    const fingerprint2 = await collectFingerprint();

    expect(fingerprint1.hash).toBeDefined();
    expect(fingerprint2.hash).toBeDefined();
    expect(fingerprint1.hash).toBe(fingerprint2.hash);
  });

  it('should complete collection in reasonable time', async () => {
    const startTime = Date.now();
    await collectFingerprint();
    const endTime = Date.now();

    // Should complete in under 5 seconds
    expect(endTime - startTime).toBeLessThan(5000);
  });

  it('should handle missing APIs gracefully', async () => {
    expect(async () => await collectFingerprint()).not.toThrow();
  });

  it('should include metadata', async () => {
    const fingerprint = await collectFingerprint();

    if ('metadata' in fingerprint) {
      expect(fingerprint.metadata).toBeDefined();
      expect(typeof fingerprint.metadata).toBe('object');
    }
  });

  it('should include timestamp', async () => {
    const fingerprint = await collectFingerprint();

    if ('timestamp' in fingerprint) {
      expect(typeof fingerprint.timestamp).toBe('number');
      expect(fingerprint.timestamp).toBeGreaterThan(0);
    }
  });

  it('should serialize to JSON without errors', async () => {
    const fingerprint = await collectFingerprint();

    expect(() => JSON.stringify(fingerprint)).not.toThrow();

    const json = JSON.stringify(fingerprint);
    expect(json.length).toBeGreaterThan(0);
  });

  it('should be reproducible from JSON', async () => {
    const fingerprint = await collectFingerprint();
    const json = JSON.stringify(fingerprint);
    const parsed = JSON.parse(json);

    expect(parsed).toEqual(fingerprint);
  });
});
