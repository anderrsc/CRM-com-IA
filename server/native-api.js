import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

try {
  const env = await fs.readFile(envPath, 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
} catch {
  // .env is optional for local preview.
}

const { supabaseConfigured, supabaseRequest } = await import('./supabase.js');
const { analyzeCustomerMessage } = await import('./services/openai.js');
const { authenticateUser } = await import('../shared/auth.js');
const { deleteRecord, listRecords, saveRecord } = await import('../shared/records.js');

const port = Number(process.env.API_PORT || 8787);
const dataDir = path.join(__dirname, 'data');

function send(res, status, body) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': process.env.APP_ORIGIN || 'http://127.0.0.1:5173',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

async function localRecordsPath(collection) {
  await fs.mkdir(dataDir, { recursive: true });
  return path.join(dataDir, `${collection}.json`);
}

async function localList(collection) {
  try {
    return JSON.parse(await fs.readFile(await localRecordsPath(collection), 'utf8'));
  } catch {
    return [];
  }
}

async function localSave(collection, item) {
  const items = await localList(collection);
  const index = items.findIndex((record) => record.id === item.id);
  if (index >= 0) items[index] = item;
  else items.unshift(item);
  await fs.writeFile(await localRecordsPath(collection), JSON.stringify(items, null, 2), 'utf8');
  return item;
}

async function localDelete(collection, id) {
  const items = await localList(collection);
  await fs.writeFile(
    await localRecordsPath(collection),
    JSON.stringify(items.filter((record) => record.id !== id), null, 2),
    'utf8'
  );
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      send(res, 204, {});
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/api/health') {
      send(res, 200, {
        ok: true,
        whatsappConfigured: Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
        openAiConfigured: Boolean(process.env.OPENAI_API_KEY),
        supabaseConfigured,
      });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/ai/analyze') {
      const body = await readJson(req);
      send(res, 200, await analyzeCustomerMessage(body.message || ''));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/login') {
      const body = await readJson(req);
      if (!supabaseConfigured) {
        send(res, 503, { error: 'Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env' });
        return;
      }
      send(res, 200, { user: await authenticateUser(supabaseRequest, body.login, body.password) });
      return;
    }

    const dataMatch = url.pathname.match(/^\/api\/data\/([^/]+)(?:\/([^/]+))?$/);
    if (dataMatch) {
      const collection = decodeURIComponent(dataMatch[1]);
      const id = dataMatch[2] ? decodeURIComponent(dataMatch[2]) : '';

      if (req.method === 'GET') {
        if (supabaseConfigured) {
          send(res, 200, await listRecords(supabaseRequest, collection));
        } else {
          send(res, 200, await localList(collection));
        }
        return;
      }

      if (req.method === 'PUT' && id) {
        const payload = await readJson(req);
        if (supabaseConfigured) {
          send(res, 200, await saveRecord(supabaseRequest, collection, id, payload));
        } else {
          send(res, 200, await localSave(collection, payload));
        }
        return;
      }

      if (req.method === 'DELETE' && id) {
        if (supabaseConfigured) {
          await deleteRecord(supabaseRequest, collection, id);
        } else {
          await localDelete(collection, id);
        }
        send(res, 200, { ok: true });
        return;
      }
    }

    if (req.method === 'GET' && url.pathname === '/api/whatsapp/messages') {
      send(res, 200, await localList('whatsapp-inbox'));
      return;
    }

    send(res, 404, { error: 'Rota nao encontrada' });
  } catch (error) {
    send(res, 500, { error: error.message });
  }
});

server.listen(port, () => {
  console.log(`API Marquinhos rodando em http://127.0.0.1:${port}`);
});
