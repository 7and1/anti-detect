import { describe, it, expect, beforeEach, vi } from 'vitest';
import { collectNavigatorInfo } from '../collectors/navigator';

describe('Navigator Collector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should collect basic navigator information', () => {
    const result = collectNavigatorInfo();

    expect(result).toBeDefined();
    expect(result.userAgent).toBeDefined();
    expect(typeof result.userAgent).toBe('string');
    expect(result.platform).toBeDefined();
    expect(typeof result.platform).toBe('string');
  });

  it('should collect language information', () => {
    const result = collectNavigatorInfo();

    expect(result.language).toBeDefined();
    expect(result.languages).toBeDefined();
    expect(Array.isArray(result.languages)).toBe(true);
  });

  it('should collect hardware concurrency', () => {
    const result = collectNavigatorInfo();

    expect(result.hardwareConcurrency).toBeDefined();
    expect(typeof result.hardwareConcurrency).toBe('number');
    expect(result.hardwareConcurrency).toBeGreaterThan(0);
  });

  it('should detect if navigator.webdriver is present', () => {
    const result = collectNavigatorInfo();

    expect('webdriver' in result).toBe(true);
    // Normal browsers should not have webdriver set to true
    expect(result.webdriver).not.toBe(true);
  });

  it('should collect device memory if available', () => {
    const result = collectNavigatorInfo();

    // DeviceMemory might not be available in all browsers
    if ('deviceMemory' in result) {
      expect(typeof result.deviceMemory).toBe('number');
    }
  });

  it('should collect maxTouchPoints', () => {
    const result = collectNavigatorInfo();

    expect('maxTouchPoints' in result).toBe(true);
    expect(typeof result.maxTouchPoints).toBe('number');
  });

  it('should handle missing properties gracefully', () => {
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

    expect(() => collectNavigatorInfo()).not.toThrow();

    // Restore original navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });
});
