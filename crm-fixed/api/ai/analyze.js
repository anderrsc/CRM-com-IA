import { analyzeCustomerMessage } from '../_lib/ai.js';
import { methodNotAllowed, send } from '../_lib/http.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    methodNotAllowed(res);
    return;
  }

  const message = req.body?.message || '';
  if (!String(message).trim()) {
    send(res, 400, { error: 'Campo "message" é obrigatório' });
    return;
  }

  try {
    send(res, 200, await analyzeCustomerMessage(message));
  } catch (error) {
    send(res, 500, { error: error.message });
  }
}
