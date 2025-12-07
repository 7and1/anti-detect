/**
 * @anti-detect/consistency
 *
 * Cross-layer validation and scoring engine for Anti-detect.com
 *
 * This package provides:
 * - Consistency validation rules (hardware/OS, browser features, timezone/language, automation)
 * - Trust score calculation based on fingerprint data
 * - Recommendations for improving fingerprint quality
 */

// Main exports
export { ConsistencyEngine, defaultEngine, evaluateConsistency } from './engine';
export { calculateTrustScore, quickScore, getPresetWeights } from './scorer';

// Types
export type {
  ConsistencyRule,
  ConsistencyResult,
  ConsistencyReport,
  ValidationInput,
  RuleResult,
  ScoringWeights,
} from './types';
export { DEFAULT_WEIGHTS, DEFAULT_WEIGHT_PRESETS } from './types';

// Individual rule sets (for selective use)
export {
  hardwareOSRules,
  browserFeaturesRules,
  timezoneLanguageRules,
  automationRules,
  fontsOSRules,
} from './validators';
