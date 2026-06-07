import { methodNotAllowed, send } from '../_lib/http.js';
import { sendWhatsAppText } from '../_lib/whatsapp.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  try {
    const { to, body } = req.body || {};
    if (!to || !body) {
      send(res, 400, { error: 'Campos "to" e "body" são obrigatórios' });
      return;
    }
    send(res, 200, await sendWhatsAppText(to, body));
  } catch (error) {
    send(res, 400, { error: error.message });
  }
}
