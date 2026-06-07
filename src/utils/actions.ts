import { Budget, Visit } from '../types';

export const onlyDigits = (value: string) => value.replace(/\D/g, '');

export const formatPhoneForWhatsApp = (phone: string) => {
  const digits = onlyDigits(phone);
  if (!digits) return '';
  return digits.startsWith('55') ? digits : `55${digits}`;
};

export const openWhatsApp = (phone: string, message: string) => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  if (!formattedPhone) return false;

  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
};

export const openMap = (address: string) => {
  if (!address.trim()) return false;

  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
};

export const callPhone = (phone: string) => {
  const digits = onlyDigits(phone);
  if (!digits) return false;

  window.location.href = `tel:${digits}`;
  return true;
};

export const copyText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  return copied;
};

export const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const buildBudgetText = (budget: Budget) => {
  const items = budget.items
    .map((item) => `- ${item.description}: ${item.quantity} ${item.unit} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.total)}`)
    .join('\n');

  const discountAmount = budget.discountType === 'percentage'
    ? (budget.subtotal * budget.discount) / 100
    : budget.discount;

  return [
    'ORCAMENTO - Marquinhos OS',
    '',
    `Cliente: ${budget.leadName}`,
    `Numero: ${budget.id.slice(0, 8).toUpperCase()}`,
    '',
    'Itens:',
    items,
    '',
    `Mao de obra: ${formatCurrency(budget.laborCost)}`,
    `Deslocamento: ${formatCurrency(budget.travelCost)}`,
    `Subtotal: ${formatCurrency(budget.subtotal)}`,
    `Desconto: ${formatCurrency(discountAmount)}`,
    `Total: ${formatCurrency(budget.total)}`,
    '',
    `Validade: ${budget.validity} dias`,
    `Pagamento: ${budget.paymentConditions}`,
    budget.observations ? `Observacoes: ${budget.observations}` : '',
  ].filter(Boolean).join('\n');
};

export const buildVisitText = (visit: Visit) => [
  'FICHA DE VISITA - Marquinhos OS',
  '',
  `Cliente: ${visit.leadName}`,
  `Telefone: ${visit.phone}`,
  `Servico: ${visit.service}`,
  `Endereco: ${visit.address}`,
  `Data: ${new Date(visit.date).toLocaleDateString('pt-BR')}`,
  `Horario: ${visit.time}`,
  visit.observations ? `Observacoes: ${visit.observations}` : '',
].filter(Boolean).join('\n');
