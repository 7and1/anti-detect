-- =============================================
-- Anti-detect.com Database Schema
-- Cloudflare D1 (SQLite)
-- =============================================

-- =============================================
-- Table: fingerprints
-- Stores verified fingerprint profiles for generator
-- =============================================
CREATE TABLE IF NOT EXISTS fingerprints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hash TEXT UNIQUE NOT NULL,

  -- Operating System
  os TEXT NOT NULL CHECK (os IN ('Windows', 'macOS', 'Linux', 'Android', 'iOS')),
  os_version TEXT,

  -- Browser
  browser TEXT NOT NULL CHECK (browser IN ('Chrome', 'Firefox', 'Safari', 'Edge')),
  browser_version TEXT,

  -- Core identifiers
  user_agent TEXT NOT NULL,
  platform TEXT NOT NULL,

  -- Screen
  screen_width INTEGER NOT NULL DEFAULT 1920,
  screen_height INTEGER NOT NULL DEFAULT 1080,
  device_pixel_ratio REAL NOT NULL DEFAULT 1.0,

  -- Hardware
  hardware_concurrency INTEGER NOT NULL DEFAULT 4,
  device_memory INTEGER DEFAULT 8,
  max_touch_points INTEGER NOT NULL DEFAULT 0,

  -- WebGL
  webgl_vendor TEXT NOT NULL,
  webgl_renderer TEXT NOT NULL,
  webgl_version TEXT,

  -- Locale
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  timezone_offset INTEGER DEFAULT -300,
  languages TEXT NOT NULL DEFAULT '["en-US"]',

  -- Fingerprint hashes
  fonts TEXT NOT NULL DEFAULT '[]',
  canvas_hash TEXT,
  audio_hash TEXT,
  webgl_hash TEXT,

  -- Quality & Metadata
  quality_score INTEGER NOT NULL DEFAULT 50 CHECK (quality_score >= 0 AND quality_score <= 100),
  source TEXT NOT NULL DEFAULT 'collected',
  browser_release_date DATE,

  -- Timestamps
  collected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Soft delete
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Indexes for fingerprints table
CREATE INDEX IF NOT EXISTS idx_fingerprints_os_browser ON fingerprints(os, browser) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_fingerprints_quality ON fingerprints(quality_score DESC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_fingerprints_collected ON fingerprints(collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_fingerprints_hash ON fingerprints(hash);
CREATE INDEX IF NOT EXISTS idx_fingerprints_os ON fingerprints(os) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_fingerprints_browser ON fingerprints(browser) WHERE is_active = TRUE;

-- =============================================
-- Table: reports
-- Stores shareable scan reports
-- =============================================
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  scan_data TEXT NOT NULL,
  trust_score INTEGER NOT NULL CHECK (trust_score >= 0 AND trust_score <= 100),
  critical_issues_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  ip_hash TEXT NOT NULL
);

-- Indexes for reports table
CREATE INDEX IF NOT EXISTS idx_reports_expires ON reports(expires_at);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_score ON reports(trust_score);

-- =============================================
-- Table: scans_daily
-- Daily analytics aggregation
-- =============================================
CREATE TABLE IF NOT EXISTS scans_daily (
  date TEXT PRIMARY KEY,
  total_scans INTEGER NOT NULL DEFAULT 0,
  avg_score REAL,
  pass_count INTEGER NOT NULL DEFAULT 0,
  fail_count INTEGER NOT NULL DEFAULT 0,
  unique_ips INTEGER NOT NULL DEFAULT 0,
  browser_distribution TEXT,
  os_distribution TEXT,
  country_distribution TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for scans_daily
CREATE INDEX IF NOT EXISTS idx_scans_daily_date ON scans_daily(date DESC);

-- =============================================
-- Table: ja3_fingerprints
-- Known TLS fingerprints database
-- =============================================
CREATE TABLE IF NOT EXISTS ja3_fingerprints (
  ja3_hash TEXT PRIMARY KEY,
  ja4_hash TEXT,
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  is_automation BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for ja3_fingerprints
CREATE INDEX IF NOT EXISTS idx_ja3_browser ON ja3_fingerprints(browser);
CREATE INDEX IF NOT EXISTS idx_ja3_automation ON ja3_fingerprints(is_automation);

-- =============================================
-- Triggers
-- =============================================

-- Update updated_at on fingerprints modification
CREATE TRIGGER IF NOT EXISTS fingerprints_updated_at
AFTER UPDATE ON fingerprints
FOR EACH ROW
BEGIN
  UPDATE fingerprints SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- =============================================
-- Sample seed data
-- =============================================

-- Sample fingerprints (Windows + Chrome)
INSERT OR IGNORE INTO fingerprints (
  hash, os, os_version, browser, browser_version, user_agent, platform,
  screen_width, screen_height, device_pixel_ratio,
  hardware_concurrency, device_memory, max_touch_points,
  webgl_vendor, webgl_renderer, webgl_version,
  timezone, timezone_offset, languages, fonts,
  canvas_hash, quality_score, source
) VALUES
(
  'fp_win_chrome_001',
  'Windows', '10',
  'Chrome', '120.0.6099.130',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Win32',
  1920, 1080, 1.0,
  8, 8, 0,
  'Google Inc. (NVIDIA)',
  'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'WebGL 1.0',
  'America/New_York', -300,
  '["en-US", "en"]',
  '["Arial", "Calibri", "Consolas", "Segoe UI", "Times New Roman", "Verdana"]',
  'a1b2c3d4e5f6',
  85,
  'verified'
),
(
  'fp_win_chrome_002',
  'Windows', '11',
  'Chrome', '120.0.6099.130',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Win32',
  2560, 1440, 1.25,
  16, 32, 0,
  'Google Inc. (NVIDIA)',
  'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'WebGL 1.0',
  'America/Los_Angeles', -480,
  '["en-US"]',
  '["Arial", "Calibri", "Cascadia Code", "Consolas", "Segoe UI", "Times New Roman"]',
  'b2c3d4e5f6a1',
  90,
  'verified'
);

-- Sample fingerprints (macOS + Safari)
INSERT OR IGNORE INTO fingerprints (
  hash, os, os_version, browser, browser_version, user_agent, platform,
  screen_width, screen_height, device_pixel_ratio,
  hardware_concurrency, device_memory, max_touch_points,
  webgl_vendor, webgl_renderer, webgl_version,
  timezone, timezone_offset, languages, fonts,
  canvas_hash, quality_score, source
) VALUES
(
  'fp_mac_safari_001',
  'macOS', '14.0',
  'Safari', '17.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'MacIntel',
  1440, 900, 2.0,
  10, 16, 0,
  'Apple Inc.',
  'Apple M2 Pro',
  'WebGL 1.0',
  'America/New_York', -300,
  '["en-US"]',
  '["Arial", "Avenir", "Helvetica Neue", "Menlo", "San Francisco", "Times"]',
  'c3d4e5f6a1b2',
  92,
  'verified'
);

-- Sample JA3 fingerprints
INSERT OR IGNORE INTO ja3_fingerprints (ja3_hash, browser, browser_version, os, is_automation) VALUES
('cd08e31494f9531f560d64c695473da9', 'Chrome', '120', 'Windows', FALSE),
('e7d705a3286e19ea42f587b344ee6865', 'Firefox', '121', 'Windows', FALSE),
('773906b0efdefa24a7f2b8eb6985bf37', 'Safari', '17', 'macOS', FALSE),
('a0d9e6fb2e63b9a5e6c9c3d7c8e3e8e5', 'Puppeteer', NULL, NULL, TRUE),
('b1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6', 'Playwright', NULL, NULL, TRUE);
