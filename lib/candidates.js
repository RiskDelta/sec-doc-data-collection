import { editableColumns } from './labels';
import { emptyToNull, numericOrNull } from './db';

export function rowValues(userKey, record) {
  const sourcePayload = {};
  for (const [key, value] of Object.entries(record)) {
    if (!editableColumns.includes(key)) sourcePayload[key] = value;
  }

  return [
    userKey,
    emptyToNull(record.batch_id),
    emptyToNull(record.candidate_id),
    emptyToNull(record.ticker),
    emptyToNull(record.old_filing_date),
    emptyToNull(record.new_filing_date),
    emptyToNull(record.old_period_of_report),
    emptyToNull(record.new_period_of_report),
    emptyToNull(record.old_accession_number),
    emptyToNull(record.new_accession_number),
    emptyToNull(record.new_filing_url),
    emptyToNull(record.candidate_source),
    emptyToNull(record.heuristic_flags),
    numericOrNull(record.similarity_score),
    numericOrNull(record.old_unit_index),
    numericOrNull(record.new_unit_index),
    emptyToNull(record.old_text),
    emptyToNull(record.new_text),
    JSON.stringify(sourcePayload),
    emptyToNull(record.primary_label),
    emptyToNull(record.secondary_label),
    emptyToNull(record.rationale_old),
    emptyToNull(record.rationale_new),
    emptyToNull(record.confidence),
    emptyToNull(record.annotator),
    emptyToNull(record.notes)
  ];
}

export const upsertCandidateSql = `
  INSERT INTO annotation_rows (
    user_key, batch_id, candidate_id, ticker, old_filing_date, new_filing_date,
    old_period_of_report, new_period_of_report, old_accession_number,
    new_accession_number, new_filing_url, candidate_source, heuristic_flags,
    similarity_score, old_unit_index, new_unit_index, old_text, new_text,
    source_payload, primary_label, secondary_label, rationale_old, rationale_new,
    confidence, annotator, notes, completed, completed_at, updated_at
  )
  VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
    $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
    CASE WHEN $20::text IS NULL OR $20::text = '' THEN false ELSE true END,
    CASE WHEN $20::text IS NULL OR $20::text = '' THEN NULL ELSE now() END,
    now()
  )
  ON CONFLICT (user_key, candidate_id) DO UPDATE SET
    batch_id = EXCLUDED.batch_id,
    ticker = EXCLUDED.ticker,
    old_filing_date = EXCLUDED.old_filing_date,
    new_filing_date = EXCLUDED.new_filing_date,
    old_period_of_report = EXCLUDED.old_period_of_report,
    new_period_of_report = EXCLUDED.new_period_of_report,
    old_accession_number = EXCLUDED.old_accession_number,
    new_accession_number = EXCLUDED.new_accession_number,
    new_filing_url = EXCLUDED.new_filing_url,
    candidate_source = EXCLUDED.candidate_source,
    heuristic_flags = EXCLUDED.heuristic_flags,
    similarity_score = EXCLUDED.similarity_score,
    old_unit_index = EXCLUDED.old_unit_index,
    new_unit_index = EXCLUDED.new_unit_index,
    old_text = EXCLUDED.old_text,
    new_text = EXCLUDED.new_text,
    source_payload = EXCLUDED.source_payload,
    updated_at = now()
  RETURNING (xmax = 0) AS inserted
`;
