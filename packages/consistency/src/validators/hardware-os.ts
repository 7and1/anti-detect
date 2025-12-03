import type { ConsistencyRule, ValidationInput, RuleResult } from '../types';

/**
 * Hardware vs OS consistency validation rules
 * These detect impossible combinations like Apple GPU on Windows
 */
export const hardwareOSRules: ConsistencyRule[] = [
  {
    id: 'gpu-os-mismatch',
    name: 'GPU/OS Mismatch',
    description: 'Apple GPU cannot run on Windows natively',
    severity: 'critical',
    penalty: 20,
    category: 'hardware-os',
    check: (data: ValidationInput): RuleResult => {
      const renderer = data.fingerprint.webgl?.unmaskedRenderer?.toLowerCase() || '';
      const vendor = data.fingerprint.webgl?.unmaskedVendor?.toLowerCase() || '';
      const ua = data.fingerprint.navigator.userAgent.toLowerCase();

      // Apple GPU on Windows
      const hasAppleGPU = renderer.includes('apple') || vendor.includes('apple');
      const claimsWindows = ua.includes('windows');

      if (hasAppleGPU && claimsWindows) {
        return {
          passed: false,
          message: 'Apple GPU hardware cannot run Windows natively',
          details: { renderer, vendor, os: 'Windows' },
        };
      }

      // AMD/NVIDIA on iOS (only Apple Silicon on real iOS)
      const claimsIOS = ua.includes('iphone') || ua.includes('ipad');
      const hasNonAppleGPU = renderer.includes('nvidia') || renderer.includes('amd') || renderer.includes('radeon') || renderer.includes('geforce');

      if (claimsIOS && hasNonAppleGPU) {
        return {
          passed: false,
          message: 'Non-Apple GPU cannot exist on iOS devices',
          details: { renderer, vendor, os: 'iOS' },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'platform-ua-mismatch',
    name: 'Platform/UA Mismatch',
    description: 'navigator.platform contradicts User-Agent',
    severity: 'critical',
    penalty: 20,
    category: 'hardware-os',
    check: (data: ValidationInput): RuleResult => {
      const platform = data.fingerprint.navigator.platform.toLowerCase();
      const ua = data.fingerprint.navigator.userAgent.toLowerCase();

      // Win32 platform but Mac UA
      if (platform.includes('win') && ua.includes('mac os x') && !ua.includes('windows')) {
        return {
          passed: false,
          message: 'Platform is Windows but UA claims Mac OS',
          details: { platform, userAgent: ua.slice(0, 100) },
        };
      }

      // Mac platform but Windows UA
      if ((platform.includes('mac') || platform === 'macintel') && ua.includes('windows') && !ua.includes('mac')) {
        return {
          passed: false,
          message: 'Platform is Mac but UA claims Windows',
          details: { platform, userAgent: ua.slice(0, 100) },
        };
      }

      // Linux platform but Windows/Mac UA
      if (platform.includes('linux') && !ua.includes('android') && (ua.includes('windows') || ua.includes('mac os x')) && !ua.includes('linux')) {
        return {
          passed: false,
          message: 'Platform is Linux but UA claims different OS',
          details: { platform, userAgent: ua.slice(0, 100) },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'suspicious-cores',
    name: 'Suspicious Core Count',
    description: 'Hardware concurrency too high for claimed device',
    severity: 'warning',
    penalty: 5,
    category: 'hardware-os',
    check: (data: ValidationInput): RuleResult => {
      const cores = data.fingerprint.navigator.hardwareConcurrency;
      const ua = data.fingerprint.navigator.userAgent;
      const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);

      if (isMobile && cores > 8) {
        return {
          passed: false,
          message: `Mobile device reports ${cores} CPU cores - unusually high`,
          details: { cores, deviceType: 'mobile' },
        };
      }

      if (!isMobile && cores > 64) {
        return {
          passed: false,
          message: `Desktop reports ${cores} CPU cores - server-level hardware`,
          details: { cores, deviceType: 'desktop' },
        };
      }

      if (cores === 0) {
        return {
          passed: false,
          message: 'Hardware concurrency is 0 - possible spoofing',
          details: { cores },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'touch-mismatch',
    name: 'Touch/Device Mismatch',
    description: 'Touch points inconsistent with device type',
    severity: 'warning',
    penalty: 5,
    category: 'hardware-os',
    check: (data: ValidationInput): RuleResult => {
      const touchPoints = data.fingerprint.navigator.maxTouchPoints;
      const ua = data.fingerprint.navigator.userAgent;
      const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);
      const isTablet = /iPad|Tablet/.test(ua);

      if (isMobile && touchPoints === 0) {
        return {
          passed: false,
          message: 'Mobile device reports no touch support',
          details: { touchPoints, deviceType: 'mobile' },
        };
      }

      if (isTablet && touchPoints === 0) {
        return {
          passed: false,
          message: 'Tablet device reports no touch support',
          details: { touchPoints, deviceType: 'tablet' },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'memory-mismatch',
    name: 'Memory/Device Mismatch',
    description: 'Device memory unusual for claimed device',
    severity: 'warning',
    penalty: 3,
    category: 'hardware-os',
    check: (data: ValidationInput): RuleResult => {
      const memory = data.fingerprint.navigator.deviceMemory;
      const ua = data.fingerprint.navigator.userAgent;
      const isMobile = /Mobile|Android|iPhone/.test(ua);

      if (memory === undefined) {
        return { passed: true, message: null };
      }

      if (isMobile && memory > 16) {
        return {
          passed: false,
          message: `Mobile device reports ${memory}GB RAM - unusually high`,
          details: { memory, deviceType: 'mobile' },
        };
      }

      if (!isMobile && memory < 2) {
        return {
          passed: false,
          message: `Desktop reports only ${memory}GB RAM - suspiciously low`,
          details: { memory, deviceType: 'desktop' },
        };
      }

      return { passed: true, message: null };
    },
  },

  {
    id: 'swiftshader-detection',
    name: 'SwiftShader Detection',
    description: 'SwiftShader indicates headless browser or virtual GPU',
    severity: 'critical',
    penalty: 15,
    category: 'hardware-os',
    check: (data: ValidationInput): RuleResult => {
      const renderer = (data.fingerprint.webgl?.unmaskedRenderer || data.fingerprint.webgl?.renderer || '').toLowerCase();

      if (renderer.includes('swiftshader') || renderer.includes('llvmpipe') || renderer.includes('virtualbox')) {
        return {
          passed: false,
          message: 'Software/Virtual GPU renderer detected (SwiftShader/LLVMpipe/VirtualBox)',
          details: { renderer },
        };
      }

      return { passed: true, message: null };
    },
  },
];
