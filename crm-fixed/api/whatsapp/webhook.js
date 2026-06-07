import { analyzeCustomerMessage } from '../_lib/ai.js';
import { send } from '../_lib/http.js';
import { supabaseConfigured, supabaseRequest } from '../_lib/supabase.js';
import { extractWebhookMessages, toDbMessage, sendWhatsAppText } from '../_lib/whatsapp.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      res.status(200).send(challenge);
      return;
    }

    res.status(403).send('Forbidden');
    return;
  }

  if (req.method !== 'POST') {
    send(res, 405, { error: 'Método não permitido' });
    return;
  }

  try {
    const messages = extractWebhookMessages(req.body || {});

    for (const message of messages) {
      const analysis = await analyzeCustomerMessage(message.text);

      if (supabaseConfigured) {
        await supabaseRequest('whatsapp_inbox?on_conflict=id', {
          method: 'POST',
          headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
          body: JSON.stringify(toDbMessage({ ...message, analysis })),
        });
      }

      if (process.env.WHATSAPP_AUTO_REPLY === 'true') {
        await sendWhatsAppText(
          message.from,
          `Olá${message.contactName ? `, ${message.contactName}` : ''}! Recebemos sua mensagem. Já identifiquei: ${analysis.summary}. Em breve retornamos para confirmar os dados.`
        );
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    send(res, 500, { error: error.message });
  }
}
