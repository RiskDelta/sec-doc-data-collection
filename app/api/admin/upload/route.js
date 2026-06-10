import { parse } from 'csv-parse/sync';
import { NextResponse } from 'next/server';
import { getPool, normalizeUserKey } from '../../../../lib/db';
import { rowValues, upsertCandidateSql } from '../../../../lib/candidates';
import { generatePassword, normalizePassword } from '../../../../lib/auth';
import { requireAdminPassword } from '../../../../lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const adminError = requireAdminPassword(request);
  if (adminError) return adminError;

  const formData = await request.formData();
  const userKey = normalizeUserKey(formData.get('user_key'));
  const password = normalizePassword(formData.get('password')) || generatePassword();
  const file = formData.get('csv');

  if (!userKey) {
    return NextResponse.json({ error: 'User key is required.' }, { status: 400 });
  }
  if (!file || typeof file.arrayBuffer !== 'function') {
    return NextResponse.json({ error: 'CSV file is required.' }, { status: 400 });
  }

  let records;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    records = parse(buffer, {
      columns: true,
      bom: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (error) {
    return NextResponse.json({ error: `Could not parse CSV: ${error.message}` }, { status: 400 });
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `
        INSERT INTO annotation_users (user_key, password, updated_at)
        VALUES ($1, $2, now())
        ON CONFLICT (user_key) DO UPDATE SET
          password = EXCLUDED.password,
          updated_at = now()
      `,
      [userKey, password]
    );

    let inserted = 0;
    let updated = 0;

    for (const record of records) {
      if (!record.candidate_id) continue;
      const result = await client.query(upsertCandidateSql, rowValues(userKey, record));
      if (result.rows[0].inserted) inserted += 1;
      else updated += 1;
    }

    await client.query('COMMIT');
    return NextResponse.json({
      ok: true,
      user_key: userKey,
      password,
      received: records.length,
      inserted,
      updated,
      annotation_url: `/annotate/${encodeURIComponent(userKey)}`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
