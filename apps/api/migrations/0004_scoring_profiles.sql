-- Scoring profiles for customizable trust models
CREATE TABLE IF NOT EXISTS scoring_profiles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  use_case TEXT,
  weights TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scoring_profiles_default ON scoring_profiles(is_default DESC, created_at DESC);

INSERT OR IGNORE INTO scoring_profiles (id, slug, name, description, use_case, weights, is_default, created_at, updated_at)
VALUES
  (
    'profile-default',
    'balanced',
    'Balanced Baseline',
    'General-purpose model balancing accuracy and stealth.',
    'General Web',
    json_object(
      'network', 0.20,
      'navigator', 0.15,
      'graphics', 0.20,
      'audio', 0.10,
      'fonts', 0.10,
      'locale', 0.10,
      'automation', 0.15
    ),
    1,
    strftime('%s','now') * 1000,
    strftime('%s','now') * 1000
  ),
  (
    'profile-ad-fraud',
    'ad-fraud',
    'Ad-Fraud Hunter',
    'Aggressively penalizes automation and IP/network anomalies.',
    'Advertising & Affiliate',
    json_object(
      'network', 0.30,
      'navigator', 0.10,
      'graphics', 0.15,
      'audio', 0.05,
      'fonts', 0.10,
      'locale', 0.10,
      'automation', 0.20
    ),
    0,
    strftime('%s','now') * 1000,
    strftime('%s','now') * 1000
  ),
  (
    'profile-finance',
    'finance',
    'Banking & KYC',
    'Prioritizes navigator, locale, and automation hygiene.',
    'Finance & Payments',
    json_object(
      'network', 0.20,
      'navigator', 0.20,
      'graphics', 0.15,
      'audio', 0.05,
      'fonts', 0.10,
      'locale', 0.15,
      'automation', 0.15
    ),
    0,
    strftime('%s','now') * 1000,
    strftime('%s','now') * 1000
  );
