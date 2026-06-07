export function extractWebhookMessages(payload) {
  const items = [];

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const contacts = value.contacts || [];
      const contactByWaId = new Map(contacts.map((contact) => [contact.wa_id, contact]));

      for (const message of value.messages || []) {
        const contact = contactByWaId.get(message.from);
        const text = message.text?.body || message.button?.text || message.interactive?.button_reply?.title || '';

        if (!text) continue;

        items.push({
          id: message.id,
          from: message.from,
          contactName: contact?.profile?.name || '',
          text,
          type: message.type,
          timestamp: message.timestamp
            ? new Date(Number(message.timestamp) * 1000).toISOString()
            : new Date().toISOString(),
          status: 'received',
          raw: message,
        });
      }
    }
  }

  return items;
}

export async function sendWhatsAppText(to, body) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error('Configure WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID no .env');
  }

  const version = process.env.WHATSAPP_GRAPH_VERSION || 'v23.0';
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: false,
        body,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}
