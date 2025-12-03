-- Anti-detect.com Database Schema
-- Version: 1.0.0
-- Database: Cloudflare D1

-- ================================================
-- FINGERPRINTS TABLE
-- Stores collected browser fingerprints for the generator
-- ================================================
CREATE TABLE IF NOT EXISTS fingerprints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT NOT NULL UNIQUE,

    -- Operating System
    os TEXT NOT NULL CHECK(os IN ('Windows', 'macOS', 'Linux', 'Android', 'iOS')),
    os_version TEXT,

    -- Browser
    browser TEXT NOT NULL CHECK(browser IN ('Chrome', 'Firefox', 'Safari', 'Edge')),
    browser_version TEXT,

    -- User Agent
    user_agent TEXT NOT NULL,
    platform TEXT NOT NULL,

    -- Screen
    screen_width INTEGER NOT NULL,
    screen_height INTEGER NOT NULL,
    device_pixel_ratio REAL NOT NULL DEFAULT 1,

    -- Hardware
    hardware_concurrency INTEGER NOT NULL DEFAULT 4,
    device_memory REAL NOT NULL DEFAULT 8,
    max_touch_points INTEGER NOT NULL DEFAULT 0,

    -- WebGL
    webgl_vendor TEXT NOT NULL,
    webgl_renderer TEXT NOT NULL,
    webgl_version TEXT,

    -- Locale
    timezone TEXT NOT NULL,
    timezone_offset INTEGER NOT NULL DEFAULT 0,
    languages TEXT NOT NULL DEFAULT '["en-US"]', -- JSON array

    -- Fonts
    fonts TEXT NOT NULL DEFAULT '[]', -- JSON array

    -- Hashes
    canvas_hash TEXT NOT NULL,
    audio_hash TEXT,
    webgl_hash TEXT,

    -- Quality & Metadata
    quality_score INTEGER NOT NULL DEFAULT 50 CHECK(quality_score >= 0 AND quality_score <= 100),
    source TEXT NOT NULL DEFAULT 'collected',
    browser_release_date TEXT,
    collected_at TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,

    -- Timestamps
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for fingerprints
CREATE INDEX IF NOT EXISTS idx_fingerprints_os ON fingerprints(os);
CREATE INDEX IF NOT EXISTS idx_fingerprints_browser ON fingerprints(browser);
CREATE INDEX IF NOT EXISTS idx_fingerprints_quality ON fingerprints(quality_score);
CREATE INDEX IF NOT EXISTS idx_fingerprints_active ON fingerprints(is_active);
CREATE INDEX IF NOT EXISTS idx_fingerprints_hash ON fingerprints(hash);

-- ================================================
-- REPORTS TABLE
-- Stores shareable scan reports
-- ================================================
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,

    -- Scan Data (JSON)
    scan_data TEXT NOT NULL,

    -- Summary
    trust_score INTEGER NOT NULL CHECK(trust_score >= 0 AND trust_score <= 100),
    critical_issues_count INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,

    -- Stats
    view_count INTEGER NOT NULL DEFAULT 0,

    -- Privacy
    ip_hash TEXT NOT NULL
);

-- Indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_expires ON reports(expires_at);
CREATE INDEX IF NOT EXISTS idx_reports_ip_hash ON reports(ip_hash);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);

-- ================================================
-- DAILY ANALYTICS TABLE
-- Aggregated daily statistics
-- ================================================
CREATE TABLE IF NOT EXISTS scans_daily (
    date TEXT PRIMARY KEY,
    total_scans INTEGER NOT NULL DEFAULT 0,
    avg_score REAL DEFAULT 0,
    pass_count INTEGER NOT NULL DEFAULT 0,
    fail_count INTEGER NOT NULL DEFAULT 0,
    unique_ips INTEGER NOT NULL DEFAULT 0
);

-- ================================================
-- CHALLENGE LEADERBOARD TABLE
-- Stores challenge completion records
-- ================================================
CREATE TABLE IF NOT EXISTS challenge_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL UNIQUE,

    -- Scores
    total_score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    percentage_score REAL NOT NULL,

    -- Level Results
    levels_passed INTEGER NOT NULL,
    level_1_passed INTEGER NOT NULL DEFAULT 0,
    level_2_passed INTEGER NOT NULL DEFAULT 0,
    level_3_passed INTEGER NOT NULL DEFAULT 0,
    level_4_passed INTEGER NOT NULL DEFAULT 0,

    -- Verdict
    verdict TEXT NOT NULL CHECK(verdict IN ('HUMAN', 'SUSPICIOUS', 'LIKELY BOT')),

    -- Metadata
    user_agent TEXT,
    ja3_hash TEXT,
    ja4_hash TEXT,

    -- Timestamps
    started_at INTEGER NOT NULL,
    completed_at INTEGER NOT NULL,

    -- Privacy
    ip_hash TEXT NOT NULL
);

-- Indexes for challenge results
CREATE INDEX IF NOT EXISTS idx_challenge_score ON challenge_results(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_verdict ON challenge_results(verdict);
CREATE INDEX IF NOT EXISTS idx_challenge_completed ON challenge_results(completed_at);

-- ================================================
-- JA3 FINGERPRINT DATABASE
-- Known JA3 hashes and their associations
-- ================================================
CREATE TABLE IF NOT EXISTS ja3_database (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ja3_hash TEXT NOT NULL UNIQUE,

    -- Browser identification
    browser TEXT,
    browser_version TEXT,
    os TEXT,

    -- Classification
    is_automation INTEGER NOT NULL DEFAULT 0,
    is_headless INTEGER NOT NULL DEFAULT 0,
    tool_name TEXT, -- e.g., 'Puppeteer', 'Selenium'

    -- Confidence & Source
    confidence REAL NOT NULL DEFAULT 0.5,
    source TEXT NOT NULL DEFAULT 'manual',

    -- Timestamps
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for JA3 database
CREATE INDEX IF NOT EXISTS idx_ja3_hash ON ja3_database(ja3_hash);
CREATE INDEX IF NOT EXISTS idx_ja3_browser ON ja3_database(browser);
CREATE INDEX IF NOT EXISTS idx_ja3_automation ON ja3_database(is_automation);

-- ================================================
-- FINGERPRINT STATISTICS TABLE
-- Pre-computed statistics for the database
-- ================================================
CREATE TABLE IF NOT EXISTS fingerprint_stats (
    stat_key TEXT PRIMARY KEY,
    stat_value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ================================================
-- TRIGGERS
-- ================================================

-- Update fingerprints.updated_at on update
CREATE TRIGGER IF NOT EXISTS update_fingerprints_timestamp
    AFTER UPDATE ON fingerprints
    FOR EACH ROW
BEGIN
    UPDATE fingerprints SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- Update ja3_database.updated_at on update
CREATE TRIGGER IF NOT EXISTS update_ja3_timestamp
    AFTER UPDATE ON ja3_database
    FOR EACH ROW
BEGIN
    UPDATE ja3_database SET updated_at = datetime('now') WHERE id = OLD.id;
END;
