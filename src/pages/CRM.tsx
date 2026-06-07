import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Phone, 
  MapPin, 
  Mail,
  Calendar,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select, TextArea } from '../components/ui/Input';
import { StatusBadge, UrgencyBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { useStore } from '../store/useStore';
import { Lead, LeadStatus, LeadOrigin, UrgencyLevel } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { openMap, openWhatsApp } from '../utils/actions';

export const CRM: React.FC = () => {
  const { leads, addLead, updateLead, deleteLead } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterOrigin, setFilterOrigin] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    neighborhood: '',
    city: 'Maringá',
    state: 'PR',
    origin: 'whatsapp' as LeadOrigin,
    service: '',
    urgency: 'media' as UrgencyLevel,
    availability: '',
    observations: '',
  });

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
      const matchesOrigin = filterOrigin === 'all' || lead.origin === filterOrigin;
      
      return matchesSearch && matchesStatus && matchesOrigin;
    });
  }, [leads, searchQuery, filterStatus, filterOrigin]);

  const handleOpenNew = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      neighborhood: '',
      city: 'Maringá',
      state: 'PR',
      origin: 'whatsapp',
      service: '',
      urgency: 'media',
      availability: '',
      observations: '',
    });
    setIsEditing(false);
    setShowNewModal(true);
  };

  const handleOpenDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailModal(true);
  };

  const handleEdit = (lead: Lead) => {
    setFormData({
      name: lead.name,
      phone: lead.phone,
      email: lead.email || '',
      address: lead.address,
      neighborhood: lead.neighborhood,
      city: lead.city,
      state: lead.state,
      origin: lead.origin,
      service: lead.service,
      urgency: lead.urgency,
      availability: lead.availability || '',
      observations: lead.observations || '',
    });
    setSelectedLead(lead);
    setIsEditing(true);
    setShowNewModal(true);
    setShowDetailModal(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este lead?')) {
      deleteLead(id);
      setShowDetailModal(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && selectedLead) {
      updateLead(selectedLead.id, formData);
      toast.success('Lead atualizado com sucesso');
    } else {
      const newLead: Lead = {
        id: uuidv4(),
        ...formData,
        zipCode: '',
        status: 'novo' as LeadStatus,
        attachments: [],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addLead(newLead);
      toast.success('Lead criado com sucesso');
    }
    
    setShowNewModal(false);
  };

  const handleWhatsApp = (lead: Lead) => {
    const ok = openWhatsApp(
      lead.phone,
      `Olá, ${lead.name}! Aqui é da Marquinhos OS. Estou entrando em contato sobre: ${lead.service}.`
    );
    if (!ok) toast.error('Telefone inválido para WhatsApp');
  };

  const handleOpenMap = (lead: Lead) => {
    const address = `${lead.address}, ${lead.neighborhood}, ${lead.city}/${lead.state}`;
    const ok = openMap(address);
    if (!ok) toast.error('Endereço não informado');
  };

  const statusOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'novo', label: 'Novo' },
    { value: 'aguardando_info', label: 'Aguardando Info' },
    { value: 'visita_agendada', label: 'Visita Agendada' },
    { value: 'visita_realizada', label: 'Visita Realizada' },
    { value: 'orcamento_enviado', label: 'Orçamento Enviado' },
    { value: 'negociacao', label: 'Negociação' },
    { value: 'fechado', label: 'Fechado' },
    { value: 'producao', label: 'Produção' },
    { value: 'instalacao', label: 'Instalação' },
    { value: 'finalizado', label: 'Finalizado' },
  ];

  const originOptions = [
    { value: 'all', label: 'Todas as origens' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'telefone', label: 'Telefone' },
    { value: 'indicacao', label: 'Indicação' },
    { value: 'site', label: 'Site' },
    { value: 'outro', label: 'Outro' },
  ];

  const originBadges: Record<string, { color: string; label: string }> = {
    whatsapp: { color: 'bg-red-100 text-red-700', label: 'WhatsApp' },
    instagram: { color: 'bg-red-100 text-red-700', label: 'Instagram' },
    telefone: { color: 'bg-red-100 text-red-700', label: 'Telefone' },
    indicacao: { color: 'bg-red-100 text-red-700', label: 'Indicação' },
    site: { color: 'bg-red-100 text-red-700', label: 'Site' },
    outro: { color: 'bg-gray-100 text-gray-700', label: 'Outro' },
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {filteredLeads.length} {filteredLeads.length === 1 ? 'cliente' : 'clientes'}
          </h2>
          <p className="text-sm text-gray-500">Gerencie seus leads e clientes</p>
        </div>
        <Button onClick={handleOpenNew} icon={<Plus size={18} />}>
          Novo Lead
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome, telefone, serviço..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={18} />}
            />
          </div>
          <div className="flex gap-3">
            <Select
              options={statusOptions}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-40"
            />
            <Select
              options={originOptions}
              value={filterOrigin}
              onChange={(e) => setFilterOrigin(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      </Card>

      {/* Leads List */}
      <div className="grid gap-4">
        {filteredLeads.length === 0 ? (
          <Card className="text-center py-10">
            <Filter size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum lead encontrado</h3>
            <p className="text-gray-500 mb-4">Tente ajustar os filtros ou adicione um novo lead</p>
            <Button onClick={handleOpenNew} icon={<Plus size={18} />}>
              Adicionar Lead
            </Button>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <Card key={lead.id} hover padding="none">
              <div className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Avatar and main info */}
                  <div className="flex gap-4 flex-1">
                    <Avatar name={lead.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{lead.name}</h3>
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          <UrgencyBadge urgency={lead.urgency} />
                          <StatusBadge status={lead.status} />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{lead.service}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone size={14} />
                          {lead.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {lead.address}, {lead.neighborhood}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${originBadges[lead.origin]?.color || 'bg-gray-100 text-gray-700'}`}>
                      {originBadges[lead.origin]?.label || lead.origin}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={12} />
                      {format(new Date(lead.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                </div>

                {/* AI Summary */}
                {lead.aiSummary && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800">
                      <span className="font-medium">IA:</span> {lead.aiSummary}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <Button size="sm" variant="ghost" onClick={() => handleOpenDetail(lead)} icon={<Eye size={16} />}>
                    Ver
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(lead)} icon={<Edit size={16} />}>
                    Editar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleWhatsApp(lead)} icon={<MessageSquare size={16} />}>
                    WhatsApp
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleOpenMap(lead)} icon={<ExternalLink size={16} />}>
                    Mapa
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* New/Edit Modal */}
      <Modal 
        isOpen={showNewModal} 
        onClose={() => setShowNewModal(false)} 
        title={isEditing ? 'Editar Lead' : 'Novo Lead'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Telefone *"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <Input
              label="E-mail"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Select
              label="Origem"
              options={originOptions.filter(o => o.value !== 'all')}
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value as LeadOrigin })}
            />
            <Input
              label="Endereço *"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              className="sm:col-span-2"
            />
            <Input
              label="Bairro"
              value={formData.neighborhood}
              onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
            />
            <Input
              label="Cidade"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="Serviço *"
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              required
              placeholder="Ex: Janela de alumínio, Box de vidro..."
            />
            <Select
              label="Urgência"
              options={[
                { value: 'baixa', label: 'Baixa' },
                { value: 'media', label: 'Média' },
                { value: 'alta', label: 'Alta' },
                { value: 'urgente', label: 'Urgente' },
              ]}
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value as UrgencyLevel })}
            />
            <Input
              label="Disponibilidade"
              value={formData.availability}
              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              placeholder="Ex: Terça e quinta à tarde"
              className="sm:col-span-2"
            />
            <TextArea
              label="Observações"
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              rows={3}
              className="sm:col-span-2"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => setShowNewModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? 'Salvar Alterações' : 'Criar Lead'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detalhes do Lead"
        size="lg"
      >
        {selectedLead && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <Avatar name={selectedLead.name} size="xl" />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{selectedLead.name}</h3>
                <p className="text-gray-600">{selectedLead.service}</p>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status={selectedLead.status} />
                  <UrgencyBadge urgency={selectedLead.urgency} />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Phone size={16} />
                  <span className="text-sm">Telefone</span>
                </div>
                <p className="font-medium">{selectedLead.phone}</p>
              </div>
              {selectedLead.email && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Mail size={16} />
                    <span className="text-sm">E-mail</span>
                  </div>
                  <p className="font-medium">{selectedLead.email}</p>
                </div>
              )}
              <div className="p-4 bg-gray-50 rounded-lg sm:col-span-2">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <MapPin size={16} />
                  <span className="text-sm">Endereço</span>
                </div>
                <p className="font-medium">
                  {selectedLead.address}, {selectedLead.neighborhood} - {selectedLead.city}/{selectedLead.state}
                </p>
              </div>
            </div>

            {/* AI Summary */}
            {selectedLead.aiSummary && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Resumo IA</h4>
                <p className="text-red-800">{selectedLead.aiSummary}</p>
              </div>
            )}

            {/* Observations */}
            {selectedLead.observations && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Observações</h4>
                <p className="text-gray-600">{selectedLead.observations}</p>
              </div>
            )}

            {/* Messages History */}
            {selectedLead.messages.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Histórico de Mensagens</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedLead.messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.sender === 'client' ? 'bg-gray-100' : 'bg-red-50'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(msg.timestamp), 'dd/MM HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              <Button onClick={() => handleEdit(selectedLead)} icon={<Edit size={18} />}>
                Editar
              </Button>
              <Button variant="secondary" onClick={() => handleWhatsApp(selectedLead)} icon={<MessageSquare size={18} />}>
                WhatsApp
              </Button>
              <Button variant="secondary" onClick={() => handleOpenMap(selectedLead)} icon={<ExternalLink size={18} />}>
                Ver no Mapa
              </Button>
              <Button 
                variant="danger" 
                onClick={() => handleDelete(selectedLead.id)} 
                icon={<Trash2 size={18} />}
              >
                Excluir
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
