CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'analyst')),
  status text NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'suspended')),
  approved_at timestamptz,
  approved_by uuid,
  status_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES users(id),
  target_user_id uuid NOT NULL REFERENCES users(id),
  action text NOT NULL CHECK (action IN ('approve_user', 'reject_user', 'suspend_user', 'reactivate_user', 'grant_tokens', 'adjust_tokens', 'revoke_tokens')),
  reason text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS token_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  admin_user_id uuid REFERENCES users(id),
  amount_tokens integer NOT NULL CHECK (amount_tokens <> 0),
  reason text NOT NULL CHECK (reason IN ('admin_initial_grant', 'admin_grant', 'admin_adjustment', 'admin_revoke', 'rag_query', 'match_prediction', 'what_if_prediction', 'group_simulation', 'report_generation')),
  related_entity_type text NOT NULL,
  related_entity_id text NOT NULL,
  idempotency_key text UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  usage_type text NOT NULL CHECK (usage_type IN ('rag', 'prediction', 'simulation', 'report')),
  model text NOT NULL,
  model_version text NOT NULL,
  prompt_tokens integer NOT NULL DEFAULT 0 CHECK (prompt_tokens >= 0),
  completion_tokens integer NOT NULL DEFAULT 0 CHECK (completion_tokens >= 0),
  embedding_tokens integer NOT NULL DEFAULT 0 CHECK (embedding_tokens >= 0),
  total_provider_tokens integer NOT NULL DEFAULT 0 CHECK (total_provider_tokens >= 0),
  estimated_cost numeric(12, 6) NOT NULL DEFAULT 0 CHECK (estimated_cost >= 0),
  internal_tokens_charged integer NOT NULL DEFAULT 0 CHECK (internal_tokens_charged >= 0),
  token_ledger_id uuid REFERENCES token_ledger(id),
  related_entity_type text NOT NULL,
  related_entity_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  confederation text NOT NULL,
  coach_name text,
  group_code text,
  flag_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id),
  name text NOT NULL,
  position text NOT NULL CHECK (position IN ('GK', 'DF', 'MF', 'FW')),
  shirt_number integer,
  availability_status text NOT NULL DEFAULT 'unknown' CHECK (availability_status IN ('available', 'doubtful', 'out', 'suspended', 'unknown')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  capacity integer,
  timezone text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS fixtures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_fixture_id text NOT NULL,
  provider text NOT NULL,
  stage text NOT NULL,
  group_code text,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid REFERENCES fixtures(id),
  home_team_id uuid NOT NULL REFERENCES teams(id),
  away_team_id uuid NOT NULL REFERENCES teams(id),
  venue_id uuid REFERENCES venues(id),
  stage text NOT NULL,
  group_code text,
  status text NOT NULL CHECK (status IN ('scheduled', 'live', 'finished', 'postponed', 'cancelled')),
  kickoff_at timestamptz NOT NULL,
  home_score integer,
  away_score integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS weather (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id),
  venue_id uuid REFERENCES venues(id),
  provider text NOT NULL,
  observed_at timestamptz NOT NULL,
  temperature_c numeric,
  humidity_pct integer,
  wind_kph numeric,
  condition text
);

CREATE TABLE IF NOT EXISTS team_match_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id),
  team_id uuid NOT NULL REFERENCES teams(id),
  xg numeric,
  xga numeric,
  shots integer,
  shots_on_target integer,
  possession_pct numeric,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS player_match_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id),
  player_id uuid NOT NULL REFERENCES players(id),
  team_id uuid NOT NULL REFERENCES teams(id),
  minutes integer,
  goals integer,
  assists integer,
  xg numeric,
  xa numeric,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS injuries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id),
  team_id uuid NOT NULL REFERENCES teams(id),
  status text NOT NULL CHECK (status IN ('doubtful', 'out', 'recovering', 'available')),
  description text NOT NULL,
  reported_at timestamptz NOT NULL,
  expected_return_at timestamptz
);

CREATE TABLE IF NOT EXISTS suspensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id),
  team_id uuid NOT NULL REFERENCES teams(id),
  match_id uuid REFERENCES matches(id),
  reason text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  status text NOT NULL CHECK (status IN ('active', 'served', 'appealed'))
);

CREATE TABLE IF NOT EXISTS rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id),
  provider text NOT NULL,
  rank integer NOT NULL,
  points numeric,
  captured_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS odds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id),
  provider text NOT NULL,
  market text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  captured_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (source_type IN ('news', 'scouting_report', 'injury_report', 'stats_feed', 'official_release', 'analysis')),
  source_name text NOT NULL,
  source_url text,
  title text NOT NULL,
  language text NOT NULL,
  published_at timestamptz,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  checksum text NOT NULL,
  raw_content_uri text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id),
  chunk_index integer NOT NULL,
  content text NOT NULL,
  embedding_ref text,
  token_count integer NOT NULL DEFAULT 0 CHECK (token_count >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (document_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS rag_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  question text NOT NULL,
  answer text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  retrieval_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  citation_chunk_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  ai_usage_log_id uuid REFERENCES ai_usage_logs(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  prediction_type text NOT NULL CHECK (prediction_type IN ('match', 'what_if', 'group_simulation', 'tournament_simulation')),
  match_id uuid REFERENCES matches(id),
  team_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  input_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  model_version text NOT NULL,
  ai_usage_log_id uuid REFERENCES ai_usage_logs(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  report_type text NOT NULL CHECK (report_type IN ('single_match', 'team', 'player', 'simulation')),
  status text NOT NULL CHECK (status IN ('queued', 'generating', 'completed', 'failed')),
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  format text NOT NULL CHECK (format IN ('pdf', 'html', 'json')),
  language text NOT NULL,
  output_uri text,
  citation_chunk_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  prediction_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  model_versions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_usage_log_id uuid REFERENCES ai_usage_logs(id),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_token_ledger_user_created ON token_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created ON ai_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON matches(kickoff_at);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document ON document_chunks(document_id, chunk_index);

CREATE OR REPLACE VIEW user_token_balances AS
SELECT
  users.id AS user_id,
  COALESCE(SUM(token_ledger.amount_tokens), 0)::integer AS balance_tokens
FROM users
LEFT JOIN token_ledger ON token_ledger.user_id = users.id
GROUP BY users.id;

