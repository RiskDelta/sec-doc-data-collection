CREATE TABLE IF NOT EXISTS annotation_users (
  user_key TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS annotation_rows (
  id BIGSERIAL PRIMARY KEY,
  user_key TEXT NOT NULL,
  batch_id TEXT,
  candidate_id TEXT NOT NULL,
  ticker TEXT,
  old_filing_date DATE,
  new_filing_date DATE,
  old_period_of_report DATE,
  new_period_of_report DATE,
  old_accession_number TEXT,
  new_accession_number TEXT,
  new_filing_url TEXT,
  candidate_source TEXT,
  heuristic_flags TEXT,
  similarity_score DOUBLE PRECISION,
  old_unit_index DOUBLE PRECISION,
  new_unit_index DOUBLE PRECISION,
  old_text TEXT,
  new_text TEXT,
  source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  primary_label TEXT CHECK (
    primary_label IS NULL OR primary_label IN (
      'addition',
      'removal',
      'actualization',
      'severity_increase',
      'severity_decrease',
      'specificity_increase',
      'specificity_decrease',
      'neutral_or_unclear'
    )
  ),
  secondary_label TEXT CHECK (
    secondary_label IS NULL OR secondary_label IN (
      'addition',
      'removal',
      'actualization',
      'severity_increase',
      'severity_decrease',
      'specificity_increase',
      'specificity_decrease',
      'neutral_or_unclear'
    )
  ),
  rationale_old TEXT,
  rationale_new TEXT,
  confidence TEXT,
  annotator TEXT,
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_key, candidate_id)
);

ALTER TABLE annotation_rows
  ADD COLUMN IF NOT EXISTS user_key TEXT;

ALTER TABLE annotation_rows
  ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE annotation_rows
  DROP CONSTRAINT IF EXISTS annotation_rows_primary_label_check,
  DROP CONSTRAINT IF EXISTS annotation_rows_secondary_label_check;

ALTER TABLE annotation_rows
  ADD CONSTRAINT annotation_rows_primary_label_check CHECK (
    primary_label IS NULL OR primary_label IN (
      'addition',
      'removal',
      'actualization',
      'severity_increase',
      'severity_decrease',
      'specificity_increase',
      'specificity_decrease',
      'neutral_or_unclear'
    )
  ) NOT VALID,
  ADD CONSTRAINT annotation_rows_secondary_label_check CHECK (
    secondary_label IS NULL OR secondary_label IN (
      'addition',
      'removal',
      'actualization',
      'severity_increase',
      'severity_decrease',
      'specificity_increase',
      'specificity_decrease',
      'neutral_or_unclear'
    )
  ) NOT VALID;

UPDATE annotation_rows
SET completed = completed_at IS NOT NULL
WHERE completed <> (completed_at IS NOT NULL);

INSERT INTO annotation_users (user_key, password)
SELECT DISTINCT user_key, substr(md5(random()::text), 1, 10)
FROM annotation_rows
WHERE user_key IS NOT NULL
ON CONFLICT (user_key) DO NOTHING;

DROP INDEX IF EXISTS annotation_rows_user_pending_idx;

CREATE INDEX IF NOT EXISTS annotation_rows_user_pending_idx
  ON annotation_rows (user_key, completed, id);

CREATE INDEX IF NOT EXISTS annotation_rows_candidate_idx
  ON annotation_rows (candidate_id);
