const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error || `Erro ${response.status}`);
  }

  return response.json();
}

export interface ApiStatus {
  ok: boolean;
  whatsappConfigured: boolean;
  openAiConfigured: boolean;
  supabaseConfigured: boolean;
}

export interface WhatsAppInboxMessage {
  id: string;
  from: string;
  contactName?: string;
  text: string;
  timestamp: string;
  status: 'received' | 'read' | 'answered';
  analysis?: unknown;
}

export const api = {
  health: () => request<ApiStatus>('/api/health'),
  login: (login: string, password: string) => request<{ user: import('../types').User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  }),
  listData: <T>(collection: string) => request<T[]>(`/api/data/${collection}`),
  saveData: <T extends { id: string }>(collection: string, item: T) => request<T>(`/api/data/${collection}/${encodeURIComponent(item.id)}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  }),
  deleteData: (collection: string, id: string) => request<{ ok: boolean }>(`/api/data/${collection}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }),
  analyze: <T>(message: string) => request<T>('/api/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({ message }),
  }),
  getWhatsAppMessages: () => request<WhatsAppInboxMessage[]>('/api/whatsapp/messages'),
  markWhatsAppRead: (id: string) => request<WhatsAppInboxMessage>(`/api/whatsapp/messages/${id}/read`, {
    method: 'POST',
  }),
  sendWhatsApp: (to: string, body: string) => request('/api/whatsapp/send', {
    method: 'POST',
    body: JSON.stringify({ to, body }),
  }),
};

