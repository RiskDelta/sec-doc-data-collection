import { NextResponse } from 'next/server';
import { getPool } from '../../../../../lib/db';
import { requireUserPassword } from '../../../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;
const statusFilters = new Set(['all', 'open', 'completed']);

export async function GET(request, { params }) {
  const auth = await requireUserPassword(request, params.userKey);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const page = parsePage(searchParams.get('page'));
  const status = parseStatus(searchParams.get('status'));
  const offset = (page - 1) * PAGE_SIZE;
  const where = ['user_key = $1'];
  const queryParams = [auth.userKey];

  if (status === 'open') {
    where.push('completed = false');
  } else if (status === 'completed') {
    where.push('completed = true');
  }

  const whereSql = where.join(' AND ');

  const pool = getPool();
  const [countResult, rowsResult] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total FROM annotation_rows WHERE ${whereSql}`, queryParams),
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
        WHERE ${whereSql}
        ORDER BY completed ASC, id ASC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `,
      [...queryParams, PAGE_SIZE, offset]
    )
  ]);

  const total = countResult.rows[0].total;
  return NextResponse.json({
    rows: rowsResult.rows,
    page,
    page_size: PAGE_SIZE,
    status,
    total,
    total_pages: Math.max(Math.ceil(total / PAGE_SIZE), 1)
  });
}

function parsePage(value) {
  const page = Number(value || 1);
  return Number.isFinite(page) ? Math.max(Math.floor(page), 1) : 1;
}

function parseStatus(value) {
  return statusFilters.has(value) ? value : 'all';
}
