-- Automation tasks, queue runs, and webhook registries
CREATE TABLE IF NOT EXISTS automation_tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  project_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  cadence TEXT NOT NULL,
  schedule TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  targets TEXT NOT NULL,
  last_run_at INTEGER,
  next_run_at INTEGER,
  last_status TEXT,
  webhook_url TEXT,
  webhook_secret TEXT,
  retry_limit INTEGER NOT NULL DEFAULT 3,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  metadata TEXT,
  last_result TEXT
);

CREATE INDEX IF NOT EXISTS idx_automation_tasks_next_run
  ON automation_tasks(next_run_at ASC, status);

CREATE TABLE IF NOT EXISTS automation_task_runs (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  status TEXT NOT NULL,
  queued_at INTEGER NOT NULL,
  started_at INTEGER,
  completed_at INTEGER,
  duration_ms INTEGER,
  batches_processed INTEGER,
  success_count INTEGER,
  fail_count INTEGER,
  webhook_status TEXT,
  response_code INTEGER,
  error TEXT,
  sample_report_id TEXT,
  metadata TEXT,
  FOREIGN KEY (task_id) REFERENCES automation_tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_automation_task_runs_task
  ON automation_task_runs(task_id, queued_at DESC);

CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_delivery_at INTEGER,
  verification_token TEXT
);

CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_project
  ON webhook_subscriptions(project_id, status);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL,
  event TEXT NOT NULL,
  status TEXT NOT NULL,
  response_code INTEGER,
  error TEXT,
  payload TEXT NOT NULL,
  delivered_at INTEGER NOT NULL,
  duration_ms INTEGER,
  FOREIGN KEY (subscription_id) REFERENCES webhook_subscriptions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_subscription
  ON webhook_deliveries(subscription_id, delivered_at DESC);
