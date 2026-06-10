import { NextResponse } from 'next/server';
import { getPool } from '../../../../lib/db';
import { requireAdminPassword } from '../../../../lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const adminError = requireAdminPassword(request);
  if (adminError) return adminError;

  const result = await getPool().query(`
    SELECT
      users.user_key,
      users.password,
      COUNT(rows.id)::int AS total,
      COUNT(rows.id) FILTER (WHERE rows.completed)::int AS completed,
      COUNT(rows.id) FILTER (WHERE rows.completed = false)::int AS open,
      GREATEST(users.updated_at, COALESCE(MAX(rows.updated_at), users.updated_at)) AS last_updated_at
    FROM annotation_users users
    LEFT JOIN annotation_rows rows ON rows.user_key = users.user_key
    GROUP BY users.user_key, users.password, users.updated_at
    ORDER BY last_updated_at DESC NULLS LAST, user_key ASC
  `);

  return NextResponse.json({ users: result.rows });
}
