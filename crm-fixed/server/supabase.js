const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

export async function supabaseRequest(path, options = {}) {
  if (!supabaseConfigured) {
    throw new Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase error ${response.status}: ${detail}`);
  }

  if (response.status === 204) return null;
  return response.json();
}
