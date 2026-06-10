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

export async function requireUserPassword(request, userKeyParam) {
  const userKey = normalizeUserKey(userKeyParam);
  const password = normalizePassword(request.headers.get('x-user-password'));

  if (!userKey || !password) {
    return { ok: false, userKey, status: 401, error: 'User ID and password are required.' };
  }

  const result = await getPool().query(
    'SELECT password FROM annotation_users WHERE user_key = $1 LIMIT 1',
    [userKey]
  );

  if (result.rowCount === 0 || result.rows[0].password !== password) {
    return { ok: false, userKey, status: 403, error: 'Invalid user ID or password.' };
  }

  return { ok: true, userKey };
}
