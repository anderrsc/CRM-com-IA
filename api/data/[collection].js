import { methodNotAllowed, requireSupabase, send } from '../_lib/http.js';
import { supabaseConfigured, supabaseRequest } from '../_lib/supabase.js';

export default async function handler(req, res) {
  const { collection } = req.query;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!requireSupabase(res, supabaseConfigured)) return;

  try {
    if (req.method === 'GET') {
      const rows = await supabaseRequest(
        `app_records?collection=eq.${encodeURIComponent(collection)}&select=id,payload,updated_at&order=updated_at.desc`
      );
      send(res, 200, rows.map((row) => row.payload));
      return;
    }

    methodNotAllowed(res);
  } catch (error) {
    send(res, 500, { error: error.message });
  }
}
