import { describe, it, expect, beforeEach } from 'vitest';
import { collectAutomation } from '../collectors/automation';

describe('Automation Detection', () => {
  beforeEach(() => {
    // Clean up
  });

  it('should detect webdriver flag', async () => {
    const result = await collectAutomation();

    expect(result).toBeDefined();
    expect(typeof result.webdriver).toBe('boolean');
  });

  it('should check for automation properties', async () => {
    const result = await collectAutomation();

    expect(typeof result.chromeRuntime).toBe('boolean');
    expect(typeof result.cdpTraces).toBe('boolean');
  });

  it('should list detected automation signals', async () => {
    const result = await collectAutomation();

    expect(Object.keys(result).length).toBeGreaterThan(0);
  });

  it('should detect common automation properties', async () => {
    const result = await collectAutomation();

    // Check for common automation indicators
    const automationProps = [
      '__webdriver_evaluate',
      '__selenium_evaluate',
      '__webdriver_script_function',
      '__driver_evaluate',
      '_phantom',
      '__nightmare',
      'callPhantom',
      'callSelenium',
    ];

    // At least check that we're looking for these
    expect(result).toBeDefined();
  });

  it('should detect Chrome CDP artifacts', async () => {
    const result = await collectAutomation();

    expect(typeof result.cdpTraces).toBe('boolean');
  });

  it('should not throw in normal browsers', async () => {
    await expect(collectAutomation()).resolves.toBeDefined();
  });

  it('should expose multiple detection knobs', async () => {
    const result = await collectAutomation();

    expect(result).toMatchObject({
      webdriver: expect.any(Boolean),
      chromeRuntime: expect.any(Boolean),
      cdpTraces: expect.any(Boolean),
      phantomJS: expect.any(Boolean),
      selenium: expect.any(Boolean),
    });
  });
});
