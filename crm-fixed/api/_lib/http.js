export function send(res, status, body) {
  res.status(status).json(body);
}

export function methodNotAllowed(res) {
  send(res, 405, { error: 'Metodo nao permitido' });
}

export function requireSupabase(res, supabaseConfigured) {
  if (supabaseConfigured) return true;
  send(res, 503, { error: 'Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no Vercel' });
  return false;
}
