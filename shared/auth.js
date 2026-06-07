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

export async function authenticateUser(supabaseRequest, email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    const error = new Error('E-mail e senha sao obrigatorios');
    error.statusCode = 400;
    throw error;
  }

  const rows = await supabaseRequest(
    `app_users?email=eq.${encodeURIComponent(normalizedEmail)}&active=eq.true&select=*&limit=1`
  );
  const user = rows?.[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    const error = new Error('E-mail ou senha incorretos');
    error.statusCode = 401;
    throw error;
  }

  return sanitizeUser(user);
}
