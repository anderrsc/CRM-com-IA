import React, { useMemo, useState } from 'react';
import { ArrowLeft, PackagePlus, CheckCircle2, Truck, Wallet, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select, TextArea } from '../components/ui/Input';
import { useStore } from '../store/useStore';
import { Purchase } from '../types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const paymentLabels: Record<Purchase['paymentMethod'], string> = {
  pix: 'PIX',
  boleto: 'Boleto',
  cartao: 'Cartao',
  dinheiro: 'Dinheiro',
  transferencia: 'Transferencia',
  outro: 'Outro',
};

export const Compras: React.FC = () => {
  const { purchases, leads, currentUser, addPurchase, updatePurchase, deletePurchase, addNotification } = useStore();
  const [pageView, setPageView] = useState<'list' | 'new'>('list');
  const [formData, setFormData] = useState({
    leadId: '',
    supplier: '',
    itemName: '',
    quantity: 1,
    unit: 'un',
    unitCost: 0,
    paymentMethod: 'pix' as Purchase['paymentMethod'],
    expectedAt: '',
    notes: '',
  });

  const canSeeValues = currentUser?.role === 'admin' || currentUser?.role === 'compras';
  const pending = purchases.filter((purchase) => purchase.status === 'comprado');
  const received = purchases.filter((purchase) => purchase.status === 'recebido');
  const totalPurchased = purchases.reduce((sum, purchase) => sum + purchase.total, 0);

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === formData.leadId),
    [formData.leadId, leads]
  );

  const resetForm = () => {
    setFormData({
      leadId: '',
      supplier: '',
      itemName: '',
      quantity: 1,
      unit: 'un',
      unitCost: 0,
      paymentMethod: 'pix',
      expectedAt: '',
      notes: '',
    });
  };

  const closeForm = () => {
    resetForm();
    setPageView('list');
  };

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.supplier.trim() || !formData.itemName.trim()) {
      toast.error('Preencha fornecedor e item');
      return;
    }

    const total = formData.quantity * formData.unitCost;
    const purchase: Purchase = {
      id: uuidv4(),
      leadId: selectedLead?.id,
      leadName: selectedLead?.name || 'Sem obra vinculada',
      supplier: formData.supplier.trim(),
      itemName: formData.itemName.trim(),
      quantity: formData.quantity,
      unit: formData.unit,
      unitCost: formData.unitCost,
      total,
      paymentMethod: formData.paymentMethod,
      purchasedBy: currentUser?.name || 'Usuario',
      purchasedAt: new Date(),
      expectedAt: formData.expectedAt ? new Date(`${formData.expectedAt}T12:00:00`) : undefined,
      status: 'comprado',
      notes: formData.notes.trim() || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addPurchase(purchase);
    toast.success('Compra registrada');
    closeForm();
  };

  const handleReceive = (purchase: Purchase) => {
    updatePurchase(purchase.id, { status: 'recebido', receivedAt: new Date() });
    addNotification({
      id: uuidv4(),
      type: 'success',
      title: 'Item recebido para producao',
      message: `${purchase.itemName} chegou de ${purchase.supplier} para ${purchase.leadName}`,
      read: false,
      actionUrl: 'producao',
      createdAt: new Date(),
    });
    toast.success('Item recebido e producao avisada');
  };

  if (pageView === 'new') {
    return (
      <div className="animate-fadeIn space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={closeForm} icon={<ArrowLeft size={18} />}>
              Voltar
            </Button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Nova compra</h2>
              <p className="text-sm text-gray-500">Registre material, fornecedor, pagamento e obra vinculada</p>
            </div>
          </div>
        </div>

        <Card className="w-full">
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Select
                label="Obra / cliente"
                value={formData.leadId}
                onChange={(event) => setFormData({ ...formData, leadId: event.target.value })}
                options={[
                  { value: '', label: 'Sem obra vinculada' },
                  ...leads.map((lead) => ({ value: lead.id, label: `${lead.name} - ${lead.service}` })),
                ]}
              />
              <Input label="Fornecedor" value={formData.supplier} onChange={(event) => setFormData({ ...formData, supplier: event.target.value })} required />
              <Input label="Item comprado" value={formData.itemName} onChange={(event) => setFormData({ ...formData, itemName: event.target.value })} required />
              <Input label="Quantidade" type="number" min="0" step="0.01" value={formData.quantity} onChange={(event) => setFormData({ ...formData, quantity: Number(event.target.value) })} />
              <Select
                label="Unidade"
                value={formData.unit}
                onChange={(event) => setFormData({ ...formData, unit: event.target.value })}
                options={[
                  { value: 'un', label: 'un' },
                  { value: 'm', label: 'm' },
                  { value: 'kg', label: 'kg' },
                  { value: 'kit', label: 'kit' },
                ]}
              />
              <Input label="Valor unitario" type="number" min="0" step="0.01" value={formData.unitCost || ''} onChange={(event) => setFormData({ ...formData, unitCost: Number(event.target.value) })} />
              <Select
                label="Forma de pagamento"
                value={formData.paymentMethod}
                onChange={(event) => setFormData({ ...formData, paymentMethod: event.target.value as Purchase['paymentMethod'] })}
                options={[
                  { value: 'pix', label: 'PIX' },
                  { value: 'boleto', label: 'Boleto' },
                  { value: 'cartao', label: 'Cartao' },
                  { value: 'dinheiro', label: 'Dinheiro' },
                  { value: 'transferencia', label: 'Transferencia' },
                  { value: 'outro', label: 'Outro' },
                ]}
              />
              <Input label="Previsao de chegada" type="date" value={formData.expectedAt} onChange={(event) => setFormData({ ...formData, expectedAt: event.target.value })} />
            </div>

            <TextArea label="Observacoes" rows={5} value={formData.notes} onChange={(event) => setFormData({ ...formData, notes: event.target.value })} />

            <div className="rounded-lg bg-gray-50 p-5 text-sm">
              Total: <strong>{formatCurrency(formData.quantity * formData.unitCost)}</strong>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={closeForm}>Cancelar</Button>
              <Button type="submit">Salvar compra</Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Compras</h2>
          <p className="text-sm text-gray-500">Controle materiais comprados, recebimento e obra vinculada</p>
        </div>
        {(currentUser?.role === 'admin' || currentUser?.role === 'compras') && (
          <Button onClick={() => setPageView('new')} icon={<Plus size={18} />}>
            Nova compra
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <PackagePlus size={22} className="text-red-600" />
            <div>
              <p className="text-2xl font-bold">{purchases.length}</p>
              <p className="text-xs text-gray-500">Compras</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <Truck size={22} className="text-red-600" />
            <div>
              <p className="text-2xl font-bold">{pending.length}</p>
              <p className="text-xs text-gray-500">Aguardando</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={22} className="text-red-600" />
            <div>
              <p className="text-2xl font-bold">{received.length}</p>
              <p className="text-xs text-gray-500">Recebidas</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <Wallet size={22} className="text-red-600" />
            <div>
              <p className="text-lg font-bold">{canSeeValues ? formatCurrency(totalPurchased) : 'Restrito'}</p>
              <p className="text-xs text-gray-500">Total comprado</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4">
        {purchases.length === 0 ? (
          <Card className="text-center py-10">
            <PackagePlus size={46} className="mx-auto mb-3 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">Nenhuma compra registrada</h3>
            <p className="text-gray-500">Quando comprar material para uma obra, registre aqui.</p>
          </Card>
        ) : (
          purchases.map((purchase) => (
            <Card key={purchase.id} hover>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{purchase.itemName}</h3>
                    <Badge variant={purchase.status === 'recebido' ? 'success' : 'warning'} dot>
                      {purchase.status === 'recebido' ? 'Recebido' : 'Comprado'}
                    </Badge>
                  </div>
                  <div className="grid gap-1 text-sm text-gray-500 sm:grid-cols-2 lg:grid-cols-3">
                    <span>Obra: {purchase.leadName}</span>
                    <span>Fornecedor: {purchase.supplier}</span>
                    <span>Comprou: {purchase.purchasedBy}</span>
                    <span>Compra: {new Date(purchase.purchasedAt).toLocaleString('pt-BR')}</span>
                    <span>Qtd: {purchase.quantity} {purchase.unit}</span>
                    {purchase.receivedAt && <span>Chegou: {new Date(purchase.receivedAt).toLocaleString('pt-BR')}</span>}
                  </div>
                  {purchase.notes && <p className="mt-2 text-sm text-gray-600">{purchase.notes}</p>}
                </div>
                <div className="flex flex-col gap-2 lg:items-end">
                  {canSeeValues && (
                    <div className="text-left lg:text-right">
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(purchase.total)}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(purchase.unitCost)}/{purchase.unit} - {paymentLabels[purchase.paymentMethod]}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {purchase.status === 'comprado' && (
                      <Button size="sm" onClick={() => handleReceive(purchase)} icon={<CheckCircle2 size={16} />}>
                        Marcar recebido
                      </Button>
                    )}
                    {(currentUser?.role === 'admin' || currentUser?.role === 'compras') && (
                      <Button size="sm" variant="danger" onClick={() => deletePurchase(purchase.id)}>
                        <Trash2 size={16} />
                        Excluir
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

    </div>
  );
};
