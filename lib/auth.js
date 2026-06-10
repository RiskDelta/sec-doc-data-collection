import { getPool, normalizeUserKey } from './db';

export function normalizePassword(value) {
  return String(value || '').trim();
}

export function generatePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let output = '';
  for (let index = 0; index < 10; index += 1) {
    output += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return output;
}

export function isMissingAuthTable(error) {
  return error?.code === '42P01' && String(error?.message || '').includes('annotation_users');
}

export function missingAuthTableMessage() {
  return 'No user accounts are configured yet. Ask the admin to run the database migration and upload a CSV for this user.';
}

export async function requireUserPassword(request, userKeyParam) {
  const userKey = normalizeUserKey(userKeyParam);
  const password = normalizePassword(request.headers.get('x-user-password'));

  if (!userKey || !password) {
    return { ok: false, userKey, status: 401, error: 'User ID and password are required.' };
  }

  let result;
  try {
    result = await getPool().query(
      'SELECT password FROM annotation_users WHERE user_key = $1 LIMIT 1',
      [userKey]
    );
  } catch (error) {
    if (isMissingAuthTable(error)) {
      return { ok: false, userKey, status: 503, error: missingAuthTableMessage() };
    }
    throw error;
  }

  if (result.rowCount === 0 || result.rows[0].password !== password) {
    return { ok: false, userKey, status: 403, error: 'Invalid user ID or password.' };
  }

  return { ok: true, userKey };
}
