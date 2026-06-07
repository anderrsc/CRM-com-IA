import { Budget, Lead, QuoteSettings, Visit } from '../types';

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

export const openBudgetPdf = (budget: Budget, settings?: QuoteSettings, lead?: Lead) => {
  const discountAmount = budget.discountType === 'percentage'
    ? (budget.subtotal * budget.discount) / 100
    : budget.discount;
  const accentColor = settings?.accentColor || '#b91c1c';
  const secondaryColor = settings?.secondaryColor || '#111827';
  const fontFamily = settings?.fontFamily || 'Arial';
  const layoutStyle = settings?.layoutStyle || 'moderno';
  const showQrCode = settings?.showQrCode !== false;
  const showSignature = settings?.showSignature !== false;
  const compact = layoutStyle === 'compacto';
  const qrUrl = settings?.pixKey && showQrCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(settings.pixKey)}`
    : '';

  const emissionDate = new Date();
  const validityDate = new Date(emissionDate);
  validityDate.setDate(validityDate.getDate() + budget.validity);
  const rows = budget.items.map((item, index) => `
    <tr>
      <td>${index + 1}.${escapeHtml(item.description)}</td>
      <td>${escapeHtml(item.unit.toUpperCase())}</td>
      <td>${Number(item.quantity).toFixed(2)}</td>
      <td>${formatCurrency(item.total)}</td>
      <td>A COMBINAR</td>
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
    body { margin: 0; font-family: ${fontFamily}, Arial, sans-serif; color: ${secondaryColor}; background: #f8fafc; }
    .page { position: relative; width: 210mm; min-height: 297mm; margin: 0 auto; padding: ${compact ? '11mm' : '14mm'}; background: white; overflow: hidden; }
    .watermark { position: absolute; inset: 42% auto auto 12%; transform: rotate(-28deg); font-size: 56px; font-weight: 800; color: rgba(17,24,39,0.055); white-space: nowrap; pointer-events: none; }
    .header { display: grid; grid-template-columns: 96px 1fr; gap: 16px; border-bottom: ${layoutStyle === 'classico' ? '1px' : '3px'} solid ${accentColor}; padding-bottom: ${compact ? '10px' : '14px'}; }
    .brand { display: flex; gap: 14px; align-items: center; }
    .logo { width: 86px; height: 86px; object-fit: contain; border: 1px solid #e5e7eb; border-radius: 10px; }
    .logo-fallback { width: 86px; height: 86px; border-radius: 10px; background: ${accentColor}; color: white; display: grid; place-items: center; font-size: 38px; font-weight: 800; }
    h1, h2, h3, p { margin: 0; }
    h1 { font-size: 24px; }
    .muted { color: #4b5563; font-size: 12px; line-height: 1.45; }
    .company-line { font-size: 12px; line-height: 1.45; }
    .quote-meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 12px; border: 1px solid #d1d5db; padding: 8px; font-size: 12px; }
    .client-grid { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 7px 14px; margin-top: 10px; font-size: 12px; }
    .field { border-bottom: 1px solid #d1d5db; min-height: 20px; }
    .label { font-weight: 700; color: #111827; }
    .block { margin-top: ${compact ? '10px' : '14px'}; padding: ${compact ? '9px' : '12px'}; border: 1px solid #d1d5db; border-radius: ${layoutStyle === 'classico' ? '2px' : '8px'}; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    th { background: ${accentColor}; text-align: left; color: white; }
    th, td { padding: 8px; border: 1px solid #d1d5db; vertical-align: top; }
    td:nth-child(2), td:nth-child(3), td:nth-child(4), td:nth-child(5), th:nth-child(2), th:nth-child(3), th:nth-child(4), th:nth-child(5) { text-align: right; white-space: nowrap; }
    .totals { margin-left: auto; width: 260px; margin-top: 14px; }
    .line { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #e5e7eb; }
    .total { font-size: 20px; font-weight: 800; color: ${accentColor}; border: 2px solid ${accentColor}; padding: 8px; }
    .pix { display: flex; align-items: center; gap: 14px; }
    .signature { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 54px; }
    .signature div { border-top: 1px solid #111827; padding-top: 8px; text-align: center; font-size: 13px; color: #374151; }
    .notes { margin-top: 14px; font-size: 12px; line-height: 1.55; }
    .footer { margin-top: 18px; color: #6b7280; font-size: 11px; text-align: center; }
    @media print {
      body { background: white; }
      .page { margin: 0; width: auto; min-height: auto; box-shadow: none; }
    }
  </style>
</head>
<body>
  <main class="page">
    ${settings?.watermarkText ? `<div class="watermark">${escapeHtml(settings.watermarkText)}</div>` : ''}
    <section class="header">
      <div>
        ${settings?.logoUrl ? `<img class="logo" src="${escapeHtml(settings.logoUrl)}" />` : '<div class="logo-fallback">M</div>'}
      </div>
      <div>
        <div>
          <h1>${escapeHtml(settings?.companyName || 'Marquinhos')}</h1>
          <p class="company-line"><strong>Endereço:</strong> ${escapeHtml(settings?.headerText || 'Configure o endereço no Modelo do Orçamento')}</p>
          <p class="company-line"><strong>Contatos:</strong> ${escapeHtml(settings?.phone || '')}${settings?.email ? ` | ${escapeHtml(settings.email)}` : ''}</p>
          <p class="company-line"><strong>CNPJ:</strong> ${escapeHtml(settings?.document || '')}</p>
        </div>
      </div>
    </section>

    <section class="quote-meta">
      <div><span class="label">Orçamento N:</span> ${budget.id.slice(0, 8).toUpperCase()}</div>
      <div><span class="label">Data Emissão:</span> ${emissionDate.toLocaleDateString('pt-BR')}</div>
      <div><span class="label">Validade:</span> ${validityDate.toLocaleDateString('pt-BR')}</div>
    </section>

    <section class="block">
      <div class="client-grid">
        <div class="field"><span class="label">Cliente:</span> ${escapeHtml(budget.leadName)}</div>
        <div class="field"><span class="label">CPF/CNPJ:</span></div>
        <div class="field"><span class="label">RG/IE:</span></div>
        <div class="field"><span class="label">Endereço:</span> ${escapeHtml(lead?.address || '')}</div>
        <div class="field"><span class="label">Bairro:</span> ${escapeHtml(lead?.neighborhood || '')}</div>
        <div class="field"><span class="label">Cidade:</span> ${escapeHtml(lead?.city || '')}${lead?.state ? ` - ${escapeHtml(lead.state)}` : ''}</div>
        <div class="field"><span class="label">Telefone:</span></div>
        <div class="field"><span class="label">Celular:</span> ${escapeHtml(lead?.phone || '')}</div>
        <div class="field"><span class="label">E-mail:</span> ${escapeHtml(lead?.email || '')}</div>
      </div>
    </section>

    <section class="block">
      <h3>Produto(s)</h3>
      <table>
        <thead><tr><th>Produto(s)</th><th>UN</th><th>Qtdade</th><th>Valor total</th><th>Prazo de Entrega</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals">
        <div class="line total"><span>Total</span><span>${formatCurrency(budget.total)}</span></div>
      </div>
    </section>

    ${settings?.pixKey ? `<section class="block pix">${qrUrl ? `<img src="${qrUrl}" width="112" height="112" />` : ''}<div><h3>PIX</h3><p>${escapeHtml(settings.pixKey)}</p></div></section>` : ''}
    <section class="notes">
      <p><strong>Condição de Pagamento:</strong> ${escapeHtml(budget.paymentConditions)}</p>
      <p><strong>Prazo de entrega:</strong> A COMBINAR</p>
      <p><strong>Observações:</strong> ${escapeHtml(budget.observations || settings?.footerText || 'NÃO INCLUSO MÃO DE OBRA DE ALVENARIA.')}</p>
      ${discountAmount > 0 ? `<p><strong>Desconto aplicado:</strong> ${formatCurrency(discountAmount)}</p>` : ''}
    </section>

    ${showSignature ? `<section class="signature">
      <div>Assinatura do cliente</div>
      <div>${escapeHtml(settings?.companyName || 'Marquinhos')}</div>
    </section>` : ''}

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
