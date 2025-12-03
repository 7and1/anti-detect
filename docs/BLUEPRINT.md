# Anti-detect.com Master Blueprint

## Executive Summary

Anti-detect.com is a production-grade fingerprint detection and anti-fraud toolkit designed to dominate the browser fingerprinting market. This blueprint provides the complete technical specification for building a world-class platform.

**Mission:** Create the most comprehensive browser fingerprint scanner that converts visitors into Mutilogin customers through fear-driven psychology.

**Core Value Proposition:**
```
Fear (Detection) → Relief (Generator) → Conversion (Mutilogin)
```

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ANTI-DETECT.COM                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         FRONTEND LAYER                               │    │
│  │                                                                       │    │
│  │   Next.js 15 (App Router) + React 19 + TypeScript 5.x               │    │
│  │   ├── Tailwind CSS 4.x (Cyberpunk Theme)                            │    │
│  │   ├── Framer Motion (Animations)                                     │    │
│  │   ├── Radix UI (Accessible Primitives)                              │    │
│  │   └── React Query (Server State)                                     │    │
│  │                                                                       │    │
│  │   Deployment: Cloudflare Pages                                       │    │
│  │   CDN: Cloudflare Edge (Global POPs)                                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                          API LAYER                                   │    │
│  │                                                                       │    │
│  │   Cloudflare Workers + Hono.js                                       │    │
│  │   ├── /api/scan/*        (Fingerprint analysis)                     │    │
│  │   ├── /api/generate/*    (Fingerprint generation)                   │    │
│  │   ├── /api/challenge/*   (Challenge arena)                          │    │
│  │   ├── /api/report/*      (Report management)                        │    │
│  │   └── /api/ip/*          (IP intelligence)                          │    │
│  │                                                                       │    │
│  │   Middleware:                                                        │    │
│  │   ├── Rate Limiting (Token Bucket via KV)                           │    │
│  │   ├── CORS (Strict origin control)                                  │    │
│  │   └── Request Validation (Zod schemas)                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         DATA LAYER                                   │    │
│  │                                                                       │    │
│  │   Cloudflare D1 (SQLite)                                            │    │
│  │   ├── fingerprints (100K+ verified records)                         │    │
│  │   ├── reports (Shareable scan results)                              │    │
│  │   ├── scans (Analytics aggregation)                                 │    │
│  │   └── rate_limits (Per-IP tracking)                                 │    │
│  │                                                                       │    │
│  │   Cloudflare KV                                                      │    │
│  │   ├── IP_CACHE (Geolocation cache)                                  │    │
│  │   ├── JA3_DB (Known TLS fingerprints)                               │    │
│  │   └── RATE_LIMITS (Token bucket state)                              │    │
│  │                                                                       │    │
│  │   Cloudflare R2                                                      │    │
│  │   └── reports/ (PDF exports)                                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Monorepo Structure

```
anti-detect.com/
├── apps/
│   ├── web/                          # Next.js 15 Frontend
│   │   ├── src/
│   │   │   ├── app/                  # App Router pages
│   │   │   │   ├── (marketing)/      # Marketing pages (home, about)
│   │   │   │   ├── tools/            # Tool pages
│   │   │   │   ├── report/           # Shareable reports
│   │   │   │   ├── learn/            # SEO content hub
│   │   │   │   └── api/              # API route proxies
│   │   │   ├── components/           # React components
│   │   │   │   ├── scanner/          # Scanner-specific
│   │   │   │   ├── generator/        # Generator-specific
│   │   │   │   ├── challenge/        # Challenge arena
│   │   │   │   ├── tools/            # Individual tools
│   │   │   │   └── ui/               # Shared primitives
│   │   │   ├── lib/                  # Utilities
│   │   │   │   ├── hooks/            # Custom hooks
│   │   │   │   ├── utils/            # Helper functions
│   │   │   │   └── api/              # API client
│   │   │   ├── styles/               # Global styles
│   │   │   └── types/                # Type definitions
│   │   ├── public/                   # Static assets
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── api/                          # Cloudflare Worker API
│       ├── src/
│       │   ├── index.ts              # Hono app entry
│       │   ├── routes/               # API routes
│       │   │   ├── scan.ts
│       │   │   ├── generate.ts
│       │   │   ├── challenge.ts
│       │   │   ├── report.ts
│       │   │   └── ip.ts
│       │   ├── services/             # Business logic
│       │   │   ├── scoring.ts
│       │   │   ├── ip-intel.ts
│       │   │   ├── leak-detector.ts
│       │   │   ├── three-lock.ts
│       │   │   ├── consistency.ts
│       │   │   └── pdf.ts
│       │   ├── middleware/           # Hono middleware
│       │   │   ├── rate-limit.ts
│       │   │   ├── cors.ts
│       │   │   └── validate.ts
│       │   └── lib/                  # Shared utilities
│       │       ├── hash.ts
│       │       ├── ua-parser.ts
│       │       └── db.ts
│       ├── schema.sql                # D1 migrations
│       ├── wrangler.toml             # Worker config
│       └── package.json
│
├── packages/
│   ├── core/                         # Fingerprint collection engine
│   │   ├── src/
│   │   │   ├── index.ts              # Main export
│   │   │   ├── collect.ts            # Orchestrator
│   │   │   ├── types.ts              # TypeScript interfaces
│   │   │   └── collectors/           # Individual collectors
│   │   │       ├── hardware.ts       # Canvas, WebGL, Audio
│   │   │       ├── system.ts         # UA, Platform, Timezone
│   │   │       ├── media.ts          # Codecs, MediaDevices
│   │   │       ├── capabilities.ts   # Storage, APIs
│   │   │       ├── network.ts        # WebRTC, DNS
│   │   │       └── automation.ts     # Bot detection
│   │   └── package.json
│   │
│   ├── consistency/                  # Cross-layer validation
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── rules.ts              # Validation rules
│   │   │   ├── engine.ts             # Rule execution
│   │   │   └── registry.ts           # Rule management
│   │   └── package.json
│   │
│   ├── types/                        # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── fingerprint.ts
│   │   │   ├── scan.ts
│   │   │   ├── report.ts
│   │   │   └── api.ts
│   │   └── package.json
│   │
│   └── ui/                           # Shared UI components
│       ├── src/
│       │   ├── index.ts
│       │   ├── Button.tsx
│       │   ├── Card.tsx
│       │   ├── Badge.tsx
│       │   └── ...
│       └── package.json
│
├── content/                          # MDX content for /learn/
│   ├── browser-fingerprinting.mdx
│   ├── webrtc-leak-guide.mdx
│   └── ...
│
├── scripts/                          # Build & deployment scripts
│   ├── seed-database.ts
│   ├── generate-sitemap.ts
│   └── ...
│
├── package.json                      # Root package.json
├── pnpm-workspace.yaml               # pnpm workspace config
├── turbo.json                        # Turborepo config
├── tsconfig.base.json                # Shared TypeScript config
└── .gitignore
```

---

## 2. Technology Stack

### 2.1 Frontend Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Framework | Next.js | 15.x | App Router, RSC, Edge Runtime |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| UI Primitives | Radix UI | Latest | Accessible components |
| Animation | Framer Motion | 11.x | Smooth animations |
| State | React Query | 5.x | Server state management |
| State | Zustand | 5.x | Client state management |
| Forms | React Hook Form | 7.x | Form handling |
| Validation | Zod | 3.x | Schema validation |
| Charts | Recharts | 2.x | Data visualization |
| Code Highlight | Shiki | 1.x | Syntax highlighting |

### 2.2 Backend Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Runtime | Cloudflare Workers | Latest | Edge computing |
| Framework | Hono | 4.x | Lightweight web framework |
| Database | Cloudflare D1 | Latest | SQLite at edge |
| Cache | Cloudflare KV | Latest | Key-value storage |
| Storage | Cloudflare R2 | Latest | Object storage |
| Language | TypeScript | 5.x | Type safety |
| Validation | Zod | 3.x | Request validation |

### 2.3 Development Tools

| Tool | Purpose |
|------|---------|
| pnpm | Package manager (fast, disk-efficient) |
| Turborepo | Monorepo build system |
| ESLint | Code linting |
| Prettier | Code formatting |
| Vitest | Unit testing |
| Playwright | E2E testing |
| Husky | Git hooks |
| Commitlint | Commit message linting |

---

## 3. Core Features Specification

### 3.1 The Ultimate Scanner (Homepage)

**Route:** `/`

**Purpose:** Create fear through exhaustive detection and drive Mutilogin conversions.

#### 3.1.1 Detection Layers (7-Layer Deep Scan)

| Layer | ID | Checks | Weight |
|-------|-----|--------|--------|
| L1: Network | `network` | IP address, Proxy detection, DNS leak, WebRTC leak, Blacklist check | 20% |
| L2: Navigator | `navigator` | UA parsing, Platform consistency, Hardware specs, Languages | 15% |
| L3: Graphics | `graphics` | Canvas hash, Canvas noise, WebGL vendor/renderer, GPU consistency | 20% |
| L4: Audio | `audio` | AudioContext fingerprint, MediaDevices enum | 10% |
| L5: Fonts | `fonts` | Font enumeration, Font hash, Font count | 10% |
| L6: Locale | `locale` | Timezone, Language consistency, Intl API | 10% |
| L7: Automation | `automation` | webdriver flag, CDP traces, Headless markers | 15% |

#### 3.1.2 Trust Score Calculation

```typescript
interface TrustScore {
  overall: number;        // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  layers: {
    network: LayerScore;
    navigator: LayerScore;
    graphics: LayerScore;
    audio: LayerScore;
    fonts: LayerScore;
    locale: LayerScore;
    automation: LayerScore;
  };
  criticalIssues: Issue[];
  warnings: Issue[];
}

interface LayerScore {
  score: number;          // 0-100
  weight: number;         // Layer weight
  checks: CheckResult[];
  status: 'pass' | 'warn' | 'fail';
}

interface CheckResult {
  id: string;
  name: string;
  status: 'pass' | 'warn' | 'fail';
  value: string | number | boolean;
  expected?: string;
  message?: string;
}
```

#### 3.1.3 Scoring Algorithm

```typescript
function calculateTrustScore(layers: LayerResults): TrustScore {
  const weights = {
    network: 0.20,
    navigator: 0.15,
    graphics: 0.20,
    audio: 0.10,
    fonts: 0.10,
    locale: 0.10,
    automation: 0.15,
  };

  let totalScore = 100;
  const criticalIssues: Issue[] = [];
  const warnings: Issue[] = [];

  // Calculate weighted score
  for (const [layerId, layer] of Object.entries(layers)) {
    const weight = weights[layerId as keyof typeof weights];
    const layerPenalty = (100 - layer.score) * weight;
    totalScore -= layerPenalty;

    // Collect issues
    for (const check of layer.checks) {
      if (check.status === 'fail') {
        criticalIssues.push({
          layerId,
          checkId: check.id,
          message: check.message,
          severity: 'critical',
        });
      } else if (check.status === 'warn') {
        warnings.push({
          layerId,
          checkId: check.id,
          message: check.message,
          severity: 'warning',
        });
      }
    }
  }

  // Apply consistency penalties (cross-layer validation)
  const consistencyPenalties = runConsistencyChecks(layers);
  totalScore -= consistencyPenalties.reduce((sum, p) => sum + p.penalty, 0);

  return {
    overall: Math.max(0, Math.round(totalScore)),
    grade: scoreToGrade(totalScore),
    layers,
    criticalIssues,
    warnings,
  };
}

function scoreToGrade(score: number): Grade {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}
```

### 3.2 Real Fingerprint Generator

**Route:** `/tools/generator`

**Purpose:** Provide legitimate fingerprints that pass detection.

#### 3.2.1 Generator Options

```typescript
interface GeneratorOptions {
  os: 'Windows' | 'macOS' | 'Linux' | 'Android' | 'iOS';
  osVersion?: string;
  browser: 'Chrome' | 'Firefox' | 'Safari' | 'Edge';
  browserVersion?: string;
  screenResolution?: '1920x1080' | '1440x900' | '2560x1440' | 'random';
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  qualityTier?: 'standard' | 'premium' | 'verified';
}

interface GeneratedFingerprint {
  // Core identifiers
  userAgent: string;
  platform: string;

  // Screen
  screen: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    colorDepth: number;
    pixelDepth: number;
    devicePixelRatio: number;
  };

  // Hardware
  hardware: {
    hardwareConcurrency: number;
    deviceMemory: number;
    maxTouchPoints: number;
  };

  // WebGL
  webgl: {
    vendor: string;
    renderer: string;
    version: string;
    shadingLanguageVersion: string;
    unmaskedVendor: string;
    unmaskedRenderer: string;
  };

  // Locale
  locale: {
    timezone: string;
    timezoneOffset: number;
    languages: string[];
    language: string;
  };

  // Fonts
  fonts: string[];

  // Hashes (for consistency)
  hashes: {
    canvas: string;
    audio: string;
    webgl: string;
    fonts: string;
  };

  // Metadata
  metadata: {
    id: string;
    qualityScore: number;
    source: string;
    collectedAt: string;
  };
}
```

#### 3.2.2 Export Formats

```typescript
interface ExportFormats {
  json: string;                    // Raw JSON
  puppeteer: string;               // Puppeteer launch options
  playwright: string;              // Playwright context options
  selenium: string;                // Selenium WebDriver options
  mutilogin: string;               // Mutilogin profile JSON
}

// Example Puppeteer export
function generatePuppeteerCode(fp: GeneratedFingerprint): string {
  return `
const puppeteer = require('puppeteer');

const browser = await puppeteer.launch({
  headless: false,
  args: [
    '--window-size=${fp.screen.width},${fp.screen.height}',
    '--user-agent=${fp.userAgent}',
  ],
});

const page = await browser.newPage();

await page.setViewport({
  width: ${fp.screen.width},
  height: ${fp.screen.height},
  deviceScaleFactor: ${fp.screen.devicePixelRatio},
});

await page.evaluateOnNewDocument(() => {
  // Override navigator properties
  Object.defineProperty(navigator, 'hardwareConcurrency', {
    get: () => ${fp.hardware.hardwareConcurrency}
  });
  Object.defineProperty(navigator, 'deviceMemory', {
    get: () => ${fp.hardware.deviceMemory}
  });
  Object.defineProperty(navigator, 'platform', {
    get: () => '${fp.platform}'
  });
  Object.defineProperty(navigator, 'languages', {
    get: () => ${JSON.stringify(fp.locale.languages)}
  });
});
`.trim();
}
```

### 3.3 Challenge Arena

**Route:** `/tools/challenge`

**Purpose:** Create competitive failure that drives conversion.

#### 3.3.1 Challenge Levels

| Level | Name | Detection Method | Pass Rate | Points |
|-------|------|------------------|-----------|--------|
| 1 | Basic JS | navigator tampering, plugin count | ~80% | 100 |
| 2 | Headless Hunter | webdriver, CDP, Notification API | ~40% | 200 |
| 3 | TLS Inspector | JA3/JA4 fingerprint analysis | ~15% | 300 |
| 4 | Human Verification | Cloudflare Turnstile + behavior | ~5% | 400 |

#### 3.3.2 Level Implementation

```typescript
// Level 1: Basic JavaScript
const level1Checks = [
  {
    id: 'navigator-exists',
    name: 'Navigator Object',
    check: () => typeof navigator !== 'undefined',
    failMessage: 'Navigator object missing (unusual)',
  },
  {
    id: 'webdriver-flag',
    name: 'WebDriver Flag',
    check: () => !navigator.webdriver,
    failMessage: 'WebDriver flag detected',
  },
  {
    id: 'plugins-count',
    name: 'Plugins Count',
    check: () => navigator.plugins.length > 0,
    failMessage: 'No plugins detected (suspicious)',
  },
  {
    id: 'languages-array',
    name: 'Languages Array',
    check: () => navigator.languages?.length > 0,
    failMessage: 'No languages configured',
  },
  {
    id: 'permission-api',
    name: 'Permission API',
    check: async () => {
      const result = await navigator.permissions.query({ name: 'notifications' });
      return result.state !== 'denied';
    },
    failMessage: 'Permissions appear automated',
  },
];

// Level 2: Headless Hunter
const level2Checks = [
  {
    id: 'chrome-runtime',
    name: 'Chrome Runtime',
    check: () => !!(window.chrome?.runtime),
    failMessage: 'Missing Chrome runtime (headless indicator)',
  },
  {
    id: 'notification-api',
    name: 'Notification API',
    check: () => typeof Notification !== 'undefined',
    failMessage: 'Notification API missing',
  },
  {
    id: 'cdp-leak',
    name: 'CDP Leak Check',
    check: () => {
      const cdpVars = [
        'cdc_adoQpoasnfa76pfcZLmcfl_Array',
        'cdc_adoQpoasnfa76pfcZLmcfl_Promise',
        '__webdriver_evaluate',
        '__selenium_evaluate',
      ];
      return !cdpVars.some(v => v in window || v in document);
    },
    failMessage: 'CDP/Selenium traces detected',
  },
  {
    id: 'iframe-test',
    name: 'Iframe Behavior',
    check: () => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      const hasWindow = iframe.contentWindow !== null;
      document.body.removeChild(iframe);
      return hasWindow;
    },
    failMessage: 'Unusual iframe behavior',
  },
];

// Level 3: TLS Inspector (Server-side)
interface TLSCheckResult {
  ja3Hash: string;
  ja4Hash: string;
  expectedBrowser: string;
  actualUA: string;
  isConsistent: boolean;
  score: number;
}

// Level 4: Human Verification
interface HumanVerificationResult {
  turnstileToken: string;
  turnstileScore: number;
  behaviorScore: number;
  passed: boolean;
}
```

### 3.4 Additional Tools

#### 3.4.1 WebRTC Leak Test (`/tools/webrtc-leak`)

```typescript
interface WebRTCLeakResult {
  hasLeak: boolean;
  localIPs: string[];
  publicIPs: string[];
  stunServers: StunServerResult[];
  turnServers: TurnServerResult[];
  recommendations: string[];
}

interface StunServerResult {
  server: string;
  localCandidate: string | null;
  reflexiveCandidate: string | null;
  relayCandidate: string | null;
  error?: string;
}
```

#### 3.4.2 Canvas Fingerprint (`/tools/canvas-fingerprint`)

```typescript
interface CanvasAnalysis {
  hash: string;
  noiseLevel: number;          // 0-100 (0 = no noise)
  uniquenessScore: number;     // Estimated uniqueness
  isAnomaly: boolean;          // Detected tampering
  renderTime: number;          // ms
  imageData: string;           // Base64 preview
  techniques: {
    basic2D: CanvasResult;
    webglVendor: CanvasResult;
    webglRenderer: CanvasResult;
    webgl2: CanvasResult;
  };
}
```

#### 3.4.3 Font Fingerprint (`/tools/font-fingerprint`)

```typescript
interface FontAnalysis {
  detectedFonts: string[];
  totalFonts: number;
  hash: string;
  osSignature: string;         // Detected OS based on fonts
  isConsistent: boolean;       // Matches claimed OS
  uniqueFonts: string[];       // Fonts unique to this system
  commonFonts: string[];       // Standard fonts
}
```

#### 3.4.4 TLS Fingerprint (`/tools/tls-fingerprint`)

```typescript
interface TLSAnalysis {
  ja3: {
    hash: string;
    fullString: string;
    knownBrowser: string | null;
  };
  ja4: {
    hash: string;
    fullString: string;
  };
  cipherSuites: string[];
  extensions: number[];
  tlsVersion: string;
  isConsistent: boolean;       // Matches User-Agent
  recommendations: string[];
}
```

---

## 4. Cross-Layer Consistency Engine

### 4.1 Consistency Rules

The consistency engine is what sets us apart. These rules detect impossible combinations.

```typescript
interface ConsistencyRule {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  penalty: number;             // Score penalty (0-20)
  check: (data: FingerprintData) => RuleResult;
}

const consistencyRules: ConsistencyRule[] = [
  // OS vs Hardware
  {
    id: 'gpu-os-mismatch',
    name: 'GPU/OS Mismatch',
    description: 'Apple GPU cannot run on Windows',
    severity: 'critical',
    penalty: 20,
    check: (data) => {
      const hasAppleGPU = data.webgl.renderer.includes('Apple');
      const claimsWindows = data.navigator.userAgent.includes('Windows');
      return {
        passed: !(hasAppleGPU && claimsWindows),
        message: hasAppleGPU && claimsWindows
          ? 'Apple GPU hardware cannot run Windows natively'
          : null,
      };
    },
  },

  // Platform vs UA
  {
    id: 'platform-ua-mismatch',
    name: 'Platform/UA Mismatch',
    description: 'navigator.platform contradicts User-Agent',
    severity: 'critical',
    penalty: 20,
    check: (data) => {
      const platform = data.navigator.platform;
      const ua = data.navigator.userAgent;

      // Win32 but Mac UA
      if (platform === 'Win32' && ua.includes('Mac OS X')) {
        return { passed: false, message: 'Platform is Win32 but UA claims Mac' };
      }
      // MacIntel but Windows UA
      if (platform === 'MacIntel' && ua.includes('Windows')) {
        return { passed: false, message: 'Platform is MacIntel but UA claims Windows' };
      }
      return { passed: true };
    },
  },

  // Timezone vs IP Location
  {
    id: 'timezone-ip-mismatch',
    name: 'Timezone/IP Mismatch',
    description: 'Timezone does not match IP geolocation',
    severity: 'warning',
    penalty: 10,
    check: (data) => {
      const tz = data.locale.timezone;
      const ipCountry = data.network.ipInfo.country;
      const expectedTimezones = getTimezonesForCountry(ipCountry);

      if (!expectedTimezones.includes(tz)) {
        return {
          passed: false,
          message: `Timezone ${tz} unexpected for ${ipCountry}`,
        };
      }
      return { passed: true };
    },
  },

  // High core count check
  {
    id: 'suspicious-cores',
    name: 'Suspicious Core Count',
    description: 'Hardware concurrency too high for claimed device',
    severity: 'warning',
    penalty: 5,
    check: (data) => {
      const cores = data.hardware.hardwareConcurrency;
      const isMobile = /Mobile|Android|iPhone/.test(data.navigator.userAgent);

      if (isMobile && cores > 8) {
        return { passed: false, message: 'Too many cores for mobile device' };
      }
      if (!isMobile && cores > 32) {
        return { passed: false, message: 'Unusually high core count' };
      }
      return { passed: true };
    },
  },

  // WebGL renderer consistency
  {
    id: 'webgl-swiftshader',
    name: 'SwiftShader Detection',
    description: 'SwiftShader indicates headless browser',
    severity: 'critical',
    penalty: 15,
    check: (data) => {
      const renderer = data.webgl.renderer.toLowerCase();
      if (renderer.includes('swiftshader') || renderer.includes('llvmpipe')) {
        return { passed: false, message: 'Software renderer detected (SwiftShader/LLVMpipe)' };
      }
      return { passed: true };
    },
  },

  // Touch points vs device type
  {
    id: 'touch-mismatch',
    name: 'Touch/Device Mismatch',
    description: 'Touch points inconsistent with device type',
    severity: 'warning',
    penalty: 5,
    check: (data) => {
      const touchPoints = data.hardware.maxTouchPoints;
      const ua = data.navigator.userAgent;
      const isMobile = /Mobile|Android|iPhone/.test(ua);

      if (isMobile && touchPoints === 0) {
        return { passed: false, message: 'Mobile device reports no touch support' };
      }
      return { passed: true };
    },
  },

  // Language vs timezone
  {
    id: 'language-timezone-mismatch',
    name: 'Language/Timezone Mismatch',
    description: 'Primary language unusual for timezone',
    severity: 'info',
    penalty: 3,
    check: (data) => {
      const lang = data.locale.language;
      const tz = data.locale.timezone;

      // Japanese timezone but non-Japanese language
      if (tz === 'Asia/Tokyo' && !lang.startsWith('ja')) {
        return { passed: false, message: 'Non-Japanese language in Japanese timezone' };
      }
      // Add more rules...
      return { passed: true };
    },
  },

  // Fonts vs OS
  {
    id: 'fonts-os-mismatch',
    name: 'Fonts/OS Mismatch',
    description: 'Installed fonts inconsistent with OS',
    severity: 'warning',
    penalty: 8,
    check: (data) => {
      const fonts = data.fonts.detected;
      const ua = data.navigator.userAgent;

      // Windows-only fonts on Mac
      const windowsFonts = ['Segoe UI', 'Calibri', 'Consolas'];
      const macFonts = ['SF Pro', 'Helvetica Neue', 'Apple Color Emoji'];

      const isMac = ua.includes('Mac OS X');
      const isWindows = ua.includes('Windows');

      if (isMac && windowsFonts.some(f => fonts.includes(f)) && !macFonts.some(f => fonts.includes(f))) {
        return { passed: false, message: 'Windows fonts detected on Mac' };
      }
      if (isWindows && macFonts.some(f => fonts.includes(f)) && !windowsFonts.some(f => fonts.includes(f))) {
        return { passed: false, message: 'Mac fonts detected on Windows' };
      }
      return { passed: true };
    },
  },
];
```

### 4.2 Consistency Engine Implementation

```typescript
class ConsistencyEngine {
  private rules: ConsistencyRule[];

  constructor(rules: ConsistencyRule[]) {
    this.rules = rules;
  }

  evaluate(data: FingerprintData): ConsistencyReport {
    const results: RuleResult[] = [];
    let totalPenalty = 0;

    for (const rule of this.rules) {
      try {
        const result = rule.check(data);
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          passed: result.passed,
          message: result.message,
          penalty: result.passed ? 0 : rule.penalty,
        });

        if (!result.passed) {
          totalPenalty += rule.penalty;
        }
      } catch (error) {
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: 'info',
          passed: true,
          message: 'Rule evaluation failed',
          penalty: 0,
        });
      }
    }

    return {
      totalPenalty,
      criticalFailures: results.filter(r => !r.passed && r.severity === 'critical'),
      warnings: results.filter(r => !r.passed && r.severity === 'warning'),
      allResults: results,
    };
  }
}
```

---

## 5. UI/UX Design System

### 5.1 Color Palette (Cyberpunk Theme)

```css
:root {
  /* Background layers */
  --bg-primary: #09090b;        /* Zinc 950 - Deep black */
  --bg-secondary: #18181b;      /* Zinc 900 - Card background */
  --bg-tertiary: #27272a;       /* Zinc 800 - Elevated surfaces */
  --bg-hover: #3f3f46;          /* Zinc 700 - Hover states */

  /* Text hierarchy */
  --text-primary: #fafafa;      /* Zinc 50 - Primary text */
  --text-secondary: #a1a1aa;    /* Zinc 400 - Secondary text */
  --text-muted: #71717a;        /* Zinc 500 - Muted text */
  --text-disabled: #52525b;     /* Zinc 600 - Disabled text */

  /* Status colors */
  --color-success: #10b981;     /* Emerald 500 - Matrix green */
  --color-success-dim: #065f46; /* Emerald 800 - Success background */
  --color-warning: #f59e0b;     /* Amber 500 */
  --color-warning-dim: #78350f; /* Amber 900 */
  --color-error: #ef4444;       /* Red 500 - Critical red */
  --color-error-dim: #7f1d1d;   /* Red 900 */
  --color-info: #3b82f6;        /* Blue 500 */

  /* Accent colors */
  --color-accent: #8b5cf6;      /* Violet 500 */
  --color-terminal: #22d3ee;    /* Cyan 400 - Terminal highlights */
  --color-neon: #22c55e;        /* Green 500 - Neon glow */

  /* Borders */
  --border-default: #27272a;    /* Zinc 800 */
  --border-subtle: #3f3f46;     /* Zinc 700 */

  /* Gradients */
  --gradient-score: linear-gradient(135deg, #ef4444 0%, #f59e0b 50%, #10b981 100%);
  --gradient-glow: linear-gradient(180deg, rgba(34, 197, 94, 0.2) 0%, transparent 100%);
}
```

### 5.2 Typography

```css
/* Font families */
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;

/* Font sizes (using clamp for fluid typography) */
--text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);     /* 12-14px */
--text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);       /* 14-16px */
--text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);       /* 16-18px */
--text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);      /* 18-20px */
--text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);       /* 20-24px */
--text-2xl: clamp(1.5rem, 1.3rem + 1vw, 2rem);            /* 24-32px */
--text-3xl: clamp(2rem, 1.7rem + 1.5vw, 2.5rem);          /* 32-40px */
--text-4xl: clamp(2.5rem, 2rem + 2.5vw, 3.5rem);          /* 40-56px */

/* Line heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Font weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 5.3 Component Specifications

#### Trust Score Gauge

```typescript
interface TrustScoreGaugeProps {
  score: number;               // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  isLoading?: boolean;
  animate?: boolean;           // Count-up animation
  size?: 'sm' | 'md' | 'lg';   // 120px, 200px, 280px
}

// Visual states
// 0-39: Red pulse, "CRITICAL" label
// 40-59: Orange, "POOR" label
// 60-74: Yellow, "MODERATE" label
// 75-89: Light green, "GOOD" label
// 90-100: Bright green glow, "EXCELLENT" label
```

#### Detection Card

```typescript
interface DetectionCardProps {
  layer: {
    id: string;
    name: string;
    icon: ReactNode;
    score: number;
    status: 'pass' | 'warn' | 'fail';
    checks: CheckResult[];
  };
  isExpanded?: boolean;
  onToggle?: () => void;
  onFixClick?: (checkId: string) => void;
}

// Collapsed state: Icon + Name + Status badge + Chevron
// Expanded state: Full list of checks with values
// Each failed check has "Fix with Mutilogin" button
```

### 5.4 Responsive Breakpoints

```css
/* Mobile first approach */
--screen-sm: 640px;   /* Large phones */
--screen-md: 768px;   /* Tablets */
--screen-lg: 1024px;  /* Small laptops */
--screen-xl: 1280px;  /* Desktop */
--screen-2xl: 1536px; /* Large desktop */
```

### 5.5 Animation Guidelines

```typescript
// Timing functions
const easing = {
  easeOut: [0.16, 1, 0.3, 1],        // For entrances
  easeIn: [0.4, 0, 1, 1],            // For exits
  easeInOut: [0.4, 0, 0.2, 1],       // For transforms
  spring: { type: 'spring', stiffness: 400, damping: 30 },
};

// Duration guidelines
const duration = {
  fast: 150,      // Micro-interactions (hovers, active states)
  normal: 300,    // Standard transitions
  slow: 500,      // Emphasis animations
  slower: 700,    // Score counting
};

// Score counting animation
const scoreAnimation = {
  from: 0,
  to: 73,
  duration: 1500,
  easing: 'easeOut',
  onUpdate: (value: number) => setDisplayScore(Math.round(value)),
};
```

---

## 6. Security Considerations

### 6.1 Data Privacy

| Data Type | Storage | Retention | Encryption |
|-----------|---------|-----------|------------|
| IP addresses | Transient (never stored) | Session only | N/A |
| Fingerprints | D1 (generator only) | Indefinite | At rest |
| Scan results | None (client-side) | N/A | N/A |
| Shared reports | D1 + R2 | 30 days TTL | At rest |

### 6.2 Security Headers

```typescript
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob:;
    connect-src 'self' https://api.ipify.org wss://*.turn.cloudflare.com;
    frame-src https://challenges.cloudflare.com;
  `.replace(/\s+/g, ' ').trim(),
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};
```

### 6.3 Rate Limiting

```typescript
interface RateLimitConfig {
  endpoint: string;
  limit: number;
  window: number;        // seconds
  identifier: 'ip' | 'fingerprint';
}

const rateLimits: RateLimitConfig[] = [
  { endpoint: '/api/scan', limit: 20, window: 3600, identifier: 'ip' },
  { endpoint: '/api/generate', limit: 50, window: 3600, identifier: 'ip' },
  { endpoint: '/api/challenge', limit: 30, window: 3600, identifier: 'ip' },
  { endpoint: '/api/report', limit: 10, window: 3600, identifier: 'ip' },
];
```

---

## 7. Performance Targets

### 7.1 Core Web Vitals

| Metric | Target | Threshold |
|--------|--------|-----------|
| Largest Contentful Paint (LCP) | < 2.0s | < 2.5s |
| First Input Delay (FID) | < 50ms | < 100ms |
| Cumulative Layout Shift (CLS) | < 0.05 | < 0.1 |
| First Contentful Paint (FCP) | < 1.2s | < 1.8s |
| Time to Interactive (TTI) | < 3.0s | < 3.9s |

### 7.2 Bundle Size Budget

| Asset | Target | Maximum |
|-------|--------|---------|
| Initial JS | < 100KB | 150KB |
| Initial CSS | < 20KB | 30KB |
| Total initial load | < 200KB | 300KB |
| Largest chunk | < 50KB | 80KB |

### 7.3 API Latency

| Endpoint | Target (p50) | Target (p99) |
|----------|--------------|--------------|
| /api/scan/start | < 50ms | < 200ms |
| /api/scan/collect | < 100ms | < 500ms |
| /api/generate | < 100ms | < 300ms |
| /api/challenge/tls | < 30ms | < 100ms |
| /api/report/create | < 200ms | < 500ms |

---

## 8. Deployment Architecture

### 8.1 Cloudflare Configuration

```toml
# wrangler.toml
name = "anti-detect-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "production"

[[d1_databases]]
binding = "DB"
database_name = "anti-detect"
database_id = "xxxxx"

[[kv_namespaces]]
binding = "KV"
id = "xxxxx"

[[r2_buckets]]
binding = "R2"
bucket_name = "anti-detect-reports"

[observability]
enabled = true
head_sampling_rate = 0.1

[[routes]]
pattern = "api.anti-detect.com/*"
zone_name = "anti-detect.com"
```

### 8.2 Domain Structure

| Domain | Purpose | Hosting |
|--------|---------|---------|
| anti-detect.com | Main website | Cloudflare Pages |
| api.anti-detect.com | API endpoints | Cloudflare Workers |
| cdn.anti-detect.com | Static assets | Cloudflare R2 |

### 8.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm lint
      - run: pnpm typecheck

  deploy-api:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm --filter @anti-detect/api deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm --filter @anti-detect/web build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: anti-detect
          directory: apps/web/out
```

---

## 9. Integration Points

### 9.1 Third-Party Services

| Service | Purpose | Integration |
|---------|---------|-------------|
| Cloudflare Turnstile | Human verification | Client-side widget |
| IPInfo.io | IP geolocation | Server-side API |
| Plausible | Analytics | Script tag |
| Sentry | Error monitoring | SDK |

### 9.2 Affiliate Integration (Mutilogin)

```typescript
// CTA click tracking
interface CtaClick {
  source: 'scanner' | 'generator' | 'challenge' | 'learn';
  checkId?: string;           // Which failed check triggered click
  score?: number;             // Trust score at time of click
  timestamp: number;
}

// Affiliate link format
const affiliateLink = 'https://mutilogin.com/?ref=antidetect';

// UTM tracking
const buildAffiliateUrl = (source: string, campaign?: string) => {
  const params = new URLSearchParams({
    ref: 'antidetect',
    utm_source: 'antidetect',
    utm_medium: source,
    utm_campaign: campaign || 'scanner',
  });
  return `https://mutilogin.com/?${params}`;
};
```

---

## 10. Document References

| Document | Purpose |
|----------|---------|
| [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) | Complete database specification |
| [API-SPECIFICATION.md](./API-SPECIFICATION.md) | All API endpoints |
| [COMPONENT-SPECIFICATIONS.md](./COMPONENT-SPECIFICATIONS.md) | UI component details |
| [SEO-CONTENT-STRATEGY.md](./SEO-CONTENT-STRATEGY.md) | Content and SEO plan |
| [ROUTING-DEPLOYMENT.md](./ROUTING-DEPLOYMENT.md) | Routes and deployment |
| [DEVELOPMENT-PHASES.md](./DEVELOPMENT-PHASES.md) | Implementation roadmap |
| [TESTING-STRATEGY.md](./TESTING-STRATEGY.md) | Testing approach |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-01 | Initial blueprint |

---

**END OF BLUEPRINT**
