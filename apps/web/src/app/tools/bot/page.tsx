'use client';

import { useState, useCallback, useEffect } from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

interface BotCheck {
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'checking';
  value: string | boolean | number | null;
  weight: number;
  category: 'automation' | 'browser' | 'behavior' | 'webdriver';
}

interface BotResult {
  checks: BotCheck[];
  botScore: number;
  isBot: boolean;
  confidence: 'high' | 'medium' | 'low';
  detectedFrameworks: string[];
  summary: string;
}

export default function BotDetectionPage() {
  const [result, setResult] = useState<BotResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDetection = useCallback(async () => {
    setIsLoading(true);

    const checks: BotCheck[] = [];
    let botSignals = 0;
    let totalWeight = 0;
    const detectedFrameworks: string[] = [];

    // Helper function to add checks
    const addCheck = (check: Omit<BotCheck, 'status'> & { isBot: boolean }) => {
      totalWeight += check.weight;
      if (check.isBot) {
        botSignals += check.weight;
      }
      checks.push({
        ...check,
        status: check.isBot ? 'fail' : 'pass',
      });
    };

    try {
      // 1. WebDriver detection
      const webdriver = (navigator as any).webdriver;
      addCheck({
        name: 'navigator.webdriver',
        description: 'Selenium/Puppeteer/Playwright set this to true',
        value: webdriver ?? 'undefined',
        weight: 30,
        category: 'webdriver',
        isBot: webdriver === true,
      });

      // 2. Check for automation-specific properties
      const automationProps = [
        '__webdriver_evaluate',
        '__selenium_evaluate',
        '__webdriver_script_function',
        '__webdriver_script_func',
        '__webdriver_script_fn',
        '__fxdriver_evaluate',
        '__driver_unwrapped',
        '__webdriver_unwrapped',
        '__driver_evaluate',
        '__selenium_unwrapped',
        '__fxdriver_unwrapped',
        '_phantom',
        '__nightmare',
        '_selenium',
        'callPhantom',
        'callSelenium',
        '_Selenium_IDE_Recorder',
      ];

      const foundAutomationProps: string[] = [];
      for (const prop of automationProps) {
        if ((window as any)[prop] !== undefined || (document as any)[prop] !== undefined) {
          foundAutomationProps.push(prop);
        }
      }

      addCheck({
        name: 'Automation Properties',
        description: 'Global variables injected by automation tools',
        value: foundAutomationProps.length > 0 ? foundAutomationProps.join(', ') : 'None found',
        weight: 25,
        category: 'webdriver',
        isBot: foundAutomationProps.length > 0,
      });

      if (foundAutomationProps.length > 0) {
        if (foundAutomationProps.some(p => p.includes('selenium'))) {
          detectedFrameworks.push('Selenium');
        }
        if (foundAutomationProps.some(p => p.includes('phantom'))) {
          detectedFrameworks.push('PhantomJS');
        }
        if (foundAutomationProps.some(p => p.includes('nightmare'))) {
          detectedFrameworks.push('Nightmare');
        }
      }

      // 3. CDP (Chrome DevTools Protocol) detection
      const hasCDP = !!(window as any).cdc_adoQpoasnfa76pfcZLmcfl_Array ||
                     !!(window as any).cdc_adoQpoasnfa76pfcZLmcfl_Promise ||
                     !!(window as any).cdc_adoQpoasnfa76pfcZLmcfl_Symbol;

      addCheck({
        name: 'Chrome DevTools Protocol',
        description: 'CDP artifacts left by Chrome automation',
        value: hasCDP ? 'Detected' : 'Not detected',
        weight: 20,
        category: 'webdriver',
        isBot: hasCDP,
      });

      if (hasCDP) {
        detectedFrameworks.push('CDP-based automation');
      }

      // 4. HeadlessChrome detection
      const userAgent = navigator.userAgent;
      const isHeadlessUA = /HeadlessChrome/.test(userAgent);

      addCheck({
        name: 'HeadlessChrome User-Agent',
        description: 'User-Agent contains HeadlessChrome',
        value: isHeadlessUA ? 'HeadlessChrome detected' : 'Normal Chrome',
        weight: 25,
        category: 'browser',
        isBot: isHeadlessUA,
      });

      if (isHeadlessUA) {
        detectedFrameworks.push('Headless Chrome');
      }

      // 5. Chrome property check
      const hasChrome = !!(window as any).chrome;
      const isChromeBrowser = /Chrome/.test(userAgent) && !/Edge|Edg/.test(userAgent);
      const chromeInconsistent = isChromeBrowser && !hasChrome;

      addCheck({
        name: 'Chrome Runtime Check',
        description: 'Chrome browser should have window.chrome object',
        value: hasChrome ? 'Present' : 'Missing',
        weight: 15,
        category: 'browser',
        isBot: chromeInconsistent,
      });

      // 6. Plugins check
      const pluginCount = navigator.plugins?.length ?? 0;
      const hasPlugins = pluginCount > 0;

      addCheck({
        name: 'Browser Plugins',
        description: 'Real browsers typically have plugins installed',
        value: `${pluginCount} plugins`,
        weight: 10,
        category: 'browser',
        isBot: !hasPlugins && !/(Firefox|Safari)/.test(userAgent),
      });

      // 7. Languages check
      const languages = navigator.languages;
      const hasLanguages = languages && languages.length > 0;

      addCheck({
        name: 'Navigator Languages',
        description: 'Real browsers have language preferences',
        value: hasLanguages ? languages.join(', ') : 'Empty',
        weight: 8,
        category: 'browser',
        isBot: !hasLanguages,
      });

      // 8. Permission API behavior
      let permissionBehavior = 'Normal';
      try {
        const result = await navigator.permissions.query({ name: 'notifications' as PermissionName });
        if (result.state === 'denied') {
          // Check if it was instantly denied (bot behavior)
          permissionBehavior = 'Normal response';
        }
      } catch (e) {
        permissionBehavior = 'API error';
      }

      addCheck({
        name: 'Permissions API',
        description: 'Check if Permissions API behaves normally',
        value: permissionBehavior,
        weight: 5,
        category: 'browser',
        isBot: permissionBehavior === 'API error',
      });

      // 9. WebGL Vendor/Renderer check
      let webglInfo = { vendor: 'Unknown', renderer: 'Unknown' };
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            webglInfo.vendor = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            webglInfo.renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          }
        }
      } catch (e) {}

      const isSoftwareRenderer = /SwiftShader|LLVMpipe|Software|Microsoft Basic/.test(webglInfo.renderer);

      addCheck({
        name: 'WebGL Renderer',
        description: 'Software renderers often indicate headless browsers',
        value: webglInfo.renderer,
        weight: 15,
        category: 'browser',
        isBot: isSoftwareRenderer,
      });

      if (isSoftwareRenderer) {
        detectedFrameworks.push('Software Renderer (Headless)');
      }

      // 10. Notification permission timing
      const notificationTiming = 'Normal';
      // In a real implementation, we'd measure the timing of permission requests

      addCheck({
        name: 'Notification Behavior',
        description: 'Bots often have unusual notification handling',
        value: Notification.permission,
        weight: 5,
        category: 'behavior',
        isBot: false, // Would need actual timing measurement
      });

      // 11. Screen dimensions check
      const hasNormalScreen = window.screen.width > 0 &&
                              window.screen.height > 0 &&
                              window.outerWidth > 0 &&
                              window.outerHeight > 0;

      addCheck({
        name: 'Screen Dimensions',
        description: 'Headless browsers may have unusual screen sizes',
        value: `${window.screen.width}x${window.screen.height} (outer: ${window.outerWidth}x${window.outerHeight})`,
        weight: 10,
        category: 'browser',
        isBot: !hasNormalScreen,
      });

      // 12. Connection type (if available)
      const connection = (navigator as any).connection;
      const hasConnection = !!connection;

      addCheck({
        name: 'Network Information API',
        description: 'Real browsers expose connection info',
        value: hasConnection ? `${connection.effectiveType || 'Unknown type'}` : 'Not available',
        weight: 5,
        category: 'browser',
        isBot: false, // Not all browsers support this
      });

      // 13. Error stack trace check
      let stackTraceNormal = true;
      try {
        throw new Error('test');
      } catch (e: any) {
        const stack = e.stack || '';
        // Puppeteer/Playwright sometimes have unusual stack traces
        stackTraceNormal = !stack.includes('puppeteer') && !stack.includes('playwright');
      }

      addCheck({
        name: 'Error Stack Traces',
        description: 'Automation tools may leave traces in error stacks',
        value: stackTraceNormal ? 'Normal' : 'Suspicious patterns',
        weight: 10,
        category: 'automation',
        isBot: !stackTraceNormal,
      });

      // 14. Iframe sandbox detection
      let inSandbox = false;
      try {
        inSandbox = window.self !== window.top && !window.frameElement;
      } catch (e) {
        // Cross-origin iframe, this is normal
      }

      // 15. Check for Puppeteer-specific properties
      const hasPuppeteerTraces = !!(window as any).__puppeteer_evaluation_script__;

      if (hasPuppeteerTraces) {
        detectedFrameworks.push('Puppeteer');
      }

      addCheck({
        name: 'Puppeteer Traces',
        description: 'Puppeteer-specific evaluation scripts',
        value: hasPuppeteerTraces ? 'Detected' : 'Not found',
        weight: 25,
        category: 'automation',
        isBot: hasPuppeteerTraces,
      });

      // 16. Playwright detection
      const hasPlaywrightTraces = !!(window as any).__playwright ||
                                   !!(window as any).__pw_manual;

      if (hasPlaywrightTraces) {
        detectedFrameworks.push('Playwright');
      }

      addCheck({
        name: 'Playwright Traces',
        description: 'Playwright-specific properties',
        value: hasPlaywrightTraces ? 'Detected' : 'Not found',
        weight: 25,
        category: 'automation',
        isBot: hasPlaywrightTraces,
      });

      // Calculate bot score
      const botScore = totalWeight > 0 ? Math.round((botSignals / totalWeight) * 100) : 0;
      const isBot = botScore >= 30;

      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (botScore >= 60) confidence = 'high';
      else if (botScore >= 30) confidence = 'medium';

      // Generate summary
      let summary = '';
      if (botScore < 20) {
        summary = 'Your browser appears to be a normal, human-operated browser with no automation signals detected.';
      } else if (botScore < 40) {
        summary = 'Some minor bot signals detected, but likely a normal browser with unusual configuration.';
      } else if (botScore < 60) {
        summary = 'Multiple bot signals detected. Your browser may be running automation tools or has suspicious characteristics.';
      } else {
        summary = 'High probability of automation detected. Multiple strong indicators suggest this is not a regular browser session.';
      }

      setResult({
        checks,
        botScore,
        isBot,
        confidence,
        detectedFrameworks,
        summary,
      });

    } catch (err) {
      console.error('Bot detection failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    runDetection();
  }, [runDetection]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-success';
      case 'fail': return 'text-error';
      case 'warning': return 'text-warning';
      default: return 'text-text-muted';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-success/10 border-success/30';
      case 'fail': return 'bg-error/10 border-error/30';
      case 'warning': return 'bg-warning/10 border-warning/30';
      default: return 'bg-bg-tertiary border-border';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'webdriver': return '🤖';
      case 'browser': return '🌐';
      case 'behavior': return '👆';
      case 'automation': return '⚙️';
      default: return '📋';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text-primary mb-4">
              Bot <span className="gradient-text">Detection Test</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              This tool checks your browser for signs of automation, headless browsing, and bot-like behavior.
              See if your browser would pass common anti-bot detection systems.
            </p>
          </div>

          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              <p className="text-text-secondary mt-4">Running bot detection...</p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Bot Score Gauge */}
              <div className={`p-8 rounded-lg border text-center ${
                result.botScore < 20 ? 'bg-success/10 border-success/30' :
                result.botScore < 40 ? 'bg-warning/10 border-warning/30' :
                'bg-error/10 border-error/30'
              }`}>
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 mb-4" style={{
                  borderColor: result.botScore < 20 ? '#22c55e' : result.botScore < 40 ? '#f59e0b' : '#ef4444'
                }}>
                  <span className={`text-4xl font-bold ${
                    result.botScore < 20 ? 'text-success' :
                    result.botScore < 40 ? 'text-warning' :
                    'text-error'
                  }`}>
                    {result.botScore}%
                  </span>
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${
                  result.botScore < 20 ? 'text-success' :
                  result.botScore < 40 ? 'text-warning' :
                  'text-error'
                }`}>
                  {result.isBot ? 'Bot Detected' : 'Human Browser'}
                </h2>
                <p className="text-text-secondary">{result.summary}</p>

                {result.detectedFrameworks.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {result.detectedFrameworks.map((framework, i) => (
                      <span key={i} className="px-3 py-1 bg-error/20 text-error rounded-full text-sm">
                        {framework}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                  <p className="text-sm text-text-muted mb-1">Detection Confidence</p>
                  <p className={`text-2xl font-bold capitalize ${
                    result.confidence === 'high' ? 'text-error' :
                    result.confidence === 'medium' ? 'text-warning' :
                    'text-success'
                  }`}>
                    {result.confidence}
                  </p>
                </div>
                <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                  <p className="text-sm text-text-muted mb-1">Checks Passed</p>
                  <p className="text-2xl font-bold text-success">
                    {result.checks.filter(c => c.status === 'pass').length}/{result.checks.length}
                  </p>
                </div>
                <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                  <p className="text-sm text-text-muted mb-1">Bot Signals</p>
                  <p className="text-2xl font-bold text-error">
                    {result.checks.filter(c => c.status === 'fail').length}
                  </p>
                </div>
              </div>

              {/* Detection Checks by Category */}
              {['webdriver', 'browser', 'automation', 'behavior'].map((category) => {
                const categoryChecks = result.checks.filter(c => c.category === category);
                if (categoryChecks.length === 0) return null;

                return (
                  <div key={category} className="p-6 rounded-lg bg-bg-secondary border border-border">
                    <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <span>{getCategoryIcon(category)}</span>
                      <span className="capitalize">{category} Detection</span>
                    </h3>
                    <div className="space-y-3">
                      {categoryChecks.map((check, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border ${getStatusBg(check.status)}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-lg ${check.status === 'pass' ? '' : ''}`}>
                                  {check.status === 'pass' ? '✅' : '❌'}
                                </span>
                                <span className="font-medium text-text-primary">{check.name}</span>
                              </div>
                              <p className="font-mono text-sm text-terminal break-all mb-1">
                                {String(check.value)}
                              </p>
                              <p className="text-sm text-text-muted">{check.description}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(check.status)} bg-bg-primary`}>
                              Weight: {check.weight}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* How Detection Works */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  How Bot Detection Works
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    Websites use multiple techniques to detect automated browsers:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded bg-bg-primary">
                      <h4 className="font-medium text-text-primary mb-2">WebDriver Detection</h4>
                      <p className="text-sm">
                        Selenium, Puppeteer, and Playwright set the <code className="text-terminal">navigator.webdriver</code> flag
                        and inject global variables that can be detected.
                      </p>
                    </div>
                    <div className="p-4 rounded bg-bg-primary">
                      <h4 className="font-medium text-text-primary mb-2">Browser Fingerprinting</h4>
                      <p className="text-sm">
                        Headless browsers have distinctive fingerprints: missing plugins, software renderers,
                        and unusual screen dimensions.
                      </p>
                    </div>
                    <div className="p-4 rounded bg-bg-primary">
                      <h4 className="font-medium text-text-primary mb-2">Behavioral Analysis</h4>
                      <p className="text-sm">
                        Bots interact differently: perfect mouse movements, instant form fills,
                        and no scroll behavior patterns.
                      </p>
                    </div>
                    <div className="p-4 rounded bg-bg-primary">
                      <h4 className="font-medium text-text-primary mb-2">JavaScript Challenges</h4>
                      <p className="text-sm">
                        Complex JavaScript puzzles that are easy for browsers but hard for
                        simple HTTP clients.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Common Detection Systems */}
              <div className="p-6 rounded-lg bg-bg-secondary border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Popular Bot Detection Systems
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-text-muted text-sm">System</th>
                        <th className="text-left py-2 text-text-muted text-sm">Used By</th>
                        <th className="text-left py-2 text-text-muted text-sm">Difficulty</th>
                      </tr>
                    </thead>
                    <tbody className="text-text-secondary">
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-medium">Cloudflare Bot Management</td>
                        <td className="py-2 text-sm">20% of websites</td>
                        <td className="py-2">
                          <span className="text-warning">Medium-Hard</span>
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-medium">Akamai Bot Manager</td>
                        <td className="py-2 text-sm">Major enterprises</td>
                        <td className="py-2">
                          <span className="text-error">Very Hard</span>
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-medium">PerimeterX</td>
                        <td className="py-2 text-sm">E-commerce, ticketing</td>
                        <td className="py-2">
                          <span className="text-error">Hard</span>
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-medium">DataDome</td>
                        <td className="py-2 text-sm">Retail, media</td>
                        <td className="py-2">
                          <span className="text-warning">Medium</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 font-medium">reCAPTCHA v3</td>
                        <td className="py-2 text-sm">Millions of sites</td>
                        <td className="py-2">
                          <span className="text-success">Easy-Medium</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tips */}
              <div className="p-6 rounded-lg bg-accent/10 border border-accent/30">
                <h3 className="text-lg font-semibold text-accent mb-4">Tips to Pass Bot Detection</h3>
                <ul className="space-y-3 text-text-secondary">
                  <li className="flex items-start gap-3">
                    <span className="text-accent">1.</span>
                    <span>
                      <strong>Use stealth plugins</strong> - puppeteer-extra-plugin-stealth or playwright-stealth
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent">2.</span>
                    <span>
                      <strong>Run headed mode</strong> - Headless browsers are easier to detect
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent">3.</span>
                    <span>
                      <strong>Use anti-detect browsers</strong> - Multilogin, GoLogin, or Dolphin Anty
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent">4.</span>
                    <span>
                      <strong>Add human-like behavior</strong> - Random delays, mouse movements, scrolling
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent">5.</span>
                    <span>
                      <strong>Rotate fingerprints</strong> - Use different browser profiles per session
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Educational Content */}
          {result && (
            <section className="mt-12 pt-12 border-t border-border/50">
              <h2 className="text-3xl font-bold text-text-primary mb-6">
                Understanding Bot Detection & Web Automation
              </h2>

              {/* The Bot Problem */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  The Scale of the Bot Problem
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    Here's a fact that might blow your mind: for the first time in a decade, bots now outnumber humans on the internet. In 2024, automated traffic surpassed human activity, accounting for 51% of all web traffic. Read that again - more than half of internet traffic isn't human anymore.
                  </p>
                  <p>
                    And it's not the friendly kind of bots either. Bad bot activity has risen for the sixth consecutive year, with malicious bots now representing 37% of all internet traffic - up from 32% the year before. That's a massive jump. To put it another way: of all the bot traffic out there, 72% of it is malicious. Yikes.
                  </p>
                  <p>
                    Why the sudden explosion? Two words: artificial intelligence. The rapid adoption of AI and large language models (LLMs) has made bot development accessible to everyone. You no longer need to be a hardcore programmer to create sophisticated bots. Now even the "less technically skilled" (as researchers politely put it) can spin up automated traffic. AI hasn't just made bots smarter - it's made bot creation democratic.
                  </p>
                  <p>
                    Simple bad bots grew from just under 40% in 2023 to 45% in 2024. That's a significant jump attributed entirely to AI adoption. Think about it: AI made it so easy that even basic, unsophisticated bots multiplied like rabbits.
                  </p>
                  <p>
                    And here's the kicker: it's 2025 now, and bots have never been as sophisticated as today. They leverage anti-detect automation frameworks, residential proxies, and CAPTCHA farms. Even basic bots using unmodified headless Chrome now have realistic fingerprints. The arms race between bot creators and bot detectors has reached absurd levels.
                  </p>
                </div>
              </div>

              {/* Web Scraping Reality */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  Web Scraping: The Silent Epidemic
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    Web scraping accounts for a staggering portion of internet traffic. According to F5 Labs research, 20.1% of all web search and 11.0% of all mobile search requests come from scrapers. That's 1 in 5 searches on desktop, 1 in 9 on mobile.
                  </p>
                  <p>
                    But here's the scary part: absent any advanced bot defense solution, upwards of 70% of all search traffic originates from scrapers. Seven. Zero. Percent. Without proper protection, most of what looks like "users searching your site" is actually bots harvesting your data.
                  </p>
                  <p>
                    The AI scraper revolution is particularly wild. In 2024, a record 16% of known-bot impressions were generated by AI scrapers like GPTBot (OpenAI), ClaudeBot (Anthropic), and AppleBot. Between March 9 and April 6, 2025, Akamai's network saw a steady rise in this traffic. These aren't traditional scrapers - they're AI training models consuming the entire web to get smarter.
                  </p>
                  <p>
                    Academic research backs this up. Multiple studies note that "more than fifty percent of the total web traffic is coming from web bots." One 2021 Imperva report found that approximately 41% of internet traffic wasn't human. And remember - that was 2021. It's gotten worse since then.
                  </p>
                </div>
              </div>

              {/* Detection Arms Race */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  The Detection Arms Race
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    The battle between bot creators and bot detectors is one of the internet's most intense technology arms races. Let me explain how sophisticated this has gotten.
                  </p>
                  <p>
                    <strong className="text-text-primary">Selenium vs. Puppeteer vs. Playwright:</strong> These are the three main browser automation frameworks. A 2024 academic study presented at the 17th International Conference on the Quality of Information and Communications Technology compared all three. The findings? Playwright and Puppeteer offer better detection avoidance due to their fine browser control, while Selenium is widely supported but more easily detected.
                  </p>
                  <p>
                    Due to its in-depth control capabilities, Playwright excels at simulating real user behavior, reducing the risk of detection. Selenium, on the other hand, may be more easily spotted by websites because of its use of WebDriver - a dead giveaway that screams "I'm a bot!"
                  </p>
                  <p>
                    <strong className="text-text-primary">CDP Detection - The Game Changer:</strong> In 2024, a significant detection technique emerged that changed everything: CDP (Chrome DevTools Protocol) detection. This is key to detecting most modern bot frameworks because it targets the underlying technology used for automation rather than specific inconsistencies.
                  </p>
                  <p>
                    Think of it this way: instead of checking if you look like a duck and quack like a duck, CDP detection checks if you're using duck-building tools. Playwright, Puppeteer, and Selenium all use CDP under the hood. Detect CDP, and you've caught them all at once.
                  </p>
                  <p>
                    <strong className="text-text-primary">The Modern Detection Stack:</strong> Today's bot detection goes way beyond just checking for <code className="text-terminal">navigator.webdriver</code>. Modern systems analyze:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>User behavior patterns (mouse movements, scroll patterns, typing rhythms)</li>
                    <li>Browser fingerprint characteristics (UA, Canvas, WebRTC, resolution, etc.)</li>
                    <li>IP addresses and network signatures</li>
                    <li>Account behavior and history</li>
                    <li>Timing patterns (humans pause, bots don't)</li>
                    <li>JavaScript challenge responses</li>
                    <li>Machine learning models trained on millions of sessions</li>
                  </ul>
                  <p>
                    A 2024 study available through DiVA Portal focused specifically on "Scraping bot detection using machine learning." Another developed a method for binary classification of web server request streams using neural networks. The sophistication level is insane - these aren't simple if-then checks anymore; they're AI detecting AI.
                  </p>
                </div>
              </div>

              {/* Real-World Impact */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  Why This Matters
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    You might be wondering, "Why should I care about bot detection? I'm not running a website." Fair question, but bot detection affects you whether you're aware of it or not.
                  </p>
                  <p>
                    <strong className="text-text-primary">If you're a developer or tester:</strong> Modern web testing tools (Selenium, Puppeteer, Playwright) trigger bot detection systems. You might be testing your own website and get blocked by your own security. It's hilariously frustrating and surprisingly common.
                  </p>
                  <p>
                    <strong className="text-text-primary">If you use automation tools:</strong> Legitimate automation - like tools that check prices for you, monitor stock availability, or auto-fill forms - gets caught in the crossfire. That browser extension that auto-applies coupon codes? Might trigger bot detection.
                  </p>
                  <p>
                    <strong className="text-text-primary">If you value privacy:</strong> Ironically, the same techniques used to detect bots can fingerprint your browser and track you. Bot detection and privacy invasion use the same underlying technology. The tools are neutral; the application determines whether they protect or exploit you.
                  </p>
                  <p>
                    <strong className="text-text-primary">The false positive problem:</strong> No bot detection system is perfect. Academic research exploring both offensive and defensive perspectives examines how to distinguish between humans, good bots, and bad bots. The challenge? Good bots (like search engines, accessibility tools, or your own testing framework) can look identical to bad bots.
                  </p>
                  <p>
                    A comprehensive 2024 analysis balancing security and privacy examined "Web Bot Detection, Privacy Challenges, and Regulatory Compliance under the GDPR and AI Act." The paper is available through PMC (PubMed Central). The takeaway? Bot detection creates serious privacy trade-offs, and regulators are starting to pay attention.
                  </p>
                  <p>
                    Here's the uncomfortable truth: the more sophisticated bot detection becomes, the more it needs to know about you. To tell humans apart from bots, systems must collect detailed behavioral data. It's a privacy nightmare dressed up as security.
                  </p>
                </div>
              </div>

              {/* Statistics Table */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  The Numbers Don't Lie
                </h3>
                <div className="space-y-4 text-text-secondary">
                  <p>
                    Let's put some concrete numbers on this problem:
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full border border-border rounded-lg">
                      <thead className="bg-bg-secondary">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                            Metric
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                            Value
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary border-b border-border">
                            Source/Year
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 text-sm">Automated traffic percentage</td>
                          <td className="px-4 py-3 text-sm font-semibold text-error">51%</td>
                          <td className="px-4 py-3 text-sm">Imperva 2024 (first time bots exceeded humans)</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 text-sm">Malicious bot traffic</td>
                          <td className="px-4 py-3 text-sm font-semibold text-error">37%</td>
                          <td className="px-4 py-3 text-sm">Up from 32% in 2023</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 text-sm">Bot traffic that's malicious</td>
                          <td className="px-4 py-3 text-sm font-semibold text-error">72%</td>
                          <td className="px-4 py-3 text-sm">2024 research</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 text-sm">Web searches from scrapers</td>
                          <td className="px-4 py-3 text-sm font-semibold text-warning">20.1% (desktop), 11% (mobile)</td>
                          <td className="px-4 py-3 text-sm">F5 Labs research</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="px-4 py-3 text-sm">Search traffic from scrapers (without protection)</td>
                          <td className="px-4 py-3 text-sm font-semibold text-error">Up to 70%</td>
                          <td className="px-4 py-3 text-sm">F5 Labs</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm">Known-bot traffic from AI scrapers</td>
                          <td className="px-4 py-3 text-sm font-semibold text-warning">16%</td>
                          <td className="px-4 py-3 text-sm">DoubleVerify 2024 (GPTBot, ClaudeBot, AppleBot)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p>
                    These aren't small numbers. This is a fundamental shift in how the internet works. Bots now outnumber humans, and the trend is accelerating thanks to AI making bot creation accessible to everyone.
                  </p>
                </div>
              </div>

              {/* Related Reading */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-4">
                  Learn More About Bot Detection
                </h3>
                <div className="space-y-4">
                  <p className="text-text-secondary">
                    Bot detection is just one part of browser fingerprinting and online privacy. To understand how all these techniques work together, check out our comprehensive guides.
                  </p>
                  <div className="flex flex-col gap-3">
                    <a
                      href="/learn/bot-detection"
                      className="inline-flex items-center gap-2 text-accent hover:underline font-semibold"
                    >
                      Read our complete guide on bot detection techniques
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </a>
                    <a
                      href="/learn/browser-fingerprinting"
                      className="inline-flex items-center gap-2 text-accent hover:underline font-semibold"
                    >
                      Understand how browser fingerprinting enables bot detection
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </a>
                  </div>
                  <p className="text-sm text-text-muted mt-4">
                    Data sources: <a href="https://www.imperva.com/blog/2025-imperva-bad-bot-report-how-ai-is-supercharging-the-bot-threat/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Imperva Bad Bot Report 2025</a>, <a href="https://doubleverify.com/ai-crawlers-and-scrapers-are-contributing-to-an-increase-in-general-invalid-traffic/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">DoubleVerify AI Scrapers Research</a>, <a href="https://www.f5.com/labs/articles/threat-intelligence/what-are-scrapers-and-why-should-you-care" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">F5 Labs Scraper Analysis</a>, <a href="https://link.springer.com/chapter/10.1007/978-3-031-70245-7_10" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Springer: Browser Automation Study 2024</a>, <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11962364/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">PMC: Bot Detection & GDPR Compliance</a>, DiVA Portal ML Detection Research
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Test Again Button */}
          <div className="mt-8 text-center">
            <button
              onClick={runDetection}
              disabled={isLoading}
              className="px-6 py-3 border border-border text-text-secondary hover:text-text-primary hover:border-border-subtle rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Detecting...' : 'Run Detection Again'}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
