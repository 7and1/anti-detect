# Anti-detect.com API Specification

**Version:** 1.0
**Last Updated:** 2025-12-01
**OpenAPI Version:** 3.0.3

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [Rate Limiting](#3-rate-limiting)
4. [Error Handling](#4-error-handling)
5. [Endpoints](#5-endpoints)
   - [5.1 Scan Endpoints](#51-scan-endpoints)
   - [5.2 Generator Endpoints](#52-generator-endpoints)
   - [5.3 Challenge Endpoints](#53-challenge-endpoints)
   - [5.4 Report Endpoints](#54-report-endpoints)
   - [5.5 IP Endpoints](#55-ip-endpoints)
   - [5.6 Public Endpoints](#56-public-endpoints)
6. [TypeScript Types](#6-typescript-types)
7. [Zod Validation Schemas](#7-zod-validation-schemas)
8. [Hono.js Implementation](#8-honojs-implementation)
9. [CORS Configuration](#9-cors-configuration)
10. [Cloudflare Worker Setup](#10-cloudflare-worker-setup)

---

## 1. Overview

The Anti-detect.com API is built on **Hono.js** running on **Cloudflare Workers**, providing global edge computing with sub-50ms latency. The API powers browser fingerprint detection, generation, and analysis.

### 1.1 Base URL

```
Production:  https://api.anti-detect.com
Development: http://localhost:8787
```

### 1.2 Architecture

```
┌─────────────────────────────────────────────────┐
│          Cloudflare Edge (Global POPs)          │
├─────────────────────────────────────────────────┤
│                  Hono.js Router                  │
│  ├─ Middleware: Rate Limiting, CORS, Auth      │
│  ├─ Request Validation: Zod Schemas            │
│  └─ Response Formatting: Standardized Errors   │
├─────────────────────────────────────────────────┤
│               Data Layer                         │
│  ├─ Cloudflare D1 (SQLite)                     │
│  ├─ Cloudflare KV (Cache)                      │
│  └─ Cloudflare R2 (PDF Reports)                │
└─────────────────────────────────────────────────┘
```

### 1.3 Content Types

All endpoints accept and return `application/json` unless specified otherwise.

---

## 2. Authentication

### 2.1 API Key Strategy

API keys are required for all endpoints except public health checks. This enables future monetization with tiered access.

#### Request Header

```http
Authorization: Bearer <api_key>
```

#### Example

```bash
curl -H "Authorization: Bearer sk_live_abc123xyz" \
  https://api.anti-detect.com/api/scan/start
```

### 2.2 API Key Tiers (Future Monetization)

| Tier | Rate Limit | Features | Price |
|------|------------|----------|-------|
| Free | 100 req/day | Basic scan, Generate (limited) | $0 |
| Pro | 10,000 req/day | Full access, PDF export | $29/mo |
| Enterprise | Unlimited | SLA, Custom integration | Custom |

### 2.3 Authentication Errors

```typescript
// 401 Unauthorized
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid API key",
    "statusCode": 401
  }
}

// 403 Forbidden
{
  "error": {
    "code": "FORBIDDEN",
    "message": "API key does not have access to this resource",
    "statusCode": 403
  }
}
```

---

## 3. Rate Limiting

### 3.1 Token Bucket Implementation

Each endpoint has independent rate limits tracked per IP address using Cloudflare KV.

```typescript
interface RateLimitConfig {
  endpoint: string;
  maxTokens: number;      // Bucket capacity
  refillRate: number;     // Tokens per second
  windowSeconds: number;  // Time window
}

const rateLimits: Record<string, RateLimitConfig> = {
  '/api/scan/start': {
    maxTokens: 20,
    refillRate: 0.0056,  // ~20 per hour
    windowSeconds: 3600
  },
  '/api/generate': {
    maxTokens: 50,
    refillRate: 0.0139,  // ~50 per hour
    windowSeconds: 3600
  },
  '/api/challenge/start': {
    maxTokens: 30,
    refillRate: 0.0083,  // ~30 per hour
    windowSeconds: 3600
  },
  '/api/report/create': {
    maxTokens: 10,
    refillRate: 0.0028,  // ~10 per hour
    windowSeconds: 3600
  }
};
```

### 3.2 Rate Limit Headers

```http
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1638360000
```

### 3.3 Rate Limit Exceeded Response

```typescript
// 429 Too Many Requests
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again in 1800 seconds.",
    "statusCode": 429,
    "retryAfter": 1800
  }
}
```

---

## 4. Error Handling

### 4.1 Standardized Error Format

```typescript
interface ApiError {
  error: {
    code: ErrorCode;
    message: string;
    statusCode: number;
    details?: Record<string, unknown>;
    requestId?: string;
  };
}

type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';
```

### 4.2 HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 201 | Created | Resource created (report, session) |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing/invalid API key |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Temporary unavailability |

### 4.3 Validation Errors

```typescript
// 422 Unprocessable Entity
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "statusCode": 422,
    "details": {
      "fields": {
        "os": "Invalid value. Expected: Windows | macOS | Linux | Android | iOS",
        "browser": "Required field missing"
      }
    }
  }
}
```

---

## 5. Endpoints

### 5.1 Scan Endpoints

#### 5.1.1 POST /api/scan/start

Initialize a new fingerprint scan session and extract IP information.

**Request:**

```http
POST /api/scan/start
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "clientIP": "192.168.1.1",  // Optional: auto-detected if not provided
  "userAgent": "Mozilla/5.0..."
}
```

**Zod Schema:**

```typescript
import { z } from 'zod';

const ScanStartSchema = z.object({
  clientIP: z.string().ip().optional(),
  userAgent: z.string().min(1).optional()
});
```

**Response (201 Created):**

```typescript
{
  "sessionId": "scan_1a2b3c4d5e6f",
  "createdAt": "2025-12-01T12:00:00.000Z",
  "expiresAt": "2025-12-01T13:00:00.000Z",
  "ipInfo": {
    "ip": "192.168.1.1",
    "country": "US",
    "city": "New York",
    "region": "NY",
    "timezone": "America/New_York",
    "isp": "Comcast Cable",
    "asn": "AS7922",
    "isProxy": false,
    "isTor": false,
    "isDatacenter": false,
    "isVPN": false,
    "threatScore": 0  // 0-100
  }
}
```

**TypeScript Interface:**

```typescript
interface ScanStartRequest {
  clientIP?: string;
  userAgent?: string;
}

interface ScanStartResponse {
  sessionId: string;
  createdAt: string;
  expiresAt: string;
  ipInfo: IPInfo;
}

interface IPInfo {
  ip: string;
  country: string;
  city: string;
  region: string;
  timezone: string;
  isp: string;
  asn: string;
  isProxy: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  isVPN: boolean;
  threatScore: number;
}
```

**Hono Implementation:**

```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const app = new Hono();

app.post('/api/scan/start', zValidator('json', ScanStartSchema), async (c) => {
  const { clientIP, userAgent } = c.req.valid('json');

  // Auto-detect IP if not provided
  const ip = clientIP || c.req.header('CF-Connecting-IP') || '';
  const ua = userAgent || c.req.header('User-Agent') || '';

  // Extract IP info from Cloudflare headers
  const ipInfo = await getIPInfo(ip, c);

  // Generate session ID
  const sessionId = `scan_${generateId()}`;

  // Store session in KV (1 hour TTL)
  await c.env.KV.put(
    `session:${sessionId}`,
    JSON.stringify({ ip, userAgent: ua, createdAt: Date.now() }),
    { expirationTtl: 3600 }
  );

  return c.json({
    sessionId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    ipInfo
  }, 201);
});
```

---

#### 5.1.2 POST /api/scan/collect

Submit fingerprint data and receive analysis with trust score.

**Request:**

```http
POST /api/scan/collect
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "sessionId": "scan_1a2b3c4d5e6f",
  "fingerprint": {
    "navigator": {
      "userAgent": "Mozilla/5.0...",
      "platform": "Win32",
      "hardwareConcurrency": 8,
      "deviceMemory": 8,
      "maxTouchPoints": 0,
      "languages": ["en-US", "en"],
      "language": "en-US",
      "plugins": [],
      "webdriver": false
    },
    "screen": {
      "width": 1920,
      "height": 1080,
      "availWidth": 1920,
      "availHeight": 1040,
      "colorDepth": 24,
      "pixelDepth": 24,
      "devicePixelRatio": 1
    },
    "graphics": {
      "canvas": {
        "hash": "a1b2c3d4...",
        "noiseLevel": 0
      },
      "webgl": {
        "vendor": "Google Inc. (NVIDIA)",
        "renderer": "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060...)",
        "version": "WebGL 2.0",
        "shadingLanguageVersion": "WebGL GLSL ES 3.00",
        "unmaskedVendor": "NVIDIA Corporation",
        "unmaskedRenderer": "NVIDIA GeForce RTX 3060"
      }
    },
    "audio": {
      "hash": "e5f6g7h8...",
      "sampleRate": 48000,
      "channelCount": 2
    },
    "fonts": {
      "detected": ["Arial", "Helvetica", "Times New Roman", "..."],
      "hash": "i9j0k1l2..."
    },
    "locale": {
      "timezone": "America/New_York",
      "timezoneOffset": -300,
      "languages": ["en-US", "en"],
      "language": "en-US"
    },
    "network": {
      "webrtcLeaked": false,
      "localIPs": [],
      "publicIPs": []
    },
    "automation": {
      "webdriver": false,
      "headlessIndicators": [],
      "cdpTraces": []
    }
  }
}
```

**Zod Schema:**

```typescript
const FingerprintSchema = z.object({
  navigator: z.object({
    userAgent: z.string(),
    platform: z.string(),
    hardwareConcurrency: z.number().int().min(1).max(128),
    deviceMemory: z.number().optional(),
    maxTouchPoints: z.number().int().min(0),
    languages: z.array(z.string()),
    language: z.string(),
    plugins: z.array(z.any()),
    webdriver: z.boolean()
  }),
  screen: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    availWidth: z.number().int().positive(),
    availHeight: z.number().int().positive(),
    colorDepth: z.number().int(),
    pixelDepth: z.number().int(),
    devicePixelRatio: z.number().positive()
  }),
  graphics: z.object({
    canvas: z.object({
      hash: z.string(),
      noiseLevel: z.number().min(0).max(100)
    }),
    webgl: z.object({
      vendor: z.string(),
      renderer: z.string(),
      version: z.string(),
      shadingLanguageVersion: z.string(),
      unmaskedVendor: z.string(),
      unmaskedRenderer: z.string()
    })
  }),
  audio: z.object({
    hash: z.string(),
    sampleRate: z.number(),
    channelCount: z.number()
  }),
  fonts: z.object({
    detected: z.array(z.string()),
    hash: z.string()
  }),
  locale: z.object({
    timezone: z.string(),
    timezoneOffset: z.number(),
    languages: z.array(z.string()),
    language: z.string()
  }),
  network: z.object({
    webrtcLeaked: z.boolean(),
    localIPs: z.array(z.string()),
    publicIPs: z.array(z.string())
  }),
  automation: z.object({
    webdriver: z.boolean(),
    headlessIndicators: z.array(z.string()),
    cdpTraces: z.array(z.string())
  })
});

const ScanCollectSchema = z.object({
  sessionId: z.string().regex(/^scan_[a-z0-9]+$/),
  fingerprint: FingerprintSchema
});
```

**Response (200 OK):**

```typescript
{
  "sessionId": "scan_1a2b3c4d5e6f",
  "trustScore": {
    "overall": 73,
    "grade": "C",
    "layers": {
      "network": {
        "score": 85,
        "weight": 0.20,
        "status": "pass",
        "checks": [
          {
            "id": "ip-check",
            "name": "IP Address",
            "status": "pass",
            "value": "192.168.1.1",
            "message": null
          },
          {
            "id": "webrtc-leak",
            "name": "WebRTC Leak",
            "status": "pass",
            "value": false,
            "message": null
          }
        ]
      },
      "navigator": {
        "score": 60,
        "weight": 0.15,
        "status": "warn",
        "checks": [
          {
            "id": "platform-ua-consistency",
            "name": "Platform/UA Consistency",
            "status": "warn",
            "value": "Win32 / Windows NT 10.0",
            "expected": "Consistent",
            "message": "Platform and UA match but minor version mismatch detected"
          }
        ]
      },
      "graphics": {
        "score": 40,
        "weight": 0.20,
        "status": "fail",
        "checks": [
          {
            "id": "webgl-renderer",
            "name": "WebGL Renderer",
            "status": "fail",
            "value": "SwiftShader",
            "expected": "Hardware GPU",
            "message": "Software renderer detected (indicates headless/VM)"
          }
        ]
      },
      "audio": {
        "score": 100,
        "weight": 0.10,
        "status": "pass",
        "checks": []
      },
      "fonts": {
        "score": 90,
        "weight": 0.10,
        "status": "pass",
        "checks": []
      },
      "locale": {
        "score": 70,
        "weight": 0.10,
        "status": "warn",
        "checks": [
          {
            "id": "timezone-ip-consistency",
            "name": "Timezone/IP Consistency",
            "status": "warn",
            "value": "America/Los_Angeles vs America/New_York (IP)",
            "message": "Timezone doesn't match IP geolocation"
          }
        ]
      },
      "automation": {
        "score": 100,
        "weight": 0.15,
        "status": "pass",
        "checks": [
          {
            "id": "webdriver-flag",
            "name": "WebDriver Flag",
            "status": "pass",
            "value": false
          }
        ]
      }
    },
    "criticalIssues": [
      {
        "layerId": "graphics",
        "checkId": "webgl-renderer",
        "message": "Software renderer detected (indicates headless/VM)",
        "severity": "critical",
        "recommendation": "Use a real GPU or configure hardware acceleration",
        "mutiloginCTA": "Mutilogin provides real hardware fingerprints with GPU support"
      }
    ],
    "warnings": [
      {
        "layerId": "locale",
        "checkId": "timezone-ip-consistency",
        "message": "Timezone doesn't match IP geolocation",
        "severity": "warning",
        "recommendation": "Set timezone to match your IP location"
      }
    ]
  },
  "consistencyReport": {
    "totalPenalty": 27,
    "criticalFailures": 1,
    "warnings": 2,
    "rulesEvaluated": 15,
    "ruleResults": [
      {
        "ruleId": "gpu-os-mismatch",
        "ruleName": "GPU/OS Mismatch",
        "severity": "critical",
        "passed": true,
        "penalty": 0
      },
      {
        "ruleId": "webgl-swiftshader",
        "ruleName": "SwiftShader Detection",
        "severity": "critical",
        "passed": false,
        "penalty": 15,
        "message": "Software renderer detected"
      }
    ]
  }
}
```

**TypeScript Interface:**

```typescript
interface ScanCollectRequest {
  sessionId: string;
  fingerprint: FingerprintData;
}

interface ScanCollectResponse {
  sessionId: string;
  trustScore: TrustScore;
  consistencyReport: ConsistencyReport;
}

interface TrustScore {
  overall: number;
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
  score: number;
  weight: number;
  status: 'pass' | 'warn' | 'fail';
  checks: CheckResult[];
}

interface CheckResult {
  id: string;
  name: string;
  status: 'pass' | 'warn' | 'fail';
  value: string | number | boolean;
  expected?: string;
  message?: string;
}

interface Issue {
  layerId: string;
  checkId: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  recommendation?: string;
  mutiloginCTA?: string;
}

interface ConsistencyReport {
  totalPenalty: number;
  criticalFailures: number;
  warnings: number;
  rulesEvaluated: number;
  ruleResults: RuleResult[];
}

interface RuleResult {
  ruleId: string;
  ruleName: string;
  severity: 'critical' | 'warning' | 'info';
  passed: boolean;
  penalty: number;
  message?: string;
}
```

**Hono Implementation:**

```typescript
app.post('/api/scan/collect', zValidator('json', ScanCollectSchema), async (c) => {
  const { sessionId, fingerprint } = c.req.valid('json');

  // Verify session exists and not expired
  const session = await c.env.KV.get(`session:${sessionId}`);
  if (!session) {
    return c.json({
      error: {
        code: 'NOT_FOUND',
        message: 'Session not found or expired',
        statusCode: 404
      }
    }, 404);
  }

  // Calculate trust score
  const trustScore = await calculateTrustScore(fingerprint, JSON.parse(session));

  // Run consistency checks
  const consistencyReport = await runConsistencyChecks(fingerprint);

  return c.json({
    sessionId,
    trustScore,
    consistencyReport
  });
});
```

---

#### 5.1.3 GET /api/scan/status/:sessionId

Check the status of an ongoing scan session.

**Request:**

```http
GET /api/scan/status/scan_1a2b3c4d5e6f
Authorization: Bearer <api_key>
```

**Response (200 OK):**

```typescript
{
  "sessionId": "scan_1a2b3c4d5e6f",
  "status": "completed" | "pending" | "expired",
  "createdAt": "2025-12-01T12:00:00.000Z",
  "expiresAt": "2025-12-01T13:00:00.000Z",
  "completedAt": "2025-12-01T12:05:00.000Z",
  "hasResults": true
}
```

**Response (404 Not Found):**

```typescript
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Session not found",
    "statusCode": 404
  }
}
```

---

### 5.2 Generator Endpoints

#### 5.2.1 GET /api/generate

Generate a verified fingerprint based on query parameters.

**Request:**

```http
GET /api/generate?os=Windows&browser=Chrome&quality=premium&screenResolution=1920x1080
Authorization: Bearer <api_key>
```

**Query Parameters:**

```typescript
interface GenerateQuery {
  os: 'Windows' | 'macOS' | 'Linux' | 'Android' | 'iOS';
  browser: 'Chrome' | 'Firefox' | 'Safari' | 'Edge';
  osVersion?: string;
  browserVersion?: string;
  screenResolution?: '1920x1080' | '1440x900' | '2560x1440' | '1366x768' | 'random';
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  quality?: 'standard' | 'premium' | 'verified';  // Default: standard
}
```

**Zod Schema:**

```typescript
const GenerateQuerySchema = z.object({
  os: z.enum(['Windows', 'macOS', 'Linux', 'Android', 'iOS']),
  browser: z.enum(['Chrome', 'Firefox', 'Safari', 'Edge']),
  osVersion: z.string().optional(),
  browserVersion: z.string().optional(),
  screenResolution: z.enum(['1920x1080', '1440x900', '2560x1440', '1366x768', 'random']).optional(),
  deviceType: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  quality: z.enum(['standard', 'premium', 'verified']).default('standard')
});
```

**Response (200 OK):**

```typescript
{
  "id": "fp_9z8y7x6w5v",
  "fingerprint": {
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "platform": "Win32",
    "screen": {
      "width": 1920,
      "height": 1080,
      "availWidth": 1920,
      "availHeight": 1040,
      "colorDepth": 24,
      "pixelDepth": 24,
      "devicePixelRatio": 1
    },
    "hardware": {
      "hardwareConcurrency": 8,
      "deviceMemory": 8,
      "maxTouchPoints": 0
    },
    "webgl": {
      "vendor": "Google Inc. (NVIDIA)",
      "renderer": "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Ti Direct3D11 vs_5_0 ps_5_0)",
      "version": "WebGL 2.0 (OpenGL ES 3.0 Chromium)",
      "shadingLanguageVersion": "WebGL GLSL ES 3.00 (OpenGL ES GLSL ES 3.0 Chromium)",
      "unmaskedVendor": "Google Inc. (NVIDIA)",
      "unmaskedRenderer": "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Ti Direct3D11 vs_5_0 ps_5_0)"
    },
    "locale": {
      "timezone": "America/New_York",
      "timezoneOffset": -300,
      "languages": ["en-US", "en"],
      "language": "en-US"
    },
    "fonts": [
      "Arial", "Arial Black", "Calibri", "Cambria", "Cambria Math",
      "Comic Sans MS", "Consolas", "Courier New", "Georgia", "Helvetica",
      "Impact", "Lucida Console", "Segoe UI", "Tahoma", "Times New Roman",
      "Trebuchet MS", "Verdana"
    ],
    "hashes": {
      "canvas": "a1b2c3d4e5f6g7h8i9j0",
      "audio": "k1l2m3n4o5p6q7r8s9t0",
      "webgl": "u1v2w3x4y5z6a7b8c9d0",
      "fonts": "e1f2g3h4i5j6k7l8m9n0"
    }
  },
  "metadata": {
    "id": "fp_9z8y7x6w5v",
    "qualityScore": 95,
    "source": "verified",
    "collectedAt": "2025-11-28T10:30:00.000Z",
    "osVersion": "Windows 10",
    "browserVersion": "Chrome 120.0.0.0",
    "deviceType": "desktop"
  }
}
```

**TypeScript Interface:**

```typescript
interface GenerateResponse {
  id: string;
  fingerprint: GeneratedFingerprint;
  metadata: FingerprintMetadata;
}

interface GeneratedFingerprint {
  userAgent: string;
  platform: string;
  screen: ScreenInfo;
  hardware: HardwareInfo;
  webgl: WebGLInfo;
  locale: LocaleInfo;
  fonts: string[];
  hashes: FingerprintHashes;
}

interface ScreenInfo {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelDepth: number;
  devicePixelRatio: number;
}

interface HardwareInfo {
  hardwareConcurrency: number;
  deviceMemory: number;
  maxTouchPoints: number;
}

interface WebGLInfo {
  vendor: string;
  renderer: string;
  version: string;
  shadingLanguageVersion: string;
  unmaskedVendor: string;
  unmaskedRenderer: string;
}

interface LocaleInfo {
  timezone: string;
  timezoneOffset: number;
  languages: string[];
  language: string;
}

interface FingerprintHashes {
  canvas: string;
  audio: string;
  webgl: string;
  fonts: string;
}

interface FingerprintMetadata {
  id: string;
  qualityScore: number;
  source: 'verified' | 'real_traffic' | 'manual';
  collectedAt: string;
  osVersion: string;
  browserVersion: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
}
```

**Hono Implementation:**

```typescript
app.get('/api/generate', zValidator('query', GenerateQuerySchema), async (c) => {
  const params = c.req.valid('query');

  // Query D1 database for matching fingerprint
  const result = await c.env.DB.prepare(`
    SELECT * FROM fingerprints
    WHERE os = ?
      AND browser = ?
      AND (? IS NULL OR verified = true)
    ORDER BY RANDOM()
    LIMIT 1
  `).bind(
    params.os,
    params.browser,
    params.quality === 'verified' ? 1 : null
  ).first();

  if (!result) {
    return c.json({
      error: {
        code: 'NOT_FOUND',
        message: 'No fingerprints found matching criteria',
        statusCode: 404
      }
    }, 404);
  }

  // Transform DB result to API response
  const fingerprint = transformDbFingerprint(result);

  return c.json({
    id: result.id,
    fingerprint,
    metadata: {
      id: result.id,
      qualityScore: result.quality_score || 80,
      source: result.source,
      collectedAt: result.created_at,
      osVersion: result.os_version,
      browserVersion: result.browser_version,
      deviceType: result.device_type || 'desktop'
    }
  });
});
```

---

#### 5.2.2 GET /api/generate/export/:format

Export generated fingerprint in specific format (Puppeteer, Playwright, Selenium, etc.).

**Request:**

```http
GET /api/generate/export/puppeteer?fingerprintId=fp_9z8y7x6w5v
Authorization: Bearer <api_key>
```

**Path Parameters:**

- `format`: `puppeteer` | `playwright` | `selenium` | `mutilogin` | `json`

**Query Parameters:**

```typescript
interface ExportQuery {
  fingerprintId: string;  // Required
}
```

**Response (200 OK) - Puppeteer Format:**

```typescript
{
  "format": "puppeteer",
  "code": "const puppeteer = require('puppeteer');\n\nconst browser = await puppeteer.launch({\n  headless: false,\n  args: [\n    '--window-size=1920,1080',\n    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'\n  ]\n});\n\nconst page = await browser.newPage();\n\nawait page.setViewport({\n  width: 1920,\n  height: 1080,\n  deviceScaleFactor: 1\n});\n\nawait page.evaluateOnNewDocument(() => {\n  Object.defineProperty(navigator, 'hardwareConcurrency', {\n    get: () => 8\n  });\n  Object.defineProperty(navigator, 'deviceMemory', {\n    get: () => 8\n  });\n  Object.defineProperty(navigator, 'platform', {\n    get: () => 'Win32'\n  });\n  Object.defineProperty(navigator, 'languages', {\n    get: () => ['en-US', 'en']\n  });\n});",
  "language": "javascript",
  "instructions": "1. Install Puppeteer: npm install puppeteer\n2. Copy the code above into your script\n3. Run with: node script.js"
}
```

**Response (200 OK) - Playwright Format:**

```typescript
{
  "format": "playwright",
  "code": "const { chromium } = require('playwright');\n\nconst browser = await chromium.launch({\n  headless: false\n});\n\nconst context = await browser.newContext({\n  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',\n  viewport: { width: 1920, height: 1080 },\n  deviceScaleFactor: 1,\n  locale: 'en-US',\n  timezoneId: 'America/New_York'\n});\n\nawait context.addInitScript(() => {\n  Object.defineProperty(navigator, 'hardwareConcurrency', {\n    get: () => 8\n  });\n  Object.defineProperty(navigator, 'deviceMemory', {\n    get: () => 8\n  });\n});\n\nconst page = await context.newPage();",
  "language": "javascript",
  "instructions": "1. Install Playwright: npm install playwright\n2. Copy the code above into your script\n3. Run with: node script.js"
}
```

**Response (200 OK) - Selenium Format:**

```typescript
{
  "format": "selenium",
  "code": "from selenium import webdriver\nfrom selenium.webdriver.chrome.options import Options\n\noptions = Options()\noptions.add_argument('--window-size=1920,1080')\noptions.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')\n\ndriver = webdriver.Chrome(options=options)\n\n# Override navigator properties\ndriver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {\n  'source': '''\n    Object.defineProperty(navigator, 'hardwareConcurrency', {\n      get: () => 8\n    });\n    Object.defineProperty(navigator, 'deviceMemory', {\n      get: () => 8\n    });\n    Object.defineProperty(navigator, 'platform', {\n      get: () => 'Win32'\n    });\n  '''\n})\n\ndriver.get('https://example.com')",
  "language": "python",
  "instructions": "1. Install Selenium: pip install selenium\n2. Download ChromeDriver matching your Chrome version\n3. Copy the code above into your Python script\n4. Run with: python script.py"
}
```

---

#### 5.2.3 GET /api/generate/stats

Get statistics on available fingerprints by OS and browser.

**Request:**

```http
GET /api/generate/stats
Authorization: Bearer <api_key>
```

**Response (200 OK):**

```typescript
{
  "totalFingerprints": 127543,
  "verifiedFingerprints": 45231,
  "lastUpdated": "2025-12-01T08:00:00.000Z",
  "byOS": {
    "Windows": 68234,
    "macOS": 32145,
    "Linux": 12098,
    "Android": 10456,
    "iOS": 4610
  },
  "byBrowser": {
    "Chrome": 78901,
    "Firefox": 23456,
    "Safari": 18765,
    "Edge": 6421
  },
  "byDeviceType": {
    "desktop": 98765,
    "mobile": 21234,
    "tablet": 7544
  },
  "qualityDistribution": {
    "verified": 45231,
    "premium": 62312,
    "standard": 20000
  }
}
```

---

### 5.3 Challenge Endpoints

#### 5.3.1 POST /api/challenge/start

Start a new challenge arena session.

**Request:**

```http
POST /api/challenge/start
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "metadata": {
    "setup": "Puppeteer + Stealth Plugin",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Zod Schema:**

```typescript
const ChallengeStartSchema = z.object({
  metadata: z.object({
    setup: z.string().optional(),
    userAgent: z.string().optional()
  }).optional()
});
```

**Response (201 Created):**

```typescript
{
  "challengeId": "chal_a1b2c3d4e5f6",
  "createdAt": "2025-12-01T12:00:00.000Z",
  "expiresAt": "2025-12-01T12:30:00.000Z",
  "levels": [
    { "level": 1, "name": "Basic JS", "status": "pending", "points": 100 },
    { "level": 2, "name": "Headless Hunter", "status": "locked", "points": 200 },
    { "level": 3, "name": "TLS Inspector", "status": "locked", "points": 300 },
    { "level": 4, "name": "Human Verification", "status": "locked", "points": 400 }
  ]
}
```

---

#### 5.3.2 POST /api/challenge/level/:level

Submit results for a specific challenge level.

**Request:**

```http
POST /api/challenge/level/1
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "challengeId": "chal_a1b2c3d4e5f6",
  "results": {
    "checks": [
      { "id": "navigator-exists", "passed": true },
      { "id": "webdriver-flag", "passed": true },
      { "id": "plugins-count", "passed": false },
      { "id": "languages-array", "passed": true },
      { "id": "permission-api", "passed": true }
    ]
  }
}
```

**Zod Schema:**

```typescript
const ChallengeLevelSchema = z.object({
  challengeId: z.string().regex(/^chal_[a-z0-9]+$/),
  results: z.object({
    checks: z.array(z.object({
      id: z.string(),
      passed: z.boolean()
    }))
  })
});
```

**Response (200 OK):**

```typescript
{
  "challengeId": "chal_a1b2c3d4e5f6",
  "level": 1,
  "levelName": "Basic JS",
  "passed": false,
  "score": 0.8,
  "pointsEarned": 0,
  "totalPoints": 0,
  "checks": [
    { "id": "navigator-exists", "name": "Navigator Object", "passed": true },
    { "id": "webdriver-flag", "name": "WebDriver Flag", "passed": true },
    { "id": "plugins-count", "name": "Plugins Count", "passed": false, "message": "No plugins detected (suspicious)" },
    { "id": "languages-array", "name": "Languages Array", "passed": true },
    { "id": "permission-api", "name": "Permission API", "passed": true }
  ],
  "failedChecks": [
    {
      "id": "plugins-count",
      "name": "Plugins Count",
      "message": "No plugins detected (suspicious)",
      "recommendation": "Configure your automation tool to include plugin signatures"
    }
  ],
  "nextLevel": null,
  "recommendation": "You must pass all checks to proceed to Level 2. Mutilogin Cloud automatically configures plugins for realistic browser behavior."
}
```

---

#### 5.3.3 POST /api/challenge/tls

Get TLS fingerprint analysis (server-side check).

**Request:**

```http
POST /api/challenge/tls
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "challengeId": "chal_a1b2c3d4e5f6"
}
```

**Response (200 OK):**

```typescript
{
  "challengeId": "chal_a1b2c3d4e5f6",
  "tls": {
    "ja3Hash": "771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,29-23-24,0",
    "ja3": "4d7a2b413d2e5c5c3c6b7a3b2c1d1e1f",
    "ja4Hash": "t13d1516h2_8daaf6152771_e5627efa2ab1",
    "expectedBrowser": "Chrome 120",
    "actualUA": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "isConsistent": true,
    "score": 1.0,
    "details": {
      "tlsVersion": "TLS 1.3",
      "cipherSuites": ["TLS_AES_128_GCM_SHA256", "TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256"],
      "extensions": [0, 23, 65281, 10, 11, 35, 16, 5, 13, 18, 51, 45, 43, 27, 21],
      "ellipticCurves": [29, 23, 24]
    }
  },
  "passed": true,
  "message": "TLS fingerprint matches claimed browser"
}
```

**TypeScript Interface:**

```typescript
interface TLSAnalysisResponse {
  challengeId: string;
  tls: {
    ja3Hash: string;
    ja3: string;
    ja4Hash: string;
    expectedBrowser: string;
    actualUA: string;
    isConsistent: boolean;
    score: number;
    details: {
      tlsVersion: string;
      cipherSuites: string[];
      extensions: number[];
      ellipticCurves: number[];
    };
  };
  passed: boolean;
  message: string;
}
```

**Hono Implementation:**

```typescript
app.post('/api/challenge/tls', zValidator('json', z.object({
  challengeId: z.string()
})), async (c) => {
  const { challengeId } = c.req.valid('json');

  // Extract TLS fingerprint from Cloudflare request metadata
  const ja3Hash = c.req.raw.cf?.tlsClientAuth?.certIssuerDNLegacy || '';
  const tlsVersion = c.req.raw.cf?.tlsVersion || '';

  // Get User-Agent
  const userAgent = c.req.header('User-Agent') || '';

  // Validate JA3 matches UA
  const expectedBrowser = getBrowserFromUA(userAgent);
  const isConsistent = validateJA3(ja3Hash, expectedBrowser);

  return c.json({
    challengeId,
    tls: {
      ja3Hash,
      ja3: ja3Hash,
      ja4Hash: generateJA4(c.req.raw),
      expectedBrowser,
      actualUA: userAgent,
      isConsistent,
      score: isConsistent ? 1.0 : 0.0,
      details: {
        tlsVersion,
        cipherSuites: [],
        extensions: [],
        ellipticCurves: []
      }
    },
    passed: isConsistent,
    message: isConsistent ? 'TLS fingerprint matches claimed browser' : 'TLS fingerprint mismatch'
  });
});
```

---

#### 5.3.4 POST /api/challenge/verify

Verify Cloudflare Turnstile token (Level 4).

**Request:**

```http
POST /api/challenge/verify
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "challengeId": "chal_a1b2c3d4e5f6",
  "turnstileToken": "0.ABC123..."
}
```

**Zod Schema:**

```typescript
const ChallengeVerifySchema = z.object({
  challengeId: z.string(),
  turnstileToken: z.string()
});
```

**Response (200 OK):**

```typescript
{
  "challengeId": "chal_a1b2c3d4e5f6",
  "verified": true,
  "score": 0.9,
  "passed": true,
  "message": "Human verification successful"
}
```

**Hono Implementation:**

```typescript
app.post('/api/challenge/verify', zValidator('json', ChallengeVerifySchema), async (c) => {
  const { challengeId, turnstileToken } = c.req.valid('json');

  // Verify Turnstile token with Cloudflare
  const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: c.env.TURNSTILE_SECRET_KEY,
      response: turnstileToken
    })
  });

  const result = await verifyResponse.json();

  return c.json({
    challengeId,
    verified: result.success,
    score: result.score || 0,
    passed: result.success && result.score >= 0.7,
    message: result.success ? 'Human verification successful' : 'Verification failed'
  });
});
```

---

### 5.4 Report Endpoints

#### 5.4.1 POST /api/report/create

Create a shareable report from scan results.

**Request:**

```http
POST /api/report/create
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "sessionId": "scan_1a2b3c4d5e6f",
  "trustScore": { ... },  // Full trust score object
  "options": {
    "includeRawData": false,
    "expiresInDays": 30
  }
}
```

**Zod Schema:**

```typescript
const ReportCreateSchema = z.object({
  sessionId: z.string(),
  trustScore: z.any(),  // TrustScore type
  options: z.object({
    includeRawData: z.boolean().default(false),
    expiresInDays: z.number().int().min(1).max(365).default(30)
  }).optional()
});
```

**Response (201 Created):**

```typescript
{
  "reportId": "report_x1y2z3a4b5c6",
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "shareUrl": "https://anti-detect.com/report/550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2025-12-01T12:00:00.000Z",
  "expiresAt": "2025-12-31T12:00:00.000Z",
  "pdfUrl": "https://api.anti-detect.com/api/report/550e8400-e29b-41d4-a716-446655440000/pdf"
}
```

**TypeScript Interface:**

```typescript
interface ReportCreateRequest {
  sessionId: string;
  trustScore: TrustScore;
  options?: {
    includeRawData?: boolean;
    expiresInDays?: number;
  };
}

interface ReportCreateResponse {
  reportId: string;
  uuid: string;
  shareUrl: string;
  createdAt: string;
  expiresAt: string;
  pdfUrl: string;
}
```

**Hono Implementation:**

```typescript
app.post('/api/report/create', zValidator('json', ReportCreateSchema), async (c) => {
  const { sessionId, trustScore, options } = c.req.valid('json');

  // Generate UUID for report
  const uuid = crypto.randomUUID();
  const reportId = `report_${generateId()}`;

  // Calculate expiration
  const expiresInDays = options?.expiresInDays || 30;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  // Store in D1
  await c.env.DB.prepare(`
    INSERT INTO reports (uuid, session_id, trust_score, expires_at)
    VALUES (?, ?, ?, ?)
  `).bind(uuid, sessionId, JSON.stringify(trustScore), expiresAt.toISOString()).run();

  return c.json({
    reportId,
    uuid,
    shareUrl: `https://anti-detect.com/report/${uuid}`,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    pdfUrl: `https://api.anti-detect.com/api/report/${uuid}/pdf`
  }, 201);
});
```

---

#### 5.4.2 GET /api/report/:uuid

Get report data by UUID.

**Request:**

```http
GET /api/report/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**

```typescript
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "trustScore": { ... },
  "createdAt": "2025-12-01T12:00:00.000Z",
  "expiresAt": "2025-12-31T12:00:00.000Z",
  "isExpired": false
}
```

**Response (404 Not Found):**

```typescript
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Report not found or expired",
    "statusCode": 404
  }
}
```

---

#### 5.4.3 GET /api/report/:uuid/pdf

Download report as PDF.

**Request:**

```http
GET /api/report/550e8400-e29b-41d4-a716-446655440000/pdf
```

**Response (200 OK):**

```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="anti-detect-report-550e8400.pdf"

[PDF Binary Data]
```

**Hono Implementation:**

```typescript
app.get('/api/report/:uuid/pdf', async (c) => {
  const uuid = c.req.param('uuid');

  // Fetch report from D1
  const report = await c.env.DB.prepare(`
    SELECT * FROM reports WHERE uuid = ? AND expires_at > datetime('now')
  `).bind(uuid).first();

  if (!report) {
    return c.json({
      error: {
        code: 'NOT_FOUND',
        message: 'Report not found or expired',
        statusCode: 404
      }
    }, 404);
  }

  // Check if PDF exists in R2
  const pdfKey = `reports/${uuid}.pdf`;
  let pdfObject = await c.env.R2.get(pdfKey);

  // Generate PDF if not cached
  if (!pdfObject) {
    const pdfBuffer = await generatePDF(JSON.parse(report.trust_score));
    await c.env.R2.put(pdfKey, pdfBuffer, {
      httpMetadata: { contentType: 'application/pdf' }
    });
    pdfObject = await c.env.R2.get(pdfKey);
  }

  // Return PDF
  return new Response(pdfObject.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="anti-detect-report-${uuid.slice(0, 8)}.pdf"`
    }
  });
});
```

---

#### 5.4.4 DELETE /api/report/:uuid

Delete a report (owner only, requires matching sessionId).

**Request:**

```http
DELETE /api/report/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "sessionId": "scan_1a2b3c4d5e6f"
}
```

**Response (204 No Content):**

```
(Empty body)
```

**Response (403 Forbidden):**

```typescript
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to delete this report",
    "statusCode": 403
  }
}
```

---

### 5.5 IP Endpoints

#### 5.5.1 GET /api/ip/check

Comprehensive IP analysis including geolocation, proxy detection, and blacklist checking.

**Request:**

```http
GET /api/ip/check?ip=192.168.1.1
Authorization: Bearer <api_key>
```

**Query Parameters:**

```typescript
interface IPCheckQuery {
  ip?: string;  // Optional: defaults to requester's IP
}
```

**Response (200 OK):**

```typescript
{
  "ip": "192.168.1.1",
  "geolocation": {
    "country": "US",
    "countryName": "United States",
    "city": "New York",
    "region": "NY",
    "regionName": "New York",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "timezone": "America/New_York",
    "postalCode": "10001"
  },
  "network": {
    "isp": "Comcast Cable Communications",
    "organization": "Comcast Cable",
    "asn": "AS7922",
    "asnOrganization": "Comcast Cable Communications, LLC"
  },
  "security": {
    "isProxy": false,
    "isTor": false,
    "isVPN": false,
    "isDatacenter": false,
    "isHosting": false,
    "isCrawler": false,
    "threatScore": 0,  // 0-100
    "threatLevel": "low",  // low | medium | high | critical
    "blacklists": []
  },
  "dns": {
    "hostname": "c-192-168-1-1.hsd1.ny.comcast.net",
    "reverseDNS": "c-192-168-1-1.hsd1.ny.comcast.net"
  }
}
```

**TypeScript Interface:**

```typescript
interface IPCheckResponse {
  ip: string;
  geolocation: {
    country: string;
    countryName: string;
    city: string;
    region: string;
    regionName: string;
    latitude: number;
    longitude: number;
    timezone: string;
    postalCode: string;
  };
  network: {
    isp: string;
    organization: string;
    asn: string;
    asnOrganization: string;
  };
  security: {
    isProxy: boolean;
    isTor: boolean;
    isVPN: boolean;
    isDatacenter: boolean;
    isHosting: boolean;
    isCrawler: boolean;
    threatScore: number;
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    blacklists: string[];
  };
  dns: {
    hostname: string;
    reverseDNS: string;
  };
}
```

**Hono Implementation:**

```typescript
app.get('/api/ip/check', async (c) => {
  const queryIP = c.req.query('ip');
  const ip = queryIP || c.req.header('CF-Connecting-IP') || '';

  // Check KV cache first
  const cacheKey = `ip:${ip}`;
  const cached = await c.env.KV.get(cacheKey);
  if (cached) {
    return c.json(JSON.parse(cached));
  }

  // Extract from Cloudflare metadata
  const cf = c.req.raw.cf || {};

  const result: IPCheckResponse = {
    ip,
    geolocation: {
      country: cf.country as string || '',
      countryName: getCountryName(cf.country as string),
      city: cf.city as string || '',
      region: cf.region as string || '',
      regionName: cf.regionCode as string || '',
      latitude: cf.latitude as number || 0,
      longitude: cf.longitude as number || 0,
      timezone: cf.timezone as string || '',
      postalCode: cf.postalCode as string || ''
    },
    network: {
      isp: cf.asOrganization as string || '',
      organization: cf.asOrganization as string || '',
      asn: `AS${cf.asn}` || '',
      asnOrganization: cf.asOrganization as string || ''
    },
    security: {
      isProxy: false,
      isTor: cf.isTorExitNode as boolean || false,
      isVPN: false,
      isDatacenter: false,
      isHosting: false,
      isCrawler: false,
      threatScore: 0,
      threatLevel: 'low',
      blacklists: []
    },
    dns: {
      hostname: '',
      reverseDNS: ''
    }
  };

  // Cache for 1 hour
  await c.env.KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 });

  return c.json(result);
});
```

---

#### 5.5.2 GET /api/ip/dns-leak

DNS leak test endpoints.

**Request:**

```http
GET /api/ip/dns-leak
Authorization: Bearer <api_key>
```

**Response (200 OK):**

```typescript
{
  "testId": "dns_test_a1b2c3",
  "endpoints": [
    "https://dns1.anti-detect.com/leak/dns_test_a1b2c3",
    "https://dns2.anti-detect.com/leak/dns_test_a1b2c3",
    "https://dns3.anti-detect.com/leak/dns_test_a1b2c3"
  ],
  "instructions": "Resolve each endpoint and visit the URLs. Results will be collected automatically.",
  "resultsUrl": "https://api.anti-detect.com/api/ip/dns-leak/dns_test_a1b2c3/results",
  "expiresAt": "2025-12-01T12:15:00.000Z"
}
```

---

### 5.6 Public Endpoints

#### 5.6.1 GET /api/health

Health check endpoint (no authentication required).

**Request:**

```http
GET /api/health
```

**Response (200 OK):**

```typescript
{
  "status": "healthy",
  "timestamp": "2025-12-01T12:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": "operational",
    "cache": "operational",
    "storage": "operational"
  }
}
```

**Hono Implementation:**

```typescript
app.get('/api/health', async (c) => {
  // Check D1
  let dbStatus = 'operational';
  try {
    await c.env.DB.prepare('SELECT 1').first();
  } catch {
    dbStatus = 'degraded';
  }

  // Check KV
  let kvStatus = 'operational';
  try {
    await c.env.KV.get('health-check');
  } catch {
    kvStatus = 'degraded';
  }

  // Check R2
  let r2Status = 'operational';
  try {
    await c.env.R2.head('health-check');
  } catch {
    r2Status = 'degraded';
  }

  const allHealthy = dbStatus === 'operational' && kvStatus === 'operational' && r2Status === 'operational';

  return c.json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: dbStatus,
      cache: kvStatus,
      storage: r2Status
    }
  }, allHealthy ? 200 : 503);
});
```

---

#### 5.6.2 GET /api/stats

Public statistics (no authentication required).

**Request:**

```http
GET /api/stats
```

**Response (200 OK):**

```typescript
{
  "scansToday": 12543,
  "scansTotal": 1234567,
  "reportsShared": 45678,
  "fingerprintsAvailable": 127543,
  "lastUpdated": "2025-12-01T12:00:00.000Z"
}
```

---

## 6. TypeScript Types

Complete TypeScript type definitions for all API entities.

```typescript
// ============================================
// Core Fingerprint Types
// ============================================

interface FingerprintData {
  navigator: NavigatorData;
  screen: ScreenData;
  graphics: GraphicsData;
  audio: AudioData;
  fonts: FontsData;
  locale: LocaleData;
  network: NetworkData;
  automation: AutomationData;
}

interface NavigatorData {
  userAgent: string;
  platform: string;
  hardwareConcurrency: number;
  deviceMemory?: number;
  maxTouchPoints: number;
  languages: string[];
  language: string;
  plugins: PluginData[];
  webdriver: boolean;
}

interface PluginData {
  name: string;
  description: string;
  filename: string;
  mimeTypes: MimeTypeData[];
}

interface MimeTypeData {
  type: string;
  description: string;
  suffixes: string;
}

interface ScreenData {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelDepth: number;
  devicePixelRatio: number;
}

interface GraphicsData {
  canvas: CanvasData;
  webgl: WebGLData;
}

interface CanvasData {
  hash: string;
  noiseLevel: number;
}

interface WebGLData {
  vendor: string;
  renderer: string;
  version: string;
  shadingLanguageVersion: string;
  unmaskedVendor: string;
  unmaskedRenderer: string;
}

interface AudioData {
  hash: string;
  sampleRate: number;
  channelCount: number;
}

interface FontsData {
  detected: string[];
  hash: string;
}

interface LocaleData {
  timezone: string;
  timezoneOffset: number;
  languages: string[];
  language: string;
}

interface NetworkData {
  webrtcLeaked: boolean;
  localIPs: string[];
  publicIPs: string[];
}

interface AutomationData {
  webdriver: boolean;
  headlessIndicators: string[];
  cdpTraces: string[];
}

// ============================================
// Scan Types
// ============================================

interface ScanSession {
  sessionId: string;
  ip: string;
  userAgent: string;
  createdAt: number;
  expiresAt: number;
}

interface TrustScore {
  overall: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  layers: LayerScores;
  criticalIssues: Issue[];
  warnings: Issue[];
}

interface LayerScores {
  network: LayerScore;
  navigator: LayerScore;
  graphics: LayerScore;
  audio: LayerScore;
  fonts: LayerScore;
  locale: LayerScore;
  automation: LayerScore;
}

interface LayerScore {
  score: number;
  weight: number;
  status: 'pass' | 'warn' | 'fail';
  checks: CheckResult[];
}

interface CheckResult {
  id: string;
  name: string;
  status: 'pass' | 'warn' | 'fail';
  value: string | number | boolean;
  expected?: string;
  message?: string;
}

interface Issue {
  layerId: string;
  checkId: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  recommendation?: string;
  mutiloginCTA?: string;
}

interface ConsistencyReport {
  totalPenalty: number;
  criticalFailures: number;
  warnings: number;
  rulesEvaluated: number;
  ruleResults: RuleResult[];
}

interface RuleResult {
  ruleId: string;
  ruleName: string;
  severity: 'critical' | 'warning' | 'info';
  passed: boolean;
  penalty: number;
  message?: string;
}

// ============================================
// Generator Types
// ============================================

interface GeneratedFingerprint {
  userAgent: string;
  platform: string;
  screen: ScreenInfo;
  hardware: HardwareInfo;
  webgl: WebGLInfo;
  locale: LocaleInfo;
  fonts: string[];
  hashes: FingerprintHashes;
}

interface ScreenInfo {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelDepth: number;
  devicePixelRatio: number;
}

interface HardwareInfo {
  hardwareConcurrency: number;
  deviceMemory: number;
  maxTouchPoints: number;
}

interface WebGLInfo {
  vendor: string;
  renderer: string;
  version: string;
  shadingLanguageVersion: string;
  unmaskedVendor: string;
  unmaskedRenderer: string;
}

interface LocaleInfo {
  timezone: string;
  timezoneOffset: number;
  languages: string[];
  language: string;
}

interface FingerprintHashes {
  canvas: string;
  audio: string;
  webgl: string;
  fonts: string;
}

interface FingerprintMetadata {
  id: string;
  qualityScore: number;
  source: 'verified' | 'real_traffic' | 'manual';
  collectedAt: string;
  osVersion: string;
  browserVersion: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
}

// ============================================
// Challenge Types
// ============================================

interface ChallengeSession {
  challengeId: string;
  createdAt: string;
  expiresAt: string;
  levels: ChallengeLevel[];
}

interface ChallengeLevel {
  level: number;
  name: string;
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'locked';
  points: number;
}

// ============================================
// Report Types
// ============================================

interface Report {
  uuid: string;
  sessionId: string;
  trustScore: TrustScore;
  createdAt: string;
  expiresAt: string;
}

// ============================================
// IP Analysis Types
// ============================================

interface IPInfo {
  ip: string;
  country: string;
  city: string;
  region: string;
  timezone: string;
  isp: string;
  asn: string;
  isProxy: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  isVPN: boolean;
  threatScore: number;
}

// ============================================
// Error Types
// ============================================

interface ApiError {
  error: {
    code: ErrorCode;
    message: string;
    statusCode: number;
    details?: Record<string, unknown>;
    requestId?: string;
  };
}

type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';
```

---

## 7. Zod Validation Schemas

Complete Zod schemas for request validation.

```typescript
import { z } from 'zod';

// ============================================
// Scan Schemas
// ============================================

export const ScanStartSchema = z.object({
  clientIP: z.string().ip().optional(),
  userAgent: z.string().min(1).optional()
});

export const NavigatorSchema = z.object({
  userAgent: z.string(),
  platform: z.string(),
  hardwareConcurrency: z.number().int().min(1).max(128),
  deviceMemory: z.number().optional(),
  maxTouchPoints: z.number().int().min(0),
  languages: z.array(z.string()),
  language: z.string(),
  plugins: z.array(z.any()),
  webdriver: z.boolean()
});

export const ScreenSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  availWidth: z.number().int().positive(),
  availHeight: z.number().int().positive(),
  colorDepth: z.number().int(),
  pixelDepth: z.number().int(),
  devicePixelRatio: z.number().positive()
});

export const GraphicsSchema = z.object({
  canvas: z.object({
    hash: z.string(),
    noiseLevel: z.number().min(0).max(100)
  }),
  webgl: z.object({
    vendor: z.string(),
    renderer: z.string(),
    version: z.string(),
    shadingLanguageVersion: z.string(),
    unmaskedVendor: z.string(),
    unmaskedRenderer: z.string()
  })
});

export const AudioSchema = z.object({
  hash: z.string(),
  sampleRate: z.number(),
  channelCount: z.number()
});

export const FontsSchema = z.object({
  detected: z.array(z.string()),
  hash: z.string()
});

export const LocaleSchema = z.object({
  timezone: z.string(),
  timezoneOffset: z.number(),
  languages: z.array(z.string()),
  language: z.string()
});

export const NetworkSchema = z.object({
  webrtcLeaked: z.boolean(),
  localIPs: z.array(z.string()),
  publicIPs: z.array(z.string())
});

export const AutomationSchema = z.object({
  webdriver: z.boolean(),
  headlessIndicators: z.array(z.string()),
  cdpTraces: z.array(z.string())
});

export const FingerprintSchema = z.object({
  navigator: NavigatorSchema,
  screen: ScreenSchema,
  graphics: GraphicsSchema,
  audio: AudioSchema,
  fonts: FontsSchema,
  locale: LocaleSchema,
  network: NetworkSchema,
  automation: AutomationSchema
});

export const ScanCollectSchema = z.object({
  sessionId: z.string().regex(/^scan_[a-z0-9]+$/),
  fingerprint: FingerprintSchema
});

// ============================================
// Generator Schemas
// ============================================

export const GenerateQuerySchema = z.object({
  os: z.enum(['Windows', 'macOS', 'Linux', 'Android', 'iOS']),
  browser: z.enum(['Chrome', 'Firefox', 'Safari', 'Edge']),
  osVersion: z.string().optional(),
  browserVersion: z.string().optional(),
  screenResolution: z.enum(['1920x1080', '1440x900', '2560x1440', '1366x768', 'random']).optional(),
  deviceType: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  quality: z.enum(['standard', 'premium', 'verified']).default('standard')
});

export const ExportFormatSchema = z.enum(['puppeteer', 'playwright', 'selenium', 'mutilogin', 'json']);

// ============================================
// Challenge Schemas
// ============================================

export const ChallengeStartSchema = z.object({
  metadata: z.object({
    setup: z.string().optional(),
    userAgent: z.string().optional()
  }).optional()
});

export const ChallengeLevelSchema = z.object({
  challengeId: z.string().regex(/^chal_[a-z0-9]+$/),
  results: z.object({
    checks: z.array(z.object({
      id: z.string(),
      passed: z.boolean()
    }))
  })
});

export const ChallengeVerifySchema = z.object({
  challengeId: z.string(),
  turnstileToken: z.string()
});

// ============================================
// Report Schemas
// ============================================

export const ReportCreateSchema = z.object({
  sessionId: z.string(),
  trustScore: z.any(),
  options: z.object({
    includeRawData: z.boolean().default(false),
    expiresInDays: z.number().int().min(1).max(365).default(30)
  }).optional()
});

// ============================================
// IP Schemas
// ============================================

export const IPCheckQuerySchema = z.object({
  ip: z.string().ip().optional()
});
```

---

## 8. Hono.js Implementation

Complete Hono.js application structure.

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { zValidator } from '@hono/zod-validator';
import {
  ScanStartSchema,
  ScanCollectSchema,
  GenerateQuerySchema,
  ChallengeStartSchema,
  ChallengeLevelSchema,
  ReportCreateSchema
} from './schemas';

// ============================================
// Environment Bindings
// ============================================

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  TURNSTILE_SECRET_KEY: string;
  API_KEY_SECRET: string;
}

// ============================================
// Hono App
// ============================================

const app = new Hono<{ Bindings: Env }>();

// ============================================
// Middleware
// ============================================

// CORS
app.use('*', cors({
  origin: ['https://anti-detect.com', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400,
  credentials: true
}));

// Logger
app.use('*', logger());

// Authentication (except public routes)
app.use('/api/*', async (c, next) => {
  const publicPaths = ['/api/health', '/api/stats'];
  if (publicPaths.includes(c.req.path)) {
    return next();
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid API key',
        statusCode: 401
      }
    }, 401);
  }

  const apiKey = authHeader.substring(7);

  // Validate API key (simple check for now)
  // TODO: Implement proper API key validation with database
  if (!apiKey || apiKey.length < 10) {
    return c.json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid API key',
        statusCode: 401
      }
    }, 401);
  }

  return next();
});

// Rate Limiting
app.use('/api/*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || '';
  const path = c.req.path;

  const rateLimitKey = `ratelimit:${ip}:${path}`;
  const limit = await c.env.KV.get(rateLimitKey);

  // Simple token bucket implementation
  const maxRequests = 60;
  const windowSeconds = 60;

  if (limit) {
    const count = parseInt(limit, 10);
    if (count >= maxRequests) {
      return c.json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded. Please try again later.',
          statusCode: 429,
          retryAfter: windowSeconds
        }
      }, 429);
    }
    await c.env.KV.put(rateLimitKey, (count + 1).toString(), { expirationTtl: windowSeconds });
  } else {
    await c.env.KV.put(rateLimitKey, '1', { expirationTtl: windowSeconds });
  }

  return next();
});

// ============================================
// Routes
// ============================================

// Health Check
app.get('/api/health', async (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'operational',
      cache: 'operational',
      storage: 'operational'
    }
  });
});

// Public Stats
app.get('/api/stats', async (c) => {
  // Fetch from D1
  const scansTotal = await c.env.DB.prepare('SELECT COUNT(*) as count FROM scans').first();

  return c.json({
    scansToday: 0,  // TODO: Implement daily counter
    scansTotal: scansTotal?.count || 0,
    reportsShared: 0,  // TODO: Implement
    fingerprintsAvailable: 127543,
    lastUpdated: new Date().toISOString()
  });
});

// ============================================
// Scan Routes
// ============================================

app.post('/api/scan/start', zValidator('json', ScanStartSchema), async (c) => {
  const { clientIP, userAgent } = c.req.valid('json');

  const ip = clientIP || c.req.header('CF-Connecting-IP') || '';
  const ua = userAgent || c.req.header('User-Agent') || '';

  const sessionId = `scan_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

  // Store session in KV
  await c.env.KV.put(
    `session:${sessionId}`,
    JSON.stringify({ ip, userAgent: ua, createdAt: Date.now() }),
    { expirationTtl: 3600 }
  );

  // Get IP info from Cloudflare
  const cf = c.req.raw.cf || {};

  return c.json({
    sessionId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    ipInfo: {
      ip,
      country: cf.country as string || 'Unknown',
      city: cf.city as string || 'Unknown',
      region: cf.region as string || 'Unknown',
      timezone: cf.timezone as string || 'UTC',
      isp: cf.asOrganization as string || 'Unknown',
      asn: `AS${cf.asn}` || 'Unknown',
      isProxy: false,
      isTor: cf.isTorExitNode as boolean || false,
      isDatacenter: false,
      isVPN: false,
      threatScore: 0
    }
  }, 201);
});

app.post('/api/scan/collect', zValidator('json', ScanCollectSchema), async (c) => {
  const { sessionId, fingerprint } = c.req.valid('json');

  // Verify session
  const session = await c.env.KV.get(`session:${sessionId}`);
  if (!session) {
    return c.json({
      error: {
        code: 'NOT_FOUND',
        message: 'Session not found or expired',
        statusCode: 404
      }
    }, 404);
  }

  // TODO: Implement trust score calculation
  const trustScore = {
    overall: 73,
    grade: 'C' as const,
    layers: {},
    criticalIssues: [],
    warnings: []
  };

  return c.json({
    sessionId,
    trustScore,
    consistencyReport: {
      totalPenalty: 0,
      criticalFailures: 0,
      warnings: 0,
      rulesEvaluated: 0,
      ruleResults: []
    }
  });
});

// ============================================
// Generator Routes
// ============================================

app.get('/api/generate', zValidator('query', GenerateQuerySchema), async (c) => {
  const params = c.req.valid('query');

  // Query fingerprint from D1
  const result = await c.env.DB.prepare(`
    SELECT * FROM fingerprints
    WHERE os = ? AND browser = ?
    ORDER BY RANDOM()
    LIMIT 1
  `).bind(params.os, params.browser).first();

  if (!result) {
    return c.json({
      error: {
        code: 'NOT_FOUND',
        message: 'No fingerprints found matching criteria',
        statusCode: 404
      }
    }, 404);
  }

  // TODO: Transform DB result to API response
  return c.json({
    id: `fp_${crypto.randomUUID().slice(0, 16)}`,
    fingerprint: {},
    metadata: {}
  });
});

// ============================================
// Export
// ============================================

export default app;
```

---

## 9. CORS Configuration

```typescript
import { cors } from 'hono/cors';

const corsConfig = {
  origin: (origin: string) => {
    const allowedOrigins = [
      'https://anti-detect.com',
      'https://www.anti-detect.com',
      'http://localhost:3000',
      'http://localhost:5173'
    ];

    if (allowedOrigins.includes(origin)) {
      return origin;
    }

    return allowedOrigins[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Request-ID'
  ],
  maxAge: 86400,
  credentials: true
};

app.use('*', cors(corsConfig));
```

---

## 10. Cloudflare Worker Setup

### 10.1 wrangler.toml

```toml
name = "anti-detect-api"
main = "src/index.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "production"

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "anti-detect"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# KV Namespace
[[kv_namespaces]]
binding = "KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# R2 Bucket
[[r2_buckets]]
binding = "R2"
bucket_name = "anti-detect-reports"

# Analytics Engine
[observability]
enabled = true
head_sampling_rate = 0.1

# Routes
[[routes]]
pattern = "api.anti-detect.com/*"
zone_name = "anti-detect.com"

# Cron Triggers (for cleanup)
[triggers]
crons = ["0 0 * * *"]  # Daily cleanup at midnight
```

### 10.2 Database Schema (D1)

```sql
-- Fingerprints table
CREATE TABLE IF NOT EXISTS fingerprints (
  id TEXT PRIMARY KEY,
  os TEXT NOT NULL,
  os_version TEXT,
  browser TEXT NOT NULL,
  browser_version TEXT,
  user_agent TEXT NOT NULL,
  platform TEXT NOT NULL,
  screen_width INTEGER,
  screen_height INTEGER,
  device_pixel_ratio REAL,
  hardware_concurrency INTEGER,
  device_memory INTEGER,
  max_touch_points INTEGER,
  webgl_vendor TEXT,
  webgl_renderer TEXT,
  timezone TEXT,
  languages TEXT,
  fonts TEXT,
  canvas_hash TEXT,
  audio_hash TEXT,
  webgl_hash TEXT,
  fonts_hash TEXT,
  quality_score INTEGER DEFAULT 80,
  source TEXT,
  verified BOOLEAN DEFAULT 0,
  device_type TEXT DEFAULT 'desktop',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_os_browser ON fingerprints(os, browser);
CREATE INDEX idx_verified ON fingerprints(verified);
CREATE INDEX idx_quality ON fingerprints(quality_score);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  uuid TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  trust_score TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_expires ON reports(expires_at);

-- Scans table (for analytics)
CREATE TABLE IF NOT EXISTS scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  trust_score INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_created ON scans(created_at);
```

### 10.3 Deployment Commands

```bash
# Install dependencies
npm install hono @hono/zod-validator zod

# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create anti-detect

# Run migrations
npx wrangler d1 execute anti-detect --file=./schema.sql

# Create KV namespace
npx wrangler kv:namespace create "KV"

# Create R2 bucket
npx wrangler r2 bucket create anti-detect-reports

# Deploy to production
npx wrangler deploy
```

---

## End of API Specification

**Document Version:** 1.0
**Last Updated:** 2025-12-01
**Maintained By:** Anti-detect.com Engineering Team

For questions or issues, please contact: api@anti-detect.com
