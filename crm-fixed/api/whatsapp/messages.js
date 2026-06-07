import { send } from '../_lib/http.js';
import { supabaseConfigured, supabaseRequest } from '../_lib/supabase.js';
import { fromDbMessage } from '../_lib/whatsapp.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    send(res, 405, { error: 'Método não permitido' });
    return;
  }

  if (!supabaseConfigured) {
    send(res, 200, []);
    return;
  }

  try {
    const rows = await supabaseRequest('whatsapp_inbox?select=*&order=timestamp.desc&limit=500');
    send(res, 200, (rows || []).map(fromDbMessage));
  } catch (error) {
    send(res, 500, { error: error.message });
  }
}
