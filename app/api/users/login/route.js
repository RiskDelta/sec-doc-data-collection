import { NextResponse } from 'next/server';
import { getPool, normalizeUserKey } from '../../../../lib/db';
import { isMissingAuthTable, missingAuthTableMessage, normalizePassword } from '../../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.json();
  const userKey = normalizeUserKey(body.user_key);
  const password = normalizePassword(body.password);

  if (!userKey || !password) {
    return NextResponse.json({ error: 'User ID and password are required.' }, { status: 400 });
  }

  let result;
  try {
    result = await getPool().query(
      'SELECT user_key FROM annotation_users WHERE user_key = $1 AND password = $2 LIMIT 1',
      [userKey, password]
    );
  } catch (error) {
    if (isMissingAuthTable(error)) {
      return NextResponse.json({ error: missingAuthTableMessage() }, { status: 503 });
    }
    throw error;
  }

  if (result.rowCount === 0) {
    return NextResponse.json({ error: 'Invalid user ID or password.' }, { status: 403 });
  }

  return NextResponse.json({ ok: true, user_key: userKey });
}
