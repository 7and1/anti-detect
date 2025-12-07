import type {
  FingerprintData,
  TrustScore,
  LayerResults,
  LayerScore,
  CheckResult,
  CheckStatus,
  Grade,
  Issue,
  IPAnalysis,
} from '@anti-detect/types';
import { ConsistencyEngine, evaluateConsistency } from './engine';
import type { ValidationInput, ScoringWeights } from './types';
import { DEFAULT_WEIGHTS, DEFAULT_WEIGHT_PRESETS } from './types';

/**
 * Calculate Trust Score from fingerprint data
 */
export function calculateTrustScore(
  fingerprint: FingerprintData,
  ipInfo?: IPAnalysis,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): TrustScore {
  // Calculate individual layer scores
  const layers = calculateLayerScores(fingerprint, ipInfo);

  // Run consistency checks
  const consistencyReport = evaluateConsistency({ fingerprint, ipInfo });

  // Calculate overall score
  let overall = 100;

  // Apply layer weights
  for (const [key, layer] of Object.entries(layers)) {
    const weight = weights[key as keyof ScoringWeights];
    if (weight) {
      const layerPenalty = (100 - layer.score) * weight;
      overall -= layerPenalty;
    }
  }

  // Apply consistency penalties
  overall -= consistencyReport.totalPenalty;

  // Clamp to 0-100
  overall = Math.max(0, Math.min(100, Math.round(overall)));

  // Calculate grade
  const grade = scoreToGrade(overall);

  // Collect issues
  const criticalIssues: Issue[] = [];
  const warnings: Issue[] = [];

  // From layer checks
  for (const [layerName, layer] of Object.entries(layers)) {
    for (const check of layer.checks) {
      if (check.status === 'fail') {
        criticalIssues.push({
          layer: layerName,
          check: check.id,
          message: check.message || `${check.name} failed`,
          severity: 'critical',
        });
      } else if (check.status === 'warn') {
        warnings.push({
          layer: layerName,
          check: check.id,
          message: check.message || `${check.name} warning`,
          severity: 'warning',
        });
      }
    }
  }

  // From consistency checks
  for (const failure of consistencyReport.criticalFailures) {
    criticalIssues.push({
      layer: failure.category,
      check: failure.id,
      message: failure.message || failure.name,
      severity: 'critical',
    });
  }

  for (const warning of consistencyReport.warnings) {
    warnings.push({
      layer: warning.category,
      check: warning.id,
      message: warning.message || warning.name,
      severity: 'warning',
    });
  }

  // Generate recommendations
  const recommendations = generateRecommendations(criticalIssues, warnings);

  return {
    overall,
    grade,
    layers,
    consistencyChecks: consistencyReport.allResults,
    criticalIssues,
    warnings,
    recommendations,
  };
}

export function getPresetWeights(id: string): ScoringWeights | null {
  const preset = DEFAULT_WEIGHT_PRESETS.find((p) => p.id === id);
  return preset ? preset.weights : null;
}

/**
 * Calculate scores for each detection layer
 */
function calculateLayerScores(
  fingerprint: FingerprintData,
  ipInfo?: IPAnalysis
): LayerResults {
  return {
    network: calculateNetworkScore(fingerprint, ipInfo),
    navigator: calculateNavigatorScore(fingerprint),
    graphics: calculateGraphicsScore(fingerprint),
    audio: calculateAudioScore(fingerprint),
    fonts: calculateFontsScore(fingerprint),
    locale: calculateLocaleScore(fingerprint),
    automation: calculateAutomationScore(fingerprint),
  };
}

/**
 * Network Layer Score (IP, WebRTC, DNS)
 */
function calculateNetworkScore(
  fingerprint: FingerprintData,
  ipInfo?: IPAnalysis
): LayerScore {
  const checks: CheckResult[] = [];
  let score = 100;

  // WebRTC Leak Check
  if (fingerprint.webrtc) {
    const hasLeak = fingerprint.webrtc.hasLeak;
    checks.push({
      id: 'webrtc-leak',
      name: 'WebRTC Leak',
      status: hasLeak ? 'fail' : 'pass',
      value: hasLeak,
      message: hasLeak ? 'WebRTC is leaking your real IP' : undefined,
    });
    if (hasLeak) score -= 25;
  }

  // IP Type Check
  if (ipInfo) {
    const isProxy = ipInfo.isProxy || ipInfo.isVPN;
    checks.push({
      id: 'ip-type',
      name: 'IP Type',
      status: isProxy ? 'warn' : 'pass',
      value: ipInfo.ipType,
      message: isProxy ? `IP detected as ${ipInfo.ipType}` : undefined,
    });
    if (ipInfo.isProxy) score -= 15;
    if (ipInfo.isVPN) score -= 10;
    if (ipInfo.isTor) score -= 20;

    // Blacklist Check
    if (ipInfo.blacklistStatus?.listed) {
      checks.push({
        id: 'blacklist',
        name: 'Blacklist Status',
        status: 'fail',
        value: true,
        message: `IP is blacklisted on ${ipInfo.blacklistStatus.lists.length} lists`,
      });
      score -= 20;
    }
  }

  const status = score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail';

  return {
    score: Math.max(0, score),
    weight: 0.20,
    checks,
    status,
  };
}

/**
 * Navigator Layer Score (UA, Platform, etc.)
 */
function calculateNavigatorScore(fingerprint: FingerprintData): LayerScore {
  const checks: CheckResult[] = [];
  let score = 100;

  const nav = fingerprint.navigator;

  // User Agent Check
  checks.push({
    id: 'user-agent',
    name: 'User Agent',
    status: 'pass',
    value: nav.userAgent.slice(0, 50) + '...',
  });

  // Platform Check
  checks.push({
    id: 'platform',
    name: 'Platform',
    status: 'pass',
    value: nav.platform,
  });

  // Languages Check
  if (!nav.languages || nav.languages.length === 0) {
    checks.push({
      id: 'languages',
      name: 'Languages',
      status: 'fail',
      value: 'Empty',
      message: 'No languages configured',
    });
    score -= 15;
  } else {
    checks.push({
      id: 'languages',
      name: 'Languages',
      status: 'pass',
      value: nav.languages.slice(0, 3).join(', '),
    });
  }

  // Hardware Concurrency
  if (nav.hardwareConcurrency === 0) {
    checks.push({
      id: 'hardware-concurrency',
      name: 'CPU Cores',
      status: 'warn',
      value: 0,
      message: 'Hardware concurrency is 0',
    });
    score -= 10;
  } else {
    checks.push({
      id: 'hardware-concurrency',
      name: 'CPU Cores',
      status: 'pass',
      value: nav.hardwareConcurrency,
    });
  }

  // Device Memory
  if (nav.deviceMemory) {
    checks.push({
      id: 'device-memory',
      name: 'Device Memory',
      status: 'pass',
      value: `${nav.deviceMemory}GB`,
    });
  }

  const status = score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail';

  return {
    score: Math.max(0, score),
    weight: 0.15,
    checks,
    status,
  };
}

/**
 * Graphics Layer Score (Canvas, WebGL)
 */
function calculateGraphicsScore(fingerprint: FingerprintData): LayerScore {
  const checks: CheckResult[] = [];
  let score = 100;

  // Canvas Check
  if (fingerprint.canvas) {
    const isNoisy = fingerprint.canvas.isNoisyCanvas;
    checks.push({
      id: 'canvas-fingerprint',
      name: 'Canvas Fingerprint',
      status: isNoisy ? 'warn' : 'pass',
      value: fingerprint.canvas.hash.slice(0, 16) + '...',
      message: isNoisy ? 'Canvas noise detected' : undefined,
    });
    if (isNoisy) score -= 5; // Canvas protection is not necessarily bad
  }

  // WebGL Check
  if (fingerprint.webgl) {
    const vendor = fingerprint.webgl.unmaskedVendor || fingerprint.webgl.vendor;
    const renderer = fingerprint.webgl.unmaskedRenderer || fingerprint.webgl.renderer;

    checks.push({
      id: 'webgl-vendor',
      name: 'WebGL Vendor',
      status: 'pass',
      value: vendor,
    });

    // Check for suspicious renderers
    const isSwiftShader = renderer.toLowerCase().includes('swiftshader');
    const isLLVMpipe = renderer.toLowerCase().includes('llvmpipe');

    checks.push({
      id: 'webgl-renderer',
      name: 'WebGL Renderer',
      status: isSwiftShader || isLLVMpipe ? 'fail' : 'pass',
      value: renderer,
      message: isSwiftShader ? 'SwiftShader detected (headless indicator)' :
               isLLVMpipe ? 'LLVMpipe detected (software renderer)' : undefined,
    });

    if (isSwiftShader || isLLVMpipe) score -= 30;
  }

  const status = score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail';

  return {
    score: Math.max(0, score),
    weight: 0.20,
    checks,
    status,
  };
}

/**
 * Audio Layer Score
 */
function calculateAudioScore(fingerprint: FingerprintData): LayerScore {
  const checks: CheckResult[] = [];
  let score = 100;

  if (fingerprint.audio) {
    const hash = fingerprint.audio.hash;
    const isError = hash === 'error' || hash === 'not-available';

    checks.push({
      id: 'audio-fingerprint',
      name: 'Audio Fingerprint',
      status: isError ? 'warn' : 'pass',
      value: isError ? 'Not available' : hash.slice(0, 16) + '...',
      message: isError ? 'Audio fingerprint not available' : undefined,
    });

    if (isError) score -= 10;
  }

  const status = score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail';

  return {
    score: Math.max(0, score),
    weight: 0.10,
    checks,
    status,
  };
}

/**
 * Fonts Layer Score
 */
function calculateFontsScore(fingerprint: FingerprintData): LayerScore {
  const checks: CheckResult[] = [];
  let score = 100;

  const fonts = fingerprint.fonts;

  checks.push({
    id: 'fonts-count',
    name: 'Fonts Count',
    status: fonts.count < 10 ? 'warn' : 'pass',
    value: fonts.count,
    message: fonts.count < 10 ? 'Low font count detected' : undefined,
  });

  if (fonts.count < 10) score -= 15;

  checks.push({
    id: 'fonts-hash',
    name: 'Fonts Hash',
    status: 'pass',
    value: fonts.hash.slice(0, 16) + '...',
  });

  const status = score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail';

  return {
    score: Math.max(0, score),
    weight: 0.10,
    checks,
    status,
  };
}

/**
 * Locale Layer Score (Timezone, Language)
 */
function calculateLocaleScore(fingerprint: FingerprintData): LayerScore {
  const checks: CheckResult[] = [];
  let score = 100;

  const tz = fingerprint.timezone;

  checks.push({
    id: 'timezone',
    name: 'Timezone',
    status: tz.name === 'Unknown' ? 'warn' : 'pass',
    value: tz.name,
    message: tz.name === 'Unknown' ? 'Timezone could not be detected' : undefined,
  });

  if (tz.name === 'Unknown') score -= 10;

  checks.push({
    id: 'timezone-offset',
    name: 'Timezone Offset',
    status: 'pass',
    value: `UTC${tz.offset >= 0 ? '-' : '+'}${Math.abs(tz.offset / 60)}`,
  });

  checks.push({
    id: 'language',
    name: 'Language',
    status: 'pass',
    value: fingerprint.navigator.language,
  });

  const status = score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail';

  return {
    score: Math.max(0, score),
    weight: 0.10,
    checks,
    status,
  };
}

/**
 * Automation Layer Score
 */
function calculateAutomationScore(fingerprint: FingerprintData): LayerScore {
  const checks: CheckResult[] = [];
  let score = 100;

  const auto = fingerprint.automation;

  // WebDriver
  checks.push({
    id: 'webdriver',
    name: 'WebDriver Flag',
    status: auto.webdriver ? 'fail' : 'pass',
    value: auto.webdriver,
    message: auto.webdriver ? 'Automation detected via navigator.webdriver' : undefined,
  });
  if (auto.webdriver) score -= 30;

  // CDP Traces
  checks.push({
    id: 'cdp-traces',
    name: 'CDP Traces',
    status: auto.cdpTraces ? 'fail' : 'pass',
    value: auto.cdpTraces,
    message: auto.cdpTraces ? 'Chrome DevTools Protocol traces detected' : undefined,
  });
  if (auto.cdpTraces) score -= 30;

  // Selenium
  checks.push({
    id: 'selenium',
    name: 'Selenium',
    status: auto.selenium ? 'fail' : 'pass',
    value: auto.selenium,
    message: auto.selenium ? 'Selenium WebDriver detected' : undefined,
  });
  if (auto.selenium) score -= 30;

  // Puppeteer
  if (auto.puppeteer) {
    checks.push({
      id: 'puppeteer',
      name: 'Puppeteer',
      status: 'fail',
      value: true,
      message: 'Puppeteer automation detected',
    });
    score -= 25;
  }

  // Playwright
  if (auto.playwright) {
    checks.push({
      id: 'playwright',
      name: 'Playwright',
      status: 'fail',
      value: true,
      message: 'Playwright automation detected',
    });
    score -= 25;
  }

  // PhantomJS
  if (auto.phantomJS) {
    checks.push({
      id: 'phantom',
      name: 'PhantomJS',
      status: 'fail',
      value: true,
      message: 'PhantomJS detected',
    });
    score -= 30;
  }

  const status = score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail';

  return {
    score: Math.max(0, score),
    weight: 0.15,
    checks,
    status,
  };
}

/**
 * Convert numeric score to letter grade
 */
function scoreToGrade(score: number): Grade {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

/**
 * Generate recommendations based on issues
 */
function generateRecommendations(criticalIssues: Issue[], warnings: Issue[]): string[] {
  const recommendations: string[] = [];

  // Check for automation issues
  const hasAutomation = criticalIssues.some(
    (i) => ['webdriver', 'cdp-traces', 'selenium', 'puppeteer', 'playwright'].includes(i.check)
  );
  if (hasAutomation) {
    recommendations.push('Use an anti-detect browser like Multilogin to mask automation signatures');
    recommendations.push('Consider using undetected-chromedriver or playwright-stealth');
  }

  // Check for WebRTC leak
  const hasWebRTCLeak = criticalIssues.some((i) => i.check === 'webrtc-leak');
  if (hasWebRTCLeak) {
    recommendations.push('Disable WebRTC in your browser or use a browser extension');
    recommendations.push('Configure your VPN to prevent WebRTC leaks');
  }

  // Check for GPU issues
  const hasGPUIssue = criticalIssues.some((i) => i.check.includes('webgl') || i.check.includes('swiftshader'));
  if (hasGPUIssue) {
    recommendations.push('Use a real GPU instead of software rendering');
    recommendations.push('Run browser in non-headless mode with GPU acceleration');
  }

  // Check for timezone/locale issues
  const hasLocaleIssue = warnings.some((i) => i.layer === 'timezone-language');
  if (hasLocaleIssue) {
    recommendations.push('Configure timezone and language to match your proxy/VPN location');
  }

  // Check for font issues
  const hasFontIssue = warnings.some((i) => i.check.includes('font'));
  if (hasFontIssue) {
    recommendations.push('Install fonts appropriate for your claimed operating system');
  }

  return recommendations;
}

/**
 * Quick score calculation (returns just the number)
 */
export function quickScore(fingerprint: FingerprintData, ipInfo?: IPAnalysis): number {
  return calculateTrustScore(fingerprint, ipInfo).overall;
}
