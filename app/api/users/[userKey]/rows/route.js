import { NextResponse } from 'next/server';
import { getPool } from '../../../../../lib/db';
import { requireUserPassword } from '../../../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export async function GET(request, { params }) {
  const auth = await requireUserPassword(request, params.userKey);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get('page') || 1), 1);
  const offset = (page - 1) * PAGE_SIZE;

  const pool = getPool();
  const [countResult, rowsResult] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS total FROM annotation_rows WHERE user_key = $1', [auth.userKey]),
    pool.query(
      `
        SELECT
          candidate_id,
          ticker,
          old_filing_date,
          new_filing_date,
          candidate_source,
          similarity_score,
          primary_label,
          confidence,
          completed,
          completed_at
        FROM annotation_rows
        WHERE user_key = $1
        ORDER BY completed ASC, id ASC
        LIMIT $2 OFFSET $3
      `,
      [auth.userKey, PAGE_SIZE, offset]
    )
  ]);

  const total = countResult.rows[0].total;
  return NextResponse.json({
    rows: rowsResult.rows,
    page,
    page_size: PAGE_SIZE,
    total,
    total_pages: Math.max(Math.ceil(total / PAGE_SIZE), 1)
  });
}
