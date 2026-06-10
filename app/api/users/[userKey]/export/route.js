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
    'SELECT * FROM annotation_rows WHERE user_key = $1 ORDER BY id',
    [auth.userKey]
  );

  return NextResponse.json({ rows: result.rows });
}
