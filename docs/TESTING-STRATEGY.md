# Testing Strategy - Anti-detect.com

**Version:** 1.0
**Last Updated:** 2025-12-01
**Status:** Production-Ready

---

## Table of Contents

1. [Testing Philosophy](#1-testing-philosophy)
2. [Unit Testing (Vitest)](#2-unit-testing-vitest)
3. [Integration Testing](#3-integration-testing)
4. [E2E Testing (Playwright)](#4-e2e-testing-playwright)
5. [Visual Regression Testing](#5-visual-regression-testing)
6. [Performance Testing](#6-performance-testing)
7. [Accessibility Testing](#7-accessibility-testing)
8. [Security Testing](#8-security-testing)
9. [Browser Fingerprint Detection Accuracy Testing](#9-browser-fingerprint-detection-accuracy-testing)
10. [CI/CD Integration](#10-cicd-integration)
11. [Test Data Management](#11-test-data-management)

---

## 1. Testing Philosophy

### 1.1 Testing Pyramid

```
                    ▲
                   ╱ ╲
                  ╱E2E╲          10% - E2E Tests (Playwright)
                 ╱─────╲         • Critical user journeys
                ╱       ╲        • Cross-browser compatibility
               ╱Integration╲     30% - Integration Tests
              ╱─────────────╲   • API endpoints
             ╱               ╲  • Database operations
            ╱   Unit Tests    ╲ 60% - Unit Tests (Vitest)
           ╱───────────────────╲ • Pure functions
          ╱                     ╲ • Individual components
         ╱_______________________╲ • Business logic
```

**Target Ratio:** 60% Unit | 30% Integration | 10% E2E

### 1.2 What to Test

**DO Test:**
- ✅ **Critical business logic** - Fingerprint analysis algorithms
- ✅ **Public APIs** - All `/api/*` endpoints
- ✅ **User journeys** - Scanner → Report flow
- ✅ **Edge cases** - Invalid inputs, rate limits, timeouts
- ✅ **Security boundaries** - XSS prevention, CSRF protection
- ✅ **Accessibility** - WCAG AA compliance
- ✅ **Browser compatibility** - Chrome, Firefox, Safari, Edge
- ✅ **Performance** - Core Web Vitals, API latency

**DON'T Test:**
- ❌ **Third-party libraries** - Trust React, Hono, etc.
- ❌ **Implementation details** - Internal state changes
- ❌ **Static content** - Hardcoded text (unless i18n)
- ❌ **CSS styling** - Use visual regression instead
- ❌ **External APIs** - Mock Cloudflare services

### 1.3 Testing Priorities

**P0 (Blocking):** Must pass before deployment
- All E2E tests pass
- API integration tests pass
- Security tests pass
- Core Web Vitals meet thresholds

**P1 (High):** Should pass but can be fixed in hotfix
- Unit test coverage >80%
- Accessibility tests pass
- Cross-browser tests pass

**P2 (Medium):** Nice to have
- Visual regression tests
- Performance benchmarks
- Mobile viewport tests

### 1.4 Coverage Targets

```typescript
// vitest.config.ts coverage thresholds
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
      exclude: [
        'node_modules/**',
        '**/*.config.{ts,js}',
        '**/*.d.ts',
        '**/types/**',
        '**/__mocks__/**',
        '**/test/**',
      ],
    },
  },
});
```

---

## 2. Unit Testing (Vitest)

### 2.1 Vitest Configuration

**File:** `packages/core/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // For DOM APIs (Canvas, WebGL, Audio)
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
      exclude: [
        'node_modules/**',
        '**/*.config.{ts,js}',
        '**/*.d.ts',
        '**/types/**',
        '**/__mocks__/**',
      ],
    },
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**File:** `packages/core/test/setup.ts`

```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock browser APIs
global.crypto = {
  getRandomValues: (arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
} as Crypto;

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillStyle: '',
  fillRect: vi.fn(),
  fillText: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4),
  })),
  measureText: vi.fn(() => ({ width: 100 })),
  canvas: { toDataURL: vi.fn(() => 'data:image/png;base64,mock') },
})) as any;

// Mock WebGL API
HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
  if (type === 'webgl' || type === 'webgl2') {
    return {
      getParameter: vi.fn((param: number) => {
        const params: Record<number, any> = {
          0x1F00: 'WebKit WebGL', // VENDOR
          0x1F01: 'WebKit', // RENDERER
          0x7938: 'WebGL 2.0', // VERSION
        };
        return params[param] || 'mock-value';
      }),
      getExtension: vi.fn(() => ({})),
      getSupportedExtensions: vi.fn(() => ['WEBGL_debug_renderer_info']),
    };
  }
  return null;
}) as any;

// Mock Audio API
global.AudioContext = vi.fn(() => ({
  createOscillator: vi.fn(() => ({
    type: 'triangle',
    frequency: { value: 10000 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createDynamicsCompressor: vi.fn(() => ({
    threshold: { value: -50 },
    knee: { value: 40 },
    ratio: { value: 12 },
    attack: { value: 0 },
    release: { value: 0.25 },
    connect: vi.fn(),
  })),
  createAnalyser: vi.fn(() => ({
    fftSize: 2048,
    getFloatFrequencyData: vi.fn(),
  })),
  destination: {},
  sampleRate: 44100,
  close: vi.fn(),
})) as any;

// Mock RTCPeerConnection
global.RTCPeerConnection = vi.fn(() => ({
  createDataChannel: vi.fn(),
  createOffer: vi.fn(() => Promise.resolve({ sdp: 'mock-sdp' })),
  setLocalDescription: vi.fn(() => Promise.resolve()),
  localDescription: { sdp: 'mock-sdp' },
  close: vi.fn(),
})) as any;
```

### 2.2 Testing Hardware Collectors

**File:** `packages/core/src/collectors/__tests__/hardware.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  collectCanvasFingerprint,
  collectWebGLFingerprint,
  collectAudioFingerprint,
} from '../hardware';

describe('Canvas Fingerprinting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate consistent canvas hash', () => {
    const result1 = collectCanvasFingerprint();
    const result2 = collectCanvasFingerprint();

    expect(result1.hash).toBeDefined();
    expect(result1.hash).toBe(result2.hash);
    expect(result1.hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash
  });

  it('should detect canvas poisoning', () => {
    // Mock canvas poisoning behavior
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => {
      throw new Error('Canvas poisoned');
    });

    const result = collectCanvasFingerprint();
    expect(result.poisoned).toBe(true);
    expect(result.error).toContain('Canvas poisoned');
  });

  it('should extract canvas metadata', () => {
    const result = collectCanvasFingerprint();

    expect(result.width).toBe(300);
    expect(result.height).toBe(150);
    expect(result.operations).toBeGreaterThan(0);
    expect(result.textMetrics).toBeDefined();
  });

  it('should handle missing canvas support', () => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null);

    const result = collectCanvasFingerprint();
    expect(result.supported).toBe(false);
    expect(result.hash).toBeNull();

    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });
});

describe('WebGL Fingerprinting', () => {
  it('should collect WebGL parameters', () => {
    const result = collectWebGLFingerprint();

    expect(result.vendor).toBe('WebKit WebGL');
    expect(result.renderer).toBe('WebKit');
    expect(result.version).toBe('WebGL 2.0');
    expect(result.extensions).toContain('WEBGL_debug_renderer_info');
  });

  it('should detect WebGL unmasking', () => {
    const result = collectWebGLFingerprint();

    expect(result.unmaskedVendor).toBeDefined();
    expect(result.unmaskedRenderer).toBeDefined();
  });

  it('should generate WebGL hash', () => {
    const result = collectWebGLFingerprint();

    expect(result.hash).toBeDefined();
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should handle WebGL not supported', () => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null);

    const result = collectWebGLFingerprint();
    expect(result.supported).toBe(false);

    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });
});

describe('Audio Fingerprinting', () => {
  it('should collect audio context fingerprint', () => {
    const result = collectAudioFingerprint();

    expect(result.hash).toBeDefined();
    expect(result.sampleRate).toBe(44100);
    expect(result.supported).toBe(true);
  });

  it('should detect audio API blocking', () => {
    const originalAudioContext = global.AudioContext;
    global.AudioContext = undefined as any;

    const result = collectAudioFingerprint();
    expect(result.supported).toBe(false);
    expect(result.blocked).toBe(true);

    global.AudioContext = originalAudioContext;
  });

  it('should extract oscillator fingerprint', () => {
    const result = collectAudioFingerprint();

    expect(result.oscillator).toBeDefined();
    expect(result.compressor).toBeDefined();
    expect(result.dynamics).toBeDefined();
  });
});
```

### 2.3 Testing System Collectors

**File:** `packages/core/src/collectors/__tests__/system.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  collectUserAgent,
  collectPlatform,
  collectTimezone,
  collectLanguages,
  collectScreen,
} from '../system';

describe('User Agent Collection', () => {
  it('should parse user agent correctly', () => {
    const mockUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
    Object.defineProperty(navigator, 'userAgent', {
      value: mockUA,
      configurable: true,
    });

    const result = collectUserAgent();

    expect(result.userAgent).toBe(mockUA);
    expect(result.browser).toBe('Chrome');
    expect(result.os).toBe('macOS');
    expect(result.version).toBeDefined();
  });

  it('should detect user agent inconsistencies', () => {
    // Set inconsistent UA (says Windows but platform says Mac)
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      configurable: true,
    });
    Object.defineProperty(navigator, 'platform', {
      value: 'MacIntel',
      configurable: true,
    });

    const result = collectUserAgent();
    expect(result.inconsistencies).toContain('platform_mismatch');
  });
});

describe('Platform Collection', () => {
  it('should collect platform information', () => {
    const result = collectPlatform();

    expect(result.platform).toBeDefined();
    expect(result.oscpu).toBeDefined();
    expect(result.hardwareConcurrency).toBeGreaterThan(0);
    expect(result.deviceMemory).toBeGreaterThan(0);
  });

  it('should detect platform spoofing', () => {
    Object.defineProperty(navigator, 'platform', {
      value: 'Win32',
      configurable: true,
    });
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      configurable: true,
    });

    const result = collectPlatform();
    expect(result.spoofed).toBe(true);
  });
});

describe('Timezone Collection', () => {
  it('should collect timezone information', () => {
    const result = collectTimezone();

    expect(result.timezone).toBeDefined();
    expect(result.offset).toBeTypeOf('number');
    expect(result.offsetString).toMatch(/^[+-]\d{2}:\d{2}$/);
  });

  it('should detect timezone tampering', () => {
    const originalDateOffset = Date.prototype.getTimezoneOffset;
    Date.prototype.getTimezoneOffset = vi.fn(() => 0); // UTC

    // Mock Intl to return different timezone
    vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
      resolvedOptions: () => ({ timeZone: 'America/New_York' }),
    } as any);

    const result = collectTimezone();
    expect(result.inconsistent).toBe(true);

    Date.prototype.getTimezoneOffset = originalDateOffset;
  });
});

describe('Languages Collection', () => {
  it('should collect language preferences', () => {
    Object.defineProperty(navigator, 'languages', {
      value: ['en-US', 'en', 'es'],
      configurable: true,
    });
    Object.defineProperty(navigator, 'language', {
      value: 'en-US',
      configurable: true,
    });

    const result = collectLanguages();

    expect(result.languages).toEqual(['en-US', 'en', 'es']);
    expect(result.language).toBe('en-US');
    expect(result.consistent).toBe(true);
  });

  it('should detect language inconsistencies', () => {
    Object.defineProperty(navigator, 'language', {
      value: 'fr-FR',
      configurable: true,
    });
    Object.defineProperty(navigator, 'languages', {
      value: ['en-US', 'en'],
      configurable: true,
    });

    const result = collectLanguages();
    expect(result.consistent).toBe(false);
  });
});

describe('Screen Collection', () => {
  it('should collect screen properties', () => {
    Object.defineProperty(window, 'screen', {
      value: {
        width: 1920,
        height: 1080,
        availWidth: 1920,
        availHeight: 1050,
        colorDepth: 24,
        pixelDepth: 24,
      },
      configurable: true,
    });

    const result = collectScreen();

    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
    expect(result.colorDepth).toBe(24);
    expect(result.pixelDepth).toBe(24);
  });

  it('should detect headless browser screen anomalies', () => {
    // Headless Chrome often has 800x600 or 1024x768 screen
    Object.defineProperty(window, 'screen', {
      value: {
        width: 800,
        height: 600,
        colorDepth: 24,
      },
      configurable: true,
    });

    const result = collectScreen();
    expect(result.suspicious).toBe(true);
    expect(result.reasons).toContain('uncommon_resolution');
  });
});
```

### 2.4 Testing Network Collectors

**File:** `packages/core/src/collectors/__tests__/network.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  collectWebRTC,
  collectDNS,
  collectConnection,
} from '../network';

describe('WebRTC Collection', () => {
  it('should collect local IP addresses via WebRTC', async () => {
    const result = await collectWebRTC();

    expect(result.localIPs).toBeDefined();
    expect(result.supported).toBe(true);
  });

  it('should detect WebRTC blocking', async () => {
    const originalRTC = global.RTCPeerConnection;
    global.RTCPeerConnection = undefined as any;

    const result = await collectWebRTC();
    expect(result.supported).toBe(false);
    expect(result.blocked).toBe(true);

    global.RTCPeerConnection = originalRTC;
  });

  it('should parse ICE candidates', async () => {
    const mockOffer = {
      sdp: 'candidate:1 1 udp 2130706431 192.168.1.100 54321 typ host',
    };

    global.RTCPeerConnection = vi.fn(() => ({
      createOffer: vi.fn(() => Promise.resolve(mockOffer)),
      setLocalDescription: vi.fn(() => Promise.resolve()),
      localDescription: mockOffer,
      close: vi.fn(),
    })) as any;

    const result = await collectWebRTC();
    expect(result.localIPs).toContain('192.168.1.100');
  });
});

describe('DNS Collection', () => {
  it('should detect DNS leaks', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          ip: '8.8.8.8',
          dns: ['8.8.8.8', '8.8.4.4'],
        }),
      })
    ) as any;

    const result = await collectDNS();
    expect(result.dnsServers).toContain('8.8.8.8');
    expect(result.leakDetected).toBe(false);
  });
});

describe('Connection Collection', () => {
  it('should collect connection information', () => {
    Object.defineProperty(navigator, 'connection', {
      value: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
      },
      configurable: true,
    });

    const result = collectConnection();

    expect(result.effectiveType).toBe('4g');
    expect(result.downlink).toBe(10);
    expect(result.rtt).toBe(50);
  });

  it('should handle missing connection API', () => {
    Object.defineProperty(navigator, 'connection', {
      value: undefined,
      configurable: true,
    });

    const result = collectConnection();
    expect(result.supported).toBe(false);
  });
});
```

### 2.5 Testing Automation Detection

**File:** `packages/core/src/collectors/__tests__/automation.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import {
  detectSelenium,
  detectPuppeteer,
  detectPlaywright,
  detectPhantomJS,
  detectHeadless,
  calculateAutomationScore,
} from '../automation';

describe('Selenium Detection', () => {
  it('should detect Selenium WebDriver', () => {
    Object.defineProperty(navigator, 'webdriver', {
      value: true,
      configurable: true,
    });
    Object.defineProperty(window, '__webdriver_evaluate', {
      value: {},
      configurable: true,
    });

    const result = detectSelenium();

    expect(result.detected).toBe(true);
    expect(result.signals).toContain('navigator.webdriver');
    expect(result.signals).toContain('__webdriver_evaluate');
  });

  it('should not detect Selenium in normal browser', () => {
    const result = detectSelenium();
    expect(result.detected).toBe(false);
  });
});

describe('Puppeteer Detection', () => {
  it('should detect Puppeteer', () => {
    Object.defineProperty(navigator, 'permissions', {
      value: {
        query: () => Promise.resolve({ state: 'granted' }),
      },
      configurable: true,
    });

    // Puppeteer adds chrome runtime
    Object.defineProperty(window, 'chrome', {
      value: { runtime: {} },
      configurable: true,
    });

    const result = detectPuppeteer();
    expect(result.detected).toBe(true);
  });
});

describe('Playwright Detection', () => {
  it('should detect Playwright', () => {
    Object.defineProperty(navigator, '__playwright', {
      value: true,
      configurable: true,
    });

    const result = detectPlaywright();
    expect(result.detected).toBe(true);
    expect(result.signals).toContain('navigator.__playwright');
  });
});

describe('PhantomJS Detection', () => {
  it('should detect PhantomJS', () => {
    Object.defineProperty(window, 'callPhantom', {
      value: () => {},
      configurable: true,
    });
    Object.defineProperty(window, '_phantom', {
      value: {},
      configurable: true,
    });

    const result = detectPhantomJS();
    expect(result.detected).toBe(true);
  });
});

describe('Headless Browser Detection', () => {
  it('should detect headless Chrome', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/91.0.4472.124 Safari/537.36',
      configurable: true,
    });

    const result = detectHeadless();
    expect(result.detected).toBe(true);
    expect(result.signals).toContain('headless_ua');
  });

  it('should detect missing plugins in headless', () => {
    Object.defineProperty(navigator, 'plugins', {
      value: [],
      configurable: true,
    });
    Object.defineProperty(navigator, 'languages', {
      value: [],
      configurable: true,
    });

    const result = detectHeadless();
    expect(result.signals).toContain('no_plugins');
    expect(result.signals).toContain('no_languages');
  });
});

describe('Automation Score Calculation', () => {
  it('should calculate high automation score for detected automation', () => {
    const signals = {
      selenium: { detected: true, signals: ['webdriver'] },
      puppeteer: { detected: true, signals: ['chrome.runtime'] },
      playwright: { detected: false, signals: [] },
      phantomjs: { detected: false, signals: [] },
      headless: { detected: true, signals: ['headless_ua'] },
    };

    const score = calculateAutomationScore(signals);
    expect(score).toBeGreaterThan(75);
  });

  it('should calculate low automation score for normal browser', () => {
    const signals = {
      selenium: { detected: false, signals: [] },
      puppeteer: { detected: false, signals: [] },
      playwright: { detected: false, signals: [] },
      phantomjs: { detected: false, signals: [] },
      headless: { detected: false, signals: [] },
    };

    const score = calculateAutomationScore(signals);
    expect(score).toBeLessThan(25);
  });
});
```

### 2.6 Testing Consistency Rules

**File:** `packages/consistency/src/__tests__/rules.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  checkPlatformConsistency,
  checkTimezoneConsistency,
  checkLanguageConsistency,
  checkScreenConsistency,
  calculateConsistencyScore,
} from '../rules';

describe('Platform Consistency', () => {
  it('should pass for consistent platform data', () => {
    const data = {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      platform: 'MacIntel',
      oscpu: 'Intel Mac OS X 10.15',
    };

    const result = checkPlatformConsistency(data);
    expect(result.consistent).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should fail for inconsistent platform data', () => {
    const data = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      platform: 'MacIntel', // Inconsistent!
      oscpu: 'Windows NT 10.0',
    };

    const result = checkPlatformConsistency(data);
    expect(result.consistent).toBe(false);
    expect(result.violations).toContain('platform_ua_mismatch');
  });
});

describe('Timezone Consistency', () => {
  it('should detect timezone vs IP location mismatch', () => {
    const data = {
      timezone: 'America/New_York',
      offset: -240, // EST
      ipCountry: 'JP', // Japan
    };

    const result = checkTimezoneConsistency(data);
    expect(result.consistent).toBe(false);
    expect(result.violations).toContain('timezone_ip_mismatch');
  });
});

describe('Language Consistency', () => {
  it('should detect language vs IP location mismatch', () => {
    const data = {
      languages: ['zh-CN', 'zh'],
      ipCountry: 'US',
    };

    const result = checkLanguageConsistency(data);
    expect(result.consistent).toBe(false);
    expect(result.suspicionScore).toBeGreaterThan(50);
  });
});

describe('Screen Consistency', () => {
  it('should detect impossible screen resolutions', () => {
    const data = {
      screen: {
        width: 1920,
        height: 1080,
        availWidth: 2560, // Impossible!
        availHeight: 1440,
      },
    };

    const result = checkScreenConsistency(data);
    expect(result.consistent).toBe(false);
    expect(result.violations).toContain('avail_exceeds_total');
  });
});

describe('Overall Consistency Score', () => {
  it('should calculate high consistency score for natural browser', () => {
    const checks = {
      platform: { consistent: true, violations: [] },
      timezone: { consistent: true, violations: [] },
      language: { consistent: true, violations: [] },
      screen: { consistent: true, violations: [] },
    };

    const score = calculateConsistencyScore(checks);
    expect(score).toBeGreaterThan(90);
  });

  it('should calculate low consistency score for spoofed browser', () => {
    const checks = {
      platform: { consistent: false, violations: ['platform_ua_mismatch'] },
      timezone: { consistent: false, violations: ['timezone_ip_mismatch'] },
      language: { consistent: false, violations: ['language_ip_mismatch'] },
      screen: { consistent: false, violations: ['impossible_resolution'] },
    };

    const score = calculateConsistencyScore(checks);
    expect(score).toBeLessThan(40);
  });
});
```

---

## 3. Integration Testing

### 3.1 API Testing with Hono Test Client

**File:** `apps/api/src/__tests__/scan.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testClient } from 'hono/testing';
import app from '../index';
import { setupTestDB, teardownTestDB, seedTestData } from './helpers/db';

describe('POST /api/scan/collect', () => {
  beforeEach(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await teardownTestDB();
  });

  it('should collect fingerprint data', async () => {
    const client = testClient(app);

    const response = await client.api.scan.collect.$post({
      json: {
        fingerprint: {
          canvas: {
            hash: 'abc123def456',
            width: 300,
            height: 150,
          },
          webgl: {
            vendor: 'Intel Inc.',
            renderer: 'Intel Iris OpenGL Engine',
          },
          audio: {
            hash: '789xyz',
            sampleRate: 44100,
          },
          userAgent: 'Mozilla/5.0...',
          platform: 'MacIntel',
          screen: {
            width: 1920,
            height: 1080,
          },
        },
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.scanId).toBeDefined();
    expect(data.analysis).toBeDefined();
    expect(data.analysis.automationScore).toBeGreaterThanOrEqual(0);
    expect(data.analysis.automationScore).toBeLessThanOrEqual(100);
  });

  it('should reject invalid fingerprint data', async () => {
    const client = testClient(app);

    const response = await client.api.scan.collect.$post({
      json: {
        fingerprint: {
          // Missing required fields
          canvas: {},
        },
      },
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should enforce rate limiting', async () => {
    const client = testClient(app);

    // Make 10 requests (assuming limit is 5/min)
    const requests = Array.from({ length: 10 }, () =>
      client.api.scan.collect.$post({
        json: {
          fingerprint: {
            canvas: { hash: 'test' },
            webgl: { vendor: 'test' },
          },
        },
      })
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter((r) => r.status === 429);

    expect(rateLimited.length).toBeGreaterThan(0);
  });

  it('should save fingerprint to D1 database', async () => {
    const client = testClient(app);

    const response = await client.api.scan.collect.$post({
      json: {
        fingerprint: {
          canvas: { hash: 'db-test' },
        },
      },
    });

    const { scanId } = await response.json();

    // Verify data in database
    const dbClient = await setupTestDB();
    const result = await dbClient
      .prepare('SELECT * FROM scans WHERE id = ?')
      .bind(scanId)
      .first();

    expect(result).toBeDefined();
    expect(result.fingerprint_hash).toBeDefined();
  });
});

describe('GET /api/generate', () => {
  it('should generate consistent fingerprint', async () => {
    const client = testClient(app);

    const response = await client.api.generate.$get({
      query: {
        os: 'windows',
        browser: 'chrome',
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.fingerprint).toBeDefined();
    expect(data.fingerprint.userAgent).toContain('Windows');
    expect(data.fingerprint.platform).toBe('Win32');
    expect(data.consistencyScore).toBeGreaterThan(90);
  });

  it('should generate different fingerprints for different configs', async () => {
    const client = testClient(app);

    const [windows, mac] = await Promise.all([
      client.api.generate.$get({ query: { os: 'windows' } }),
      client.api.generate.$get({ query: { os: 'mac' } }),
    ]);

    const windowsData = await windows.json();
    const macData = await mac.json();

    expect(windowsData.fingerprint.platform).not.toBe(macData.fingerprint.platform);
  });
});

describe('POST /api/challenge/tls', () => {
  it('should analyze TLS fingerprint', async () => {
    const client = testClient(app);

    const response = await client.api.challenge.tls.$post({
      json: {
        ja3Hash: 'abc123def456',
        cipherSuites: ['TLS_AES_128_GCM_SHA256'],
        extensions: [0, 10, 11],
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.analysis).toBeDefined();
    expect(data.knownBrowser).toBeDefined();
  });
});
```

### 3.2 D1 Database Testing

**File:** `apps/api/src/__tests__/helpers/db.ts`

```typescript
import { D1Database } from '@cloudflare/workers-types';
import { vi } from 'vitest';

// In-memory SQLite for testing
let db: any;

export async function setupTestDB(): Promise<D1Database> {
  const { Database } = await import('better-sqlite3');
  db = new Database(':memory:');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      fingerprint_hash TEXT NOT NULL,
      fingerprint_data TEXT NOT NULL,
      analysis_result TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      scan_id TEXT NOT NULL,
      title TEXT,
      created_at INTEGER NOT NULL,
      expires_at INTEGER,
      FOREIGN KEY (scan_id) REFERENCES scans(id)
    );

    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      reset_at INTEGER NOT NULL
    );

    CREATE INDEX idx_scans_created ON scans(created_at);
    CREATE INDEX idx_scans_hash ON scans(fingerprint_hash);
  `);

  // Wrap in D1-compatible API
  return {
    prepare: (sql: string) => ({
      bind: (...params: any[]) => ({
        first: async () => {
          const stmt = db.prepare(sql);
          return stmt.get(...params);
        },
        all: async () => {
          const stmt = db.prepare(sql);
          return { results: stmt.all(...params) };
        },
        run: async () => {
          const stmt = db.prepare(sql);
          return stmt.run(...params);
        },
      }),
    }),
    batch: async (statements: any[]) => {
      const transaction = db.transaction(() => {
        statements.forEach((stmt) => stmt.run());
      });
      transaction();
    },
  } as D1Database;
}

export async function teardownTestDB() {
  if (db) {
    db.close();
  }
}

export async function seedTestData() {
  db.exec(`
    INSERT INTO scans (id, fingerprint_hash, fingerprint_data, analysis_result, created_at)
    VALUES
      ('scan1', 'hash1', '{}', '{"score": 85}', ${Date.now()}),
      ('scan2', 'hash2', '{}', '{"score": 45}', ${Date.now()});
  `);
}
```

### 3.3 KV Mock Testing

**File:** `apps/api/src/__tests__/helpers/kv.ts`

```typescript
import { KVNamespace } from '@cloudflare/workers-types';

export function createMockKV(): KVNamespace {
  const store = new Map<string, string>();

  return {
    get: async (key: string) => store.get(key) || null,
    put: async (key: string, value: string, options?: any) => {
      store.set(key, value);
    },
    delete: async (key: string) => {
      store.delete(key);
    },
    list: async () => ({
      keys: Array.from(store.keys()).map((name) => ({ name })),
      list_complete: true,
      cursor: '',
    }),
  } as KVNamespace;
}
```

---

## 4. E2E Testing (Playwright)

### 4.1 Playwright Configuration

**File:** `apps/web/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

### 4.2 E2E Test: Homepage Scanner Flow

**File:** `apps/web/e2e/scanner-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Homepage Scanner Flow', () => {
  test('should complete full scan journey', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/Anti-detect/i);

    // Click "Start Scan" button
    const startButton = page.getByRole('button', { name: /start scan/i });
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Wait for scan to complete (progress animation)
    await expect(page.getByText(/analyzing/i)).toBeVisible();

    // Wait for results to load (max 10 seconds)
    await page.waitForSelector('[data-testid="scan-results"]', {
      timeout: 10_000,
    });

    // Verify risk score is displayed
    const riskScore = page.getByTestId('risk-score');
    await expect(riskScore).toBeVisible();
    const scoreText = await riskScore.textContent();
    expect(scoreText).toMatch(/\d+/); // Contains number

    // Verify key fingerprint sections are shown
    await expect(page.getByText(/canvas fingerprint/i)).toBeVisible();
    await expect(page.getByText(/webgl/i)).toBeVisible();
    await expect(page.getByText(/audio/i)).toBeVisible();

    // Expand detailed analysis
    await page.getByRole('button', { name: /show details/i }).click();
    await expect(page.getByText(/hash:/i)).toBeVisible();

    // Take screenshot for visual regression
    await page.screenshot({ path: 'test-results/scanner-results.png' });
  });

  test('should share scan report', async ({ page, context }) => {
    // Complete a scan first
    await page.goto('/');
    await page.getByRole('button', { name: /start scan/i }).click();
    await page.waitForSelector('[data-testid="scan-results"]');

    // Click share button
    const shareButton = page.getByRole('button', { name: /share/i });
    await shareButton.click();

    // Wait for share modal
    await expect(page.getByText(/shareable link/i)).toBeVisible();

    // Copy share link
    const shareLink = await page.getByTestId('share-link').textContent();
    expect(shareLink).toMatch(/^https?:\/\/.+\/report\/.+/);

    // Open share link in new tab
    const newPage = await context.newPage();
    await newPage.goto(shareLink!);

    // Verify report is visible
    await expect(newPage.getByTestId('shared-report')).toBeVisible();
    await expect(newPage.getByTestId('risk-score')).toBeVisible();
  });

  test('should export PDF report', async ({ page }) => {
    // Complete scan
    await page.goto('/');
    await page.getByRole('button', { name: /start scan/i }).click();
    await page.waitForSelector('[data-testid="scan-results"]');

    // Click export PDF
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /export pdf/i }).click(),
    ]);

    // Verify download
    expect(download.suggestedFilename()).toMatch(/fingerprint-report.*\.pdf/);
    const path = await download.path();
    expect(path).toBeTruthy();
  });
});
```

### 4.3 E2E Test: Generator Flow

**File:** `apps/web/e2e/generator-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Generator Flow', () => {
  test('should generate consistent fingerprint', async ({ page }) => {
    // Navigate to generator
    await page.goto('/tools/generator');
    await expect(page.getByRole('heading', { name: /generator/i })).toBeVisible();

    // Select OS
    await page.getByLabel(/operating system/i).click();
    await page.getByRole('option', { name: /windows/i }).click();

    // Select Browser
    await page.getByLabel(/browser/i).click();
    await page.getByRole('option', { name: /chrome/i }).click();

    // Click Generate
    await page.getByRole('button', { name: /generate/i }).click();

    // Wait for generated fingerprint
    await page.waitForSelector('[data-testid="generated-fingerprint"]');

    // Verify components
    await expect(page.getByText(/user agent:/i)).toBeVisible();
    await expect(page.getByText(/platform:/i)).toBeVisible();
    await expect(page.getByText(/screen resolution:/i)).toBeVisible();

    // Verify consistency score
    const consistencyScore = page.getByTestId('consistency-score');
    await expect(consistencyScore).toBeVisible();
    const score = await consistencyScore.textContent();
    expect(parseInt(score!)).toBeGreaterThan(85);

    // Copy to clipboard
    await page.getByRole('button', { name: /copy/i }).click();
    await expect(page.getByText(/copied/i)).toBeVisible();
  });

  test('should customize fingerprint parameters', async ({ page }) => {
    await page.goto('/tools/generator');

    // Enable advanced options
    await page.getByRole('button', { name: /advanced/i }).click();

    // Set custom screen resolution
    await page.getByLabel(/screen width/i).fill('2560');
    await page.getByLabel(/screen height/i).fill('1440');

    // Set custom timezone
    await page.getByLabel(/timezone/i).click();
    await page.getByRole('option', { name: /america\/new_york/i }).click();

    // Generate
    await page.getByRole('button', { name: /generate/i }).click();
    await page.waitForSelector('[data-testid="generated-fingerprint"]');

    // Verify custom parameters
    const fingerprint = await page.getByTestId('generated-fingerprint').textContent();
    expect(fingerprint).toContain('2560');
    expect(fingerprint).toContain('1440');
    expect(fingerprint).toContain('America/New_York');
  });
});
```

### 4.4 E2E Test: Challenge Arena

**File:** `apps/web/e2e/challenge-arena.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Challenge Arena', () => {
  test('should complete all challenges', async ({ page }) => {
    await page.goto('/tools/challenge');

    // Challenge 1: Canvas
    await test.step('Canvas Challenge', async () => {
      await page.getByRole('button', { name: /start canvas/i }).click();
      await page.waitForSelector('[data-testid="canvas-result"]');
      await expect(page.getByText(/passed|failed/i)).toBeVisible();
    });

    // Challenge 2: WebGL
    await test.step('WebGL Challenge', async () => {
      await page.getByRole('button', { name: /start webgl/i }).click();
      await page.waitForSelector('[data-testid="webgl-result"]');
      await expect(page.getByText(/passed|failed/i)).toBeVisible();
    });

    // Challenge 3: TLS Fingerprint
    await test.step('TLS Challenge', async () => {
      await page.getByRole('button', { name: /start tls/i }).click();
      await page.waitForSelector('[data-testid="tls-result"]');
      await expect(page.getByText(/ja3 hash:/i)).toBeVisible();
    });

    // Check overall score
    const totalScore = page.getByTestId('total-score');
    await expect(totalScore).toBeVisible();
  });
});
```

### 4.5 E2E Test: Cross-Browser Compatibility

**File:** `apps/web/e2e/cross-browser.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Compatibility', () => {
  test('scanner works in all browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /start scan/i }).click();
    await page.waitForSelector('[data-testid="scan-results"]', {
      timeout: 15_000,
    });

    // Verify results regardless of browser
    const riskScore = await page.getByTestId('risk-score').textContent();
    expect(riskScore).toMatch(/\d+/);

    // Browser-specific assertions
    if (browserName === 'webkit') {
      // Safari-specific checks
      await expect(page.getByText(/safari/i)).toBeVisible();
    } else if (browserName === 'firefox') {
      await expect(page.getByText(/firefox/i)).toBeVisible();
    }
  });

  test('mobile viewport works correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Verify mobile menu
    const menuButton = page.getByRole('button', { name: /menu/i });
    await expect(menuButton).toBeVisible();

    // Test scanner on mobile
    await page.getByRole('button', { name: /start scan/i }).click();
    await page.waitForSelector('[data-testid="scan-results"]');
    await expect(page.getByTestId('risk-score')).toBeVisible();
  });
});
```

---

## 5. Visual Regression Testing

### 5.1 Percy Configuration

**File:** `.percy.yml`

```yaml
version: 2
static:
  include:
    - public/**
snapshot:
  widths:
    - 375  # Mobile
    - 768  # Tablet
    - 1280 # Desktop
    - 1920 # Large Desktop
  min-height: 1024
  percy-css: |
    /* Hide dynamic content */
    [data-testid="timestamp"] { display: none !important; }
    [data-testid="session-id"] { display: none !important; }
    .animation { animation: none !important; }

browsers:
  - name: chrome
  - name: firefox
  - name: edge
```

**File:** `apps/web/e2e/visual-regression.spec.ts`

```typescript
import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Visual Regression Tests', () => {
  test('homepage renders correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await percySnapshot(page, 'Homepage');
  });

  test('scanner results page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /start scan/i }).click();
    await page.waitForSelector('[data-testid="scan-results"]');
    await percySnapshot(page, 'Scanner Results');
  });

  test('generator page', async ({ page }) => {
    await page.goto('/tools/generator');
    await percySnapshot(page, 'Generator Page');
  });

  test('challenge arena', async ({ page }) => {
    await page.goto('/tools/challenge');
    await percySnapshot(page, 'Challenge Arena');
  });

  test('shared report page', async ({ page }) => {
    // Use a static test report
    await page.goto('/report/test-report-123');
    await percySnapshot(page, 'Shared Report');
  });

  test('dark mode', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ colorScheme: 'dark' });
    await percySnapshot(page, 'Homepage - Dark Mode');
  });
});
```

---

## 6. Performance Testing

### 6.1 Lighthouse CI Configuration

**File:** `lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "startServerCommand": "npm run build && npm run start",
      "url": [
        "http://localhost:3000",
        "http://localhost:3000/tools/generator",
        "http://localhost:3000/tools/challenge"
      ]
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 1800 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 300 }],
        "speed-index": ["error", { "maxNumericValue": 3000 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### 6.2 Core Web Vitals Testing

**File:** `apps/web/e2e/performance.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Core Web Vitals', () => {
  test('measures LCP, FID, CLS', async ({ page }) => {
    await page.goto('/');

    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Measure Web Vitals using Performance API
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics: any = {};

        // LCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // FID
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          metrics.fid = entries[0].processingStart - entries[0].startTime;
        }).observe({ entryTypes: ['first-input'] });

        // CLS
        let clsScore = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsScore += entry.value;
            }
          }
          metrics.cls = clsScore;
        }).observe({ entryTypes: ['layout-shift'] });

        // Resolve after 5 seconds
        setTimeout(() => resolve(metrics), 5000);
      });
    });

    // Assert thresholds
    expect(webVitals.lcp).toBeLessThan(2500); // Good: <2.5s
    expect(webVitals.cls).toBeLessThan(0.1); // Good: <0.1

    console.log('Web Vitals:', webVitals);
  });

  test('API latency benchmark', async ({ request }) => {
    const start = Date.now();

    const response = await request.post('/api/scan/collect', {
      data: {
        fingerprint: {
          canvas: { hash: 'test' },
          webgl: { vendor: 'test' },
        },
      },
    });

    const latency = Date.now() - start;

    expect(response.status).toBe(200);
    expect(latency).toBeLessThan(500); // <500ms response time
  });
});
```

### 6.3 Bundle Size Monitoring

**File:** `.github/workflows/bundle-size.yml`

```yaml
name: Bundle Size Check

on: [pull_request]

jobs:
  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build app
        run: npm run build

      - name: Analyze bundle
        uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          skip_step: install
```

**File:** `.size-limit.json`

```json
[
  {
    "name": "Homepage (First Load)",
    "path": "apps/web/.next/static/chunks/pages/index.js",
    "limit": "150 KB"
  },
  {
    "name": "Generator Page",
    "path": "apps/web/.next/static/chunks/pages/tools/generator.js",
    "limit": "100 KB"
  },
  {
    "name": "Core Collectors Package",
    "path": "packages/core/dist/index.js",
    "limit": "50 KB"
  }
]
```

---

## 7. Accessibility Testing

### 7.1 axe-core Integration

**File:** `apps/web/e2e/accessibility.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (WCAG AA)', () => {
  test('homepage has no violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('scanner results have no violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /start scan/i }).click();
    await page.waitForSelector('[data-testid="scan-results"]');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('generator page has no violations', async ({ page }) => {
    await page.goto('/tools/generator');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/');

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    let focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focused);

    // Press Enter on Start Scan button
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="scan-results"]');
  });

  test('screen reader compatibility', async ({ page }) => {
    await page.goto('/');

    // Check ARIA labels
    const startButton = page.getByRole('button', { name: /start scan/i });
    const ariaLabel = await startButton.getAttribute('aria-label');
    expect(ariaLabel || await startButton.textContent()).toBeTruthy();

    // Check heading hierarchy
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (elements) =>
      elements.map((el) => ({ tag: el.tagName, text: el.textContent }))
    );
    expect(headings[0].tag).toBe('H1'); // Only one H1
    expect(headings.filter((h) => h.tag === 'H1')).toHaveLength(1);
  });

  test('color contrast meets WCAG AA', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
```

---

## 8. Security Testing

### 8.1 OWASP Testing Checklist

**File:** `apps/web/e2e/security.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Security Tests (OWASP)', () => {
  test('XSS Prevention: rejects malicious input', async ({ page, request }) => {
    // Attempt XSS via API
    const response = await request.post('/api/scan/collect', {
      data: {
        fingerprint: {
          canvas: {
            hash: '<script>alert("XSS")</script>',
          },
        },
      },
    });

    const data = await response.json();

    // Should sanitize or reject
    expect(data.error || !data.analysis.canvas.hash.includes('<script>')).toBeTruthy();
  });

  test('CSRF Protection: rejects requests without origin header', async ({ request }) => {
    const response = await request.post('/api/scan/collect', {
      headers: {
        // Missing Origin header
      },
      data: {
        fingerprint: { canvas: { hash: 'test' } },
      },
    });

    // Should reject or require CSRF token
    expect([400, 403]).toContain(response.status);
  });

  test('Rate Limiting: enforces limits', async ({ request }) => {
    const requests = Array.from({ length: 20 }, () =>
      request.post('/api/scan/collect', {
        data: { fingerprint: { canvas: { hash: 'test' } } },
      })
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter((r) => r.status === 429);

    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test('Input Validation: rejects oversized payloads', async ({ request }) => {
    const hugePayload = {
      fingerprint: {
        canvas: {
          hash: 'a'.repeat(10_000_000), // 10MB
        },
      },
    };

    const response = await request.post('/api/scan/collect', {
      data: hugePayload,
    });

    expect(response.status).toBe(413); // Payload Too Large
  });

  test('SQL Injection Prevention: escapes inputs', async ({ request }) => {
    const response = await request.get('/api/report/test-report-123\'; DROP TABLE scans; --');

    // Should safely handle SQL injection attempt
    expect([400, 404]).toContain(response.status);
  });

  test('Clickjacking Protection: sets X-Frame-Options', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();

    expect(
      headers?.['x-frame-options'] === 'DENY' ||
      headers?.['x-frame-options'] === 'SAMEORIGIN'
    ).toBe(true);
  });

  test('Content Security Policy: restricts resources', async ({ page }) => {
    const response = await page.goto('/');
    const csp = response?.headers()['content-security-policy'];

    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain("'unsafe-inline'"); // No inline scripts
  });
});
```

---

## 9. Browser Fingerprint Detection Accuracy Testing

### 9.1 Real Browser Testing

**File:** `apps/web/e2e/accuracy/real-browsers.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Real Browser Detection Accuracy', () => {
  test('detects normal Chrome browser as low risk', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /start scan/i }).click();
    await page.waitForSelector('[data-testid="scan-results"]');

    const automationScore = await page
      .getByTestId('automation-score')
      .textContent();
    const score = parseInt(automationScore!);

    // Normal browser should have low automation score
    expect(score).toBeLessThan(30);
  });

  test('detects Firefox as legitimate', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-only test');

    await page.goto('/');
    await page.getByRole('button', { name: /start scan/i }).click();
    await page.waitForSelector('[data-testid="scan-results"]');

    const riskLevel = await page.getByTestId('risk-level').textContent();
    expect(riskLevel).toMatch(/low|medium/i);
  });
});
```

### 9.2 Automated Browser Detection

**File:** `apps/web/e2e/accuracy/automation-detection.spec.ts`

```typescript
import { test, expect, chromium } from '@playwright/test';

test.describe('Automation Tool Detection', () => {
  test('detects Playwright', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: /start scan/i }).click();
    await page.waitForSelector('[data-testid="scan-results"]');

    const automationScore = await page
      .getByTestId('automation-score')
      .textContent();
    const score = parseInt(automationScore!);

    // Should detect Playwright with high confidence
    expect(score).toBeGreaterThan(70);

    // Check specific signals
    const signals = await page.getByTestId('automation-signals').textContent();
    expect(signals).toContain('navigator.webdriver');

    await browser.close();
  });

  test('detects Puppeteer', async () => {
    // Run Puppeteer script
    const { execSync } = require('child_process');
    const result = execSync('node test/puppeteer-scan.js', {
      encoding: 'utf-8',
    });

    const data = JSON.parse(result);
    expect(data.automationScore).toBeGreaterThan(70);
    expect(data.signals).toContain('chrome.runtime');
  });

  test('detects Selenium', async () => {
    // Requires Selenium WebDriver setup
    const result = execSync('node test/selenium-scan.js', {
      encoding: 'utf-8',
    });

    const data = JSON.parse(result);
    expect(data.automationScore).toBeGreaterThan(80);
    expect(data.signals).toContain('webdriver');
  });
});
```

**File:** `apps/web/test/puppeteer-scan.js`

```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3000');
  await page.click('button:has-text("Start Scan")');
  await page.waitForSelector('[data-testid="scan-results"]');

  const result = await page.evaluate(() => {
    const score = document.querySelector('[data-testid="automation-score"]').textContent;
    const signals = document.querySelector('[data-testid="automation-signals"]').textContent;
    return { automationScore: parseInt(score), signals };
  });

  console.log(JSON.stringify(result));
  await browser.close();
})();
```

### 9.3 Anti-Detect Browser Testing

**File:** `apps/web/e2e/accuracy/anti-detect.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Anti-Detect Browser Testing', () => {
  test('should detect inconsistencies in spoofed fingerprints', async ({ page }) => {
    // Simulate anti-detect browser behavior
    await page.addInitScript(() => {
      // Override navigator.platform
      Object.defineProperty(navigator, 'platform', {
        get: () => 'Win32',
      });

      // But keep macOS user agent
      Object.defineProperty(navigator, 'userAgent', {
        get: () =>
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      });
    });

    await page.goto('/');
    await page.getByRole('button', { name: /start scan/i }).click();
    await page.waitForSelector('[data-testid="scan-results"]');

    // Should detect inconsistency
    const consistencyScore = await page
      .getByTestId('consistency-score')
      .textContent();
    const score = parseInt(consistencyScore!);

    expect(score).toBeLessThan(70);

    const violations = await page
      .getByTestId('consistency-violations')
      .textContent();
    expect(violations).toContain('platform_mismatch');
  });

  test('detection accuracy metrics', async ({ page }) => {
    // Test against known fingerprint database
    const testCases = [
      { type: 'real', expectedScore: '<30' },
      { type: 'puppeteer', expectedScore: '>70' },
      { type: 'anti-detect', expectedScore: '40-70' },
    ];

    for (const testCase of testCases) {
      // Load fingerprint fixture
      await page.goto(`/test/fingerprint/${testCase.type}`);
      await page.getByRole('button', { name: /analyze/i }).click();
      await page.waitForSelector('[data-testid="scan-results"]');

      const score = parseInt(
        await page.getByTestId('automation-score').textContent() || '0'
      );

      // Log for accuracy tracking
      console.log(`${testCase.type}: ${score} (expected ${testCase.expectedScore})`);
    }
  });
});
```

---

## 10. CI/CD Integration

### 10.1 GitHub Actions Workflow

**File:** `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: npm run db:test:setup

      - name: Run integration tests
        run: npm run test:integration

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e -- --project=${{ matrix.browser }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/
          retention-days: 30

  accessibility-tests:
    name: Accessibility Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run accessibility tests
        run: npm run test:a11y

  performance-tests:
    name: Performance Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun

      - name: Upload Lighthouse results
        uses: actions/upload-artifact@v3
        with:
          name: lighthouse-results
          path: .lighthouseci/

  security-tests:
    name: Security Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run security tests
        run: npm run test:security

      - name: Run npm audit
        run: npm audit --production

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### 10.2 Pre-commit Hooks

**File:** `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run unit tests for changed files
npm run test:changed

# Run format check
npm run format:check
```

**File:** `package.json` (scripts section)

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:a11y": "playwright test --grep @a11y",
    "test:security": "playwright test --grep @security",
    "test:changed": "vitest related --run",
    "test:coverage": "vitest run --coverage",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "format:check": "prettier --check ."
  }
}
```

---

## 11. Test Data Management

### 11.1 Fingerprint Fixtures

**File:** `apps/web/test/fixtures/fingerprints.ts`

```typescript
export const realChromeFingerprint = {
  canvas: {
    hash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    width: 300,
    height: 150,
    poisoned: false,
  },
  webgl: {
    vendor: 'Intel Inc.',
    renderer: 'Intel Iris Plus Graphics 640',
    version: 'WebGL 2.0',
    unmaskedVendor: 'Intel Inc.',
    unmaskedRenderer: 'Intel Iris Plus Graphics 640',
    extensions: [
      'ANGLE_instanced_arrays',
      'EXT_blend_minmax',
      'EXT_color_buffer_half_float',
      'WEBGL_debug_renderer_info',
    ],
    hash: 'webgl-hash-123456',
  },
  audio: {
    hash: 'audio-hash-789',
    sampleRate: 44100,
    supported: true,
    blocked: false,
  },
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  platform: 'MacIntel',
  languages: ['en-US', 'en'],
  timezone: 'America/New_York',
  screen: {
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1050,
    colorDepth: 24,
  },
};

export const puppeteerFingerprint = {
  ...realChromeFingerprint,
  userAgent:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36',
  screen: {
    width: 800,
    height: 600,
    availWidth: 800,
    availHeight: 600,
    colorDepth: 24,
  },
  automation: {
    webdriver: true,
    chromeRuntime: true,
  },
};

export const antiDetectFingerprint = {
  ...realChromeFingerprint,
  platform: 'Win32', // Inconsistent with UA
  timezone: 'Europe/London', // Doesn't match IP
  canvas: {
    ...realChromeFingerprint.canvas,
    poisoned: true,
  },
};
```

### 11.2 Database Seed Data

**File:** `apps/api/test/fixtures/db-seed.ts`

```typescript
import { D1Database } from '@cloudflare/workers-types';

export async function seedDatabase(db: D1Database) {
  // Insert test scans
  await db.batch([
    db
      .prepare(
        'INSERT INTO scans (id, fingerprint_hash, fingerprint_data, analysis_result, created_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(
        'scan-test-1',
        'hash-123',
        JSON.stringify(realChromeFingerprint),
        JSON.stringify({ automationScore: 15, riskLevel: 'low' }),
        Date.now()
      ),
    db
      .prepare(
        'INSERT INTO scans (id, fingerprint_hash, fingerprint_data, analysis_result, created_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(
        'scan-test-2',
        'hash-456',
        JSON.stringify(puppeteerFingerprint),
        JSON.stringify({ automationScore: 85, riskLevel: 'high' }),
        Date.now()
      ),
  ]);

  // Insert test reports
  await db
    .prepare(
      'INSERT INTO reports (id, scan_id, title, created_at) VALUES (?, ?, ?, ?)'
    )
    .bind('report-test-1', 'scan-test-1', 'Test Report', Date.now())
    .run();
}
```

### 11.3 Mock API Responses

**File:** `apps/web/test/mocks/api.ts`

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock scan endpoint
  http.post('/api/scan/collect', async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json({
      scanId: 'mock-scan-123',
      analysis: {
        automationScore: 25,
        riskLevel: 'low',
        signals: [],
        consistencyScore: 95,
      },
    });
  }),

  // Mock generator endpoint
  http.get('/api/generate', ({ request }) => {
    const url = new URL(request.url);
    const os = url.searchParams.get('os');

    return HttpResponse.json({
      fingerprint: {
        userAgent: os === 'windows' ? 'Windows UA' : 'Mac UA',
        platform: os === 'windows' ? 'Win32' : 'MacIntel',
      },
      consistencyScore: 98,
    });
  }),

  // Mock report endpoint
  http.get('/api/report/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      scanId: 'scan-123',
      title: 'Mock Report',
      createdAt: Date.now(),
    });
  }),
];
```

**File:** `apps/web/test/setup-msw.ts`

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './mocks/api';
import { beforeAll, afterAll, afterEach } from 'vitest';

export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
```

---

## Summary

This comprehensive testing strategy ensures:

1. **High Code Quality** - 80%+ unit test coverage with Vitest
2. **Robust APIs** - Full integration testing with Hono test client
3. **Cross-Browser Compatibility** - E2E tests on Chrome, Firefox, Safari, Edge
4. **Accessibility Compliance** - WCAG AA validation with axe-core
5. **Security** - OWASP checklist coverage
6. **Performance** - Core Web Vitals monitoring
7. **Detection Accuracy** - Real vs. automated browser testing
8. **CI/CD Integration** - Automated testing on every commit
9. **Visual Regression** - Percy snapshots for UI consistency

**Total Test Count Estimate:**
- Unit Tests: ~150 tests
- Integration Tests: ~30 tests
- E2E Tests: ~40 tests
- Accessibility Tests: ~15 tests
- Security Tests: ~10 tests
- **TOTAL: ~245 tests**

**Estimated Runtime:**
- Unit Tests: ~30 seconds
- Integration Tests: ~1 minute
- E2E Tests: ~5 minutes (parallel across browsers)
- **TOTAL CI Runtime: ~7 minutes**

This strategy balances comprehensive coverage with fast feedback loops, ensuring production-ready code quality for Anti-detect.com.
