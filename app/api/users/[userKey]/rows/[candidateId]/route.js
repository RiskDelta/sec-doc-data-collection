import { NextResponse } from 'next/server';
import { emptyToNull, getPool } from '../../../../../../lib/db';
import { confidenceValues, editableColumns, labels } from '../../../../../../lib/labels';
import { requireUserPassword } from '../../../../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const auth = await requireUserPassword(request, params.userKey);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const candidateId = decodeURIComponent(params.candidateId);
  const pool = getPool();
  const result = await pool.query(
    'SELECT * FROM annotation_rows WHERE user_key = $1 AND candidate_id = $2 LIMIT 1',
    [auth.userKey, candidateId]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: 'Annotation row not found.' }, { status: 404 });
  }

  return NextResponse.json({ row: result.rows[0], labels });
}

export async function PATCH(request, { params }) {
  const auth = await requireUserPassword(request, params.userKey);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const candidateId = decodeURIComponent(params.candidateId);
  const body = await request.json();
  const input = sanitizeAnnotation(body);

  if (!input.primary_label || !labels.includes(input.primary_label)) {
    return NextResponse.json({ error: 'A valid primary label is required.' }, { status: 400 });
  }
  if (input.secondary_label && !labels.includes(input.secondary_label)) {
    return NextResponse.json({ error: 'Secondary label is invalid.' }, { status: 400 });
  }
  if (input.confidence && !confidenceValues.includes(input.confidence)) {
    return NextResponse.json(
      { error: 'Confidence must be low, medium, or high.' },
      { status: 400 }
    );
  }

  const pool = getPool();
  const result = await pool.query(
    `
      UPDATE annotation_rows
      SET primary_label = $3,
          secondary_label = $4,
          rationale_old = $5,
          rationale_new = $6,
          confidence = $7,
          annotator = $1,
          notes = $8,
          completed = true,
          completed_at = COALESCE(completed_at, now()),
          updated_at = now()
      WHERE user_key = $1 AND candidate_id = $2
      RETURNING candidate_id
    `,
    [
      auth.userKey,
      candidateId,
      input.primary_label,
      input.secondary_label,
      input.rationale_old,
      input.rationale_new,
      input.confidence,
      input.notes
    ]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: 'Annotation row not found.' }, { status: 404 });
  }

  const nextResult = await pool.query(
    `
      SELECT candidate_id
      FROM annotation_rows
      WHERE user_key = $1 AND completed = false
      ORDER BY id
      LIMIT 1
    `,
    [auth.userKey]
  );

  return NextResponse.json({
    ok: true,
    next_candidate_id: nextResult.rows[0]?.candidate_id || null
  });
}

function sanitizeAnnotation(body) {
  const output = {};
  for (const column of editableColumns) {
    output[column] = emptyToNull(body[column]);
  }
  return output;
}
