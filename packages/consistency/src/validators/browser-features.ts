import type { ConsistencyRule, ValidationInput, RuleResult } from '../types';

/**
 * Browser feature consistency validation rules
 * Detect missing or suspicious browser capabilities
 */
export const browserFeaturesRules: ConsistencyRule[] = [
  {
    id: 'webgl-canvas-mismatch',
    name: 'WebGL/Canvas Mismatch',
    description: 'WebGL available but Canvas fingerprint missing or invalid',
    severity: 'warning',
    penalty: 5,
    category: 'browser-features',
    check: (data: ValidationInput): RuleResult => {
      const hasWebGL = data.fingerprint.webgl?.vendor && data.fingerprint.webgl.vendor !== 'Not available';
      const hasCanvas = data.fingerprint.canvas?.hash && data.fingerprint.canvas.hash !== 'not-available';

      if (hasWebGL && !hasCanvas) {
        return {
          passed: false,
          message: 'WebGL is available but Canvas fingerprint is missing',
          details: { webglVendor: data.fingerprint.webgl?.vendor, canvasHash: data.fingerprint.canvas?.hash },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'plugins-anomaly',
    name: 'Plugins Anomaly',
    description: 'Plugin configuration unusual for browser type',
    severity: 'info',
    penalty: 3,
    category: 'browser-features',
    check: (data: ValidationInput): RuleResult => {
      const pluginCount = data.fingerprint.plugins?.length || 0;
      const ua = data.fingerprint.navigator.userAgent;
      const isChrome = ua.includes('Chrome') && !ua.includes('Edge') && !ua.includes('OPR');
      const isFirefox = ua.includes('Firefox');

      // Chrome typically has 0-3 plugins (PDF Viewer variants)
      // Firefox deprecated plugins entirely
      if (isFirefox && pluginCount > 0) {
        return {
          passed: false,
          message: 'Firefox reports plugins, but Firefox deprecated navigator.plugins',
          details: { pluginCount, browser: 'Firefox' },
        };
      }

      // Very high plugin count is suspicious
      if (pluginCount > 10) {
        return {
          passed: false,
          message: `Unusually high plugin count: ${pluginCount}`,
          details: { pluginCount },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'languages-empty',
    name: 'Empty Languages Array',
    description: 'navigator.languages is empty or missing',
    severity: 'warning',
    penalty: 8,
    category: 'browser-features',
    check: (data: ValidationInput): RuleResult => {
      const languages = data.fingerprint.navigator.languages;

      if (!languages || languages.length === 0) {
        return {
          passed: false,
          message: 'navigator.languages is empty - unusual for real browsers',
          details: { languages },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'cookies-disabled',
    name: 'Cookies Disabled',
    description: 'Cookies are disabled which may indicate automation',
    severity: 'info',
    penalty: 2,
    category: 'browser-features',
    check: (data: ValidationInput): RuleResult => {
      if (!data.fingerprint.navigator.cookieEnabled) {
        return {
          passed: false,
          message: 'Cookies are disabled - may indicate automation or privacy mode',
          details: { cookieEnabled: false },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'canvas-noise-detected',
    name: 'Canvas Noise Detected',
    description: 'Canvas fingerprint protection is active',
    severity: 'info',
    penalty: 0,
    category: 'browser-features',
    check: (data: ValidationInput): RuleResult => {
      if (data.fingerprint.canvas?.isNoisyCanvas) {
        return {
          passed: false,
          message: 'Canvas fingerprint noise detected - privacy protection is active',
          details: { isNoisyCanvas: true },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'screen-resolution-common',
    name: 'Screen Resolution Check',
    description: 'Screen resolution should match common values',
    severity: 'info',
    penalty: 2,
    category: 'browser-features',
    check: (data: ValidationInput): RuleResult => {
      const { width, height } = data.fingerprint.screen;

      // Common desktop resolutions
      const commonDesktop = [
        [1920, 1080], [1366, 768], [1536, 864], [1440, 900], [1280, 720],
        [2560, 1440], [3840, 2160], [1680, 1050], [1280, 800], [1600, 900],
        [2560, 1600], [3440, 1440], [1920, 1200], [2880, 1800], [3072, 1920],
      ];

      // Common mobile resolutions
      const commonMobile = [
        [375, 812], [414, 896], [390, 844], [428, 926], [360, 640],
        [360, 780], [412, 915], [393, 873], [360, 800], [320, 568],
      ];

      const ua = data.fingerprint.navigator.userAgent;
      const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);

      const resolutions = isMobile ? commonMobile : commonDesktop;
      const isCommon = resolutions.some(([w, h]) => width === w && height === h);

      // Allow aspect ratios within reasonable range
      const aspectRatio = width / height;
      const isReasonableAspect = aspectRatio >= 1.0 && aspectRatio <= 2.5;

      if (!isCommon && !isReasonableAspect) {
        return {
          passed: false,
          message: `Unusual screen resolution: ${width}x${height}`,
          details: { width, height, aspectRatio },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'color-depth-check',
    name: 'Color Depth Check',
    description: 'Color depth should be standard value',
    severity: 'info',
    penalty: 2,
    category: 'browser-features',
    check: (data: ValidationInput): RuleResult => {
      const colorDepth = data.fingerprint.screen.colorDepth;
      const validDepths = [8, 15, 16, 24, 30, 32, 48];

      if (!validDepths.includes(colorDepth)) {
        return {
          passed: false,
          message: `Unusual color depth: ${colorDepth}`,
          details: { colorDepth },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'webgl-extensions-check',
    name: 'WebGL Extensions Check',
    description: 'WebGL extension count should be reasonable',
    severity: 'info',
    penalty: 2,
    category: 'browser-features',
    check: (data: ValidationInput): RuleResult => {
      const extensions = data.fingerprint.webgl?.extensions;

      if (!extensions) {
        return { passed: true, message: null };
      }

      // Real browsers typically have 20-50+ WebGL extensions
      if (extensions.length < 10 && data.fingerprint.webgl?.vendor !== 'Not available') {
        return {
          passed: false,
          message: `Low WebGL extension count: ${extensions.length} (expected 20+)`,
          details: { extensionCount: extensions.length },
        };
      }

      return { passed: true, message: null };
    },
  },
];
