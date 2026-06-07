import crypto from 'node:crypto';

export function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar || undefined,
    phone: row.phone || undefined,
    active: row.active,
    createdAt: row.created_at,
  };
}

export function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;

  const [algorithm, iterationsValue, salt, expected] = String(storedHash).split('$');
  if (algorithm !== 'pbkdf2_sha256' || !iterationsValue || !salt || !expected) return false;

  const iterations = Number(iterationsValue);
  if (!Number.isFinite(iterations) || iterations < 100000) return false;

  const actual = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('base64');
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const iterations = 600000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('base64');
  return `pbkdf2_sha256$${iterations}$${salt}$${hash}`;
}

export async function authenticateUser(supabaseRequest, login, password) {
  const normalizedLogin = String(login || '').trim().toLowerCase();
  if (!normalizedLogin || !password) {
    const error = new Error('Login e senha sao obrigatorios');
    error.statusCode = 400;
    throw error;
  }

  const rows = await supabaseRequest(
    `app_users?email=eq.${encodeURIComponent(normalizedLogin)}&active=eq.true&select=*&limit=1`
  );
  const user = rows?.[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    const error = new Error('E-mail ou senha incorretos');
    error.statusCode = 401;
    throw error;
  }

  return sanitizeUser(user);
}
