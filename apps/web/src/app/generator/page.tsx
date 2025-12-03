'use client';

import { useState, useCallback } from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

type OS = 'Windows' | 'macOS' | 'Linux' | 'Android' | 'iOS';
type Browser = 'Chrome' | 'Firefox' | 'Safari' | 'Edge';
type Quality = 'standard' | 'premium' | 'verified';
type ExportFormat = 'json' | 'puppeteer' | 'playwright' | 'selenium' | 'mutilogin';

interface GeneratedFingerprint {
  id: number;
  hash: string;
  userAgent: string;
  platform: string;
  screen: {
    width: number;
    height: number;
    devicePixelRatio: number;
  };
  hardware: {
    hardwareConcurrency: number;
    deviceMemory: number;
    maxTouchPoints: number;
  };
  webgl: {
    vendor: string;
    renderer: string;
  };
  locale: {
    timezone: string;
    languages: string[];
  };
  fonts: string[];
  metadata: {
    qualityScore: number;
    os: string;
    browser: string;
  };
}

export default function GeneratorPage() {
  const [os, setOs] = useState<OS | ''>('');
  const [browser, setBrowser] = useState<Browser | ''>('');
  const [quality, setQuality] = useState<Quality>('standard');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');

  const [fingerprint, setFingerprint] = useState<GeneratedFingerprint | null>(null);
  const [exportCode, setExportCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (os) params.append('os', os);
      if (browser) params.append('browser', browser);
      params.append('quality', quality);

      // Call the API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';
      const response = await fetch(`${apiUrl}/generate?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate fingerprint');
      }

      const data = await response.json();
      setFingerprint(data);
      setExportCode(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      console.error('Generation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [os, browser, quality]);

  const handleExport = useCallback(async () => {
    if (!fingerprint) return;

    let code: string;
    switch (exportFormat) {
      case 'puppeteer':
        code = generatePuppeteerCode(fingerprint);
        break;
      case 'playwright':
        code = generatePlaywrightCode(fingerprint);
        break;
      case 'selenium':
        code = generateSeleniumCode(fingerprint);
        break;
      case 'mutilogin':
        code = generateMutiloginProfile(fingerprint);
        break;
      default:
        code = JSON.stringify(fingerprint, null, 2);
    }
    setExportCode(code);
  }, [fingerprint, exportFormat]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(exportCode);
  }, [exportCode]);

  const osOptions: { value: OS; label: string; icon: string }[] = [
    { value: 'Windows', label: 'Windows', icon: '🪟' },
    { value: 'macOS', label: 'macOS', icon: '🍎' },
    { value: 'Linux', label: 'Linux', icon: '🐧' },
    { value: 'Android', label: 'Android', icon: '🤖' },
    { value: 'iOS', label: 'iOS', icon: '📱' },
  ];

  const browserOptions: { value: Browser; label: string; icon: string }[] = [
    { value: 'Chrome', label: 'Chrome', icon: '🌐' },
    { value: 'Firefox', label: 'Firefox', icon: '🦊' },
    { value: 'Safari', label: 'Safari', icon: '🧭' },
    { value: 'Edge', label: 'Edge', icon: '🔷' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text-primary mb-4">
              Fingerprint <span className="gradient-text">Generator</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Generate realistic browser fingerprints from our database of 127,000+ verified profiles.
              Export to Puppeteer, Playwright, Selenium, or Mutilogin.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Configuration Panel */}
            <div className="space-y-6">
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h2 className="text-lg font-semibold text-text-primary mb-6">Configuration</h2>

                {/* OS Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-secondary mb-3">
                    Operating System
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {osOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setOs(os === option.value ? '' : option.value)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          os === option.value
                            ? 'border-success bg-success/10 text-success'
                            : 'border-border bg-bg-primary hover:border-border-subtle text-text-secondary'
                        }`}
                      >
                        <span className="text-xl block mb-1">{option.icon}</span>
                        <span className="text-xs">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Browser Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-secondary mb-3">
                    Browser
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {browserOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setBrowser(browser === option.value ? '' : option.value)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          browser === option.value
                            ? 'border-success bg-success/10 text-success'
                            : 'border-border bg-bg-primary hover:border-border-subtle text-text-secondary'
                        }`}
                      >
                        <span className="text-xl block mb-1">{option.icon}</span>
                        <span className="text-xs">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality Tier */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-secondary mb-3">
                    Quality Tier
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'standard', label: 'Standard', desc: 'Basic fingerprints' },
                      { value: 'premium', label: 'Premium', desc: '70+ quality score' },
                      { value: 'verified', label: 'Verified', desc: '90+ quality score' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setQuality(option.value as Quality)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          quality === option.value
                            ? 'border-success bg-success/10'
                            : 'border-border bg-bg-primary hover:border-border-subtle'
                        }`}
                      >
                        <span className={`text-sm font-medium ${quality === option.value ? 'text-success' : 'text-text-primary'}`}>
                          {option.label}
                        </span>
                        <span className="text-xs text-text-muted block mt-0.5">{option.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="w-full py-3 bg-success text-bg-primary font-semibold rounded-lg hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Generating...' : 'Generate Fingerprint'}
                </button>

                {error && (
                  <p className="mt-3 text-sm text-error">{error}</p>
                )}
              </div>

              {/* Export Options */}
              {fingerprint && (
                <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                  <h2 className="text-lg font-semibold text-text-primary mb-4">Export Format</h2>

                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {[
                      { value: 'json', label: 'JSON' },
                      { value: 'puppeteer', label: 'Puppeteer' },
                      { value: 'playwright', label: 'Playwright' },
                      { value: 'selenium', label: 'Selenium' },
                      { value: 'mutilogin', label: 'Mutilogin' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setExportFormat(option.value as ExportFormat);
                          handleExport();
                        }}
                        className={`px-3 py-2 rounded text-sm transition-all ${
                          exportFormat === option.value
                            ? 'bg-accent text-white'
                            : 'bg-bg-primary text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Output Panel */}
            <div className="space-y-6">
              {fingerprint ? (
                <>
                  {/* Fingerprint Summary */}
                  <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-text-primary">Generated Fingerprint</h2>
                      <span className="px-2 py-1 text-xs font-medium rounded bg-success/10 text-success">
                        Quality: {fingerprint.metadata.qualityScore}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-text-muted">OS / Browser</span>
                        <p className="text-sm font-mono text-text-primary">
                          {fingerprint.metadata.os} / {fingerprint.metadata.browser}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-text-muted">Screen</span>
                        <p className="text-sm font-mono text-text-primary">
                          {fingerprint.screen.width}x{fingerprint.screen.height}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-text-muted">GPU</span>
                        <p className="text-sm font-mono text-text-primary truncate">
                          {fingerprint.webgl.renderer.slice(0, 30)}...
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-text-muted">Timezone</span>
                        <p className="text-sm font-mono text-text-primary">
                          {fingerprint.locale.timezone}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Code Output */}
                  <div className="rounded-lg bg-bg-secondary border border-border overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-bg-tertiary border-b border-border">
                      <span className="text-sm font-medium text-text-secondary">
                        {exportFormat.charAt(0).toUpperCase() + exportFormat.slice(1)} Export
                      </span>
                      <button
                        onClick={handleCopy}
                        className="px-3 py-1 text-xs bg-bg-primary text-text-secondary hover:text-text-primary rounded transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-terminal overflow-x-auto max-h-96">
                      {exportCode}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center p-12 rounded-lg bg-bg-secondary border border-border border-dashed">
                  <div className="text-center">
                    <svg
                      className="w-16 h-16 mx-auto text-text-disabled mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-text-secondary mb-2">
                      No Fingerprint Generated
                    </h3>
                    <p className="text-sm text-text-muted">
                      Configure options and click generate to create a fingerprint
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-16 p-8 rounded-lg bg-bg-secondary border border-border">
            <h2 className="text-xl font-bold text-text-primary mb-6">
              About the Fingerprint Database
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold text-success font-mono mb-2">127,543</div>
                <p className="text-text-muted">Real fingerprints from actual browsers worldwide</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-accent font-mono mb-2">94.2%</div>
                <p className="text-text-muted">Average pass rate on detection systems</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-terminal font-mono mb-2">Daily</div>
                <p className="text-text-muted">Updates with new browser versions</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Mock fingerprint generation for demo
function generateMockFingerprint(os?: string, browser?: string, quality?: string): GeneratedFingerprint {
  const selectedOs = os || ['Windows', 'macOS', 'Linux'][Math.floor(Math.random() * 3)];
  const selectedBrowser = browser || ['Chrome', 'Firefox', 'Safari'][Math.floor(Math.random() * 3)];

  const screens: Record<string, { width: number; height: number }[]> = {
    Windows: [{ width: 1920, height: 1080 }, { width: 2560, height: 1440 }],
    macOS: [{ width: 1440, height: 900 }, { width: 2560, height: 1600 }],
    Linux: [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }],
    Android: [{ width: 412, height: 915 }, { width: 360, height: 780 }],
    iOS: [{ width: 390, height: 844 }, { width: 414, height: 896 }],
  };

  const gpus: Record<string, string[]> = {
    Windows: ['NVIDIA GeForce RTX 3080', 'AMD Radeon RX 6800 XT', 'NVIDIA GeForce GTX 1660'],
    macOS: ['Apple M2 Pro', 'Apple M1', 'AMD Radeon Pro 5500M'],
    Linux: ['NVIDIA GeForce RTX 3070', 'Mesa Intel UHD Graphics 630'],
  };

  const screen = screens[selectedOs]?.[Math.floor(Math.random() * (screens[selectedOs]?.length || 1))] || { width: 1920, height: 1080 };
  const gpu = gpus[selectedOs]?.[Math.floor(Math.random() * (gpus[selectedOs]?.length || 1))] || 'Generic GPU';

  const qualityScore = quality === 'verified' ? 90 + Math.floor(Math.random() * 10) :
                       quality === 'premium' ? 70 + Math.floor(Math.random() * 20) :
                       50 + Math.floor(Math.random() * 20);

  return {
    id: Math.floor(Math.random() * 100000),
    hash: `fp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
    userAgent: `Mozilla/5.0 (${selectedOs === 'Windows' ? 'Windows NT 10.0; Win64; x64' : selectedOs === 'macOS' ? 'Macintosh; Intel Mac OS X 10_15_7' : 'X11; Linux x86_64'}) AppleWebKit/537.36 (KHTML, like Gecko) ${selectedBrowser}/120.0.0.0 Safari/537.36`,
    platform: selectedOs === 'Windows' ? 'Win32' : selectedOs === 'macOS' ? 'MacIntel' : 'Linux x86_64',
    screen: {
      width: screen.width,
      height: screen.height,
      devicePixelRatio: selectedOs === 'macOS' || selectedOs === 'iOS' ? 2 : 1,
    },
    hardware: {
      hardwareConcurrency: [4, 8, 12, 16][Math.floor(Math.random() * 4)],
      deviceMemory: [4, 8, 16, 32][Math.floor(Math.random() * 4)],
      maxTouchPoints: ['Android', 'iOS'].includes(selectedOs) ? 5 : 0,
    },
    webgl: {
      vendor: selectedOs === 'macOS' ? 'Apple Inc.' : 'Google Inc.',
      renderer: gpu,
    },
    locale: {
      timezone: ['America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin'][Math.floor(Math.random() * 4)],
      languages: ['en-US', 'en'],
    },
    fonts: ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'],
    metadata: {
      qualityScore,
      os: selectedOs,
      browser: selectedBrowser,
    },
  };
}

function generatePuppeteerCode(fp: GeneratedFingerprint): string {
  return `const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const browser = await puppeteer.launch({
  headless: false,
  args: [
    '--window-size=${fp.screen.width},${fp.screen.height}',
    '--disable-blink-features=AutomationControlled',
  ],
});

const page = await browser.newPage();

await page.setUserAgent('${fp.userAgent}');

await page.setViewport({
  width: ${fp.screen.width},
  height: ${fp.screen.height},
  deviceScaleFactor: ${fp.screen.devicePixelRatio},
});

await page.evaluateOnNewDocument(() => {
  Object.defineProperty(navigator, 'hardwareConcurrency', {
    get: () => ${fp.hardware.hardwareConcurrency}
  });
  Object.defineProperty(navigator, 'deviceMemory', {
    get: () => ${fp.hardware.deviceMemory}
  });
  Object.defineProperty(navigator, 'platform', {
    get: () => '${fp.platform}'
  });
  Object.defineProperty(navigator, 'languages', {
    get: () => ${JSON.stringify(fp.locale.languages)}
  });
});

// Your automation code here
await page.goto('https://example.com');
`;
}

function generatePlaywrightCode(fp: GeneratedFingerprint): string {
  return `const { chromium } = require('playwright');

const browser = await chromium.launch({
  headless: false,
});

const context = await browser.newContext({
  userAgent: '${fp.userAgent}',
  viewport: {
    width: ${fp.screen.width},
    height: ${fp.screen.height},
  },
  deviceScaleFactor: ${fp.screen.devicePixelRatio},
  locale: '${fp.locale.languages[0]}',
  timezoneId: '${fp.locale.timezone}',
});

await context.addInitScript(() => {
  Object.defineProperty(navigator, 'hardwareConcurrency', {
    get: () => ${fp.hardware.hardwareConcurrency}
  });
  Object.defineProperty(navigator, 'deviceMemory', {
    get: () => ${fp.hardware.deviceMemory}
  });
  Object.defineProperty(navigator, 'platform', {
    get: () => '${fp.platform}'
  });
});

const page = await context.newPage();

// Your automation code here
await page.goto('https://example.com');
`;
}

function generateSeleniumCode(fp: GeneratedFingerprint): string {
  return `from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--disable-blink-features=AutomationControlled')
options.add_argument(f'--window-size=${fp.screen.width},${fp.screen.height}')
options.add_argument('user-agent=${fp.userAgent}')

options.add_experimental_option('excludeSwitches', ['enable-automation'])
options.add_experimental_option('useAutomationExtension', False)

driver = webdriver.Chrome(options=options)

driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
    'source': '''
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });
        Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => ${fp.hardware.hardwareConcurrency}
        });
        Object.defineProperty(navigator, 'deviceMemory', {
            get: () => ${fp.hardware.deviceMemory}
        });
        Object.defineProperty(navigator, 'platform', {
            get: () => '${fp.platform}'
        });
    '''
})

# Your automation code here
driver.get('https://example.com')
`;
}

function generateMutiloginProfile(fp: GeneratedFingerprint): string {
  return JSON.stringify({
    name: `Generated Profile ${Date.now()}`,
    os: fp.metadata.os,
    browser: fp.metadata.browser,
    navigator: {
      userAgent: fp.userAgent,
      platform: fp.platform,
      hardwareConcurrency: fp.hardware.hardwareConcurrency,
      deviceMemory: fp.hardware.deviceMemory,
      languages: fp.locale.languages,
      maxTouchPoints: fp.hardware.maxTouchPoints,
    },
    screen: {
      width: fp.screen.width,
      height: fp.screen.height,
      devicePixelRatio: fp.screen.devicePixelRatio,
    },
    webgl: {
      vendor: fp.webgl.vendor,
      renderer: fp.webgl.renderer,
    },
    timezone: {
      id: fp.locale.timezone,
    },
    fonts: {
      families: fp.fonts,
    },
  }, null, 2);
}
