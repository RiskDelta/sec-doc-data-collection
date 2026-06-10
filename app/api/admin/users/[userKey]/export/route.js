import { NextResponse } from 'next/server';
import { requireAdminPassword } from '../../../../../../lib/admin-auth';
import { getPool, normalizeUserKey } from '../../../../../../lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const exportColumns = [
  'user_key',
  'batch_id',
  'candidate_id',
  'ticker',
  'old_filing_date',
  'new_filing_date',
  'old_period_of_report',
  'new_period_of_report',
  'old_accession_number',
  'new_accession_number',
  'new_filing_url',
  'candidate_source',
  'heuristic_flags',
  'similarity_score',
  'old_unit_index',
  'new_unit_index',
  'old_text',
  'new_text',
  'primary_label',
  'secondary_label',
  'rationale_old',
  'rationale_new',
  'confidence',
  'annotator',
  'notes',
  'completed',
  'completed_at',
  'created_at',
  'updated_at'
];

export async function GET(request, { params }) {
  const adminError = requireAdminPassword(request);
  if (adminError) return adminError;

  const userKey = normalizeUserKey(params.userKey);
  const result = await getPool().query(
    `
      SELECT ${exportColumns.join(', ')}
      FROM annotation_rows
      WHERE user_key = $1
      ORDER BY id
    `,
    [userKey]
  );

  const csv = toCsv(result.rows, exportColumns);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${userKey}-annotation-rows.csv"`
    }
  });
}

function toCsv(rows, columns) {
  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(columns.map((column) => csvCell(row[column])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function csvCell(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return `"${value.toISOString()}"`;

  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}
