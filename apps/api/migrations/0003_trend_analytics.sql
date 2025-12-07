-- Fingerprint session history for drift analytics
CREATE TABLE IF NOT EXISTS fingerprint_sessions (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  report_id TEXT NOT NULL UNIQUE,
  fingerprint_hash TEXT NOT NULL,
  trust_score INTEGER NOT NULL,
  issues_count INTEGER NOT NULL,
  warnings_count INTEGER NOT NULL,
  layer_scores TEXT NOT NULL,
  recommendations TEXT,
  created_at INTEGER NOT NULL,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_fingerprint_sessions_client_created
  ON fingerprint_sessions (client_id, created_at DESC);
