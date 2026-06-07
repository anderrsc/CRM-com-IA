const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

export async function supabaseRequest(path, options = {}) {
  if (!supabaseConfigured) {
    throw new Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no Vercel');
  }

  const method = options.method || 'GET';

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    method,
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: options.headers?.Prefer || 'return=representation',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase ${response.status}: ${detail}`);
  }

  if (response.status === 204) return [];

  const text = await response.text();
  if (!text || text.trim() === '') return [];

  return JSON.parse(text);
}
