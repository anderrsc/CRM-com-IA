import React, { useState } from 'react';
import { 
  Plus, 
  FileText, 
  Send, 
  Download, 
  Eye,
  Trash2,
  Calculator,
  Package,
  DollarSign,
  Percent,
  MessageSquare,
  Mail,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select, TextArea } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useStore } from '../store/useStore';
import { Budget, BudgetItem, QuotePriceItem } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { buildBudgetText, copyText, downloadTextFile, openWhatsApp } from '../utils/actions';

type QuoteType = 'calhas' | 'esquadrias';

export const Orcamentos: React.FC = () => {
  const {
    budgets,
    leads,
    productions,
    quotePriceItems,
    quoteSettings,
    addBudget,
    updateBudget,
    addProduction,
    updateLeadStatus,
    addNotification,
    addQuotePriceItem,
    updateQuotePriceItem,
    deleteQuotePriceItem,
    updateQuoteSettings,
  } = useStore();
  const [showNewModal, setShowNewModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [activeQuoteType, setActiveQuoteType] = useState<QuoteType>('calhas');

  // Form state
  const [formData, setFormData] = useState({
    quoteType: 'calhas' as QuoteType,
    leadId: '',
    items: [] as BudgetItem[],
    laborCost: 0,
    travelCost: 0,
    discount: 0,
    discountType: 'percentage' as 'percentage' | 'fixed',
    validity: 15,
    paymentConditions: '50% entrada + 50% na entrega',
    observations: '',
  });

  const [newItem, setNewItem] = useState({
    priceMode: 'saved' as 'saved' | 'manual',
    priceItemId: '',
    category: 'calha' as BudgetItem['category'],
    product: 'Calha',
    thickness: '0.50',
    cut: '300',
    color: 'Natural',
    description: '',
    quantity: 1,
    unit: 'm',
    unitPrice: 0,
  });

  const [priceForm, setPriceForm] = useState({
    name: 'Calha',
    category: 'calha' as QuotePriceItem['category'],
    thickness: '0.50',
    cut: '300',
    color: 'Natural',
    unit: 'm',
    unitPrice: 0,
  });

  const thicknessOptions = ['0.43', '0.50', '0.60', '0.80'];
  const cutOptions = ['150', '200', '250', '300', '330', '350', '400', '500', '600', '700', '800', '900', '1000', '1200'];
  const colorOptions = ['Natural', 'Branco', 'Preto', 'Bronze', 'Grafite'];
  const productOptions = [
    { value: 'Calha', label: 'Calha' },
    { value: 'Rufo', label: 'Rufo' },
    { value: 'Rufo com Pingadeira', label: 'Rufo com Pingadeira' },
    { value: 'Pingadeira', label: 'Pingadeira' },
    { value: 'Condutor', label: 'Condutor' },
  ];
  const frameProductOptions = [
    { value: 'Janela', label: 'Janela' },
    { value: 'Porta', label: 'Porta' },
    { value: 'Porta de correr', label: 'Porta de correr' },
    { value: 'Basculante', label: 'Basculante' },
    { value: 'Box', label: 'Box' },
    { value: 'Guarda-corpo', label: 'Guarda-corpo' },
    { value: 'Vidro', label: 'Vidro' },
    { value: 'Acessorio', label: 'Acessorio' },
    { value: 'Instalacao', label: 'Instalacao' },
  ];

  const quoteTypeConfig: Record<QuoteType, { label: string; description: string; categories: BudgetItem['category'][] }> = {
    calhas: {
      label: 'Calhas',
      description: 'Calhas, rufos, pingadeiras e condutores',
      categories: ['calha', 'rufo', 'pingadeira', 'outro'],
    },
    esquadrias: {
      label: 'Esquadrias',
      description: 'Portas, janelas, vidros, acessorios e instalacao',
      categories: ['esquadria', 'vidro', 'acessorio', 'instalacao', 'outro'],
    },
  };

  const currentProductOptions = formData.quoteType === 'calhas' ? productOptions : frameProductOptions;
  const currentPriceProductOptions = formData.quoteType === 'calhas' ? productOptions : frameProductOptions;

  const buildMetalSheetDescription = () => {
    return `${newItem.product} Aluminio ${newItem.thickness}mm C/${newItem.cut} ${newItem.color}`;
  };

  const buildPriceItemName = () => {
    if (formData.quoteType === 'esquadrias') {
      return `${priceForm.name} ${priceForm.color}`.trim();
    }

    return `${priceForm.name} Aluminio ${priceForm.thickness}mm C/${priceForm.cut} ${priceForm.color}`;
  };

  const categoryFromProduct = (product: string): BudgetItem['category'] => {
    const normalized = product.toLowerCase();
    if (normalized.includes('rufo')) return 'rufo';
    if (normalized.includes('pingadeira')) return 'pingadeira';
    if (normalized.includes('vidro') || normalized.includes('box') || normalized.includes('guarda')) return 'vidro';
    if (normalized.includes('acessorio')) return 'acessorio';
    if (normalized.includes('instal')) return 'instalacao';
    if (normalized.includes('janela') || normalized.includes('porta') || normalized.includes('basculante')) return 'esquadria';
    if (normalized.includes('calha') || normalized.includes('condutor')) return 'calha';
    return 'outro';
  };

  const getBudgetType = (budget: Budget): QuoteType => {
    if (budget.quoteType) return budget.quoteType;
    const hasFrames = budget.items.some(item => ['esquadria', 'vidro', 'acessorio'].includes(item.category || ''));
    return hasFrames ? 'esquadrias' : 'calhas';
  };

  const activePriceItems = quotePriceItems.filter(item =>
    item.active && quoteTypeConfig[formData.quoteType].categories.includes(item.category || 'outro')
  );
  const filteredBudgets = budgets.filter(budget => getBudgetType(budget) === activeQuoteType);

  const setQuoteType = (quoteType: QuoteType) => {
    const nextProduct = quoteType === 'calhas' ? 'Calha' : 'Janela';
    const nextUnit = quoteType === 'calhas' ? 'm' : 'un';

    setFormData({ ...formData, quoteType, items: [] });
    setNewItem({
      priceMode: 'saved',
      priceItemId: '',
      category: quoteType === 'calhas' ? 'calha' : 'esquadria',
      product: nextProduct,
      thickness: quoteType === 'calhas' ? '0.50' : '',
      cut: quoteType === 'calhas' ? '300' : '',
      color: quoteType === 'calhas' ? 'Natural' : 'Branco',
      description: '',
      quantity: 1,
      unit: nextUnit,
      unitPrice: 0,
    });
    setPriceForm({
      name: nextProduct,
      category: quoteType === 'calhas' ? 'calha' : 'esquadria',
      thickness: quoteType === 'calhas' ? '0.50' : '',
      cut: quoteType === 'calhas' ? '300' : '',
      color: quoteType === 'calhas' ? 'Natural' : 'Branco',
      unit: nextUnit,
      unitPrice: 0,
    });
  };

  const handleSelectSavedPrice = (id: string) => {
    const priceItem = quotePriceItems.find(item => item.id === id);
    if (!priceItem) {
      setNewItem({ ...newItem, priceItemId: id });
      return;
    }

    setNewItem({
      ...newItem,
      priceMode: 'saved',
      priceItemId: id,
      category: priceItem.category,
      product: priceItem.name.split(' Aluminio ')[0] || priceItem.name,
      thickness: priceItem.thickness || newItem.thickness,
      cut: priceItem.cut || newItem.cut,
      color: priceItem.color || newItem.color,
      description: priceItem.name,
      unit: priceItem.unit,
      unitPrice: priceItem.unitPrice,
    });
  };

  const handleSavePriceItem = () => {
    if (!priceForm.name.trim() || priceForm.unitPrice <= 0) {
      toast.error('Preencha produto e valor unitario');
      return;
    }

    const item: QuotePriceItem = {
      id: uuidv4(),
      name: buildPriceItemName(),
      category: categoryFromProduct(priceForm.name),
      thickness: priceForm.thickness,
      cut: priceForm.cut,
      color: priceForm.color,
      unit: priceForm.unit,
      unitPrice: priceForm.unitPrice,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addQuotePriceItem(item);
    toast.success('Preco salvo na tabela');
  };

  const calculateTotals = () => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const subtotal = itemsTotal + formData.laborCost + formData.travelCost;
    const discountAmount = formData.discountType === 'percentage' 
      ? (subtotal * formData.discount) / 100
      : formData.discount;
    const total = subtotal - discountAmount;
    return { itemsTotal, subtotal, discountAmount, total };
  };

  const handleAddItem = () => {
    const description = formData.quoteType === 'calhas'
      ? (newItem.description || buildMetalSheetDescription())
      : newItem.description;

    if (!description || newItem.unitPrice <= 0) return;

    const item: BudgetItem = {
      id: uuidv4(),
      description,
      quantity: newItem.quantity,
      unit: newItem.unit,
      unitPrice: newItem.unitPrice,
      category: categoryFromProduct(newItem.product),
      thickness: newItem.thickness,
      cut: newItem.cut,
      color: newItem.color,
      priceSource: newItem.priceMode,
      priceItemId: newItem.priceItemId || undefined,
      total: newItem.quantity * newItem.unitPrice,
    };

    setFormData({ ...formData, items: [...formData.items, item] });
    setNewItem({
      category: formData.quoteType === 'calhas' ? 'calha' : 'esquadria',
      priceMode: 'saved',
      priceItemId: '',
      product: formData.quoteType === 'calhas' ? 'Calha' : 'Janela',
      thickness: formData.quoteType === 'calhas' ? '0.50' : '',
      cut: formData.quoteType === 'calhas' ? '300' : '',
      color: formData.quoteType === 'calhas' ? 'Natural' : 'Branco',
      description: '',
      quantity: 1,
      unit: formData.quoteType === 'calhas' ? 'm' : 'un',
      unitPrice: 0,
    });
  };

  const handleRemoveItem = (id: string) => {
    setFormData({ ...formData, items: formData.items.filter(i => i.id !== id) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedLead = leads.find(l => l.id === formData.leadId);
    if (!selectedLead || formData.items.length === 0) return;

    const { subtotal, total } = calculateTotals();

    const newBudget: Budget = {
      id: uuidv4(),
      leadId: formData.leadId,
      leadName: selectedLead.name,
      quoteType: formData.quoteType,
      items: formData.items,
      laborCost: formData.laborCost,
      travelCost: formData.travelCost,
      discount: formData.discount,
      discountType: formData.discountType,
      subtotal,
      total,
      validity: formData.validity,
      paymentConditions: formData.paymentConditions,
      observations: formData.observations,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addBudget(newBudget);
    toast.success('Orçamento criado com sucesso');
    setShowNewModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      quoteType: 'calhas',
      leadId: '',
      items: [],
      laborCost: 0,
      travelCost: 0,
      discount: 0,
      discountType: 'percentage',
      validity: 15,
      paymentConditions: '50% entrada + 50% na entrega',
      observations: '',
    });
  };

  const handleSendBudget = (budget: Budget) => {
    updateBudget(budget.id, { status: 'sent', sentAt: new Date() });
    updateLeadStatus(budget.leadId, 'orcamento_enviado');
    addNotification({
      id: uuidv4(),
      type: 'info',
      title: 'Orçamento enviado',
      message: `Orçamento de ${budget.leadName} foi marcado como enviado`,
      read: false,
      createdAt: new Date(),
    });
    toast.success('Orçamento marcado como enviado');
  };

  const handleApprove = (budget: Budget) => {
    updateBudget(budget.id, { status: 'approved' });
    updateLeadStatus(budget.leadId, 'producao');

    const alreadyExists = productions.some((production) => production.budgetId === budget.id);
    if (!alreadyExists) {
      const estimatedEnd = new Date();
      estimatedEnd.setDate(estimatedEnd.getDate() + 10);

      addProduction({
        id: uuidv4(),
        budgetId: budget.id,
        leadId: budget.leadId,
        leadName: budget.leadName,
        items: budget.items.map((item) => item.description),
        currentStage: 'corte',
        progress: 0,
        startDate: new Date(),
        estimatedEnd,
        assignedTeam: ['3'],
        history: [],
        createdAt: new Date(),
      });
    }

    addNotification({
      id: uuidv4(),
      type: 'success',
      title: 'Orçamento aprovado',
      message: `${budget.leadName} entrou em produção`,
      read: false,
      createdAt: new Date(),
    });
    toast.success('Orçamento aprovado e produção criada');
  };

  const handleReject = (budget: Budget) => {
    updateBudget(budget.id, { status: 'rejected' });
    updateLeadStatus(budget.leadId, 'negociacao');
    toast.success('Orçamento marcado como rejeitado');
  };

  const handlePreview = (budget: Budget) => {
    setSelectedBudget(budget);
    setShowPreviewModal(true);
  };

  const handleWhatsAppBudget = (budget: Budget) => {
    const lead = leads.find(l => l.id === budget.leadId);
    if (!lead) {
      toast.error('Cliente não encontrado');
      return;
    }

    const ok = openWhatsApp(lead.phone, buildBudgetText(budget, quoteSettings));
    if (!ok) toast.error('Telefone inválido para WhatsApp');
  };

  const handleEmailBudget = (budget: Budget) => {
    const lead = leads.find(l => l.id === budget.leadId);
    if (!lead?.email) {
      toast.error('Cliente sem e-mail cadastrado');
      return;
    }

    const subject = encodeURIComponent(`Orçamento Marquinhos - ${budget.leadName}`);
    const body = encodeURIComponent(buildBudgetText(budget, quoteSettings));
    window.location.href = `mailto:${lead.email}?subject=${subject}&body=${body}`;
  };

  const handleDownloadBudget = (budget: Budget) => {
    downloadTextFile(`orcamento-${budget.id.slice(0, 8)}.txt`, buildBudgetText(budget, quoteSettings));
    toast.success('Arquivo do orçamento baixado');
  };

  const handleCopyBudget = async (budget: Budget) => {
    await copyText(buildBudgetText(budget, quoteSettings));
    toast.success('Orçamento copiado');
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700' },
    sent: { label: 'Enviado', color: 'bg-red-100 text-red-700' },
    approved: { label: 'Aprovado', color: 'bg-red-100 text-red-700' },
    rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-700' },
    expired: { label: 'Expirado', color: 'bg-red-100 text-red-700' },
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {filteredBudgets.length} {filteredBudgets.length === 1 ? 'orcamento' : 'orcamentos'} de {quoteTypeConfig[activeQuoteType].label.toLowerCase()}
          </h2>
          <p className="text-sm text-gray-500">{quoteTypeConfig[activeQuoteType].description}</p>
        </div>
        <Button onClick={() => { setQuoteType(activeQuoteType); setShowNewModal(true); }} icon={<Plus size={18} />}>
          Novo Orcamento
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(['calhas', 'esquadrias'] as QuoteType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveQuoteType(type)}
            className={`rounded-lg border p-4 text-left transition-colors ${
              activeQuoteType === type
                ? 'border-red-600 bg-red-50 text-red-900'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{quoteTypeConfig[type].label}</p>
                <p className="text-sm opacity-75">{quoteTypeConfig[type].description}</p>
              </div>
              <Badge className={activeQuoteType === type ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}>
                {budgets.filter(budget => getBudgetType(budget) === type).length}
              </Badge>
            </div>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{filteredBudgets.filter(b => b.status === 'draft').length}</p>
              <p className="text-xs text-gray-500">Rascunhos</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Send size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{filteredBudgets.filter(b => b.status === 'sent').length}</p>
              <p className="text-xs text-gray-500">Enviados</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <CheckCircle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{filteredBudgets.filter(b => b.status === 'approved').length}</p>
              <p className="text-xs text-gray-500">Aprovados</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <DollarSign size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatCurrency(filteredBudgets.filter(b => b.status === 'approved').reduce((sum, b) => sum + b.total, 0))}
              </p>
              <p className="text-xs text-gray-500">Total Aprovado</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Budgets List */}
      <div className="grid gap-4">
        {filteredBudgets.length === 0 ? (
          <Card className="text-center py-10">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum orçamento</h3>
            <p className="text-gray-500 mb-4">Crie seu primeiro orcamento de {quoteTypeConfig[activeQuoteType].label.toLowerCase()}</p>
            <Button onClick={() => { setQuoteType(activeQuoteType); setShowNewModal(true); }} icon={<Plus size={18} />}>
              Criar Orcamento
            </Button>
          </Card>
        ) : (
          filteredBudgets.map((budget) => (
            <Card key={budget.id} hover padding="none">
              <div className="p-5">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{budget.leadName}</h3>
                      <Badge className={statusConfig[budget.status]?.color}>
                        {statusConfig[budget.status]?.label}
                      </Badge>
                      <Badge className="bg-gray-100 text-gray-700">
                        {quoteTypeConfig[getBudgetType(budget)].label}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>{budget.items.length} itens</span>
                      <span>Criado em {format(new Date(budget.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      {budget.sentAt && (
                        <span>Enviado em {format(new Date(budget.sentAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(budget.total)}</p>
                    <p className="text-sm text-gray-500">Validade: {budget.validity} dias</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                  <Button size="sm" variant="ghost" onClick={() => handlePreview(budget)} icon={<Eye size={16} />}>
                    Visualizar
                  </Button>
                  {budget.status === 'draft' && (
                    <Button size="sm" variant="primary" onClick={() => handleSendBudget(budget)} icon={<Send size={16} />}>
                      Enviar
                    </Button>
                  )}
                  {budget.status === 'sent' && (
                    <>
                      <Button size="sm" variant="success" onClick={() => handleApprove(budget)} icon={<CheckCircle size={16} />}>
                        Aprovar
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleReject(budget)} icon={<XCircle size={16} />}>
                        Rejeitar
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleWhatsAppBudget(budget)} icon={<MessageSquare size={16} />}>
                    WhatsApp
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleEmailBudget(budget)} icon={<Mail size={16} />}>
                    E-mail
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDownloadBudget(budget)} icon={<Download size={16} />}>
                    PDF
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* New Budget Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title={`Novo Orcamento de ${quoteTypeConfig[formData.quoteType].label}`}
        size="full"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['calhas', 'esquadrias'] as QuoteType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setQuoteType(type)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  formData.quoteType === type
                    ? 'border-red-600 bg-red-50 text-red-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold">{quoteTypeConfig[type].label}</p>
                <p className="text-sm opacity-75">{quoteTypeConfig[type].description}</p>
              </button>
            ))}
          </div>

          {/* Client Selection */}
          <Select
            label="Cliente *"
            options={[
              { value: '', label: 'Selecione um cliente' },
              ...leads.map(lead => ({ value: lead.id, label: `${lead.name} - ${lead.service}` }))
            ]}
            value={formData.leadId}
            onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card padding="sm">
              <h4 className="font-medium text-gray-900 mb-3">Emissao do orcamento</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Nome da empresa"
                  value={quoteSettings.companyName}
                  onChange={(e) => updateQuoteSettings({ companyName: e.target.value })}
                />
                <Input
                  label="Documento"
                  value={quoteSettings.document}
                  onChange={(e) => updateQuoteSettings({ document: e.target.value })}
                />
                <Input
                  label="URL da logo"
                  value={quoteSettings.logoUrl || ''}
                  onChange={(e) => updateQuoteSettings({ logoUrl: e.target.value })}
                />
                <Input
                  label="Telefone"
                  value={quoteSettings.phone || ''}
                  onChange={(e) => updateQuoteSettings({ phone: e.target.value })}
                />
                <Input
                  label="Chave PIX"
                  value={quoteSettings.pixKey || ''}
                  onChange={(e) => updateQuoteSettings({ pixKey: e.target.value })}
                />
                <div className="sm:col-span-2">
                  <TextArea
                    label="Texto do cabecalho"
                    rows={2}
                    value={quoteSettings.headerText}
                    onChange={(e) => updateQuoteSettings({ headerText: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <TextArea
                    label="Texto final"
                    rows={2}
                    value={quoteSettings.footerText}
                    onChange={(e) => updateQuoteSettings({ footerText: e.target.value })}
                  />
                </div>
              </div>
            </Card>

            <Card padding="sm">
              <h4 className="font-medium text-gray-900 mb-3">Tabela de precos</h4>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Produto"
                  options={currentPriceProductOptions}
                  value={priceForm.name}
                  onChange={(e) => setPriceForm({ ...priceForm, name: e.target.value, category: categoryFromProduct(e.target.value) })}
                />
                {formData.quoteType === 'calhas' && (
                  <>
                    <Select
                      label="Espessura"
                      options={thicknessOptions.map(value => ({ value, label: `${value}mm` }))}
                      value={priceForm.thickness}
                      onChange={(e) => setPriceForm({ ...priceForm, thickness: e.target.value })}
                    />
                    <Select
                      label="Corte"
                      options={cutOptions.map(value => ({ value, label: `C/${value}` }))}
                      value={priceForm.cut}
                      onChange={(e) => setPriceForm({ ...priceForm, cut: e.target.value })}
                    />
                  </>
                )}
                <Select
                  label="Cor"
                  options={colorOptions.map(value => ({ value, label: value }))}
                  value={priceForm.color}
                  onChange={(e) => setPriceForm({ ...priceForm, color: e.target.value })}
                />
                <Select
                  label="Unidade"
                  options={[
                    { value: 'm', label: 'm' },
                    { value: 'un', label: 'un' },
                    { value: 'kit', label: 'kit' },
                  ]}
                  value={priceForm.unit}
                  onChange={(e) => setPriceForm({ ...priceForm, unit: e.target.value })}
                />
                <Input
                  label="Valor unitario"
                  type="number"
                  min={0}
                  step={0.01}
                  value={priceForm.unitPrice || ''}
                  onChange={(e) => setPriceForm({ ...priceForm, unitPrice: Number(e.target.value) })}
                />
                <div className="col-span-2">
                  <Button type="button" fullWidth onClick={handleSavePriceItem}>
                    Salvar preco na tabela
                  </Button>
                </div>
              </div>
              <div className="mt-3 max-h-32 space-y-2 overflow-auto">
                {quotePriceItems.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum preco salvo ainda.</p>
                ) : (
                  quotePriceItems.slice(0, 6).map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                      <span className="truncate">{item.name} - {formatCurrency(item.unitPrice)}/{item.unit}</span>
                      <div className="flex gap-1">
                        <button type="button" className="text-gray-500 hover:text-red-700" onClick={() => updateQuotePriceItem(item.id, { active: !item.active })}>
                          {item.active ? 'Pausar' : 'Ativar'}
                        </button>
                        <button type="button" className="text-red-600 hover:text-red-800" onClick={() => deleteQuotePriceItem(item.id)}>
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Items Section */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Package size={18} />
              Itens do Orçamento
            </h4>

            {/* Add Item Form */}
            <div className="mb-4 rounded-lg bg-gray-50 p-4">
              <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-3">
                <Select
                  label="Tipo de valor"
                  options={[
                    { value: 'saved', label: 'Usar tabela' },
                    { value: 'manual', label: 'Valor manual' },
                  ]}
                  value={newItem.priceMode}
                  onChange={(e) => setNewItem({ ...newItem, priceMode: e.target.value as 'saved' | 'manual', priceItemId: '' })}
                />
                <Select
                  label="Preco salvo"
                  options={[
                    { value: '', label: activePriceItems.length ? 'Escolha um preco salvo' : 'Nenhum preco salvo' },
                    ...activePriceItems.map(item => ({ value: item.id, label: `${item.name} - ${formatCurrency(item.unitPrice)}/${item.unit}` })),
                  ]}
                  value={newItem.priceItemId}
                  onChange={(e) => handleSelectSavedPrice(e.target.value)}
                  disabled={newItem.priceMode !== 'saved' || activePriceItems.length === 0}
                />
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <Select
                  label="Produto"
                  options={currentProductOptions}
                  value={newItem.product}
                  onChange={(e) => setNewItem({ ...newItem, product: e.target.value, category: categoryFromProduct(e.target.value) })}
                />
                {formData.quoteType === 'calhas' && (
                  <>
                    <Select
                      label="Espessura"
                      options={thicknessOptions.map(value => ({ value, label: `${value}mm` }))}
                      value={newItem.thickness}
                      onChange={(e) => setNewItem({ ...newItem, thickness: e.target.value })}
                    />
                    <Select
                      label="Corte"
                      options={cutOptions.map(value => ({ value, label: `C/${value}` }))}
                      value={newItem.cut}
                      onChange={(e) => setNewItem({ ...newItem, cut: e.target.value })}
                    />
                  </>
                )}
                <Select
                  label="Cor / acabamento"
                  options={colorOptions.map(value => ({ value, label: value }))}
                  value={newItem.color}
                  onChange={(e) => setNewItem({ ...newItem, color: e.target.value })}
                />
              </div>

              <div className="mt-3 grid grid-cols-1 xl:grid-cols-[1fr_120px_120px_160px_220px] gap-3">
                <Input
                  label="Descricao do item"
                  placeholder={formData.quoteType === 'calhas' ? buildMetalSheetDescription() : 'Ex: Janela 2 folhas 1,20 x 1,00 com vidro incolor'}
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                />
                <Input
                  label="Qtd"
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                  min={1}
                />
                <Select
                  label="Un."
                  options={[
                    { value: 'm', label: 'm' },
                    { value: 'un', label: 'un' },
                    { value: 'm2', label: 'm2' },
                    { value: 'kit', label: 'kit' },
                  ]}
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                />
                <Input
                  label="Valor unitario"
                  type="number"
                  placeholder="R$ Unit"
                  value={newItem.unitPrice || ''}
                  onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                  min={0}
                  step={0.01}
                />
                <div className="flex items-end">
                  <Button type="button" onClick={handleAddItem} className="w-full">
                    <Plus size={18} />
                    Adicionar item
                  </Button>
                </div>
              </div>
            </div>
            {/* Items List */}
            {formData.items.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">Descrição</th>
                      <th className="text-center p-3">Qtd</th>
                      <th className="text-center p-3">Un</th>
                      <th className="text-right p-3">Unit.</th>
                      <th className="text-right p-3">Total</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3">{item.description}</td>
                        <td className="text-center p-3">{item.quantity}</td>
                        <td className="text-center p-3">{item.unit}</td>
                        <td className="text-right p-3">{formatCurrency(item.unitPrice)}</td>
                        <td className="text-right p-3 font-medium">{formatCurrency(item.total)}</td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Costs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input
              label="Mão de obra"
              type="number"
              value={formData.laborCost || ''}
              onChange={(e) => setFormData({ ...formData, laborCost: Number(e.target.value) })}
              min={0}
              step={0.01}
              icon={<DollarSign size={16} />}
            />
            <Input
              label="Deslocamento"
              type="number"
              value={formData.travelCost || ''}
              onChange={(e) => setFormData({ ...formData, travelCost: Number(e.target.value) })}
              min={0}
              step={0.01}
              icon={<DollarSign size={16} />}
            />
            <Input
              label="Desconto"
              type="number"
              value={formData.discount || ''}
              onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
              min={0}
              icon={formData.discountType === 'percentage' ? <Percent size={16} /> : <DollarSign size={16} />}
            />
            <Select
              label="Tipo Desconto"
              options={[
                { value: 'percentage', label: 'Percentual' },
                { value: 'fixed', label: 'Valor Fixo' },
              ]}
              value={formData.discountType}
              onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
            />
          </div>

          {/* Summary */}
          {formData.items.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator size={18} />
                <h4 className="font-medium">Resumo</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Itens</span>
                  <span>{formatCurrency(calculateTotals().itemsTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mão de obra</span>
                  <span>{formatCurrency(formData.laborCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Deslocamento</span>
                  <span>{formatCurrency(formData.travelCost)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Subtotal</span>
                  <span>{formatCurrency(calculateTotals().subtotal)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Desconto</span>
                  <span>-{formatCurrency(calculateTotals().discountAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span className="text-red-600">{formatCurrency(calculateTotals().total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Validade (dias)"
              type="number"
              value={formData.validity}
              onChange={(e) => setFormData({ ...formData, validity: Number(e.target.value) })}
              min={1}
            />
            <Input
              label="Condições de Pagamento"
              value={formData.paymentConditions}
              onChange={(e) => setFormData({ ...formData, paymentConditions: e.target.value })}
            />
          </div>

          <TextArea
            label="Observações"
            value={formData.observations}
            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
            rows={3}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => setShowNewModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={formData.items.length === 0}>
              Criar Orçamento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Orçamento"
        size="lg"
      >
        {selectedBudget && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                {quoteSettings.logoUrl ? (
                  <img
                    src={quoteSettings.logoUrl}
                    alt={quoteSettings.companyName}
                    className="h-14 w-14 rounded-lg border border-gray-200 object-contain"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    M
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold">{quoteSettings.companyName}</h1>
                  <p className="text-sm text-gray-500">{quoteSettings.document}</p>
                  {quoteSettings.phone && <p className="text-sm text-gray-500">{quoteSettings.phone}</p>}
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold text-red-600">ORÇAMENTO</h2>
                <p className="text-sm text-gray-500">#{selectedBudget.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>

            {quoteSettings.headerText && (
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
                {quoteSettings.headerText}
              </div>
            )}

            {/* Client */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Cliente</h4>
              <p className="font-semibold text-lg">{selectedBudget.leadName}</p>
            </div>

            {/* Items */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Itens</h4>
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-2">Descrição</th>
                    <th className="text-center p-2">Qtd</th>
                    <th className="text-right p-2">Unit.</th>
                    <th className="text-right p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBudget.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-2">{item.description}</td>
                      <td className="text-center p-2">{item.quantity} {item.unit}</td>
                      <td className="text-right p-2">{formatCurrency(item.unitPrice)}</td>
                      <td className="text-right p-2 font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Mão de obra</span>
                <span>{formatCurrency(selectedBudget.laborCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Deslocamento</span>
                <span>{formatCurrency(selectedBudget.travelCost)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedBudget.subtotal)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Desconto</span>
                <span>-{formatCurrency(
                  selectedBudget.discountType === 'percentage'
                    ? (selectedBudget.subtotal * selectedBudget.discount) / 100
                    : selectedBudget.discount
                )}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-red-600">{formatCurrency(selectedBudget.total)}</span>
              </div>
            </div>

            {/* Conditions */}
            <div className="text-sm text-gray-600">
              <p><strong>Validade:</strong> {selectedBudget.validity} dias</p>
              <p><strong>Pagamento:</strong> {selectedBudget.paymentConditions}</p>
              {quoteSettings.pixKey && <p><strong>PIX:</strong> {quoteSettings.pixKey}</p>}
              {selectedBudget.observations && (
                <p><strong>Observações:</strong> {selectedBudget.observations}</p>
              )}
              {quoteSettings.footerText && (
                <p className="mt-3 rounded-lg bg-gray-50 p-3">{quoteSettings.footerText}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button size="sm" onClick={() => handleWhatsAppBudget(selectedBudget)} icon={<MessageSquare size={16} />}>
                Enviar WhatsApp
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleCopyBudget(selectedBudget)}>
                Copiar texto
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDownloadBudget(selectedBudget)} icon={<Download size={16} />}>
                Baixar arquivo
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
