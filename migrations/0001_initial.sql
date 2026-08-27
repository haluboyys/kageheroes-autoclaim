CREATE TABLE IF NOT EXISTS game_accounts (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  game_email TEXT NOT NULL,
  game_password_encrypted TEXT NOT NULL,
  server_id TEXT NOT NULL DEFAULT '0',
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  last_status TEXT,
  last_message TEXT,
  last_attempt_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS claim_attempts (
  id TEXT PRIMARY KEY,
  game_account_id TEXT NOT NULL REFERENCES game_accounts(id) ON DELETE CASCADE,
  claim_key TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  attempted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_claim_attempts_account ON claim_attempts(game_account_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_claim_attempts_date ON claim_attempts(attempted_at DESC);
