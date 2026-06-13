import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Plus, FileText, Send, Download, Eye, Trash2, Calculator, Package,
  DollarSign, Percent, MessageSquare, Mail, CheckCircle, XCircle,
  Lock, Layers, Paintbrush, Wrench, ChevronDown, ChevronLeft, AlertCircle, Printer,
  Copy, MoreVertical, Tag, Settings2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select, TextArea } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
// Modal removed — using full-page navigation instead
import { useStore } from '../store/useStore';
import { Budget, BudgetItem, QuotePriceItem, UserRole } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { buildBudgetText, copyText, downloadTextFile, openWhatsApp, formatCurrency } from '../utils/actions';

// ─── Access control ────────────────────────────────────────────────────────────
const ALLOWED_ROLES: UserRole[] = ['admin', 'gerente', 'vendedor'];
const PRICE_VISIBLE_ROLES: UserRole[] = ['admin', 'gerente', 'vendedor'];

// ─── Product catalog ──────────────────────────────────────────────────────────
const THICKNESS_OPTS = ['0.50', '0.60', '0.70', '1.00'];
const CUT_OPTS = ['150','200','250','300','330','350','400','500','600','700','800','900','1000','1200'];
const COLOR_OPTS = ['Natural','Branco','Preto','Bronze','Grafite','Amarelo','Vermelho','Verde'];
const UNIT_OPTS = [{ value: 'm', label: 'm' },{ value: 'un', label: 'un' },{ value: 'kg', label: 'kg' },{ value: 'kit', label: 'kit' },{ value: 'h', label: 'h' }];

interface ProductDef {
  label: string;
  group: ItemGroup;
  hasAluminium: boolean;   // shows thickness/cut/color selectors
  defaultUnit: string;
}

const PRODUCT_CATALOG: ProductDef[] = [
  // CALHAS
  { label: 'Calha Platibanda',        group: 'calha',      hasAluminium: true,  defaultUnit: 'm' },
  { label: 'Calha Beiral',            group: 'calha',      hasAluminium: true,  defaultUnit: 'm' },
  { label: 'Calha Coletora',          group: 'calha',      hasAluminium: true,  defaultUnit: 'm' },
  { label: 'Calha de Meio',           group: 'calha',      hasAluminium: true,  defaultUnit: 'm' },
  { label: 'Condutor',                group: 'calha',      hasAluminium: true,  defaultUnit: 'm' },
  // RUFOS
  { label: 'Rufo com Pingadeira',     group: 'rufo',       hasAluminium: true,  defaultUnit: 'm' },
  { label: 'Rufo Chapéu',             group: 'rufo',       hasAluminium: true,  defaultUnit: 'm' },
  { label: 'Rufo de Acabamento',      group: 'rufo',       hasAluminium: true,  defaultUnit: 'm' },
  // PINGADEIRAS
  { label: 'Pingadeira com Rufo',     group: 'pingadeira', hasAluminium: true,  defaultUnit: 'm' },
  { label: 'Pingadeira de Muro',      group: 'pingadeira', hasAluminium: true,  defaultUnit: 'm' },
  { label: 'Pingadeira de Fechamento',group: 'pingadeira', hasAluminium: true,  defaultUnit: 'm' },
  // ACESSÓRIOS
  { label: 'Conector de Calha',       group: 'acessorio',  hasAluminium: false, defaultUnit: 'un' },
  { label: 'Abraçadeira',             group: 'acessorio',  hasAluminium: false, defaultUnit: 'un' },
  { label: 'Saída d\'água',           group: 'acessorio',  hasAluminium: false, defaultUnit: 'un' },
  { label: 'Tampa de Calha',          group: 'acessorio',  hasAluminium: false, defaultUnit: 'un' },
  { label: 'Fixador de Condutor',     group: 'acessorio',  hasAluminium: false, defaultUnit: 'un' },
  { label: 'Item Personalizado',      group: 'acessorio',  hasAluminium: false, defaultUnit: 'un' },
  // INSTALAÇÃO
  { label: 'Mão de obra – Instalação',group: 'instalacao', hasAluminium: false, defaultUnit: 'm' },
  { label: 'Mão de obra – Manutenção',group: 'instalacao', hasAluminium: false, defaultUnit: 'h' },
  { label: 'Mão de obra – Remoção e Reinstalação de Telhas', group: 'instalacao', hasAluminium: false, defaultUnit: 'un' },
  { label: 'Material de Pintura',     group: 'instalacao', hasAluminium: false, defaultUnit: 'kit' },
  { label: 'Mão de obra – Pintura',   group: 'instalacao', hasAluminium: false, defaultUnit: 'm' },
];

const GROUP_LABELS: Record<ItemGroup, string> = {
  calha: '🏗️ Calhas',
  rufo: '🔩 Rufos',
  pingadeira: '💧 Pingadeiras',
  acessorio: '🔧 Acessórios',
  instalacao: '👷 Instalação',
};

const PAINT_LABOR_LABEL = 'Mão de obra – Pintura';
const PAINT_MATERIAL_LABEL = 'Material de Pintura';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const buildDescription = (
  product: string, thickness: string, cut: string, color: string, hasAlu: boolean, custom: string
): string => {
  if (custom.trim()) return custom;
  if (!hasAlu) return product;
  return `${product} Alumínio ${thickness}mm C/${cut} ${color}`;
};

const needsPaintItems = (color: string) => color !== 'Natural' && color !== '';

const categoryFromGroup = (g: ItemGroup): BudgetItem['category'] => {
  if (g === 'calha') return 'calha';
  if (g === 'rufo') return 'rufo';
  if (g === 'pingadeira') return 'pingadeira';
  if (g === 'instalacao') return 'instalacao';
  return 'acessorio';
};

// ─── PDF generator (pure HTML → print window) ────────────────────────────────
const generatePDF = (budget: Budget, settings: any) => {
  const discountAmount = budget.discountType === 'percentage'
    ? (budget.subtotal * budget.discount) / 100
    : budget.discount;

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // Group items by category
  const groups: Record<string, BudgetItem[]> = {};
  budget.items.forEach(item => {
    const g = item.category || 'outro';
    if (!groups[g]) groups[g] = [];
    groups[g].push(item);
  });

  const catLabel: Record<string, string> = {
    calha: 'Calhas', rufo: 'Rufos', pingadeira: 'Pingadeiras',
    acessorio: 'Acessórios', instalacao: 'Instalação / Serviços', outro: 'Outros',
  };

  const itemsHtml = Object.entries(groups).map(([cat, items]) => `
    <tr><td colspan="5" style="background:#1a1a2e;color:#fff;padding:8px 12px;font-weight:700;font-size:11px;letter-spacing:.05em;text-transform:uppercase">${catLabel[cat] || cat}</td></tr>
    ${items.map(i => `
      <tr>
        <td style="padding:9px 12px;border-bottom:1px solid #f0f0f0;font-size:12px">${i.description}</td>
        <td style="padding:9px 12px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:12px">${i.quantity}</td>
        <td style="padding:9px 12px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:12px">${i.unit}</td>
        <td style="padding:9px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:12px">${fmt(i.unitPrice)}</td>
        <td style="padding:9px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:12px;font-weight:600">${fmt(i.total)}</td>
      </tr>`).join('')}
  `).join('');

  // QR Code PIX (simple URL-based approach)
  const pixQr = settings.pixKey
    ? `<div style="text-align:center;margin-top:16px">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent('PIX:' + settings.pixKey)}" alt="QR Code PIX" style="width:90px;height:90px;border:1px solid #ddd;border-radius:8px"/>
        <p style="font-size:10px;color:#666;margin-top:4px">PIX: ${settings.pixKey}</p>
      </div>`
    : '';

  const logoHtml = settings.logoUrl
    ? `<img src="${settings.logoUrl}" style="height:56px;object-fit:contain;border-radius:8px" alt="logo"/>`
    : `<div style="width:52px;height:52px;background:linear-gradient(135deg,#dc2626,#991b1b);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;font-weight:900">M</div>`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8"/>
<title>Orçamento ${budget.id.slice(0,8).toUpperCase()} – ${budget.leadName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;color:#1a1a2e;background:#fff;font-size:13px}
  @page{margin:14mm 14mm 14mm 14mm}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head><body>
<!-- HEADER -->
<div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #dc2626;padding-bottom:18px;margin-bottom:20px">
  <div style="display:flex;align-items:center;gap:14px">
    ${logoHtml}
    <div>
      <div style="font-size:20px;font-weight:900;color:#1a1a2e">${settings.companyName}</div>
      ${settings.document ? `<div style="font-size:11px;color:#666">${settings.document}</div>` : ''}
      ${settings.phone ? `<div style="font-size:11px;color:#666">📞 ${settings.phone}</div>` : ''}
      ${settings.email ? `<div style="font-size:11px;color:#666">✉️ ${settings.email}</div>` : ''}
    </div>
  </div>
  <div style="text-align:right">
    <div style="font-size:26px;font-weight:900;color:#dc2626;letter-spacing:-.03em">ORÇAMENTO</div>
    <div style="font-size:13px;color:#444;font-weight:600">#${budget.id.slice(0,8).toUpperCase()}</div>
    <div style="font-size:11px;color:#888;margin-top:2px">${format(new Date(budget.createdAt),'dd/MM/yyyy',{locale:ptBR})}</div>
  </div>
</div>

${settings.headerText ? `<div style="background:#fff8f0;border:1px solid #fed7aa;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#92400e">${settings.headerText}</div>` : ''}

<!-- CLIENT -->
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin-bottom:6px">Cliente</div>
    <div style="font-size:16px;font-weight:700">${budget.leadName}</div>
  </div>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin-bottom:6px">Condições</div>
    <div style="font-size:12px;color:#374151">Validade: <strong>${budget.validity} dias</strong></div>
    <div style="font-size:12px;color:#374151">Pagamento: <strong>${budget.paymentConditions}</strong></div>
  </div>
</div>

<!-- ITEMS TABLE -->
<table style="width:100%;border-collapse:collapse;margin-bottom:18px">
  <thead>
    <tr style="background:#1a1a2e;color:#fff">
      <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;letter-spacing:.05em">DESCRIÇÃO</th>
      <th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:700;width:60px">QTD</th>
      <th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:700;width:50px">UN</th>
      <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;width:100px">UNIT.</th>
      <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;width:100px">TOTAL</th>
    </tr>
  </thead>
  <tbody>${itemsHtml}</tbody>
</table>

<!-- TOTALS -->
<div style="display:flex;justify-content:flex-end;margin-bottom:20px">
  <div style="min-width:280px">
    ${budget.laborCost > 0 ? `<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12px;color:#64748b"><span>Mão de obra adicional</span><span>${fmt(budget.laborCost)}</span></div>` : ''}
    ${budget.travelCost > 0 ? `<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12px;color:#64748b"><span>Deslocamento</span><span>${fmt(budget.travelCost)}</span></div>` : ''}
    <div style="display:flex;justify-content:space-between;padding:7px 0;font-size:13px;border-top:1px solid #e2e8f0;margin-top:4px"><span style="font-weight:600">Subtotal</span><span style="font-weight:600">${fmt(budget.subtotal)}</span></div>
    ${discountAmount > 0 ? `<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12px;color:#dc2626"><span>Desconto</span><span>-${fmt(discountAmount)}</span></div>` : ''}
    <div style="display:flex;justify-content:space-between;padding:12px 16px;background:linear-gradient(135deg,#1a1a2e,#2d2d5e);color:#fff;border-radius:10px;margin-top:6px">
      <span style="font-size:16px;font-weight:900">TOTAL</span>
      <span style="font-size:20px;font-weight:900;color:#f87171">${fmt(budget.total)}</span>
    </div>
  </div>
</div>

${budget.observations ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:12px"><strong>Observações:</strong> ${budget.observations}</div>` : ''}

<!-- FOOTER -->
<div style="display:grid;grid-template-columns:1fr auto;gap:20px;border-top:2px solid #e2e8f0;padding-top:16px;margin-top:8px">
  <div>
    ${settings.footerText ? `<div style="font-size:11px;color:#666;margin-bottom:10px">${settings.footerText}</div>` : ''}
    <div style="margin-top:20px;border-top:1px solid #cbd5e1;padding-top:12px">
      <div style="font-size:10px;color:#94a3b8;margin-bottom:28px">Assinatura do responsável</div>
      <div style="border-top:1px solid #374151;width:200px;padding-top:4px;font-size:10px;color:#374151">${settings.companyName}</div>
    </div>
  </div>
  ${pixQr}
</div>
</body></html>`;

  const win = window.open('', '_blank');
  if (!win) { toast.error('Permita popups para gerar o PDF'); return; }
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
type ItemGroup = 'calha' | 'rufo' | 'pingadeira' | 'acessorio' | 'instalacao';

export const Orcamentos: React.FC<{ type?: 'calhas' | 'esquadrias' }> = ({ type = 'calhas' }) => {
  const {
    budgets, leads, productions, quotePriceItems, quoteSettings,
    currentUser, addBudget, updateBudget, addProduction, updateLeadStatus,
    addNotification, addQuotePriceItem, updateQuotePriceItem, deleteQuotePriceItem,
    updateQuoteSettings,
  } = useStore();

  // ── Access guard ────────────────────────────────────────────────────────────
  const canAccess = currentUser && ALLOWED_ROLES.includes(currentUser.role);
  const canSeePrice = currentUser && PRICE_VISIBLE_ROLES.includes(currentUser.role);

  const [pageView, setPageView] = useState<'list' | 'new' | 'preview'>('list');
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [activeSection, setActiveSection] = useState<ItemGroup>('calha');

  // ── Form ───────────────────────────────────────────────────────────────────
  const blankForm = {
    leadId: '', items: [] as BudgetItem[],
    laborCost: 0, travelCost: 0, discount: 0,
    discountType: 'percentage' as 'percentage' | 'fixed',
    validity: 15, paymentConditions: '50% entrada + 50% na entrega', observations: '',
  };
  const [formData, setFormData] = useState(blankForm);

  // ── New item builder ───────────────────────────────────────────────────────
  const blankItem = {
    productLabel: 'Calha Platibanda',
    group: 'calha' as ItemGroup,
    hasAlu: true,
    thickness: '0.50',
    cut: '300',
    color: 'Natural',
    customDescription: '',
    quantity: 1,
    unit: 'm',
    unitPrice: 0,
    priceMode: 'manual' as 'saved' | 'manual',
    priceItemId: '',
  };
  const [newItem, setNewItem] = useState({ ...blankItem });

  const activePriceItems = useMemo(() =>
    quotePriceItems.filter(i => i.active), [quotePriceItems]);

  // Update group/unit when product changes
  const handleProductChange = (label: string) => {
    const def = PRODUCT_CATALOG.find(p => p.label === label);
    if (!def) return;
    setNewItem(prev => ({
      ...prev,
      productLabel: label,
      group: def.group,
      hasAlu: def.hasAluminium,
      unit: def.defaultUnit,
      priceItemId: '',
    }));
  };

  // Auto-select saved price when colour/thickness/cut changes
  const autoMatchPrice = useCallback((label: string, thickness: string, cut: string, color: string) => {
    const desc = `${label} Alumínio ${thickness}mm C/${cut} ${color}`;
    const match = activePriceItems.find(i => i.name === desc);
    if (match) {
      setNewItem(prev => ({ ...prev, priceMode: 'saved', priceItemId: match.id, unitPrice: match.unitPrice }));
    }
  }, [activePriceItems]);

  const computedDescription = buildDescription(
    newItem.productLabel, newItem.thickness, newItem.cut,
    newItem.color, newItem.hasAlu, newItem.customDescription
  );

  const handleAddItem = () => {
    if (newItem.unitPrice <= 0) { toast.error('Informe o valor unitário'); return; }

    const desc = computedDescription;
    const items: BudgetItem[] = [{
      id: uuidv4(),
      description: desc,
      quantity: newItem.quantity,
      unit: newItem.unit,
      unitPrice: newItem.unitPrice,
      category: categoryFromGroup(newItem.group),
      thickness: newItem.hasAlu ? newItem.thickness : undefined,
      cut: newItem.hasAlu ? newItem.cut : undefined,
      color: newItem.hasAlu ? newItem.color : undefined,
      priceSource: newItem.priceMode,
      priceItemId: newItem.priceItemId || undefined,
      total: newItem.quantity * newItem.unitPrice,
    }];

    // Auto-add paint items if non-Natural colour (aluminium products only)
    if (newItem.hasAlu && needsPaintItems(newItem.color)) {
      const alreadyHasPaintLabor = formData.items.some(i => i.description.startsWith(PAINT_LABOR_LABEL));
      const alreadyHasPaintMat = formData.items.some(i => i.description.startsWith(PAINT_MATERIAL_LABEL));

      const paintLaborPrice = activePriceItems.find(i => i.name === PAINT_LABOR_LABEL);
      const paintMatPrice = activePriceItems.find(i => i.name === PAINT_MATERIAL_LABEL);

      if (!alreadyHasPaintLabor) {
        items.push({
          id: uuidv4(),
          description: `${PAINT_LABOR_LABEL} – ${newItem.color}`,
          quantity: newItem.quantity,
          unit: newItem.unit,
          unitPrice: paintLaborPrice?.unitPrice ?? 0,
          category: 'instalacao',
          total: newItem.quantity * (paintLaborPrice?.unitPrice ?? 0),
        });
      }
      if (!alreadyHasPaintMat) {
        items.push({
          id: uuidv4(),
          description: `${PAINT_MATERIAL_LABEL} – ${newItem.color}`,
          quantity: 1,
          unit: 'kit',
          unitPrice: paintMatPrice?.unitPrice ?? 0,
          category: 'instalacao',
          total: paintMatPrice?.unitPrice ?? 0,
        });
      }

      if (paintLaborPrice || paintMatPrice) {
        toast.success('Itens de pintura adicionados automaticamente');
      } else {
        toast(`Itens de pintura adicionados — configure os preços na Tabela de Calhas`, { icon: '🎨' });
      }
    }

    setFormData(prev => ({ ...prev, items: [...prev.items, ...items] }));
    setNewItem({ ...blankItem });
  };

  const handleRemoveItem = (id: string) =>
    setFormData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const itemsTotal = formData.items.reduce((s, i) => s + i.total, 0);
    const subtotal = itemsTotal + formData.laborCost + formData.travelCost;
    const discountAmount = formData.discountType === 'percentage'
      ? (subtotal * formData.discount) / 100
      : formData.discount;
    return { itemsTotal, subtotal, discountAmount, total: subtotal - discountAmount };
  }, [formData]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = leads.find(l => l.id === formData.leadId);
    if (!lead || formData.items.length === 0) return;

    const budget: Budget = {
      id: uuidv4(),
      leadId: formData.leadId,
      leadName: lead.name,
      items: formData.items,
      laborCost: formData.laborCost,
      travelCost: formData.travelCost,
      discount: formData.discount,
      discountType: formData.discountType,
      subtotal: totals.subtotal,
      total: totals.total,
      validity: formData.validity,
      paymentConditions: formData.paymentConditions,
      observations: formData.observations,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addBudget(budget);
    toast.success('Orçamento criado com sucesso');
    setPageView('list');
    setFormData(blankForm);
  };

  // ── Budget actions ─────────────────────────────────────────────────────────
  const handleSend = (b: Budget) => {
    updateBudget(b.id, { status: 'sent', sentAt: new Date() });
    updateLeadStatus(b.leadId, 'orcamento_enviado');
    addNotification({ id: uuidv4(), type: 'info', title: 'Orçamento enviado', message: `Orçamento de ${b.leadName} marcado como enviado`, read: false, createdAt: new Date() });
    toast.success('Orçamento enviado');
  };

  const handleApprove = (b: Budget) => {
    updateBudget(b.id, { status: 'approved' });
    updateLeadStatus(b.leadId, 'producao');
    if (!productions.some(p => p.budgetId === b.id)) {
      const est = new Date(); est.setDate(est.getDate() + 10);
      addProduction({ id: uuidv4(), budgetId: b.id, leadId: b.leadId, leadName: b.leadName, items: b.items.map(i => i.description), currentStage: 'corte', progress: 0, startDate: new Date(), estimatedEnd: est, assignedTeam: ['3'], history: [], createdAt: new Date() });
    }
    addNotification({ id: uuidv4(), type: 'success', title: 'Orçamento aprovado', message: `${b.leadName} entrou em produção`, read: false, createdAt: new Date() });
    toast.success('Aprovado — produção criada');
  };

  const handleReject = (b: Budget) => {
    updateBudget(b.id, { status: 'rejected' });
    updateLeadStatus(b.leadId, 'negociacao');
    toast.success('Orçamento rejeitado');
  };

  const handleWhatsApp = (b: Budget) => {
    const lead = leads.find(l => l.id === b.leadId);
    if (!lead) { toast.error('Cliente não encontrado'); return; }
    const ok = openWhatsApp(lead.phone, buildBudgetText(b, quoteSettings));
    if (!ok) toast.error('Telefone inválido');
  };

  const handleEmail = (b: Budget) => {
    const lead = leads.find(l => l.id === b.leadId);
    if (!lead?.email) { toast.error('Cliente sem e-mail'); return; }
    window.location.href = `mailto:${lead.email}?subject=${encodeURIComponent(`Orçamento – ${b.leadName}`)}&body=${encodeURIComponent(buildBudgetText(b, quoteSettings))}`;
  };

  const handleCopy = async (b: Budget) => {
    await copyText(buildBudgetText(b, quoteSettings));
    toast.success('Texto copiado');
  };

  // ── Filters ────────────────────────────────────────────────────────────────
  const isCalhas = type === 'calhas';
  const filteredBudgets = budgets.filter(b => {
    const hasCal = b.items.some(i => ['calha','rufo','pingadeira'].includes(i.category ?? ''));
    const hasEsq = b.items.some(i => ['esquadria','janela','porta'].includes(i.category ?? ''));
    return isCalhas ? (hasCal || (!hasEsq && !hasCal)) : hasEsq;
  });

  const statusCfg: Record<string, { label: string; color: string }> = {
    draft:    { label: 'Rascunho', color: 'bg-gray-100 text-gray-700' },
    sent:     { label: 'Enviado',  color: 'bg-blue-100 text-blue-700' },
    approved: { label: 'Aprovado', color: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejeitado',color: 'bg-red-100 text-red-700' },
    expired:  { label: 'Expirado', color: 'bg-orange-100 text-orange-700' },
  };

  // ── Items grouped by category in form ─────────────────────────────────────
  const formItemsByGroup = useMemo(() => {
    const g: Partial<Record<ItemGroup | 'outro', BudgetItem[]>> = {};
    formData.items.forEach(item => {
      const key = (item.category as ItemGroup) || 'outro';
      if (!g[key]) g[key] = [];
      g[key]!.push(item);
    });
    return g;
  }, [formData.items]);

  // ── ACCESS DENIED ──────────────────────────────────────────────────────────
  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <Lock size={32} className="text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Acesso Restrito</h2>
        <p className="text-gray-500 text-center max-w-sm">
          Esta seção é acessível apenas para Administradores, Gerentes e Vendedores. <br />
          Solicite acesso ao administrador do sistema.
        </p>
      </div>
    );
  }

  // ── PRODUCT GROUPS for the form ────────────────────────────────────────────
  const productsByGroup = useMemo(() => {
    const g: Partial<Record<ItemGroup, string[]>> = {};
    PRODUCT_CATALOG.forEach(p => {
      if (!g[p.group]) g[p.group] = [];
      g[p.group]!.push(p.label);
    });
    return g;
  }, []);

  const currentProductDef = PRODUCT_CATALOG.find(p => p.label === newItem.productLabel) ?? PRODUCT_CATALOG[0];

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-5 animate-fadeIn">

      {/* ── LIST VIEW ───────────────────────────────────────────────────── */}
      {pageView === 'list' && <>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {filteredBudgets.length} {filteredBudgets.length === 1 ? 'orçamento' : 'orçamentos'}
            {isCalhas ? ' de calhas' : ' de esquadrias'}
          </h2>
          <p className="text-sm text-gray-500">
            {isCalhas ? 'Calhas · Rufos · Pingadeiras · Instalação' : 'Janelas · Portas · Esquadrias'}
          </p>
        </div>
        <Button onClick={() => setPageView('new')} icon={<Plus size={18} />}>
          {isCalhas ? 'Novo Orç. Calhas' : 'Novo Orç. Esquadrias'}
        </Button>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Rascunhos',    icon: FileText,     val: filteredBudgets.filter(b=>b.status==='draft').length,    cls: 'bg-gray-100 text-gray-600' },
          { label: 'Enviados',     icon: Send,         val: filteredBudgets.filter(b=>b.status==='sent').length,     cls: 'bg-blue-100 text-blue-600' },
          { label: 'Aprovados',    icon: CheckCircle,  val: filteredBudgets.filter(b=>b.status==='approved').length, cls: 'bg-green-100 text-green-600' },
          { label: 'Total Aprov.', icon: DollarSign,   val: canSeePrice ? formatCurrency(filteredBudgets.filter(b=>b.status==='approved').reduce((s,b)=>s+b.total,0)) : '––', cls: 'bg-red-100 text-red-600' },
        ].map(s => (
          <Card key={s.label} padding="sm">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.cls.split(' ').slice(0,1).join(' ')}`}>
                <s.icon size={20} className={s.cls.split(' ').slice(1).join(' ')} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.val}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Budget List ─────────────────────────────────────────────────── */}
      <div className="grid gap-4">
        {filteredBudgets.length === 0 ? (
          <Card className="text-center py-10">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum orçamento</h3>
            <Button onClick={() => setPageView('new')} icon={<Plus size={18} />}>Criar Orçamento</Button>
          </Card>
        ) : filteredBudgets.map(budget => (
          <Card key={budget.id} hover padding="none">
            <div className="p-5">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="font-semibold text-gray-900">{budget.leadName}</h3>
                    <Badge className={statusCfg[budget.status]?.color}>{statusCfg[budget.status]?.label}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                    <span>{budget.items.length} itens</span>
                    <span>{format(new Date(budget.createdAt),'dd/MM/yyyy',{locale:ptBR})}</span>
                    {budget.sentAt && <span>Enviado {format(new Date(budget.sentAt),'dd/MM/yyyy',{locale:ptBR})}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {canSeePrice
                    ? <p className="text-2xl font-bold text-gray-900">{formatCurrency(budget.total)}</p>
                    : <p className="text-sm text-gray-400 flex items-center gap-1"><Lock size={14}/> valor oculto</p>
                  }
                  <p className="text-sm text-gray-500">Validade: {budget.validity} dias</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                <Button size="sm" variant="ghost" onClick={() => { setSelectedBudget(budget); setPageView('preview'); }} icon={<Eye size={15}/>}>Visualizar</Button>
                {budget.status === 'draft' && <Button size="sm" variant="primary" onClick={() => handleSend(budget)} icon={<Send size={15}/>}>Enviar</Button>}
                {budget.status === 'sent' && <>
                  <Button size="sm" variant="success" onClick={() => handleApprove(budget)} icon={<CheckCircle size={15}/>}>Aprovar</Button>
                  <Button size="sm" variant="danger" onClick={() => handleReject(budget)} icon={<XCircle size={15}/>}>Rejeitar</Button>
                </>}
                <Button size="sm" variant="ghost" onClick={() => handleWhatsApp(budget)} icon={<MessageSquare size={15}/>}>WhatsApp</Button>
                <Button size="sm" variant="ghost" onClick={() => handleEmail(budget)} icon={<Mail size={15}/>}>E-mail</Button>
                <Button size="sm" variant="ghost" onClick={() => generatePDF(budget, quoteSettings)} icon={<Printer size={15}/>}>PDF</Button>
                <Button size="sm" variant="ghost" onClick={() => handleCopy(budget)} icon={<Copy size={15}/>}>Copiar</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      </> /* end list view */}


      {/* ══════════════════════════════════════════════════════════════════
          NEW BUDGET — FULL PAGE VIEW
      ══════════════════════════════════════════════════════════════════ */}
      {pageView === 'new' && (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => { setPageView('list'); setFormData(blankForm); }} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft size={18}/>
            Voltar para {isCalhas ? 'Orçamentos de Calhas' : 'Orçamentos de Esquadrias'}
          </button>
          <h2 className="text-lg font-bold text-gray-900">{isCalhas ? '📋 Novo Orçamento de Calhas' : '📋 Novo Orçamento de Esquadrias'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Company settings (collapsed) ────────────────────────── */}
          <details className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden group">
            <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer font-semibold text-sm text-gray-700 select-none">
              <Settings2 size={16} className="text-gray-500"/> Dados da empresa &amp; emissão
              <ChevronDown size={15} className="ml-auto text-gray-400 group-open:rotate-180 transition-transform"/>
            </summary>
            <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-gray-200">
              <Input label="Empresa" value={quoteSettings.companyName} onChange={e=>updateQuoteSettings({companyName:e.target.value})}/>
              <Input label="CNPJ / CPF" value={quoteSettings.document} onChange={e=>updateQuoteSettings({document:e.target.value})}/>
              <Input label="Telefone" value={quoteSettings.phone||''} onChange={e=>updateQuoteSettings({phone:e.target.value})}/>
              <Input label="E-mail" value={(quoteSettings as any).email||''} onChange={e=>updateQuoteSettings({email:e.target.value} as any)}/>
              <Input label="Chave PIX" value={quoteSettings.pixKey||''} onChange={e=>updateQuoteSettings({pixKey:e.target.value})}/>
              <Input label="URL da logo" value={quoteSettings.logoUrl||''} onChange={e=>updateQuoteSettings({logoUrl:e.target.value})}/>
              <div className="col-span-2 sm:col-span-3">
                <TextArea label="Texto do cabeçalho" rows={2} value={quoteSettings.headerText} onChange={e=>updateQuoteSettings({headerText:e.target.value})}/>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <TextArea label="Texto do rodapé" rows={2} value={quoteSettings.footerText} onChange={e=>updateQuoteSettings({footerText:e.target.value})}/>
              </div>
            </div>
          </details>

          {/* ── Client ──────────────────────────────────────────────── */}
          <Select label="Cliente *" required
            options={[{value:'',label:'Selecione um cliente'},...leads.map(l=>({value:l.id,label:`${l.name} – ${l.service}`}))]}
            value={formData.leadId}
            onChange={e=>setFormData(p=>({...p,leadId:e.target.value}))}/>

          {/* ── Item builder ────────────────────────────────────────── */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 bg-gray-800 text-white px-4 py-3">
              <Package size={16}/>
              <span className="font-semibold text-sm">Adicionar Item</span>
            </div>

            {/* Group tabs */}
            <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
              {(Object.entries(GROUP_LABELS) as [ItemGroup, string][]).map(([g, lbl]) => (
                <button key={g} type="button"
                  onClick={() => {
                    setActiveSection(g);
                    const firstProd = PRODUCT_CATALOG.find(p=>p.group===g);
                    if (firstProd) handleProductChange(firstProd.label);
                  }}
                  className={`shrink-0 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeSection===g ? 'border-red-600 text-red-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>

            <div className="p-4 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Product dropdown */}
                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Produto</label>
                  <select
                    value={newItem.productLabel}
                    onChange={e => handleProductChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-300"
                  >
                    {(productsByGroup[activeSection] ?? []).map(lbl => (
                      <option key={lbl} value={lbl}>{lbl}</option>
                    ))}
                  </select>
                </div>

                {/* Aluminium specs */}
                {currentProductDef.hasAluminium && <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Espessura</label>
                    <select value={newItem.thickness}
                      onChange={e => { setNewItem(p=>({...p,thickness:e.target.value})); autoMatchPrice(newItem.productLabel,e.target.value,newItem.cut,newItem.color); }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-300">
                      {THICKNESS_OPTS.map(v=><option key={v} value={v}>{v}mm</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Corte</label>
                    <select value={newItem.cut}
                      onChange={e => { setNewItem(p=>({...p,cut:e.target.value})); autoMatchPrice(newItem.productLabel,newItem.thickness,e.target.value,newItem.color); }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-300">
                      {CUT_OPTS.map(v=><option key={v} value={v}>C/{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Cor / Acabamento
                      {needsPaintItems(newItem.color) && <span className="ml-1 text-xs text-orange-600 font-bold">🎨 +pintura</span>}
                    </label>
                    <select value={newItem.color}
                      onChange={e => { setNewItem(p=>({...p,color:e.target.value})); autoMatchPrice(newItem.productLabel,newItem.thickness,newItem.cut,e.target.value); }}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                        needsPaintItems(newItem.color) ? 'border-orange-300 bg-orange-50 focus:border-orange-400 focus:ring-orange-200' : 'border-gray-300 focus:border-red-400 focus:ring-red-300'
                      }`}>
                      {COLOR_OPTS.map(v=><option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </>}

                {/* Qty + Unit + Price */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Qtd</label>
                  <input type="number" min={0.01} step={0.01} value={newItem.quantity}
                    onChange={e=>setNewItem(p=>({...p,quantity:Number(e.target.value)}))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-300"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Unidade</label>
                  <select value={newItem.unit} onChange={e=>setNewItem(p=>({...p,unit:e.target.value}))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-300">
                    {UNIT_OPTS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Valor Unit. (R$)</label>
                  <input type="number" min={0} step={0.01} value={newItem.unitPrice||''}
                    onChange={e=>setNewItem(p=>({...p,unitPrice:Number(e.target.value),priceMode:'manual'}))}
                    placeholder="0,00"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-300"/>
                </div>

                {/* Tabela de preços quick-select */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ou selecionar da tabela</label>
                  <select value={newItem.priceItemId}
                    onChange={e => {
                      const item = quotePriceItems.find(i=>i.id===e.target.value);
                      if (item) setNewItem(p=>({...p,priceMode:'saved',priceItemId:item.id,unitPrice:item.unitPrice}));
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-300">
                    <option value="">— escolher da tabela de preços —</option>
                    {activePriceItems.map(i=><option key={i.id} value={i.id}>{i.name} · {formatCurrency(i.unitPrice)}/{i.unit}</option>)}
                  </select>
                </div>

                {/* Description preview */}
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Descrição (auto-gerada · editável)</label>
                  <input value={newItem.customDescription || computedDescription}
                    onChange={e=>setNewItem(p=>({...p,customDescription:e.target.value}))}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-red-300"/>
                </div>
              </div>

              {/* Preview total */}
              <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-4 py-2.5">
                <span className="text-sm text-gray-500">
                  Subtotal item: <strong className="text-gray-900">{formatCurrency(newItem.quantity * newItem.unitPrice)}</strong>
                  {needsPaintItems(newItem.color) && newItem.hasAlu && (
                    <span className="ml-2 text-xs text-orange-600">+ itens de pintura serão adicionados</span>
                  )}
                </span>
                <Button type="button" size="sm" onClick={handleAddItem} icon={<Plus size={15}/>}>
                  Adicionar ao orçamento
                </Button>
              </div>
            </div>
          </div>

          {/* ── Items table ──────────────────────────────────────────── */}
          {formData.items.length > 0 && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-800">{formData.items.length} itens adicionados</span>
                <span className="text-sm text-gray-500 font-medium">{formatCurrency(totals.itemsTotal)}</span>
              </div>

              {/* Grouped by category */}
              {(Object.entries(formItemsByGroup) as [ItemGroup | 'outro', BudgetItem[]][]).map(([grp, items]) => (
                <div key={grp}>
                  <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide">
                    {GROUP_LABELS[grp as ItemGroup] || grp}
                  </div>
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.description}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.quantity} {item.unit} × {canSeePrice ? formatCurrency(item.unitPrice) : '••••'}</p>
                      </div>
                      <span className="text-sm font-bold text-gray-900 shrink-0">
                        {canSeePrice ? formatCurrency(item.total) : '••••'}
                      </span>
                      <button type="button" onClick={() => handleRemoveItem(item.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* ── Extra costs + discount ───────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input label="Deslocamento (R$)" type="number" min={0} step={0.01}
              value={formData.travelCost||''} onChange={e=>setFormData(p=>({...p,travelCost:Number(e.target.value)}))}
              icon={<DollarSign size={15}/>}/>
            <Input label="Desconto" type="number" min={0} step={0.01}
              value={formData.discount||''} onChange={e=>setFormData(p=>({...p,discount:Number(e.target.value)}))}
              icon={formData.discountType==='percentage'?<Percent size={15}/>:<DollarSign size={15}/>}/>
            <Select label="Tipo desconto"
              options={[{value:'percentage',label:'Percentual %'},{value:'fixed',label:'Valor fixo R$'}]}
              value={formData.discountType}
              onChange={e=>setFormData(p=>({...p,discountType:e.target.value as any}))}/>
            <Input label="Validade (dias)" type="number" min={1}
              value={formData.validity} onChange={e=>setFormData(p=>({...p,validity:Number(e.target.value)}))}/>
          </div>

          <Input label="Condições de pagamento"
            value={formData.paymentConditions}
            onChange={e=>setFormData(p=>({...p,paymentConditions:e.target.value}))}/>

          <TextArea label="Observações" rows={2}
            value={formData.observations}
            onChange={e=>setFormData(p=>({...p,observations:e.target.value}))}/>

          {/* ── Totals summary ───────────────────────────────────────── */}
          {formData.items.length > 0 && (
            <div className="rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 text-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calculator size={18} className="text-red-400"/>
                <h4 className="font-bold">Resumo do Orçamento</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-300"><span>Itens</span><span>{formatCurrency(totals.itemsTotal)}</span></div>
                {formData.travelCost > 0 && <div className="flex justify-between text-gray-300"><span>Deslocamento</span><span>{formatCurrency(formData.travelCost)}</span></div>}
                <div className="flex justify-between text-gray-200 font-medium border-t border-white/10 pt-2"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
                {totals.discountAmount > 0 && <div className="flex justify-between text-red-400"><span>Desconto</span><span>-{formatCurrency(totals.discountAmount)}</span></div>}
                <div className="flex justify-between text-xl font-black border-t border-white/20 pt-3 mt-1">
                  <span>TOTAL</span>
                  <span className="text-red-400">{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => setPageView('list')}>Cancelar</Button>
            <Button type="submit" disabled={formData.items.length === 0 || !formData.leadId}>
              Criar Orçamento
            </Button>
          </div>
        </form>
      </div>
      }

      {/* ══════════════════════════════════════════════════════════════════
          PREVIEW — FULL PAGE VIEW
      ══════════════════════════════════════════════════════════════════ */}
      {pageView === 'preview' && (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => { setPageView('list'); setSelectedBudget(null); }} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft size={18}/>
            Voltar para {isCalhas ? 'Orçamentos de Calhas' : 'Orçamentos de Esquadrias'}
          </button>
          <h2 className="text-lg font-bold text-gray-900">Visualização do Orçamento</h2>
        </div>
        {selectedBudget && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-5">
              <div className="flex items-center gap-4">
                {quoteSettings.logoUrl
                  ? <img src={quoteSettings.logoUrl} alt="" className="h-14 w-14 rounded-xl border border-gray-200 object-contain"/>
                  : <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center text-white font-black text-xl">M</div>}
                <div>
                  <h1 className="text-xl font-black text-gray-900">{quoteSettings.companyName}</h1>
                  <p className="text-sm text-gray-500">{quoteSettings.document}</p>
                  {quoteSettings.phone && <p className="text-sm text-gray-500">{quoteSettings.phone}</p>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-red-600">ORÇAMENTO</div>
                <div className="text-sm font-bold text-gray-500">#{selectedBudget.id.slice(0,8).toUpperCase()}</div>
                <div className="text-xs text-gray-400">{format(new Date(selectedBudget.createdAt),'dd/MM/yyyy',{locale:ptBR})}</div>
              </div>
            </div>

            {/* Client + Conditions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Cliente</p>
                <p className="text-lg font-bold text-gray-900">{selectedBudget.leadName}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Condições</p>
                <p className="text-sm text-gray-700">Validade: <strong>{selectedBudget.validity} dias</strong></p>
                <p className="text-sm text-gray-700">Pgto: <strong>{selectedBudget.paymentConditions}</strong></p>
              </div>
            </div>

            {/* Items by category */}
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 text-white">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Descrição</th>
                    <th className="text-center px-3 py-3 font-semibold w-16">Qtd</th>
                    <th className="text-center px-3 py-3 font-semibold w-14">Un</th>
                    {canSeePrice && <>
                      <th className="text-right px-4 py-3 font-semibold w-24">Unit.</th>
                      <th className="text-right px-4 py-3 font-semibold w-24">Total</th>
                    </>}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const groups: Record<string, BudgetItem[]> = {};
                    selectedBudget.items.forEach(i => {
                      const k = i.category || 'outro';
                      if (!groups[k]) groups[k] = [];
                      groups[k].push(i);
                    });
                    return Object.entries(groups).flatMap(([cat, items]) => [
                      <tr key={`hdr-${cat}`} className="bg-red-50">
                        <td colSpan={canSeePrice ? 5 : 3} className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-700">
                          {GROUP_LABELS[cat as ItemGroup] || cat}
                        </td>
                      </tr>,
                      ...items.map(item => (
                        <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3">{item.description}</td>
                          <td className="px-3 py-3 text-center">{item.quantity}</td>
                          <td className="px-3 py-3 text-center">{item.unit}</td>
                          {canSeePrice && <>
                            <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatCurrency(item.total)}</td>
                          </>}
                        </tr>
                      ))
                    ]);
                  })()}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            {canSeePrice && (
              <div className="flex justify-end">
                <div className="min-w-[260px] space-y-1.5">
                  {selectedBudget.travelCost > 0 && <div className="flex justify-between text-sm text-gray-500"><span>Deslocamento</span><span>{formatCurrency(selectedBudget.travelCost)}</span></div>}
                  <div className="flex justify-between text-sm font-medium border-t pt-2"><span>Subtotal</span><span>{formatCurrency(selectedBudget.subtotal)}</span></div>
                  {selectedBudget.discount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Desconto</span>
                      <span>-{formatCurrency(selectedBudget.discountType==='percentage'?(selectedBudget.subtotal*selectedBudget.discount)/100:selectedBudget.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-black bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl px-4 py-3 mt-2">
                    <span>TOTAL</span>
                    <span className="text-red-400">{formatCurrency(selectedBudget.total)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* PIX QR */}
            {quoteSettings.pixKey && (
              <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('PIX:'+quoteSettings.pixKey)}`}
                  alt="QR PIX" className="w-20 h-20 rounded-lg border border-gray-200"/>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Pagamento via PIX</p>
                  <p className="font-semibold text-gray-900">{quoteSettings.pixKey}</p>
                </div>
              </div>
            )}

            {selectedBudget.observations && (
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
                <strong>Observações:</strong> {selectedBudget.observations}
              </div>
            )}

            {quoteSettings.footerText && (
              <p className="text-sm text-gray-500 rounded-lg bg-gray-50 p-3">{quoteSettings.footerText}</p>
            )}

            <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              <Button size="sm" onClick={() => generatePDF(selectedBudget, quoteSettings)} icon={<Printer size={15}/>}>Gerar PDF</Button>
              <Button size="sm" variant="ghost" onClick={() => handleWhatsApp(selectedBudget)} icon={<MessageSquare size={15}/>}>WhatsApp</Button>
              <Button size="sm" variant="ghost" onClick={() => handleEmail(selectedBudget)} icon={<Mail size={15}/>}>E-mail</Button>
              <Button size="sm" variant="ghost" onClick={() => handleCopy(selectedBudget)} icon={<Copy size={15}/>}>Copiar texto</Button>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
};
