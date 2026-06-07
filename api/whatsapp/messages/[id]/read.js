import { methodNotAllowed, requireSupabase, send } from '../../../_lib/http.js';
import { supabaseConfigured, supabaseRequest } from '../../../_lib/supabase.js';
import { fromDbMessage } from '../../../_lib/whatsapp.js';

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
    const { id } = req.query;
    const results = await supabaseRequest(
      `whatsapp_inbox?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ status: 'read', updated_at: new Date().toISOString() }),
      }
    );
    const updated = Array.isArray(results) ? results[0] : results;
    if (!updated) {
      send(res, 404, { error: 'Mensagem não encontrada' });
      return;
    }
    send(res, 200, fromDbMessage(updated));
  } catch (error) {
    send(res, 500, { error: error.message });
  }
}
