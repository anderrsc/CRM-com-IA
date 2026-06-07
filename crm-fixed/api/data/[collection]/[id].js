import { methodNotAllowed, requireSupabase, send } from '../../_lib/http.js';
import { supabaseConfigured, supabaseRequest } from '../../_lib/supabase.js';

export default async function handler(req, res) {
  const { collection, id } = req.query;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!requireSupabase(res, supabaseConfigured)) return;

  try {
    if (req.method === 'PUT') {
      const results = await supabaseRequest(
        `app_records?on_conflict=collection,id`,
        {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify({
            collection,
            id,
            payload: req.body,
            updated_at: new Date().toISOString(),
          }),
        }
      );
      // supabaseRequest returns null for 204, array otherwise
      const saved = Array.isArray(results) ? results[0] : results;
      send(res, 200, saved?.payload ?? req.body);
      return;
    }

    if (req.method === 'DELETE') {
      await supabaseRequest(
        `app_records?collection=eq.${encodeURIComponent(collection)}&id=eq.${encodeURIComponent(id)}`,
        { method: 'DELETE', headers: { Prefer: 'return=minimal' } }
      );
      send(res, 200, { ok: true });
      return;
    }

    methodNotAllowed(res);
  } catch (error) {
    send(res, 500, { error: error.message });
  }
}
