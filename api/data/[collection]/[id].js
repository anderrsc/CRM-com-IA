import { methodNotAllowed, requireSupabase, send } from '../../_lib/http.js';
import { supabaseConfigured, supabaseRequest } from '../../_lib/supabase.js';
import { deleteRecord, saveRecord } from '../../../shared/records.js';

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
      send(res, 200, await saveRecord(supabaseRequest, collection, id, req.body));
      return;
    }

    if (req.method === 'DELETE') {
      await deleteRecord(supabaseRequest, collection, id);
      send(res, 200, { ok: true });
      return;
    }

    methodNotAllowed(res);
  } catch (error) {
    send(res, error.statusCode || 500, { error: error.message });
  }
}
