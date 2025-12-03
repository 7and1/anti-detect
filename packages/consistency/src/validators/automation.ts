import type { ConsistencyRule, ValidationInput, RuleResult } from '../types';

/**
 * Automation detection validation rules
 * Detect headless browsers, bots, and automation frameworks
 */
export const automationRules: ConsistencyRule[] = [
  {
    id: 'webdriver-detected',
    name: 'WebDriver Detected',
    description: 'navigator.webdriver flag is true',
    severity: 'critical',
    penalty: 25,
    category: 'automation',
    check: (data: ValidationInput): RuleResult => {
      if (data.fingerprint.automation.webdriver) {
        return {
          passed: false,
          message: 'navigator.webdriver flag is true - automation detected',
          details: { webdriver: true },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'cdp-traces-detected',
    name: 'CDP Traces Detected',
    description: 'Chrome DevTools Protocol traces found',
    severity: 'critical',
    penalty: 25,
    category: 'automation',
    check: (data: ValidationInput): RuleResult => {
      if (data.fingerprint.automation.cdpTraces) {
        return {
          passed: false,
          message: 'Chrome DevTools Protocol traces detected',
          details: { cdpTraces: true },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'selenium-detected',
    name: 'Selenium Detected',
    description: 'Selenium WebDriver signatures found',
    severity: 'critical',
    penalty: 25,
    category: 'automation',
    check: (data: ValidationInput): RuleResult => {
      if (data.fingerprint.automation.selenium) {
        return {
          passed: false,
          message: 'Selenium WebDriver signatures detected',
          details: { selenium: true },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'puppeteer-detected',
    name: 'Puppeteer Detected',
    description: 'Puppeteer automation signatures found',
    severity: 'critical',
    penalty: 20,
    category: 'automation',
    check: (data: ValidationInput): RuleResult => {
      if (data.fingerprint.automation.puppeteer) {
        return {
          passed: false,
          message: 'Puppeteer automation signatures detected',
          details: { puppeteer: true },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'playwright-detected',
    name: 'Playwright Detected',
    description: 'Playwright automation signatures found',
    severity: 'critical',
    penalty: 20,
    category: 'automation',
    check: (data: ValidationInput): RuleResult => {
      if (data.fingerprint.automation.playwright) {
        return {
          passed: false,
          message: 'Playwright automation signatures detected',
          details: { playwright: true },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'phantom-detected',
    name: 'PhantomJS Detected',
    description: 'PhantomJS headless browser detected',
    severity: 'critical',
    penalty: 25,
    category: 'automation',
    check: (data: ValidationInput): RuleResult => {
      if (data.fingerprint.automation.phantomJS) {
        return {
          passed: false,
          message: 'PhantomJS headless browser detected',
          details: { phantomJS: true },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'chrome-runtime-missing',
    name: 'Chrome Runtime Missing',
    description: 'Chrome browser missing chrome.runtime API',
    severity: 'warning',
    penalty: 10,
    category: 'automation',
    check: (data: ValidationInput): RuleResult => {
      const ua = data.fingerprint.navigator.userAgent;
      const isChrome = ua.includes('Chrome') && !ua.includes('Edge') && !ua.includes('OPR');

      if (isChrome && !data.fingerprint.automation.chromeRuntime) {
        return {
          passed: false,
          message: 'Chrome browser missing chrome.runtime API - possible headless',
          details: { chromeRuntime: false, browser: 'Chrome' },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'headless-ua',
    name: 'Headless User-Agent',
    description: 'User-Agent contains Headless indicator',
    severity: 'critical',
    penalty: 25,
    category: 'automation',
    check: (data: ValidationInput): RuleResult => {
      const ua = data.fingerprint.navigator.userAgent.toLowerCase();

      if (ua.includes('headless')) {
        return {
          passed: false,
          message: 'User-Agent contains "Headless" indicator',
          details: { userAgent: data.fingerprint.navigator.userAgent.slice(0, 100) },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'nightmare-detected',
    name: 'NightmareJS Detected',
    description: 'NightmareJS automation signatures found',
    severity: 'critical',
    penalty: 20,
    category: 'automation',
    check: (data: ValidationInput): RuleResult => {
      if (data.fingerprint.automation.nightmareJS) {
        return {
          passed: false,
          message: 'NightmareJS automation signatures detected',
          details: { nightmareJS: true },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'webrtc-disabled-suspicion',
    name: 'WebRTC Disabled Suspicion',
    description: 'WebRTC disabled may indicate privacy tool or automation',
    severity: 'info',
    penalty: 0,
    category: 'automation',
    check: (data: ValidationInput): RuleResult => {
      if (!data.fingerprint.webrtc || (data.fingerprint.webrtc.localIPs.length === 0 && !data.fingerprint.webrtc.hasLeak)) {
        // This is actually good for privacy - just informational
        return {
          passed: true,
          message: 'WebRTC is disabled or protected - this is good for privacy',
          details: { webrtcProtected: true },
        };
      }

      return { passed: true, message: null };
    },
  },
];
