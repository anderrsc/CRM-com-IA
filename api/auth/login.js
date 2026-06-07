import { methodNotAllowed, requireSupabase, send } from '../_lib/http.js';
import { supabaseConfigured, supabaseRequest } from '../_lib/supabase.js';
import { authenticateUser } from '../../shared/auth.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  if (!requireSupabase(res, supabaseConfigured)) return;

  try {
    const user = await authenticateUser(supabaseRequest, req.body?.email, req.body?.password);
    send(res, 200, { user });
  } catch (error) {
    send(res, error.statusCode || 500, { error: error.message });
  }
}
