// ============================================
// Core Fingerprint Types
// ============================================

export interface NavigatorData {
  userAgent: string;
  platform: string;
  language: string;
  languages: string[];
  cookieEnabled: boolean;
  doNotTrack: string | null;
  hardwareConcurrency: number;
  deviceMemory?: number;
  maxTouchPoints: number;
  webdriver?: boolean;
  vendor?: string;
  vendorSub?: string;
  product?: string;
  productSub?: string;
  appName?: string;
  appCodeName?: string;
  appVersion?: string;
}

export interface ScreenData {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelDepth: number;
  devicePixelRatio: number;
  orientation?: string;
}

export interface WebGLData {
  vendor: string;
  renderer: string;
  version?: string;
  shadingLanguageVersion?: string;
  unmaskedVendor?: string;
  unmaskedRenderer?: string;
  maxTextureSize?: number;
  maxRenderBufferSize?: number;
  extensions?: string[];
}

export interface CanvasData {
  hash: string;
  isNoisyCanvas?: boolean;
  noiseDetected?: boolean;
  supported?: boolean;
  renderTime?: number;
  imageData?: string;
}

export interface AudioData {
  hash: string;
  sampleRate?: number;
  channelCount?: number;
  state?: string;
}

export interface FontsData {
  detected: string[];
  hash: string;
  count: number;
}

export interface TimezoneData {
  name: string;
  offset: number;
  dst?: boolean;
}

export interface WebRTCData {
  localIPs: string[];
  publicIP: string | null;
  hasLeak: boolean;
  stunResults?: StunResult[];
}

export interface StunResult {
  server: string;
  localCandidate: string | null;
  reflexiveCandidate: string | null;
  relayCandidate: string | null;
  error?: string;
}

export interface AutomationData {
  webdriver: boolean;
  chromeRuntime: boolean;
  cdpTraces: boolean;
  phantomJS: boolean;
  selenium: boolean;
  puppeteer?: boolean;
  playwright?: boolean;
  nightmareJS?: boolean;
}

export interface PluginData {
  name: string;
  description?: string;
  filename?: string;
}

// ============================================
// Complete Fingerprint Data
// ============================================

export interface FingerprintData {
  navigator: NavigatorData;
  screen: ScreenData;
  webgl: WebGLData;
  canvas: CanvasData;
  audio?: AudioData;
  fonts: FontsData;
  timezone: TimezoneData;
  plugins: string[];
  webrtc?: WebRTCData;
  automation: AutomationData;
  storage?: StorageData;
  mediaDevices?: MediaDeviceInfo[];
  codecs?: CodecsData;
}

export interface StorageData {
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  cookiesEnabled: boolean;
}

export interface CodecsData {
  audio: string[];
  video: string[];
}

// ============================================
// Analysis & Scoring Types
// ============================================

export type CheckStatus = 'pass' | 'warn' | 'fail';
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
export type Severity = 'critical' | 'warning' | 'info';

export interface CheckResult {
  id: string;
  name: string;
  status: CheckStatus;
  value: string | number | boolean | null;
  expected?: string;
  message?: string;
}

export interface LayerScore {
  score: number;
  weight: number;
  checks: CheckResult[];
  status: CheckStatus;
}

export interface LayerResults {
  network: LayerScore;
  navigator: LayerScore;
  graphics: LayerScore;
  audio: LayerScore;
  fonts: LayerScore;
  locale: LayerScore;
  automation: LayerScore;
}

export interface ConsistencyResult {
  id: string;
  name: string;
  passed: boolean;
  severity: Severity;
  penalty: number;
  message: string | null;
}

export interface Issue {
  layer: string;
  check: string;
  message: string;
  severity: Severity;
}

export interface TrustScore {
  overall: number;
  grade: Grade;
  layers: LayerResults;
  consistencyChecks: ConsistencyResult[];
  criticalIssues: Issue[];
  warnings: Issue[];
  recommendations: string[];
}

// ============================================
// Automation & Webhooks
// ============================================

export type AutomationCadence = 'manual' | 'interval' | 'hourly' | 'daily' | 'cron';

export interface AutomationSchedule {
  intervalMinutes?: number;
  dailyTime?: string;
  cron?: string;
  startAt?: number;
  timezone?: string;
}

export interface AutomationTarget {
  type: 'scan' | 'report';
  label: string;
  batchSize: number;
  profileId?: string;
  metadata?: Record<string, unknown>;
}

export interface AutomationTaskDTO {
  id: string;
  name: string;
  projectId: string | null;
  status: 'inactive' | 'scheduled' | 'queued' | 'running' | 'paused' | 'failed';
  cadence: AutomationCadence;
  timezone: string;
  schedule: AutomationSchedule | null;
  targets: AutomationTarget[];
  lastRunAt: number | null;
  nextRunAt: number | null;
  lastStatus: string | null;
  retryLimit: number;
  createdAt: number;
  updatedAt: number;
  lastResult?: Record<string, unknown> | null;
  webhookUrl?: string | null;
  webhookSecret?: string | null;
}

export interface AutomationTaskRunDTO {
  id: string;
  taskId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  queuedAt: number;
  startedAt: number | null;
  completedAt: number | null;
  durationMs: number | null;
  batchesProcessed: number | null;
  successCount: number | null;
  failCount: number | null;
  webhookStatus: string | null;
  responseCode: number | null;
  error: string | null;
  sampleReportId: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface WebhookSubscriptionDTO {
  id: string;
  projectId: string | null;
  name: string;
  url: string;
  status: 'active' | 'paused';
  events: string[];
  createdAt: number;
  updatedAt: number;
  lastDeliveryAt: number | null;
}

export interface WebhookDeliveryDTO {
  id: string;
  subscriptionId: string;
  event: string;
  status: 'delivered' | 'failed';
  responseCode: number | null;
  error: string | null;
  deliveredAt: number;
  durationMs: number | null;
  payload: Record<string, unknown>;
}

// ============================================
// IP Intelligence Types
// ============================================

export interface IPInfo {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  asn: number;
  asOrganization: string;
  continent?: string;
  isEU?: boolean;
}

export type IPType = 'residential' | 'isp' | 'datacenter' | 'hosting' | 'vpn' | 'tor' | 'proxy' | 'unknown';

export interface IPAnalysis extends IPInfo {
  ipType: IPType;
  isProxy: boolean;
  isVPN: boolean;
  isTor: boolean;
  isResidential: boolean;
  riskScore: number;
  blacklistStatus: {
    listed: boolean;
    lists: string[];
  };
  analysis: {
    httpProtocol: string;
    tlsVersion: string;
    tlsCipher: string;
    botScore: number | null;
    verifiedBot: boolean;
  };
}

// ============================================
// TLS Fingerprint Types
// ============================================

export interface TLSFingerprint {
  ja3Hash: string | null;
  ja4Hash: string | null;
  cipherSuites?: string[];
  extensions?: number[];
  tlsVersion?: string;
}

export interface TLSAnalysis {
  ja3: {
    hash: string;
    fullString?: string;
    knownBrowser: string | null;
  };
  ja4?: {
    hash: string;
    fullString?: string;
  };
  isConsistent: boolean;
  isAutomation: boolean;
  expectedBrowser: string;
  detectedBrowser: string | null;
}

// ============================================
// Generator Types
// ============================================

export type OS = 'Windows' | 'macOS' | 'Linux' | 'Android' | 'iOS';
export type Browser = 'Chrome' | 'Firefox' | 'Safari' | 'Edge';
export type QualityTier = 'standard' | 'premium' | 'verified';
export type ExportFormat = 'json' | 'puppeteer' | 'playwright' | 'selenium' | 'mutilogin';

export interface GeneratorOptions {
  os?: OS;
  osVersion?: string;
  browser?: Browser;
  browserVersion?: string;
  screenResolution?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  qualityTier?: QualityTier;
}

export interface GeneratedFingerprint {
  id: string | number;
  hash: string;
  userAgent: string;
  platform: string;
  screen: ScreenData;
  hardware: {
    hardwareConcurrency: number;
    deviceMemory: number;
    maxTouchPoints: number;
  };
  webgl: WebGLData;
  locale: {
    timezone: string;
    timezoneOffset: number;
    languages: string[];
    language: string;
  };
  fonts: string[];
  hashes: {
    canvas: string;
    audio: string;
    webgl: string;
    fonts: string;
  };
  metadata: {
    id: string | number;
    qualityScore: number;
    source: string;
    collectedAt: string;
    os: OS;
    osVersion?: string;
    browser: Browser;
    browserVersion?: string;
  };
}

// ============================================
// Challenge Types
// ============================================

export type ChallengeLevel = 1 | 2 | 3 | 4;
export type ChallengeStatus = 'pending' | 'passed' | 'failed';
export type Verdict = 'HUMAN' | 'SUSPICIOUS' | 'LIKELY BOT';

export interface LevelConfig {
  name: string;
  points: number;
  passThreshold: number;
}

export interface LevelResult {
  status: ChallengeStatus;
  checks: CheckResult[];
  score: number;
  completedAt?: number;
  details?: Record<string, any>;
}

export interface ChallengeSession {
  sessionId: string;
  startedAt: number;
  completedAt?: number;
  levels: Record<ChallengeLevel, LevelResult>;
  totalScore: number;
  ja3Hash: string | null;
  ja4Hash: string | null;
  userAgent: string;
}

export interface ChallengeSummary {
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  levelsPassed: number;
  totalLevels: number;
  verdict: Verdict;
}

// ============================================
// Report Types
// ============================================

export interface ScanReport {
  reportId: string;
  trustScore: number;
  grade: Grade;
  createdAt: string;
  expiresAt: string;
  viewCount: number;
  scanData: {
    layers: LayerResults;
    criticalIssues: Issue[];
    warnings: Issue[];
    recommendations: string[];
  };
}

export interface ShareLinks {
  twitter: string;
  reddit: string;
  copy: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiError {
  error: string;
  message: string;
  status: number;
  details?: Record<string, any>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Database Types
// ============================================

export interface DBFingerprint {
  id: number;
  hash: string;
  os: OS;
  os_version: string | null;
  browser: Browser;
  browser_version: string | null;
  user_agent: string;
  platform: string;
  screen_width: number;
  screen_height: number;
  device_pixel_ratio: number;
  hardware_concurrency: number;
  device_memory: number;
  max_touch_points: number;
  webgl_vendor: string;
  webgl_renderer: string;
  webgl_version: string | null;
  timezone: string;
  timezone_offset: number;
  languages: string; // JSON array
  fonts: string; // JSON array
  canvas_hash: string;
  audio_hash: string | null;
  webgl_hash: string | null;
  quality_score: number;
  source: string;
  browser_release_date: string | null;
  collected_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DBReport {
  id: string;
  scan_data: string; // JSON
  trust_score: number;
  critical_issues_count: number;
  created_at: number;
  expires_at: number;
  view_count: number;
  ip_hash: string;
}
