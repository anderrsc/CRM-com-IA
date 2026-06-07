import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { analyzeCustomerMessage } from './services/openai.js';
import { extractWebhookMessages, sendWhatsAppText } from './services/whatsapp.js';
import { addInboxMessage, readInbox, updateInboxMessage } from './store.js';
import { supabaseConfigured } from './supabase.js';
import { authenticateUser } from '../shared/auth.js';
import { deleteRecord, listRecords, saveRecord } from '../shared/records.js';

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

app.post('/api/auth/login', async (req, res) => {
  try {
    if (!supabaseConfigured) {
      res.status(503).json({ error: 'Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env' });
      return;
    }

    const { supabaseRequest } = await import('./supabase.js');
    res.json({ user: await authenticateUser(supabaseRequest, req.body?.login, req.body?.password) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.get('/api/data/:collection', async (req, res) => {
  try {
    if (!supabaseConfigured) {
      res.json([]);
      return;
    }

    const { supabaseRequest } = await import('./supabase.js');
    res.json(await listRecords(supabaseRequest, req.params.collection));
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.put('/api/data/:collection/:id', async (req, res) => {
  try {
    if (!supabaseConfigured) {
      res.json(req.body);
      return;
    }

    const { supabaseRequest } = await import('./supabase.js');
    res.json(await saveRecord(supabaseRequest, req.params.collection, req.params.id, req.body));
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.delete('/api/data/:collection/:id', async (req, res) => {
  try {
    if (supabaseConfigured) {
      const { supabaseRequest } = await import('./supabase.js');
      await deleteRecord(supabaseRequest, req.params.collection, req.params.id);
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
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
  console.log(`API Marquinhos rodando em http://127.0.0.1:${port}`);
});
