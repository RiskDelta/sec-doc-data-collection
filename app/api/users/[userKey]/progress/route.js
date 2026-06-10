import { NextResponse } from 'next/server';
import { getPool } from '../../../../../lib/db';
import { requireUserPassword } from '../../../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const auth = await requireUserPassword(request, params.userKey);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const result = await getPool().query(
    `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE completed)::int AS completed
      FROM annotation_rows
      WHERE user_key = $1
    `,
    [auth.userKey]
  );

  return NextResponse.json(result.rows[0]);
}
