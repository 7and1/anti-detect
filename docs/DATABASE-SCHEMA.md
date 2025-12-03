# Anti-detect.com Database Schema Specification

## Executive Summary

This document provides the complete production-grade database schema for Anti-detect.com, leveraging Cloudflare's edge infrastructure (D1 SQLite and KV stores). The database architecture is designed to handle 100K+ fingerprints, scale to millions of scans, and deliver sub-100ms query performance globally.

**Last Updated:** 2024-12-01
**Version:** 1.0
**Status:** Production Ready

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Cloudflare D1 Tables](#2-cloudflare-d1-tables)
3. [Cloudflare KV Namespaces](#3-cloudflare-kv-namespaces)
4. [Cloudflare R2 Buckets](#4-cloudflare-r2-buckets)
5. [Migration Files](#5-migration-files)
6. [Seed Data Strategy](#6-seed-data-strategy)
7. [Query Patterns & Optimization](#7-query-patterns--optimization)
8. [Data Retention Policies](#8-data-retention-policies)
9. [Backup & Recovery](#9-backup--recovery)
10. [Performance Benchmarks](#10-performance-benchmarks)
11. [Security Considerations](#11-security-considerations)

---

## 1. Architecture Overview

### 1.1 Database Stack

```
┌─────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE D1 (PRIMARY)                    │
│                     SQLite at Edge                           │
├─────────────────────────────────────────────────────────────┤
│  ├── fingerprints (100K+ records) - Read-heavy             │
│  ├── reports (Shareable scans) - Write-heavy               │
│  ├── scans_daily (Analytics) - Aggregated                  │
│  ├── ja3_fingerprints (TLS DB) - Read-heavy                │
│  └── rate_limits (API throttling) - Write-heavy            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              CLOUDFLARE KV (CACHE LAYER)                     │
├─────────────────────────────────────────────────────────────┤
│  ├── IP_CACHE (60min TTL) - Geolocation data               │
│  ├── JA3_DB (24hr TTL) - Fast TLS lookups                  │
│  ├── RATE_LIMITS (60min TTL) - Token bucket state          │
│  └── SESSIONS (15min TTL) - Temporary scan data            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               CLOUDFLARE R2 (OBJECT STORAGE)                 │
├─────────────────────────────────────────────────────────────┤
│  └── reports/ - PDF exports (30-day lifecycle)              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Read Optimization** | Heavy indexing on `fingerprints` table |
| **Write Efficiency** | Batched inserts for analytics |
| **Global Latency** | Edge replication via D1 |
| **Data Privacy** | No PII storage, anonymized IPs |
| **Scalability** | KV cache layer reduces D1 load |
| **Cost Efficiency** | 30-day TTL on reports, aggressive pruning |

### 1.3 Data Flow

```
User Request
     │
     ▼
[Check KV Cache] ──(Hit)──> Return Cached Data
     │
    (Miss)
     │
     ▼
[Query D1 Database]
     │
     ▼
[Cache Result in KV] ──> Return Data
     │
     ▼
[Log to Analytics]
```

---

## 2. Cloudflare D1 Tables

### 2.1 Table: `fingerprints`

**Purpose:** Real fingerprint library (100K+ verified records) used by the generator.

**Schema:**

```sql
CREATE TABLE fingerprints (
  -- Primary key
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Unique fingerprint identifier
  hash TEXT UNIQUE NOT NULL,                    -- SHA256 hash of full fingerprint

  -- Operating System
  os TEXT NOT NULL CHECK(os IN ('Windows', 'macOS', 'Linux', 'Android', 'iOS')),
  os_version TEXT NOT NULL,                     -- e.g., '10.0', '14.2', '22.04'

  -- Browser
  browser TEXT NOT NULL CHECK(browser IN ('Chrome', 'Firefox', 'Safari', 'Edge')),
  browser_version TEXT NOT NULL,                -- e.g., '121.0.6167.85'
  browser_build_number TEXT,                    -- Optional build number
  browser_release_date DATE,                    -- When browser version was released

  -- User Agent
  user_agent TEXT NOT NULL,                     -- Full UA string
  platform TEXT NOT NULL,                       -- navigator.platform value

  -- Screen
  screen_width INTEGER NOT NULL CHECK(screen_width > 0),
  screen_height INTEGER NOT NULL CHECK(screen_height > 0),
  device_pixel_ratio REAL NOT NULL DEFAULT 1.0 CHECK(device_pixel_ratio > 0),
  color_depth INTEGER NOT NULL DEFAULT 24 CHECK(color_depth IN (8, 16, 24, 30, 32)),

  -- Hardware
  hardware_concurrency INTEGER CHECK(hardware_concurrency > 0 AND hardware_concurrency <= 128),
  device_memory INTEGER CHECK(device_memory > 0 AND device_memory <= 512),  -- GB
  max_touch_points INTEGER NOT NULL DEFAULT 0 CHECK(max_touch_points >= 0 AND max_touch_points <= 10),

  -- WebGL
  webgl_vendor TEXT,                            -- e.g., 'Google Inc. (NVIDIA)'
  webgl_renderer TEXT,                          -- e.g., 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060...)'
  webgl_version TEXT,                           -- e.g., 'WebGL 1.0'
  webgl_shading_language_version TEXT,          -- e.g., 'WebGL GLSL ES 1.0'
  webgl_unmasked_vendor TEXT,                   -- Unmasked GPU vendor
  webgl_unmasked_renderer TEXT,                 -- Unmasked GPU renderer

  -- Locale
  timezone TEXT NOT NULL,                       -- IANA timezone, e.g., 'America/New_York'
  timezone_offset INTEGER NOT NULL,             -- Minutes offset from UTC
  languages TEXT NOT NULL,                      -- JSON array: ["en-US", "en"]

  -- Fonts (JSON array)
  fonts TEXT NOT NULL,                          -- e.g., ["Arial", "Times New Roman", ...]
  fonts_count INTEGER NOT NULL DEFAULT 0,       -- Number of detected fonts

  -- Fingerprint Hashes
  canvas_hash TEXT,                             -- Canvas fingerprint hash
  audio_hash TEXT,                              -- AudioContext fingerprint hash
  webgl_hash TEXT,                              -- WebGL fingerprint hash
  fonts_hash TEXT,                              -- Fonts fingerprint hash

  -- Quality Metrics
  quality_score INTEGER NOT NULL DEFAULT 50 CHECK(quality_score >= 0 AND quality_score <= 100),
  consistency_score INTEGER CHECK(consistency_score >= 0 AND consistency_score <= 100),

  -- Metadata
  source TEXT NOT NULL CHECK(source IN ('mutilogin', 'real_traffic', 'manual', 'verified', 'synthetic')),
  collected_at TIMESTAMP NOT NULL,              -- When fingerprint was collected
  is_active BOOLEAN NOT NULL DEFAULT TRUE,      -- Can be used by generator
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,   -- Manually verified as legitimate
  usage_count INTEGER NOT NULL DEFAULT 0,       -- Times used in generator

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_fingerprints_os_browser ON fingerprints(os, browser, is_active)
  WHERE is_active = TRUE;

CREATE INDEX idx_fingerprints_quality ON fingerprints(quality_score DESC, consistency_score DESC)
  WHERE is_active = TRUE;

CREATE INDEX idx_fingerprints_hash ON fingerprints(hash);

CREATE INDEX idx_fingerprints_source ON fingerprints(source)
  WHERE is_active = TRUE;

CREATE INDEX idx_fingerprints_os_version ON fingerprints(os, os_version, browser, browser_version)
  WHERE is_active = TRUE;

CREATE INDEX idx_fingerprints_verified ON fingerprints(is_verified, quality_score DESC)
  WHERE is_active = TRUE AND is_verified = TRUE;

CREATE INDEX idx_fingerprints_usage ON fingerprints(usage_count ASC, quality_score DESC)
  WHERE is_active = TRUE;

-- Trigger to update updated_at timestamp
CREATE TRIGGER fingerprints_updated_at
  AFTER UPDATE ON fingerprints
  FOR EACH ROW
BEGIN
  UPDATE fingerprints SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
```

**Estimated Size:**
- 100,000 records × ~2KB per record = ~200MB
- With indexes: ~300MB total

**Sample Record:**

```json
{
  "id": 12345,
  "hash": "a3f4e9c8d2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5",
  "os": "Windows",
  "os_version": "10.0",
  "browser": "Chrome",
  "browser_version": "121.0.6167.85",
  "browser_release_date": "2024-01-15",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "platform": "Win32",
  "screen_width": 1920,
  "screen_height": 1080,
  "device_pixel_ratio": 1.0,
  "color_depth": 24,
  "hardware_concurrency": 8,
  "device_memory": 8,
  "max_touch_points": 0,
  "webgl_vendor": "Google Inc. (NVIDIA)",
  "webgl_renderer": "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Ti Direct3D11 vs_5_0 ps_5_0)",
  "webgl_version": "WebGL 1.0 (OpenGL ES 2.0 Chromium)",
  "webgl_shading_language_version": "WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)",
  "timezone": "America/New_York",
  "timezone_offset": -300,
  "languages": "[\"en-US\",\"en\"]",
  "fonts": "[\"Arial\",\"Calibri\",\"Consolas\",\"Segoe UI\",\"Times New Roman\"]",
  "fonts_count": 45,
  "canvas_hash": "c4f3e2d1",
  "audio_hash": "a8f7e6d5",
  "webgl_hash": "f5e4d3c2",
  "fonts_hash": "d2c1b0a9",
  "quality_score": 85,
  "consistency_score": 92,
  "source": "verified",
  "collected_at": "2024-01-15T10:30:00Z",
  "is_active": true,
  "is_verified": true,
  "usage_count": 42,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-02-01T14:20:00Z"
}
```

---

### 2.2 Table: `reports`

**Purpose:** Shareable scan reports with permanent URLs (viral growth mechanism).

**Schema:**

```sql
CREATE TABLE reports (
  -- Primary key (UUID v4)
  id TEXT PRIMARY KEY CHECK(length(id) = 36),   -- e.g., '550e8400-e29b-41d4-a716-446655440000'

  -- Scan Data (JSON blob)
  scan_data TEXT NOT NULL,                      -- Complete scan results (compressed JSON)
  scan_data_version INTEGER NOT NULL DEFAULT 1, -- Schema version for backwards compatibility

  -- Trust Score Summary
  trust_score INTEGER NOT NULL CHECK(trust_score >= 0 AND trust_score <= 100),
  trust_grade TEXT NOT NULL CHECK(trust_grade IN ('A', 'B', 'C', 'D', 'F')),
  critical_issues_count INTEGER NOT NULL DEFAULT 0,
  warnings_count INTEGER NOT NULL DEFAULT 0,

  -- Anonymized client data
  ip_hash TEXT NOT NULL,                        -- SHA256(IP + salt) - never store real IP
  ip_country TEXT,                              -- 2-letter country code
  ip_city TEXT,                                 -- City name (optional)
  user_agent_hash TEXT,                         -- SHA256(UA)

  -- Timestamps
  created_at INTEGER NOT NULL,                  -- Unix timestamp
  expires_at INTEGER NOT NULL,                  -- Unix timestamp (30 days from creation)

  -- Analytics
  view_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at INTEGER,                       -- Unix timestamp

  -- Optional metadata
  share_source TEXT,                            -- Where report was shared (reddit, twitter, etc.)
  is_public BOOLEAN NOT NULL DEFAULT TRUE       -- Can be viewed by anyone
);

-- Indexes
CREATE INDEX idx_reports_expires ON reports(expires_at)
  WHERE expires_at > 0;

CREATE INDEX idx_reports_created ON reports(created_at DESC);

CREATE INDEX idx_reports_ip_hash ON reports(ip_hash, created_at DESC);

CREATE INDEX idx_reports_score ON reports(trust_score, created_at DESC)
  WHERE is_public = TRUE;

-- Trigger to increment view count
CREATE TRIGGER reports_increment_views
  AFTER UPDATE OF view_count ON reports
  FOR EACH ROW
BEGIN
  UPDATE reports SET last_viewed_at = unixepoch() WHERE id = NEW.id;
END;
```

**Estimated Size:**
- 1 million reports × ~10KB per report = ~10GB
- With 30-day TTL: ~300K active records = ~3GB

**Sample Record:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "scan_data": "{\"trustScore\":{\"overall\":73,\"grade\":\"C\",\"layers\":{...}},\"criticalIssues\":[...]}",
  "scan_data_version": 1,
  "trust_score": 73,
  "trust_grade": "C",
  "critical_issues_count": 2,
  "warnings_count": 5,
  "ip_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "ip_country": "US",
  "ip_city": "New York",
  "user_agent_hash": "d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3",
  "created_at": 1704124800,
  "expires_at": 1706716800,
  "view_count": 12,
  "last_viewed_at": 1704211200,
  "share_source": "reddit",
  "is_public": true
}
```

---

### 2.3 Table: `scans_daily`

**Purpose:** Daily analytics aggregation for performance tracking.

**Schema:**

```sql
CREATE TABLE scans_daily (
  -- Composite primary key
  date DATE PRIMARY KEY,                        -- e.g., '2024-01-15'

  -- Scan counts
  total_scans INTEGER NOT NULL DEFAULT 0,
  unique_ips INTEGER NOT NULL DEFAULT 0,        -- Approximate unique visitors

  -- Score distribution
  avg_trust_score REAL CHECK(avg_trust_score >= 0 AND avg_trust_score <= 100),
  median_trust_score INTEGER CHECK(median_trust_score >= 0 AND median_trust_score <= 100),

  -- Pass/Fail breakdown
  grade_a_count INTEGER NOT NULL DEFAULT 0,     -- 90-100
  grade_b_count INTEGER NOT NULL DEFAULT 0,     -- 75-89
  grade_c_count INTEGER NOT NULL DEFAULT 0,     -- 60-74
  grade_d_count INTEGER NOT NULL DEFAULT 0,     -- 40-59
  grade_f_count INTEGER NOT NULL DEFAULT 0,     -- 0-39

  -- Critical issues distribution
  total_critical_issues INTEGER NOT NULL DEFAULT 0,
  total_warnings INTEGER NOT NULL DEFAULT 0,

  -- Top failing layers (JSON array of layer IDs)
  top_failing_layers TEXT,                      -- e.g., '["network","automation"]'

  -- Browser/OS breakdown (JSON objects)
  browser_distribution TEXT,                    -- e.g., '{"Chrome":1200,"Firefox":300}'
  os_distribution TEXT,                         -- e.g., '{"Windows":1000,"macOS":400}'

  -- Geographic distribution (JSON object)
  country_distribution TEXT,                    -- e.g., '{"US":800,"GB":200}'

  -- Conversion metrics
  mutilogin_clicks INTEGER NOT NULL DEFAULT 0,
  report_shares INTEGER NOT NULL DEFAULT 0,
  generator_uses INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_scans_daily_date ON scans_daily(date DESC);

CREATE INDEX idx_scans_daily_scans ON scans_daily(total_scans DESC);

-- Trigger to update updated_at
CREATE TRIGGER scans_daily_updated_at
  AFTER UPDATE ON scans_daily
  FOR EACH ROW
BEGIN
  UPDATE scans_daily SET updated_at = CURRENT_TIMESTAMP WHERE date = NEW.date;
END;
```

**Estimated Size:**
- 365 days × ~2KB per record = ~730KB (negligible)

**Sample Record:**

```json
{
  "date": "2024-01-15",
  "total_scans": 1523,
  "unique_ips": 987,
  "avg_trust_score": 68.4,
  "median_trust_score": 71,
  "grade_a_count": 123,
  "grade_b_count": 456,
  "grade_c_count": 512,
  "grade_d_count": 289,
  "grade_f_count": 143,
  "total_critical_issues": 2341,
  "total_warnings": 4567,
  "top_failing_layers": "[\"network\",\"automation\",\"graphics\"]",
  "browser_distribution": "{\"Chrome\":1203,\"Firefox\":298,\"Safari\":22}",
  "os_distribution": "{\"Windows\":1045,\"macOS\":412,\"Linux\":66}",
  "country_distribution": "{\"US\":823,\"GB\":189,\"DE\":102,\"FR\":87}",
  "mutilogin_clicks": 234,
  "report_shares": 67,
  "generator_uses": 123,
  "created_at": "2024-01-15T00:00:00Z",
  "updated_at": "2024-01-15T23:59:59Z"
}
```

---

### 2.4 Table: `ja3_fingerprints`

**Purpose:** Known TLS fingerprint database for browser/automation detection.

**Schema:**

```sql
CREATE TABLE ja3_fingerprints (
  -- Primary key
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- TLS fingerprints
  ja3_hash TEXT UNIQUE NOT NULL,                -- MD5 hash of JA3 string
  ja3_string TEXT NOT NULL,                     -- Full JA3 string
  ja4_hash TEXT,                                -- JA4 hash (newer standard)
  ja4_string TEXT,                              -- Full JA4 string

  -- Identified browser/tool
  browser TEXT,                                 -- e.g., 'Chrome', 'Firefox', 'Puppeteer'
  browser_version TEXT,                         -- e.g., '121.0.6167.85'
  os TEXT,                                      -- e.g., 'Windows', 'macOS'
  os_version TEXT,                              -- e.g., '10.0', '14.2'

  -- Detection flags
  is_automation BOOLEAN NOT NULL DEFAULT FALSE, -- Known automation tool
  is_proxy BOOLEAN NOT NULL DEFAULT FALSE,      -- Known proxy client
  is_vpn BOOLEAN NOT NULL DEFAULT FALSE,        -- Known VPN client

  -- Automation tool identification
  automation_tool TEXT,                         -- e.g., 'Puppeteer', 'Selenium', 'Playwright'
  automation_tool_version TEXT,                 -- Tool version

  -- Confidence and usage
  confidence_score INTEGER NOT NULL DEFAULT 50 CHECK(confidence_score >= 0 AND confidence_score <= 100),
  detection_count INTEGER NOT NULL DEFAULT 0,   -- Times seen in the wild

  -- Metadata
  first_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source TEXT,                                  -- Where fingerprint was discovered
  notes TEXT,                                   -- Additional information

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX idx_ja3_hash ON ja3_fingerprints(ja3_hash);

CREATE INDEX idx_ja3_automation ON ja3_fingerprints(is_automation, confidence_score DESC)
  WHERE is_automation = TRUE;

CREATE INDEX idx_ja3_browser ON ja3_fingerprints(browser, browser_version);

CREATE INDEX idx_ja3_last_seen ON ja3_fingerprints(last_seen DESC);

-- Trigger to update last_seen and updated_at
CREATE TRIGGER ja3_fingerprints_update_timestamp
  AFTER UPDATE OF detection_count ON ja3_fingerprints
  FOR EACH ROW
BEGIN
  UPDATE ja3_fingerprints
  SET last_seen = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;
```

**Estimated Size:**
- 10,000 fingerprints × ~500 bytes per record = ~5MB

**Sample Record:**

```json
{
  "id": 567,
  "ja3_hash": "e7d705a3286e19ea42f587b344ee6865",
  "ja3_string": "771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,29-23-24,0",
  "ja4_hash": "t13d1516h2_8daaf6152771_02713d6af862",
  "browser": "Chrome",
  "browser_version": "121.0.6167.85",
  "os": "Windows",
  "os_version": "10.0",
  "is_automation": false,
  "is_proxy": false,
  "is_vpn": false,
  "automation_tool": null,
  "confidence_score": 95,
  "detection_count": 15234,
  "first_seen": "2024-01-10T08:30:00Z",
  "last_seen": "2024-02-01T14:22:00Z",
  "source": "real_traffic",
  "notes": "Legitimate Chrome 121 on Windows 10",
  "created_at": "2024-01-10T08:30:00Z",
  "updated_at": "2024-02-01T14:22:00Z"
}
```

---

### 2.5 Table: `rate_limits`

**Purpose:** API rate limiting tracking (backup to KV store).

**Schema:**

```sql
CREATE TABLE rate_limits (
  -- Composite primary key
  identifier TEXT NOT NULL,                     -- IP hash or API key hash
  endpoint TEXT NOT NULL,                       -- e.g., '/api/scan'
  window_start INTEGER NOT NULL,                -- Unix timestamp (start of window)

  -- Rate limit state
  request_count INTEGER NOT NULL DEFAULT 0,
  last_request INTEGER NOT NULL,                -- Unix timestamp

  -- Metadata
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  block_expires_at INTEGER,                     -- Unix timestamp

  PRIMARY KEY (identifier, endpoint, window_start)
);

-- Indexes
CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier, last_request DESC);

CREATE INDEX idx_rate_limits_blocked ON rate_limits(is_blocked, block_expires_at)
  WHERE is_blocked = TRUE;

CREATE INDEX idx_rate_limits_cleanup ON rate_limits(window_start)
  WHERE window_start < unixepoch() - 3600;  -- Cleanup entries older than 1 hour
```

**Estimated Size:**
- Transient data, cleaned up hourly
- ~100K active entries × ~100 bytes = ~10MB

**Sample Record:**

```json
{
  "identifier": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "endpoint": "/api/scan",
  "window_start": 1704124800,
  "request_count": 15,
  "last_request": 1704125400,
  "is_blocked": false,
  "block_expires_at": null
}
```

---

## 3. Cloudflare KV Namespaces

### 3.1 Namespace: `IP_CACHE`

**Purpose:** Cache IP geolocation data from IPInfo.io API (reduce external API calls).

**TTL:** 3600 seconds (1 hour)

**Key Format:** `ip:{ip_address}`

**Value Structure:**

```json
{
  "ip": "8.8.8.8",
  "city": "Mountain View",
  "region": "California",
  "country": "US",
  "country_name": "United States",
  "continent": "NA",
  "latitude": 37.386,
  "longitude": -122.084,
  "postal": "94035",
  "timezone": "America/Los_Angeles",
  "asn": {
    "asn": "AS15169",
    "name": "Google LLC",
    "domain": "google.com",
    "route": "8.8.8.0/24",
    "type": "hosting"
  },
  "company": {
    "name": "Google LLC",
    "domain": "google.com",
    "type": "hosting"
  },
  "privacy": {
    "vpn": false,
    "proxy": false,
    "tor": false,
    "relay": false,
    "hosting": true,
    "service": ""
  },
  "abuse": {
    "address": "US, CA, Mountain View, 1600 Amphitheatre Parkway, 94043",
    "country": "US",
    "email": "network-abuse@google.com",
    "name": "Abuse",
    "network": "8.8.8.0/24",
    "phone": "+1-650-253-0000"
  },
  "cached_at": 1704124800
}
```

**Usage Example:**

```typescript
// Check cache first
const cacheKey = `ip:${clientIP}`;
let ipData = await env.IP_CACHE.get(cacheKey, 'json');

if (!ipData) {
  // Cache miss - fetch from IPInfo
  const response = await fetch(`https://ipinfo.io/${clientIP}/json?token=${IPINFO_TOKEN}`);
  ipData = await response.json();
  ipData.cached_at = Date.now();

  // Store in cache with 1-hour TTL
  await env.IP_CACHE.put(cacheKey, JSON.stringify(ipData), {
    expirationTtl: 3600
  });
}
```

**Estimated Usage:**
- 10K unique IPs per day
- 1-hour TTL reduces IPInfo API calls by 95%
- Storage: ~10K entries × 1KB = ~10MB

---

### 3.2 Namespace: `JA3_DB`

**Purpose:** Fast TLS fingerprint lookup (hot cache for `ja3_fingerprints` table).

**TTL:** 86400 seconds (24 hours)

**Key Format:** `ja3:{ja3_hash}`

**Value Structure:**

```json
{
  "ja3_hash": "e7d705a3286e19ea42f587b344ee6865",
  "browser": "Chrome",
  "browser_version": "121.0.6167.85",
  "os": "Windows",
  "is_automation": false,
  "automation_tool": null,
  "confidence_score": 95,
  "cached_at": 1704124800
}
```

**Usage Example:**

```typescript
const ja3Hash = request.cf?.ja3Hash;
if (!ja3Hash) {
  return { detected: false, message: 'JA3 not available' };
}

// Check KV cache
const cacheKey = `ja3:${ja3Hash}`;
let ja3Data = await env.JA3_DB.get(cacheKey, 'json');

if (!ja3Data) {
  // Cache miss - query D1
  const result = await env.DB.prepare(
    'SELECT * FROM ja3_fingerprints WHERE ja3_hash = ?'
  ).bind(ja3Hash).first();

  if (result) {
    ja3Data = {
      ja3_hash: result.ja3_hash,
      browser: result.browser,
      browser_version: result.browser_version,
      os: result.os,
      is_automation: result.is_automation,
      automation_tool: result.automation_tool,
      confidence_score: result.confidence_score,
      cached_at: Date.now()
    };

    // Store in KV with 24-hour TTL
    await env.JA3_DB.put(cacheKey, JSON.stringify(ja3Data), {
      expirationTtl: 86400
    });
  }
}
```

**Estimated Usage:**
- 1,000 unique JA3 hashes
- 24-hour TTL
- Storage: ~1,000 entries × 200 bytes = ~200KB

---

### 3.3 Namespace: `RATE_LIMITS`

**Purpose:** Token bucket rate limiting state (fast read/write).

**TTL:** 3600 seconds (1 hour)

**Key Format:** `ratelimit:{identifier}:{endpoint}`

**Value Structure:**

```json
{
  "tokens": 18,
  "capacity": 20,
  "refill_rate": 5,
  "last_refill": 1704124800,
  "blocked_until": null
}
```

**Usage Example:**

```typescript
async function checkRateLimit(
  env: Env,
  identifier: string,
  endpoint: string,
  capacity: number = 20,
  refillRate: number = 5
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `ratelimit:${identifier}:${endpoint}`;

  // Get current state
  let state = await env.RATE_LIMITS.get(key, 'json');

  if (!state) {
    // Initialize new bucket
    state = {
      tokens: capacity - 1,
      capacity,
      refill_rate: refillRate,
      last_refill: Math.floor(Date.now() / 1000),
      blocked_until: null
    };
  } else {
    // Check if blocked
    if (state.blocked_until && Date.now() < state.blocked_until * 1000) {
      return { allowed: false, remaining: 0 };
    }

    // Refill tokens based on time elapsed
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - state.last_refill;
    const refillAmount = Math.floor(elapsed / 60) * refillRate; // Refill per minute

    if (refillAmount > 0) {
      state.tokens = Math.min(state.capacity, state.tokens + refillAmount);
      state.last_refill = now;
    }

    // Consume token
    state.tokens -= 1;
  }

  // Check if exhausted
  if (state.tokens < 0) {
    state.blocked_until = Math.floor(Date.now() / 1000) + 300; // Block for 5 minutes
    await env.RATE_LIMITS.put(key, JSON.stringify(state), { expirationTtl: 3600 });
    return { allowed: false, remaining: 0 };
  }

  // Update state
  await env.RATE_LIMITS.put(key, JSON.stringify(state), { expirationTtl: 3600 });

  return { allowed: true, remaining: state.tokens };
}
```

**Estimated Usage:**
- 50K active rate limit states
- Storage: ~50K entries × 100 bytes = ~5MB

---

### 3.4 Namespace: `SESSIONS`

**Purpose:** Temporary scan session data (multi-step scan process).

**TTL:** 900 seconds (15 minutes)

**Key Format:** `session:{session_id}`

**Value Structure:**

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "step": "collecting",
  "client_data": {
    "ip_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "user_agent": "Mozilla/5.0 ...",
    "started_at": 1704124800
  },
  "collected_data": {
    "network": { /* ... */ },
    "navigator": { /* ... */ }
  },
  "created_at": 1704124800,
  "expires_at": 1704125700
}
```

**Usage Example:**

```typescript
// Step 1: Start scan (create session)
const sessionId = crypto.randomUUID();
const session = {
  session_id: sessionId,
  step: 'started',
  client_data: {
    ip_hash: await hashIP(clientIP),
    user_agent: request.headers.get('User-Agent'),
    started_at: Math.floor(Date.now() / 1000)
  },
  collected_data: {},
  created_at: Math.floor(Date.now() / 1000),
  expires_at: Math.floor(Date.now() / 1000) + 900
};

await env.SESSIONS.put(`session:${sessionId}`, JSON.stringify(session), {
  expirationTtl: 900
});

// Step 2: Collect fingerprint data
const storedSession = await env.SESSIONS.get(`session:${sessionId}`, 'json');
if (!storedSession) {
  return new Response('Session expired', { status: 410 });
}

storedSession.collected_data = fingerprintData;
storedSession.step = 'analyzing';

await env.SESSIONS.put(`session:${sessionId}`, JSON.stringify(storedSession), {
  expirationTtl: 900
});
```

**Estimated Usage:**
- 5K concurrent sessions
- Storage: ~5K entries × 10KB = ~50MB

---

## 4. Cloudflare R2 Buckets

### 4.1 Bucket: `anti-detect-reports`

**Purpose:** PDF report storage for shareable scan results.

**Lifecycle Policy:** 30-day TTL (automatic deletion after 30 days)

**Directory Structure:**

```
anti-detect-reports/
├── 2024/
│   ├── 01/
│   │   ├── 15/
│   │   │   ├── 550e8400-e29b-41d4-a716-446655440000.pdf
│   │   │   ├── 661f9510-f3ac-52e5-b827-557766551111.pdf
│   │   │   └── ...
│   │   └── ...
│   └── ...
└── ...
```

**Object Metadata:**

```json
{
  "customMetadata": {
    "report_id": "550e8400-e29b-41d4-a716-446655440000",
    "trust_score": "73",
    "trust_grade": "C",
    "created_at": "1704124800",
    "ip_country": "US"
  }
}
```

**Usage Example:**

```typescript
// Generate PDF and upload to R2
const pdfBuffer = await generatePDFReport(scanData);
const reportId = crypto.randomUUID();
const date = new Date();
const key = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${reportId}.pdf`;

await env.R2.put(key, pdfBuffer, {
  httpMetadata: {
    contentType: 'application/pdf',
    cacheControl: 'public, max-age=2592000' // 30 days
  },
  customMetadata: {
    report_id: reportId,
    trust_score: String(scanData.trustScore.overall),
    trust_grade: scanData.trustScore.grade,
    created_at: String(Math.floor(Date.now() / 1000)),
    ip_country: scanData.network.ipInfo.country
  }
});

// Generate public URL
const publicUrl = `https://cdn.anti-detect.com/reports/${key}`;
```

**Estimated Usage:**
- 10K reports per day
- 30-day retention = ~300K active reports
- Average 500KB per PDF
- Total: 300K × 500KB = ~150GB

**Cost Estimate (Cloudflare R2):**
- Storage: $0.015/GB/month × 150GB = **$2.25/month**
- Class A operations (writes): $4.50/million × 10K/day × 30 = **$1.35/month**
- Class B operations (reads): $0.36/million × 100K/day × 30 = **$1.08/month**
- **Total: ~$5/month**

---

## 5. Migration Files

### 5.1 Migration Strategy

Migrations are numbered sequentially and applied in order. Each migration is idempotent.

```
migrations/
├── 001_initial_schema.sql
├── 002_add_ja3_table.sql
├── 003_add_indexes.sql
├── 004_add_triggers.sql
└── 005_seed_data.sql
```

---

### 5.2 Migration 001: Initial Schema

**File:** `migrations/001_initial_schema.sql`

```sql
-- Migration 001: Initial Database Schema
-- Created: 2024-01-01
-- Description: Create core tables (fingerprints, reports, scans_daily)

BEGIN TRANSACTION;

-- Create fingerprints table
CREATE TABLE IF NOT EXISTS fingerprints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hash TEXT UNIQUE NOT NULL,
  os TEXT NOT NULL CHECK(os IN ('Windows', 'macOS', 'Linux', 'Android', 'iOS')),
  os_version TEXT NOT NULL,
  browser TEXT NOT NULL CHECK(browser IN ('Chrome', 'Firefox', 'Safari', 'Edge')),
  browser_version TEXT NOT NULL,
  browser_build_number TEXT,
  browser_release_date DATE,
  user_agent TEXT NOT NULL,
  platform TEXT NOT NULL,
  screen_width INTEGER NOT NULL CHECK(screen_width > 0),
  screen_height INTEGER NOT NULL CHECK(screen_height > 0),
  device_pixel_ratio REAL NOT NULL DEFAULT 1.0 CHECK(device_pixel_ratio > 0),
  color_depth INTEGER NOT NULL DEFAULT 24 CHECK(color_depth IN (8, 16, 24, 30, 32)),
  hardware_concurrency INTEGER CHECK(hardware_concurrency > 0 AND hardware_concurrency <= 128),
  device_memory INTEGER CHECK(device_memory > 0 AND device_memory <= 512),
  max_touch_points INTEGER NOT NULL DEFAULT 0 CHECK(max_touch_points >= 0 AND max_touch_points <= 10),
  webgl_vendor TEXT,
  webgl_renderer TEXT,
  webgl_version TEXT,
  webgl_shading_language_version TEXT,
  webgl_unmasked_vendor TEXT,
  webgl_unmasked_renderer TEXT,
  timezone TEXT NOT NULL,
  timezone_offset INTEGER NOT NULL,
  languages TEXT NOT NULL,
  fonts TEXT NOT NULL,
  fonts_count INTEGER NOT NULL DEFAULT 0,
  canvas_hash TEXT,
  audio_hash TEXT,
  webgl_hash TEXT,
  fonts_hash TEXT,
  quality_score INTEGER NOT NULL DEFAULT 50 CHECK(quality_score >= 0 AND quality_score <= 100),
  consistency_score INTEGER CHECK(consistency_score >= 0 AND consistency_score <= 100),
  source TEXT NOT NULL CHECK(source IN ('mutilogin', 'real_traffic', 'manual', 'verified', 'synthetic')),
  collected_at TIMESTAMP NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY CHECK(length(id) = 36),
  scan_data TEXT NOT NULL,
  scan_data_version INTEGER NOT NULL DEFAULT 1,
  trust_score INTEGER NOT NULL CHECK(trust_score >= 0 AND trust_score <= 100),
  trust_grade TEXT NOT NULL CHECK(trust_grade IN ('A', 'B', 'C', 'D', 'F')),
  critical_issues_count INTEGER NOT NULL DEFAULT 0,
  warnings_count INTEGER NOT NULL DEFAULT 0,
  ip_hash TEXT NOT NULL,
  ip_country TEXT,
  ip_city TEXT,
  user_agent_hash TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at INTEGER,
  share_source TEXT,
  is_public BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create scans_daily table
CREATE TABLE IF NOT EXISTS scans_daily (
  date DATE PRIMARY KEY,
  total_scans INTEGER NOT NULL DEFAULT 0,
  unique_ips INTEGER NOT NULL DEFAULT 0,
  avg_trust_score REAL CHECK(avg_trust_score >= 0 AND avg_trust_score <= 100),
  median_trust_score INTEGER CHECK(median_trust_score >= 0 AND median_trust_score <= 100),
  grade_a_count INTEGER NOT NULL DEFAULT 0,
  grade_b_count INTEGER NOT NULL DEFAULT 0,
  grade_c_count INTEGER NOT NULL DEFAULT 0,
  grade_d_count INTEGER NOT NULL DEFAULT 0,
  grade_f_count INTEGER NOT NULL DEFAULT 0,
  total_critical_issues INTEGER NOT NULL DEFAULT 0,
  total_warnings INTEGER NOT NULL DEFAULT 0,
  top_failing_layers TEXT,
  browser_distribution TEXT,
  os_distribution TEXT,
  country_distribution TEXT,
  mutilogin_clicks INTEGER NOT NULL DEFAULT 0,
  report_shares INTEGER NOT NULL DEFAULT 0,
  generator_uses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
```

---

### 5.3 Migration 002: Add JA3 Table

**File:** `migrations/002_add_ja3_table.sql`

```sql
-- Migration 002: Add JA3 Fingerprints Table
-- Created: 2024-01-02
-- Description: TLS fingerprint database for automation detection

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS ja3_fingerprints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ja3_hash TEXT UNIQUE NOT NULL,
  ja3_string TEXT NOT NULL,
  ja4_hash TEXT,
  ja4_string TEXT,
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  os_version TEXT,
  is_automation BOOLEAN NOT NULL DEFAULT FALSE,
  is_proxy BOOLEAN NOT NULL DEFAULT FALSE,
  is_vpn BOOLEAN NOT NULL DEFAULT FALSE,
  automation_tool TEXT,
  automation_tool_version TEXT,
  confidence_score INTEGER NOT NULL DEFAULT 50 CHECK(confidence_score >= 0 AND confidence_score <= 100),
  detection_count INTEGER NOT NULL DEFAULT 0,
  first_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
```

---

### 5.4 Migration 003: Add Indexes

**File:** `migrations/003_add_indexes.sql`

```sql
-- Migration 003: Add Performance Indexes
-- Created: 2024-01-03
-- Description: Critical indexes for query performance

BEGIN TRANSACTION;

-- Fingerprints indexes
CREATE INDEX IF NOT EXISTS idx_fingerprints_os_browser ON fingerprints(os, browser, is_active)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_fingerprints_quality ON fingerprints(quality_score DESC, consistency_score DESC)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_fingerprints_hash ON fingerprints(hash);

CREATE INDEX IF NOT EXISTS idx_fingerprints_source ON fingerprints(source)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_fingerprints_os_version ON fingerprints(os, os_version, browser, browser_version)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_fingerprints_verified ON fingerprints(is_verified, quality_score DESC)
  WHERE is_active = TRUE AND is_verified = TRUE;

CREATE INDEX IF NOT EXISTS idx_fingerprints_usage ON fingerprints(usage_count ASC, quality_score DESC)
  WHERE is_active = TRUE;

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_expires ON reports(expires_at)
  WHERE expires_at > 0;

CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_ip_hash ON reports(ip_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_score ON reports(trust_score, created_at DESC)
  WHERE is_public = TRUE;

-- Scans daily indexes
CREATE INDEX IF NOT EXISTS idx_scans_daily_date ON scans_daily(date DESC);

CREATE INDEX IF NOT EXISTS idx_scans_daily_scans ON scans_daily(total_scans DESC);

-- JA3 fingerprints indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_ja3_hash ON ja3_fingerprints(ja3_hash);

CREATE INDEX IF NOT EXISTS idx_ja3_automation ON ja3_fingerprints(is_automation, confidence_score DESC)
  WHERE is_automation = TRUE;

CREATE INDEX IF NOT EXISTS idx_ja3_browser ON ja3_fingerprints(browser, browser_version);

CREATE INDEX IF NOT EXISTS idx_ja3_last_seen ON ja3_fingerprints(last_seen DESC);

COMMIT;
```

---

### 5.5 Migration 004: Add Triggers

**File:** `migrations/004_add_triggers.sql`

```sql
-- Migration 004: Add Database Triggers
-- Created: 2024-01-04
-- Description: Automatic timestamp updates and data integrity

BEGIN TRANSACTION;

-- Fingerprints updated_at trigger
CREATE TRIGGER IF NOT EXISTS fingerprints_updated_at
  AFTER UPDATE ON fingerprints
  FOR EACH ROW
BEGIN
  UPDATE fingerprints SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Reports view count trigger
CREATE TRIGGER IF NOT EXISTS reports_increment_views
  AFTER UPDATE OF view_count ON reports
  FOR EACH ROW
BEGIN
  UPDATE reports SET last_viewed_at = unixepoch() WHERE id = NEW.id;
END;

-- Scans daily updated_at trigger
CREATE TRIGGER IF NOT EXISTS scans_daily_updated_at
  AFTER UPDATE ON scans_daily
  FOR EACH ROW
BEGIN
  UPDATE scans_daily SET updated_at = CURRENT_TIMESTAMP WHERE date = NEW.date;
END;

-- JA3 fingerprints update timestamp trigger
CREATE TRIGGER IF NOT EXISTS ja3_fingerprints_update_timestamp
  AFTER UPDATE OF detection_count ON ja3_fingerprints
  FOR EACH ROW
BEGIN
  UPDATE ja3_fingerprints
  SET last_seen = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

COMMIT;
```

---

### 5.6 Migration 005: Rate Limits Table

**File:** `migrations/005_add_rate_limits.sql`

```sql
-- Migration 005: Add Rate Limits Table
-- Created: 2024-01-05
-- Description: API rate limiting tracking

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS rate_limits (
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  last_request INTEGER NOT NULL,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  block_expires_at INTEGER,
  PRIMARY KEY (identifier, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, last_request DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked ON rate_limits(is_blocked, block_expires_at)
  WHERE is_blocked = TRUE;

CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup ON rate_limits(window_start)
  WHERE window_start < unixepoch() - 3600;

COMMIT;
```

---

## 6. Seed Data Strategy

### 6.1 Fingerprint Library Seeding

**Goal:** Populate 100,000+ verified fingerprints for the generator.

**Data Sources:**

1. **Mutilogin Export** (Priority 1)
   - 50,000 verified fingerprints from Mutilogin profiles
   - Already validated and consistent
   - Source: `mutilogin`

2. **Real Traffic Collection** (Priority 2)
   - 30,000 fingerprints from legitimate traffic
   - Collected with consent from own properties
   - Source: `real_traffic`

3. **Manual Verification** (Priority 3)
   - 10,000 fingerprints manually verified
   - High-quality tier for premium users
   - Source: `verified`

4. **Synthetic Generation** (Priority 4)
   - 10,000 synthetic fingerprints
   - Generated algorithmically but validated
   - Source: `synthetic`

**Seed Script:** `scripts/seed-fingerprints.ts`

```typescript
import { readFileSync } from 'fs';
import { D1Database } from '@cloudflare/workers-types';

interface FingerprintSeed {
  hash: string;
  os: string;
  os_version: string;
  browser: string;
  browser_version: string;
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
  timezone: string;
  timezone_offset: number;
  languages: string[];
  fonts: string[];
  quality_score: number;
  source: string;
}

async function seedFingerprints(db: D1Database) {
  console.log('Starting fingerprint seed...');

  // Load seed data from JSON files
  const mutiloginData: FingerprintSeed[] = JSON.parse(
    readFileSync('./seed-data/mutilogin-fingerprints.json', 'utf-8')
  );

  const realTrafficData: FingerprintSeed[] = JSON.parse(
    readFileSync('./seed-data/real-traffic-fingerprints.json', 'utf-8')
  );

  // Batch insert (1000 records per batch for optimal performance)
  const BATCH_SIZE = 1000;
  let totalInserted = 0;

  for (let i = 0; i < mutiloginData.length; i += BATCH_SIZE) {
    const batch = mutiloginData.slice(i, i + BATCH_SIZE);

    const stmt = db.prepare(`
      INSERT INTO fingerprints (
        hash, os, os_version, browser, browser_version,
        user_agent, platform, screen_width, screen_height,
        device_pixel_ratio, hardware_concurrency, device_memory,
        max_touch_points, webgl_vendor, webgl_renderer,
        timezone, timezone_offset, languages, fonts,
        quality_score, source, collected_at, is_active, is_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const queries = batch.map(fp =>
      stmt.bind(
        fp.hash,
        fp.os,
        fp.os_version,
        fp.browser,
        fp.browser_version,
        fp.user_agent,
        fp.platform,
        fp.screen_width,
        fp.screen_height,
        fp.device_pixel_ratio,
        fp.hardware_concurrency,
        fp.device_memory,
        fp.max_touch_points,
        fp.webgl_vendor,
        fp.webgl_renderer,
        fp.timezone,
        fp.timezone_offset,
        JSON.stringify(fp.languages),
        JSON.stringify(fp.fonts),
        fp.quality_score,
        fp.source,
        new Date().toISOString(),
        true,
        fp.source === 'verified'
      )
    );

    await db.batch(queries);
    totalInserted += batch.length;
    console.log(`Inserted ${totalInserted} fingerprints...`);
  }

  console.log(`✅ Seed complete: ${totalInserted} fingerprints inserted`);
}

// Run seed
seedFingerprints(env.DB).catch(console.error);
```

---

### 6.2 JA3 Database Seeding

**Goal:** Populate known TLS fingerprints for automation detection.

**Data Sources:**

1. **Public JA3 Database** (ja3er.com)
   - 5,000 known fingerprints
2. **Custom Collection** (own traffic)
   - 2,000 fingerprints
3. **Automation Tool Signatures**
   - Puppeteer, Selenium, Playwright variants

**Seed Script:** `scripts/seed-ja3.ts`

```typescript
async function seedJA3Database(db: D1Database) {
  console.log('Starting JA3 database seed...');

  const ja3Data = [
    // Chrome 121 on Windows 10
    {
      ja3_hash: 'e7d705a3286e19ea42f587b344ee6865',
      ja3_string: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,29-23-24,0',
      browser: 'Chrome',
      browser_version: '121.0.6167.85',
      os: 'Windows',
      os_version: '10.0',
      is_automation: false,
      confidence_score: 95,
      source: 'verified'
    },
    // Puppeteer default
    {
      ja3_hash: '579ccef312d18482fc42e2b822ca2430',
      ja3_string: '771,4865-4866-4867-49195-49199-52393-52392-49196-49200-49162-49161-49171-49172-51-57-47-53-10,0-23-65281-10-11-35-16-5-13-51-45-43-21,29-23-24-25-256-257,0',
      browser: 'Chrome',
      browser_version: '115.0.0.0',
      os: 'Linux',
      is_automation: true,
      automation_tool: 'Puppeteer',
      confidence_score: 98,
      source: 'known_automation'
    },
    // Add more...
  ];

  for (const ja3 of ja3Data) {
    await db.prepare(`
      INSERT INTO ja3_fingerprints (
        ja3_hash, ja3_string, browser, browser_version, os, os_version,
        is_automation, automation_tool, confidence_score, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      ja3.ja3_hash,
      ja3.ja3_string,
      ja3.browser,
      ja3.browser_version,
      ja3.os,
      ja3.os_version || null,
      ja3.is_automation,
      ja3.automation_tool || null,
      ja3.confidence_score,
      ja3.source
    ).run();
  }

  console.log(`✅ JA3 seed complete: ${ja3Data.length} fingerprints inserted`);
}
```

---

## 7. Query Patterns & Optimization

### 7.1 Common Query Patterns

#### Query 1: Generate Random Fingerprint

**Use Case:** Generator fetches random fingerprint matching filters.

**SQL:**

```sql
-- Optimized query with quality bias
SELECT * FROM fingerprints
WHERE
  os = ?1
  AND browser = ?2
  AND is_active = TRUE
ORDER BY
  -- Weight by quality and inverse usage (spread load)
  (quality_score * 0.7) + ((100 - MIN(usage_count, 100)) * 0.3) DESC,
  RANDOM()
LIMIT 1;
```

**Indexes Used:**
- `idx_fingerprints_os_browser` (os, browser, is_active)
- `idx_fingerprints_quality` (quality_score DESC)

**EXPLAIN Output:**

```
QUERY PLAN
├── SEARCH fingerprints USING INDEX idx_fingerprints_os_browser (os=? AND browser=? AND is_active=?)
└── USE TEMP B-TREE FOR ORDER BY
```

**Performance:** ~10ms (with 100K records)

---

#### Query 2: Lookup JA3 Fingerprint

**Use Case:** TLS fingerprint check during scan.

**SQL:**

```sql
SELECT
  browser,
  browser_version,
  os,
  is_automation,
  automation_tool,
  confidence_score
FROM ja3_fingerprints
WHERE ja3_hash = ?1
LIMIT 1;
```

**Indexes Used:**
- `idx_ja3_hash` (ja3_hash UNIQUE)

**EXPLAIN Output:**

```
QUERY PLAN
└── SEARCH ja3_fingerprints USING INDEX idx_ja3_hash (ja3_hash=?)
```

**Performance:** ~2ms (index-only scan)

---

#### Query 3: Create Shareable Report

**Use Case:** Save scan results and generate share URL.

**SQL:**

```sql
INSERT INTO reports (
  id, scan_data, scan_data_version, trust_score, trust_grade,
  critical_issues_count, warnings_count, ip_hash, ip_country,
  created_at, expires_at
) VALUES (
  ?1, ?2, 1, ?3, ?4, ?5, ?6, ?7, ?8,
  unixepoch(), unixepoch() + 2592000  -- 30 days
);
```

**Performance:** ~15ms (single insert)

---

#### Query 4: Retrieve Report

**Use Case:** View shared report by UUID.

**SQL:**

```sql
-- Retrieve and increment view count atomically
UPDATE reports
SET view_count = view_count + 1
WHERE id = ?1 AND expires_at > unixepoch()
RETURNING *;
```

**Indexes Used:**
- `id` (PRIMARY KEY)

**Performance:** ~5ms

---

#### Query 5: Daily Analytics Aggregation

**Use Case:** Batch job to aggregate daily statistics.

**SQL:**

```sql
-- Insert or update daily stats (UPSERT pattern)
INSERT INTO scans_daily (
  date, total_scans, avg_trust_score, grade_a_count, grade_b_count,
  grade_c_count, grade_d_count, grade_f_count
) VALUES (
  DATE('now'), ?1, ?2, ?3, ?4, ?5, ?6, ?7
)
ON CONFLICT(date) DO UPDATE SET
  total_scans = total_scans + excluded.total_scans,
  avg_trust_score = (avg_trust_score * total_scans + excluded.avg_trust_score * excluded.total_scans) / (total_scans + excluded.total_scans),
  grade_a_count = grade_a_count + excluded.grade_a_count,
  grade_b_count = grade_b_count + excluded.grade_b_count,
  grade_c_count = grade_c_count + excluded.grade_c_count,
  grade_d_count = grade_d_count + excluded.grade_d_count,
  grade_f_count = grade_f_count + excluded.grade_f_count,
  updated_at = CURRENT_TIMESTAMP;
```

**Performance:** ~20ms

---

#### Query 6: Cleanup Expired Reports

**Use Case:** Scheduled cleanup job (runs daily).

**SQL:**

```sql
-- Delete expired reports (returns count)
DELETE FROM reports
WHERE expires_at < unixepoch()
RETURNING COUNT(*);
```

**Indexes Used:**
- `idx_reports_expires` (expires_at)

**Performance:** ~100ms (batch delete of ~10K records)

---

#### Query 7: Rate Limit Check

**Use Case:** Check if IP has exceeded rate limit.

**SQL:**

```sql
-- Check current request count within window
SELECT
  request_count,
  is_blocked,
  block_expires_at
FROM rate_limits
WHERE
  identifier = ?1
  AND endpoint = ?2
  AND window_start >= unixepoch() - 3600
ORDER BY window_start DESC
LIMIT 1;
```

**Performance:** ~5ms

---

### 7.2 Query Optimization Guidelines

| Guideline | Implementation |
|-----------|----------------|
| **Index Coverage** | All WHERE/ORDER BY columns indexed |
| **Partial Indexes** | Use WHERE clause in index for filtered queries |
| **Batch Operations** | Use `db.batch()` for bulk inserts (1000+ records) |
| **Prepared Statements** | Always use `.prepare().bind()` to cache execution plans |
| **JSON Columns** | Store complex data as JSON TEXT, extract with `json_extract()` |
| **Pagination** | Use `LIMIT` + `OFFSET` with covering indexes |
| **Full-Text Search** | Use SQLite FTS5 for content search (future enhancement) |

---

## 8. Data Retention Policies

### 8.1 Retention Rules

| Data Type | Retention Period | Cleanup Method | Rationale |
|-----------|------------------|----------------|-----------|
| **Fingerprints** | Indefinite | Manual deactivation | Core asset |
| **Reports** | 30 days | Automated cron job | Privacy + cost |
| **Scans Daily** | 1 year | Automated cron job | Analytics history |
| **JA3 Fingerprints** | Indefinite | Manual pruning | Reference database |
| **Rate Limits** | 1 hour | Automated cleanup | Transient state |
| **KV Cache (IP)** | 1 hour | Automatic expiration | Reduce API calls |
| **KV Cache (JA3)** | 24 hours | Automatic expiration | Hot cache |
| **KV Sessions** | 15 minutes | Automatic expiration | Temporary state |
| **R2 Reports (PDF)** | 30 days | Lifecycle policy | Storage cost |

---

### 8.2 Cleanup Scripts

#### Script 1: Expired Reports Cleanup

**File:** `scripts/cleanup-reports.ts`

**Schedule:** Daily at 02:00 UTC

```typescript
async function cleanupExpiredReports(db: D1Database) {
  console.log('[Cleanup] Starting expired reports cleanup...');

  const result = await db.prepare(`
    DELETE FROM reports
    WHERE expires_at < unixepoch()
    RETURNING COUNT(*) as deleted_count
  `).first();

  console.log(`[Cleanup] Deleted ${result.deleted_count} expired reports`);

  return result.deleted_count;
}
```

---

#### Script 2: Old Analytics Cleanup

**File:** `scripts/cleanup-analytics.ts`

**Schedule:** Monthly on 1st day

```typescript
async function cleanupOldAnalytics(db: D1Database) {
  console.log('[Cleanup] Starting old analytics cleanup...');

  // Keep last 365 days only
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 365);

  const result = await db.prepare(`
    DELETE FROM scans_daily
    WHERE date < ?
    RETURNING COUNT(*) as deleted_count
  `).bind(cutoffDate.toISOString().split('T')[0]).first();

  console.log(`[Cleanup] Deleted ${result.deleted_count} old analytics records`);

  return result.deleted_count;
}
```

---

#### Script 3: Rate Limits Cleanup

**File:** `scripts/cleanup-rate-limits.ts`

**Schedule:** Hourly

```typescript
async function cleanupRateLimits(db: D1Database) {
  console.log('[Cleanup] Starting rate limits cleanup...');

  const result = await db.prepare(`
    DELETE FROM rate_limits
    WHERE window_start < unixepoch() - 3600
    RETURNING COUNT(*) as deleted_count
  `).first();

  console.log(`[Cleanup] Deleted ${result.deleted_count} old rate limit records`);

  return result.deleted_count;
}
```

---

#### Script 4: R2 Lifecycle Policy

**Cloudflare Dashboard Configuration:**

```json
{
  "id": "delete-old-reports",
  "status": "Enabled",
  "filter": {
    "prefix": "2024/"
  },
  "actions": [
    {
      "type": "expiration",
      "days": 30
    }
  ]
}
```

---

## 9. Backup & Recovery

### 9.1 Backup Strategy

| Component | Backup Method | Frequency | Retention |
|-----------|---------------|-----------|-----------|
| **D1 Database** | Cloudflare automatic snapshots | Continuous | 30 days |
| **D1 Manual Exports** | `wrangler d1 export` | Weekly | 90 days |
| **KV Namespaces** | No backup (cache layer) | N/A | N/A |
| **R2 Buckets** | S3-compatible replication | Real-time | 30 days |

---

### 9.2 D1 Backup Commands

#### Automated Weekly Backup

**File:** `.github/workflows/backup-database.yml`

```yaml
name: Weekly Database Backup

on:
  schedule:
    - cron: '0 3 * * 0'  # Every Sunday at 3 AM UTC

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Wrangler
        run: npm install -g wrangler

      - name: Export D1 Database
        run: |
          wrangler d1 export anti-detect --output ./backups/anti-detect-$(date +%Y%m%d).sql
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}

      - name: Upload to S3
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - run: |
          aws s3 cp ./backups/anti-detect-$(date +%Y%m%d).sql s3://anti-detect-backups/d1/
```

---

#### Manual Backup

```bash
# Export full database
wrangler d1 export anti-detect --output backup-$(date +%Y%m%d).sql

# Export specific table
wrangler d1 execute anti-detect --command "SELECT * FROM fingerprints" --json > fingerprints-backup.json
```

---

### 9.3 Disaster Recovery Procedure

**Scenario:** Complete D1 database loss

**Recovery Steps:**

1. **Restore from latest backup:**
   ```bash
   wrangler d1 execute anti-detect --file backup-20240201.sql
   ```

2. **Re-run migrations:**
   ```bash
   for file in migrations/*.sql; do
     wrangler d1 execute anti-detect --file "$file"
   done
   ```

3. **Re-seed critical data:**
   ```bash
   npm run seed:fingerprints
   npm run seed:ja3
   ```

4. **Verify data integrity:**
   ```bash
   wrangler d1 execute anti-detect --command "SELECT COUNT(*) FROM fingerprints"
   wrangler d1 execute anti-detect --command "SELECT COUNT(*) FROM ja3_fingerprints"
   ```

5. **Test API endpoints:**
   ```bash
   curl https://api.anti-detect.com/health
   curl https://api.anti-detect.com/api/generate?os=Windows&browser=Chrome
   ```

**Recovery Time Objective (RTO):** 2 hours
**Recovery Point Objective (RPO):** 7 days (weekly backup)

---

## 10. Performance Benchmarks

### 10.1 D1 Query Performance

| Query Type | Records | Cold Start | Warm Cache | Target |
|------------|---------|------------|------------|--------|
| Simple SELECT by ID | 1 | 8ms | 2ms | <10ms |
| Filtered SELECT (indexed) | 100K | 25ms | 10ms | <50ms |
| Random fingerprint | 100K | 35ms | 15ms | <100ms |
| JA3 lookup | 10K | 5ms | 2ms | <10ms |
| INSERT single record | 1 | 12ms | 8ms | <20ms |
| Batch INSERT | 1000 | 450ms | 350ms | <1s |
| Complex JOIN | 10K+10K | 120ms | 80ms | <200ms |

**Test Environment:** Cloudflare Workers (global average)

---

### 10.2 KV Performance

| Operation | Latency (p50) | Latency (p99) | Throughput |
|-----------|---------------|---------------|------------|
| GET (hit) | 2ms | 8ms | 100K ops/sec |
| GET (miss) | 5ms | 15ms | 50K ops/sec |
| PUT | 10ms | 30ms | 10K ops/sec |
| DELETE | 8ms | 20ms | 10K ops/sec |

---

### 10.3 R2 Performance

| Operation | Latency (p50) | Latency (p99) | Throughput |
|-----------|---------------|---------------|------------|
| GET object | 45ms | 120ms | 1K ops/sec |
| PUT object (500KB) | 180ms | 400ms | 500 ops/sec |
| DELETE object | 25ms | 80ms | 1K ops/sec |
| LIST objects | 35ms | 100ms | 500 ops/sec |

---

### 10.4 End-to-End Latency

| User Action | Total Latency | Breakdown |
|-------------|---------------|-----------|
| **Scan Start** | 150ms | Request validation (10ms) + IP lookup KV (5ms) + D1 insert (20ms) + Network (115ms) |
| **Scan Collect** | 320ms | Client collection (200ms) + Consistency engine (50ms) + Scoring (30ms) + Network (40ms) |
| **Generate Fingerprint** | 180ms | KV check (5ms) + D1 query (25ms) + Serialization (20ms) + Network (130ms) |
| **View Report** | 95ms | D1 query (15ms) + Network (80ms) |

---

## 11. Security Considerations

### 11.1 Data Protection

| Data Type | Protection Method |
|-----------|-------------------|
| **IP Addresses** | NEVER stored raw - only SHA256(IP + salt) |
| **User Agents** | Hashed for analytics, full string not persisted |
| **Scan Data** | Encrypted at rest (D1 native encryption) |
| **API Keys** | Hashed with bcrypt before storage |
| **Session Tokens** | 15-minute TTL in KV, auto-purged |

---

### 11.2 SQL Injection Prevention

**NEVER do this:**
```typescript
// ❌ VULNERABLE
const query = `SELECT * FROM fingerprints WHERE os = '${userInput}'`;
await db.prepare(query).all();
```

**ALWAYS do this:**
```typescript
// ✅ SAFE
const query = `SELECT * FROM fingerprints WHERE os = ?`;
await db.prepare(query).bind(userInput).all();
```

---

### 11.3 Access Control

| Role | Permissions |
|------|-------------|
| **Anonymous** | Read fingerprints (generator), Create reports (scanner) |
| **API User** | Rate-limited access to all public endpoints |
| **Admin** | Full D1/KV/R2 access via Wrangler CLI |

---

### 11.4 Audit Logging

**Critical Operations Logged:**
- Fingerprint generation requests (IP hash, timestamp)
- Report creation (IP hash, trust score)
- Rate limit violations
- Failed authentication attempts

**Storage:** Cloudflare Logpush → AWS S3 → 90-day retention

---

## Appendix A: Database Size Projections

### Year 1 Projections

| Table | Records | Size per Record | Total Size |
|-------|---------|-----------------|------------|
| fingerprints | 100,000 | 2KB | 200MB |
| reports | 300,000 (30-day rolling) | 10KB | 3GB |
| scans_daily | 365 | 2KB | 730KB |
| ja3_fingerprints | 10,000 | 500B | 5MB |
| rate_limits | 50,000 (1-hour rolling) | 100B | 5MB |
| **Total D1** | | | **~3.2GB** |

**Cloudflare D1 Limits:**
- Free tier: 5GB storage, 5M reads/day, 100K writes/day
- Paid tier: 10GB storage, 25M reads/day, 1M writes/day

**Projection:** Within free tier limits for first 6 months.

---

## Appendix B: Cost Estimates

### Monthly Costs (10K daily active users)

| Service | Usage | Cost |
|---------|-------|------|
| Cloudflare D1 | 3GB storage, 15M reads, 300K writes | $0 (free tier) |
| Cloudflare KV | 100K writes, 10M reads | $1.50 |
| Cloudflare R2 | 150GB storage, 300K Class A, 3M Class B | $5.00 |
| Cloudflare Workers | 50M requests | $0 (included) |
| IPInfo.io | 50K API calls (95% cache hit rate) | $0 (free tier) |
| **Total** | | **~$7/month** |

---

## Appendix C: Wrangler Configuration

**File:** `apps/api/wrangler.toml`

```toml
name = "anti-detect-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[env.production]
vars = { ENVIRONMENT = "production" }

[[env.production.d1_databases]]
binding = "DB"
database_name = "anti-detect"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

[[env.production.kv_namespaces]]
binding = "IP_CACHE"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

[[env.production.kv_namespaces]]
binding = "JA3_DB"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

[[env.production.kv_namespaces]]
binding = "RATE_LIMITS"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

[[env.production.kv_namespaces]]
binding = "SESSIONS"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

[[env.production.r2_buckets]]
binding = "R2"
bucket_name = "anti-detect-reports"

[observability]
enabled = true
head_sampling_rate = 0.1

[[routes]]
pattern = "api.anti-detect.com/*"
zone_name = "anti-detect.com"
```

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2024-12-01 | Initial comprehensive schema | Claude |

---

**END OF DATABASE SCHEMA SPECIFICATION**
