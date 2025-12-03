import type { ConsistencyRule, ValidationInput, RuleResult } from '../types';

// Windows-specific fonts
const WINDOWS_FONTS = [
  'Segoe UI',
  'Calibri',
  'Cambria',
  'Consolas',
  'Candara',
  'Constantia',
  'Corbel',
  'Microsoft YaHei',
  'Microsoft JhengHei',
  'Malgun Gothic',
  'Meiryo',
  'Segoe UI Symbol',
  'Segoe UI Emoji',
  'Ebrima',
  'Gadugi',
  'Leelawadee UI',
  'Nirmala UI',
  'Yu Gothic',
  'MS Gothic',
  'MS PGothic',
];

// macOS-specific fonts
const MACOS_FONTS = [
  'SF Pro',
  'SF Pro Display',
  'SF Pro Text',
  'SF Mono',
  'SF Compact',
  'Helvetica Neue',
  'Apple Color Emoji',
  'Apple SD Gothic Neo',
  'Apple Symbols',
  'AppleMyungjo',
  'Avenir',
  'Avenir Next',
  'Baskerville',
  'Futura',
  'Geneva',
  'Gill Sans',
  'Helvetica',
  'Hoefler Text',
  'Lucida Grande',
  'Menlo',
  'Monaco',
  'Optima',
  'Palatino',
  'San Francisco',
  'Skia',
  'Zapfino',
];

// Linux-specific fonts
const LINUX_FONTS = [
  'Ubuntu',
  'Ubuntu Mono',
  'DejaVu Sans',
  'DejaVu Sans Mono',
  'DejaVu Serif',
  'Liberation Sans',
  'Liberation Mono',
  'Liberation Serif',
  'Noto Sans',
  'Noto Serif',
  'Droid Sans',
  'Droid Sans Mono',
  'FreeSans',
  'FreeSerif',
  'FreeMono',
  'Cantarell',
  'Oxygen',
  'Nimbus Sans',
];

/**
 * Font vs OS consistency validation rules
 */
export const fontsOSRules: ConsistencyRule[] = [
  {
    id: 'fonts-os-mismatch',
    name: 'Fonts/OS Mismatch',
    description: 'Installed fonts inconsistent with claimed OS',
    severity: 'warning',
    penalty: 10,
    category: 'hardware-os',
    check: (data: ValidationInput): RuleResult => {
      const fonts = data.fingerprint.fonts.detected;
      const ua = data.fingerprint.navigator.userAgent;

      const isMac = ua.includes('Mac OS X') && !ua.includes('Windows');
      const isWindows = ua.includes('Windows') && !ua.includes('Mac');
      const isLinux = ua.includes('Linux') && !ua.includes('Android');

      // Check for OS-specific fonts
      const hasWindowsFonts = fonts.some((f) => WINDOWS_FONTS.includes(f));
      const hasMacFonts = fonts.some((f) => MACOS_FONTS.includes(f));
      const hasLinuxFonts = fonts.some((f) => LINUX_FONTS.includes(f));

      // Mac claiming to have Windows fonts without Mac fonts
      if (isMac && hasWindowsFonts && !hasMacFonts) {
        return {
          passed: false,
          message: 'Mac OS detected Windows-specific fonts but no Mac fonts',
          details: {
            claimedOS: 'macOS',
            windowsFonts: fonts.filter((f) => WINDOWS_FONTS.includes(f)),
            macFonts: fonts.filter((f) => MACOS_FONTS.includes(f)),
          },
        };
      }

      // Windows claiming to have Mac fonts without Windows fonts
      if (isWindows && hasMacFonts && !hasWindowsFonts) {
        return {
          passed: false,
          message: 'Windows detected Mac-specific fonts but no Windows fonts',
          details: {
            claimedOS: 'Windows',
            macFonts: fonts.filter((f) => MACOS_FONTS.includes(f)),
            windowsFonts: fonts.filter((f) => WINDOWS_FONTS.includes(f)),
          },
        };
      }

      // Linux claiming to have Windows/Mac fonts
      if (isLinux && (hasWindowsFonts || hasMacFonts) && !hasLinuxFonts) {
        return {
          passed: false,
          message: 'Linux detected OS-specific fonts from other platforms',
          details: {
            claimedOS: 'Linux',
            windowsFonts: fonts.filter((f) => WINDOWS_FONTS.includes(f)),
            macFonts: fonts.filter((f) => MACOS_FONTS.includes(f)),
            linuxFonts: fonts.filter((f) => LINUX_FONTS.includes(f)),
          },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'fonts-count-anomaly',
    name: 'Font Count Anomaly',
    description: 'Font count too low or too high',
    severity: 'info',
    penalty: 3,
    category: 'browser-features',
    check: (data: ValidationInput): RuleResult => {
      const fontCount = data.fingerprint.fonts.count;

      // Most systems have 20-200 fonts
      if (fontCount < 5) {
        return {
          passed: false,
          message: `Very few fonts detected: ${fontCount} (expected 20+)`,
          details: { fontCount },
        };
      }

      if (fontCount > 500) {
        return {
          passed: false,
          message: `Unusually high font count: ${fontCount} (expected <300)`,
          details: { fontCount },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'system-fonts-missing',
    name: 'System Fonts Missing',
    description: 'Expected system fonts are missing',
    severity: 'warning',
    penalty: 5,
    category: 'browser-features',
    check: (data: ValidationInput): RuleResult => {
      const fonts = data.fingerprint.fonts.detected;

      // Universal fonts that should exist on all systems
      const universalFonts = ['Arial', 'Times New Roman', 'Courier New', 'Verdana'];
      const hasUniversal = universalFonts.some((f) => fonts.includes(f));

      if (!hasUniversal && fonts.length > 0) {
        return {
          passed: false,
          message: 'Missing common system fonts (Arial, Times New Roman)',
          details: {
            expectedFonts: universalFonts,
            detectedFonts: fonts.slice(0, 10),
          },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'emoji-font-check',
    name: 'Emoji Font Check',
    description: 'Check for appropriate emoji font for OS',
    severity: 'info',
    penalty: 2,
    category: 'browser-features',
    check: (data: ValidationInput): RuleResult => {
      const fonts = data.fingerprint.fonts.detected;
      const ua = data.fingerprint.navigator.userAgent;

      const isMac = ua.includes('Mac OS X');
      const isWindows = ua.includes('Windows');

      // Mac should have Apple Color Emoji
      if (isMac && !fonts.some((f) => f.includes('Apple') && f.includes('Emoji'))) {
        return {
          passed: false,
          message: 'Mac OS missing Apple Color Emoji font',
          details: { expectedFont: 'Apple Color Emoji' },
        };
      }

      // Windows should have Segoe UI Emoji
      if (isWindows && !fonts.some((f) => f.includes('Segoe UI Emoji') || f.includes('Segoe UI Symbol'))) {
        return {
          passed: false,
          message: 'Windows missing Segoe UI Emoji font',
          details: { expectedFont: 'Segoe UI Emoji' },
        };
      }

      return { passed: true, message: null };
    },
  },
];
