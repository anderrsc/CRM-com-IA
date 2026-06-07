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
import { Budget, BudgetItem } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { buildBudgetText, copyText, downloadTextFile, openWhatsApp } from '../utils/actions';

export const Orcamentos: React.FC = () => {
  const { budgets, leads, productions, addBudget, updateBudget, addProduction, updateLeadStatus, addNotification } = useStore();
  const [showNewModal, setShowNewModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // Form state
  const [formData, setFormData] = useState({
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
    description: '',
    quantity: 1,
    unit: 'un',
    unitPrice: 0,
  });

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
    if (!newItem.description || newItem.unitPrice <= 0) return;

    const item: BudgetItem = {
      id: uuidv4(),
      ...newItem,
      total: newItem.quantity * newItem.unitPrice,
    };

    setFormData({ ...formData, items: [...formData.items, item] });
    setNewItem({ description: '', quantity: 1, unit: 'un', unitPrice: 0 });
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

    const ok = openWhatsApp(lead.phone, buildBudgetText(budget));
    if (!ok) toast.error('Telefone inválido para WhatsApp');
  };

  const handleEmailBudget = (budget: Budget) => {
    const lead = leads.find(l => l.id === budget.leadId);
    if (!lead?.email) {
      toast.error('Cliente sem e-mail cadastrado');
      return;
    }

    const subject = encodeURIComponent(`Orçamento Marquinhos - ${budget.leadName}`);
    const body = encodeURIComponent(buildBudgetText(budget));
    window.location.href = `mailto:${lead.email}?subject=${subject}&body=${body}`;
  };

  const handleDownloadBudget = (budget: Budget) => {
    downloadTextFile(`orcamento-${budget.id.slice(0, 8)}.txt`, buildBudgetText(budget));
    toast.success('Arquivo do orçamento baixado');
  };

  const handleCopyBudget = async (budget: Budget) => {
    await copyText(buildBudgetText(budget));
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
            {budgets.length} {budgets.length === 1 ? 'orçamento' : 'orçamentos'}
          </h2>
          <p className="text-sm text-gray-500">Crie e gerencie orçamentos</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} icon={<Plus size={18} />}>
          Novo Orçamento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{budgets.filter(b => b.status === 'draft').length}</p>
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
              <p className="text-2xl font-bold">{budgets.filter(b => b.status === 'sent').length}</p>
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
              <p className="text-2xl font-bold">{budgets.filter(b => b.status === 'approved').length}</p>
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
                {formatCurrency(budgets.filter(b => b.status === 'approved').reduce((sum, b) => sum + b.total, 0))}
              </p>
              <p className="text-xs text-gray-500">Total Aprovado</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Budgets List */}
      <div className="grid gap-4">
        {budgets.length === 0 ? (
          <Card className="text-center py-10">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum orçamento</h3>
            <p className="text-gray-500 mb-4">Crie seu primeiro orçamento</p>
            <Button onClick={() => setShowNewModal(true)} icon={<Plus size={18} />}>
              Criar Orçamento
            </Button>
          </Card>
        ) : (
          budgets.map((budget) => (
            <Card key={budget.id} hover padding="none">
              <div className="p-5">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{budget.leadName}</h3>
                      <Badge className={statusConfig[budget.status]?.color}>
                        {statusConfig[budget.status]?.label}
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
        title="Novo Orçamento"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
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

          {/* Items Section */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Package size={18} />
              Itens do Orçamento
            </h4>

            {/* Add Item Form */}
            <div className="grid grid-cols-12 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="col-span-12 sm:col-span-5">
                <Input
                  placeholder="Descrição do item"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Input
                  type="number"
                  placeholder="Qtd"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                  min={1}
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Select
                  options={[
                    { value: 'un', label: 'un' },
                    { value: 'm', label: 'm' },
                    { value: 'm²', label: 'm²' },
                    { value: 'kit', label: 'kit' },
                  ]}
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Input
                  type="number"
                  placeholder="R$ Unit"
                  value={newItem.unitPrice || ''}
                  onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                  min={0}
                  step={0.01}
                />
              </div>
              <div className="col-span-12 sm:col-span-1 flex items-end">
                <Button type="button" onClick={handleAddItem} size="sm" className="w-full">
                  <Plus size={18} />
                </Button>
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
                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  M
                </div>
                <div>
                  <h1 className="text-xl font-bold">Marquinhos</h1>
                  <p className="text-sm text-gray-500">CNPJ: 00.000.000/0001-00</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold text-red-600">ORÇAMENTO</h2>
                <p className="text-sm text-gray-500">#{selectedBudget.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>

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
              {selectedBudget.observations && (
                <p><strong>Observações:</strong> {selectedBudget.observations}</p>
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
