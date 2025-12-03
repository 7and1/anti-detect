import { describe, it, expect } from 'vitest';
import { collectTimezoneInfo } from '../collectors/timezone';

describe('Timezone Collector', () => {
  it('should collect timezone information', () => {
    const result = collectTimezoneInfo();

    expect(result).toBeDefined();
    expect(result.timezone).toBeDefined();
    expect(typeof result.timezone).toBe('string');
  });

  it('should collect timezone offset', () => {
    const result = collectTimezoneInfo();

    expect(result.offset).toBeDefined();
    expect(typeof result.offset).toBe('number');
    // Offset should be between -720 and 840 minutes
    expect(result.offset).toBeGreaterThanOrEqual(-720);
    expect(result.offset).toBeLessThanOrEqual(840);
  });

  it('should detect daylight saving time if applicable', () => {
    const result = collectTimezoneInfo();

    if ('isDST' in result) {
      expect(typeof result.isDST).toBe('boolean');
    }
  });

  it('should provide timezone name in IANA format', () => {
    const result = collectTimezoneInfo();

    // IANA timezone format: Continent/City
    expect(result.timezone).toMatch(/^[A-Za-z_]+\/[A-Za-z_]+$/);
  });

  it('should handle Intl.DateTimeFormat', () => {
    const result = collectTimezoneInfo();

    // Should use Intl.DateTimeFormat if available
    expect(result.timezone.length).toBeGreaterThan(0);
  });

  it('should calculate correct offset', () => {
    const result = collectTimezoneInfo();
    const now = new Date();
    const expectedOffset = -now.getTimezoneOffset();

    expect(result.offset).toBe(expectedOffset);
  });

  it('should detect timezone spoofing', () => {
    const result = collectTimezoneInfo();

    if ('spoofDetected' in result) {
      expect(typeof result.spoofDetected).toBe('boolean');
    }
  });

  it('should handle timezone detection failure gracefully', () => {
    expect(() => collectTimezoneInfo()).not.toThrow();
  });
});
