import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { supabaseConfigured, supabaseRequest } from './supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const inboxPath = path.join(dataDir, 'whatsapp-inbox.json');

const toDbMessage = (message) => ({
  id: message.id,
  sender_phone: message.from,
  contact_name: message.contactName || '',
  text: message.text,
  message_type: message.type || 'text',
  timestamp: message.timestamp,
  status: message.status || 'received',
  analysis: message.analysis || null,
  raw: message.raw || null,
});

const fromDbMessage = (message) => ({
  id: message.id,
  from: message.sender_phone,
  contactName: message.contact_name || '',
  text: message.text,
  type: message.message_type || 'text',
  timestamp: message.timestamp,
  status: message.status,
  analysis: message.analysis,
  raw: message.raw,
  createdAt: message.created_at,
  updatedAt: message.updated_at,
});

export async function readInbox() {
  if (supabaseConfigured) {
    const messages = await supabaseRequest('whatsapp_inbox?select=*&order=timestamp.desc&limit=500');
    return messages.map(fromDbMessage);
  }

  try {
    const content = await fs.readFile(inboxPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function writeInbox(messages) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(inboxPath, JSON.stringify(messages, null, 2), 'utf8');
}

export async function addInboxMessage(message) {
  if (supabaseConfigured) {
    const saved = await supabaseRequest('whatsapp_inbox?on_conflict=id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=ignore-duplicates,return=representation',
      },
      body: JSON.stringify(toDbMessage(message)),
    });

    if (saved?.[0]) return fromDbMessage(saved[0]);

    const existing = await supabaseRequest(`whatsapp_inbox?id=eq.${encodeURIComponent(message.id)}&select=*&limit=1`);
    return existing?.[0] ? fromDbMessage(existing[0]) : message;
  }

  const messages = await readInbox();
  const exists = messages.some((item) => item.id === message.id);

  if (!exists) {
    messages.unshift(message);
    await writeInbox(messages.slice(0, 500));
  }

  return message;
}

export async function updateInboxMessage(id, updates) {
  if (supabaseConfigured) {
    const dbUpdates = {
      ...(updates.status ? { status: updates.status } : {}),
      ...(updates.analysis ? { analysis: updates.analysis } : {}),
      updated_at: new Date().toISOString(),
    };

    const updated = await supabaseRequest(`whatsapp_inbox?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(dbUpdates),
    });

    return updated?.[0] ? fromDbMessage(updated[0]) : null;
  }

  const messages = await readInbox();
  const updated = messages.map((message) =>
    message.id === id ? { ...message, ...updates, updatedAt: new Date().toISOString() } : message
  );

  await writeInbox(updated);
  return updated.find((message) => message.id === id);
}
