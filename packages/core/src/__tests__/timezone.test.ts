import { describe, it, expect } from 'vitest';
import { collectTimezone } from '../collectors/timezone';

describe('Timezone Collector', () => {
  it('should collect timezone information', async () => {
    const result = await collectTimezone();

    expect(result).toBeDefined();
    expect(result.name).toBeDefined();
    expect(typeof result.name).toBe('string');
  });

  it('should collect timezone offset', async () => {
    const result = await collectTimezone();

    expect(result.offset).toBeDefined();
    expect(typeof result.offset).toBe('number');
    // Offset should be between -720 and 840 minutes
    expect(result.offset).toBeGreaterThanOrEqual(-720);
    expect(result.offset).toBeLessThanOrEqual(840);
  });

  it('should detect daylight saving time if applicable', async () => {
    const result = await collectTimezone();

    if (typeof result.dst !== 'undefined') {
      expect(typeof result.dst).toBe('boolean');
    }
  });

  it('should provide timezone name in IANA format', async () => {
    const result = await collectTimezone();

    // IANA timezone format: Continent/City
    expect(result.name).toMatch(/^[A-Za-z_]+\/[A-Za-z_]+$/);
  });

  it('should handle Intl.DateTimeFormat', async () => {
    const result = await collectTimezone();

    // Should use Intl.DateTimeFormat if available
    expect(result.name.length).toBeGreaterThan(0);
  });

  it('should calculate correct offset', async () => {
    const result = await collectTimezone();
    const now = new Date();
    const expectedOffset = now.getTimezoneOffset();

    expect(result.offset).toBe(expectedOffset);
  });

  it('should handle timezone detection failure gracefully', async () => {
    await expect(collectTimezone()).resolves.toBeDefined();
  });
});
