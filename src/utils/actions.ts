import { Budget, QuoteSettings, Visit } from '../types';

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

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const openBudgetPdf = (budget: Budget, settings?: QuoteSettings) => {
  const discountAmount = budget.discountType === 'percentage'
    ? (budget.subtotal * budget.discount) / 100
    : budget.discount;
  const qrUrl = settings?.pixKey
    ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(settings.pixKey)}`
    : '';

  const rows = budget.items.map((item) => `
    <tr>
      <td>${escapeHtml(item.description)}</td>
      <td>${item.quantity} ${escapeHtml(item.unit)}</td>
      <td>${formatCurrency(item.unitPrice)}</td>
      <td>${formatCurrency(item.total)}</td>
    </tr>
  `).join('');

  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Orcamento ${escapeHtml(budget.leadName)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; color: #111827; background: #f8fafc; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 18mm; background: white; }
    .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 3px solid #b91c1c; padding-bottom: 18px; }
    .brand { display: flex; gap: 14px; align-items: center; }
    .logo { width: 64px; height: 64px; object-fit: contain; border: 1px solid #e5e7eb; border-radius: 10px; }
    .logo-fallback { width: 64px; height: 64px; border-radius: 10px; background: #b91c1c; color: white; display: grid; place-items: center; font-size: 32px; font-weight: 800; }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 24px; }
    .muted { color: #6b7280; font-size: 13px; line-height: 1.5; }
    .quote-title { text-align: right; }
    .quote-title h2 { color: #b91c1c; font-size: 24px; }
    .block { margin-top: 20px; padding: 14px; border: 1px solid #e5e7eb; border-radius: 10px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th { background: #f3f4f6; text-align: left; color: #374151; }
    th, td { padding: 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    td:nth-child(2), td:nth-child(3), td:nth-child(4), th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; white-space: nowrap; }
    .totals { margin-left: auto; width: 340px; margin-top: 18px; }
    .line { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #e5e7eb; }
    .total { font-size: 20px; font-weight: 800; color: #b91c1c; }
    .pix { display: flex; align-items: center; gap: 14px; }
    .signature { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 54px; }
    .signature div { border-top: 1px solid #111827; padding-top: 8px; text-align: center; font-size: 13px; color: #374151; }
    .footer { margin-top: 30px; color: #6b7280; font-size: 12px; text-align: center; }
    @media print {
      body { background: white; }
      .page { margin: 0; width: auto; min-height: auto; box-shadow: none; }
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="header">
      <div class="brand">
        ${settings?.logoUrl ? `<img class="logo" src="${escapeHtml(settings.logoUrl)}" />` : '<div class="logo-fallback">M</div>'}
        <div>
          <h1>${escapeHtml(settings?.companyName || 'Marquinhos')}</h1>
          <p class="muted">${escapeHtml(settings?.document || '')}</p>
          <p class="muted">${escapeHtml(settings?.phone || '')}${settings?.email ? ` | ${escapeHtml(settings.email)}` : ''}</p>
        </div>
      </div>
      <div class="quote-title">
        <h2>ORCAMENTO</h2>
        <p class="muted">#${budget.id.slice(0, 8).toUpperCase()}</p>
        <p class="muted">${new Date().toLocaleDateString('pt-BR')}</p>
      </div>
    </section>

    ${settings?.headerText ? `<section class="block">${escapeHtml(settings.headerText)}</section>` : ''}

    <section class="grid">
      <div class="block">
        <h3>Cliente</h3>
        <p>${escapeHtml(budget.leadName)}</p>
      </div>
      <div class="block">
        <h3>Condicoes</h3>
        <p class="muted">Validade: ${budget.validity} dias</p>
        <p class="muted">Pagamento: ${escapeHtml(budget.paymentConditions)}</p>
      </div>
    </section>

    <section class="block">
      <h3>Itens</h3>
      <table>
        <thead><tr><th>Descricao</th><th>Qtd</th><th>Unit.</th><th>Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals">
        <div class="line"><span>Itens</span><strong>${formatCurrency(budget.items.reduce((sum, item) => sum + item.total, 0))}</strong></div>
        <div class="line"><span>Mao de obra</span><strong>${formatCurrency(budget.laborCost)}</strong></div>
        <div class="line"><span>Deslocamento</span><strong>${formatCurrency(budget.travelCost)}</strong></div>
        <div class="line"><span>Subtotal</span><strong>${formatCurrency(budget.subtotal)}</strong></div>
        <div class="line"><span>Desconto</span><strong>-${formatCurrency(discountAmount)}</strong></div>
        <div class="line total"><span>Total</span><span>${formatCurrency(budget.total)}</span></div>
      </div>
    </section>

    ${settings?.pixKey ? `<section class="block pix"><img src="${qrUrl}" width="112" height="112" /><div><h3>PIX</h3><p>${escapeHtml(settings.pixKey)}</p></div></section>` : ''}
    ${budget.observations ? `<section class="block"><h3>Observacoes</h3><p>${escapeHtml(budget.observations)}</p></section>` : ''}

    <section class="signature">
      <div>Assinatura do cliente</div>
      <div>${escapeHtml(settings?.companyName || 'Marquinhos')}</div>
    </section>

    <p class="footer">${escapeHtml(settings?.footerText || '')}</p>
  </main>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) return false;
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
};

export const buildBudgetText = (budget: Budget, settings?: QuoteSettings) => {
  const items = budget.items
    .map((item) => `- ${item.description}: ${item.quantity} ${item.unit} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.total)}`)
    .join('\n');

  const discountAmount = budget.discountType === 'percentage'
    ? (budget.subtotal * budget.discount) / 100
    : budget.discount;

  return [
    `ORCAMENTO - ${settings?.companyName || 'Marquinhos'}`,
    settings?.logoUrl ? `Logo: ${settings.logoUrl}` : '',
    settings?.document ? `Documento: ${settings.document}` : '',
    settings?.phone ? `Telefone: ${settings.phone}` : '',
    settings?.email ? `E-mail: ${settings.email}` : '',
    settings?.headerText ? `\n${settings.headerText}` : '',
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
    settings?.pixKey ? `PIX: ${settings.pixKey}` : '',
    budget.observations ? `Observacoes: ${budget.observations}` : '',
    settings?.footerText ? `\n${settings.footerText}` : '',
  ].filter(Boolean).join('\n');
};

export const buildVisitText = (visit: Visit) => [
  'FICHA DE VISITA - Marquinhos',
  '',
  `Cliente: ${visit.leadName}`,
  `Telefone: ${visit.phone}`,
  `Servico: ${visit.service}`,
  `Endereco: ${visit.address}`,
  `Data: ${new Date(visit.date).toLocaleDateString('pt-BR')}`,
  `Horario: ${visit.time}`,
  visit.observations ? `Observacoes: ${visit.observations}` : '',
].filter(Boolean).join('\n');
