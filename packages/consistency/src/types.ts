import type { FingerprintData, IPAnalysis, Severity, CheckResult, CheckStatus } from '@anti-detect/types';

export interface ConsistencyRule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  penalty: number;
  category: 'hardware-os' | 'browser-features' | 'timezone-language' | 'screen-resolution' | 'automation' | 'network';
  check: (data: ValidationInput) => RuleResult;
}

export interface RuleResult {
  passed: boolean;
  message: string | null;
  details?: Record<string, unknown>;
}

export interface ValidationInput {
  fingerprint: FingerprintData;
  ipInfo?: IPAnalysis;
  tlsFingerprint?: {
    ja3Hash: string | null;
    ja4Hash: string | null;
  };
}

export interface ConsistencyResult {
  id: string;
  name: string;
  passed: boolean;
  severity: Severity;
  penalty: number;
  message: string | null;
  category: string;
}

export interface ConsistencyReport {
  totalPenalty: number;
  criticalFailures: ConsistencyResult[];
  warnings: ConsistencyResult[];
  info: ConsistencyResult[];
  allResults: ConsistencyResult[];
  passed: boolean;
}

export interface LayerScoreInput {
  fingerprint: FingerprintData;
  ipInfo?: IPAnalysis;
}

export interface ScoringWeights {
  network: number;
  navigator: number;
  graphics: number;
  audio: number;
  fonts: number;
  locale: number;
  automation: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  network: 0.20,
  navigator: 0.15,
  graphics: 0.20,
  audio: 0.10,
  fonts: 0.10,
  locale: 0.10,
  automation: 0.15,
};

export type { CheckResult, CheckStatus, Severity };
