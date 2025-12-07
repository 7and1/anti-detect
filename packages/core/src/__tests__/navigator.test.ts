import { describe, it, expect, beforeEach, vi } from 'vitest';
import { collectNavigator } from '../collectors/navigator';

describe('Navigator Collector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should collect basic navigator information', async () => {
    const result = await collectNavigator();

    expect(result).toBeDefined();
    expect(result.userAgent).toBeDefined();
    expect(typeof result.userAgent).toBe('string');
    expect(result.platform).toBeDefined();
    expect(typeof result.platform).toBe('string');
  });

  it('should collect language information', async () => {
    const result = await collectNavigator();

    expect(result.language).toBeDefined();
    expect(result.languages).toBeDefined();
    expect(Array.isArray(result.languages)).toBe(true);
  });

  it('should collect hardware concurrency', async () => {
    const result = await collectNavigator();

    expect(result.hardwareConcurrency).toBeDefined();
    expect(typeof result.hardwareConcurrency).toBe('number');
    expect(result.hardwareConcurrency).toBeGreaterThan(0);
  });

  it('should detect if navigator.webdriver is present', async () => {
    const result = await collectNavigator();

    expect('webdriver' in result).toBe(true);
    // Normal browsers should not have webdriver set to true
    expect(result.webdriver).not.toBe(true);
  });

  it('should collect device memory if available', async () => {
    const result = await collectNavigator();

    if (typeof result.deviceMemory !== 'undefined') {
      expect(typeof result.deviceMemory).toBe('number');
    }
  });

  it('should collect maxTouchPoints', async () => {
    const result = await collectNavigator();

    expect('maxTouchPoints' in result).toBe(true);
    expect(typeof result.maxTouchPoints).toBe('number');
  });

  it('should handle missing properties gracefully', async () => {
    // Mock a limited navigator object
    const originalNavigator = global.navigator;

    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Test Agent',
        platform: 'Test Platform',
      },
      configurable: true,
      writable: true,
    });

    await expect(collectNavigator()).resolves.toBeDefined();

    // Restore original navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });
});
