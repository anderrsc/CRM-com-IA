const fallbackAnalyze = (message) => {
  const text = String(message || '');
  const lower = text.toLowerCase();
  const phone = text.match(/\(?\d{2}\)?\s*\d{4,5}[-.\s]?\d{4}/)?.[0] || '';
  const address = text.match(/(?:rua|av\.?|avenida|alameda)\s+[^,.\n]+(?:\s*,?\s*\d+)?/i)?.[0] || '';
  const name = text.match(/(?:sou|meu nome e|meu nome é|me chamo|aqui e|aqui é|e o|é o|e a|é a)\s+([A-Za-zÀ-ÿ]+)/i)?.[1] || '';

  const serviceMap = [
    ['Calha', ['calha', 'calhas']],
    ['Rufo', ['rufo', 'rufos']],
    ['Janela', ['janela', 'janelas']],
    ['Porta', ['porta', 'portas']],
    ['Box de Vidro', ['box', 'banheiro']],
    ['Vidro Temperado', ['vidro', 'temperado', 'laminado']],
    ['Guarda-corpo', ['guarda-corpo', 'guarda corpo', 'sacada']],
    ['Manutenção', ['manutenção', 'manutencao', 'conserto', 'reparo', 'arrumar', 'trocar']],
  ];

  const service = serviceMap.find(([, keys]) => keys.some((key) => lower.includes(key)))?.[0] || '';
  const urgency = lower.includes('urgente') || lower.includes('vazando') || lower.includes('quebr')
    ? 'urgente'
    : lower.includes('rapido') || lower.includes('rápido') || lower.includes('logo')
      ? 'alta'
      : 'media';

  return {
    name: name ? name.charAt(0).toUpperCase() + name.slice(1) : '',
    phone,
    address,
    neighborhood: '',
    city: 'Maringá',
    service,
    availability: '',
    urgency,
    summary: [name && `Cliente ${name}`, service && `precisa de ${service.toLowerCase()}`, address && `em ${address}`]
      .filter(Boolean)
      .join(', ') || 'Mensagem recebida. Revise os dados antes de criar o lead.',
    suggestedActions: ['Confirmar dados do cliente', 'Agendar visita técnica'],
    confidence: [name, phone, address, service].filter(Boolean).length / 4,
    source: 'fallback',
  };
};

export async function analyzeCustomerMessage(message) {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackAnalyze(message);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: [
              'Você é um assistente que extrai dados comerciais de mensagens de clientes de uma empresa de esquadrias, alumínio, vidros, calhas e manutenção.',
              'Responda SOMENTE com JSON válido, sem markdown, sem texto extra.',
              'Campos obrigatórios: name (string), phone (string), address (string), neighborhood (string), city (string), service (string), availability (string), urgency (string: "baixa"|"media"|"alta"|"urgente"), summary (string), suggestedActions (array de strings), confidence (número 0-1).',
              'Se não souber um campo, use string vazia.',
            ].join(' '),
          },
          { role: 'user', content: message },
        ],
      }),
    });

    if (!response.ok) {
      console.error('OpenAI error:', response.status, await response.text());
      return fallbackAnalyze(message);
    }

    const data = await response.json();
    const outputText = data.choices?.[0]?.message?.content || '';

    try {
      return { ...JSON.parse(outputText), source: 'openai' };
    } catch {
      return { ...fallbackAnalyze(message), summary: outputText || fallbackAnalyze(message).summary, source: 'openai-text' };
    }
  } catch (err) {
    console.error('OpenAI fetch failed:', err.message);
    return fallbackAnalyze(message);
  }
}
