import type {
  ConsistencyRule,
  ConsistencyResult,
  ConsistencyReport,
  ValidationInput,
} from './types';
import {
  hardwareOSRules,
  browserFeaturesRules,
  timezoneLanguageRules,
  automationRules,
  fontsOSRules,
} from './validators';

/**
 * All validation rules combined
 */
const ALL_RULES: ConsistencyRule[] = [
  ...hardwareOSRules,
  ...browserFeaturesRules,
  ...timezoneLanguageRules,
  ...automationRules,
  ...fontsOSRules,
];

/**
 * Consistency Engine - runs all validation rules against fingerprint data
 */
export class ConsistencyEngine {
  private rules: ConsistencyRule[];

  constructor(rules?: ConsistencyRule[]) {
    this.rules = rules || ALL_RULES;
  }

  /**
   * Evaluate all consistency rules
   */
  evaluate(input: ValidationInput): ConsistencyReport {
    const results: ConsistencyResult[] = [];
    let totalPenalty = 0;

    for (const rule of this.rules) {
      try {
        const result = rule.check(input);

        const consistencyResult: ConsistencyResult = {
          id: rule.id,
          name: rule.name,
          passed: result.passed,
          severity: rule.severity,
          penalty: result.passed ? 0 : rule.penalty,
          message: result.message,
          category: rule.category,
        };

        results.push(consistencyResult);

        if (!result.passed) {
          totalPenalty += rule.penalty;
        }
      } catch (error) {
        // Rule evaluation failed - treat as passed with note
        results.push({
          id: rule.id,
          name: rule.name,
          passed: true,
          severity: 'info',
          penalty: 0,
          message: `Rule evaluation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          category: rule.category,
        });
      }
    }

    // Cap total penalty at 100
    totalPenalty = Math.min(totalPenalty, 100);

    return {
      totalPenalty,
      criticalFailures: results.filter((r) => !r.passed && r.severity === 'critical'),
      warnings: results.filter((r) => !r.passed && r.severity === 'warning'),
      info: results.filter((r) => !r.passed && r.severity === 'info'),
      allResults: results,
      passed: totalPenalty < 20,
    };
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: string): ConsistencyRule[] {
    return this.rules.filter((r) => r.category === category);
  }

  /**
   * Add custom rule
   */
  addRule(rule: ConsistencyRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove rule by ID
   */
  removeRule(id: string): void {
    this.rules = this.rules.filter((r) => r.id !== id);
  }

  /**
   * Get all rule IDs
   */
  getRuleIds(): string[] {
    return this.rules.map((r) => r.id);
  }
}

/**
 * Default engine instance
 */
export const defaultEngine = new ConsistencyEngine();

/**
 * Quick evaluation function
 */
export function evaluateConsistency(input: ValidationInput): ConsistencyReport {
  return defaultEngine.evaluate(input);
}
