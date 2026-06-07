import { send } from './_lib/http.js';
import { supabaseConfigured } from './_lib/supabase.js';

export default function handler(_req, res) {
  send(res, 200, {
    ok: true,
    whatsappConfigured: Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
    openAiConfigured: Boolean(process.env.OPENAI_API_KEY),
    supabaseConfigured,
  });
}
