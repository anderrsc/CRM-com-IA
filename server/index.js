import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { analyzeCustomerMessage } from './services/openai.js';
import { extractWebhookMessages, sendWhatsAppText } from './services/whatsapp.js';
import { addInboxMessage, readInbox, updateInboxMessage } from './store.js';
import { supabaseConfigured } from './supabase.js';

const app = express();
const port = Number(process.env.API_PORT || 8787);

app.use(cors({ origin: process.env.APP_ORIGIN || 'http://127.0.0.1:5173' }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    whatsappConfigured: Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
    openAiConfigured: Boolean(process.env.OPENAI_API_KEY),
    supabaseConfigured,
  });
});

app.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
    return;
  }

  res.sendStatus(403);
});

app.post('/api/whatsapp/webhook', async (req, res) => {
  try {
    const messages = extractWebhookMessages(req.body);

    for (const message of messages) {
      const analysis = await analyzeCustomerMessage(message.text);
      const saved = await addInboxMessage({ ...message, analysis });

      if (process.env.WHATSAPP_AUTO_REPLY === 'true') {
        await sendWhatsAppText(
          saved.from,
          `Olá${saved.contactName ? `, ${saved.contactName}` : ''}! Recebemos sua mensagem. Já identifiquei: ${analysis.summary}. Em breve retornamos para confirmar os dados.`
        );
        await updateInboxMessage(saved.id, { status: 'answered' });
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/whatsapp/messages', async (_req, res) => {
  res.json(await readInbox());
});

app.get('/api/data/:collection', async (req, res) => {
  try {
    if (!supabaseConfigured) {
      res.json([]);
      return;
    }

    const { supabaseRequest } = await import('./supabase.js');
    const rows = await supabaseRequest(
      `app_records?collection=eq.${encodeURIComponent(req.params.collection)}&select=id,payload,updated_at&order=updated_at.desc`
    );
    res.json(rows.map((row) => row.payload));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/data/:collection/:id', async (req, res) => {
  try {
    if (!supabaseConfigured) {
      res.json(req.body);
      return;
    }

    const { supabaseRequest } = await import('./supabase.js');
    const [saved] = await supabaseRequest('app_records?on_conflict=collection,id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        collection: req.params.collection,
        id: req.params.id,
        payload: req.body,
        updated_at: new Date().toISOString(),
      }),
    });
    res.json(saved.payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/data/:collection/:id', async (req, res) => {
  try {
    if (supabaseConfigured) {
      const { supabaseRequest } = await import('./supabase.js');
      await supabaseRequest(
        `app_records?collection=eq.${encodeURIComponent(req.params.collection)}&id=eq.${encodeURIComponent(req.params.id)}`,
        { method: 'DELETE', headers: { Prefer: 'return=minimal' } }
      );
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/whatsapp/messages/:id/read', async (req, res) => {
  const updated = await updateInboxMessage(req.params.id, { status: 'read' });
  res.json(updated);
});

app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { to, body } = req.body;
    const result = await sendWhatsAppText(to, body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      res.status(400).json({ error: 'message é obrigatório' });
      return;
    }

    res.json(await analyzeCustomerMessage(message));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`API Marquinhos OS rodando em http://127.0.0.1:${port}`);
});
