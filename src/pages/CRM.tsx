import React, { useState, useMemo } from 'react';
import {
  Search, Plus, Filter, Phone, MapPin, Mail, Calendar, Edit,
  Trash2, Eye, MessageSquare, ExternalLink, ChevronLeft, Tag, Clock,
  User, AlertCircle, CheckCircle, TrendingUp
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select, TextArea } from '../components/ui/Input';
import { StatusBadge, UrgencyBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { useStore } from '../store/useStore';
import { Lead, LeadStatus, LeadOrigin, UrgencyLevel } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { openMap, openWhatsApp } from '../utils/actions';

type CRMView = 'list' | 'new' | 'detail';

const BLANK_FORM = {
  name: '', phone: '', email: '', address: '', neighborhood: '',
  city: 'Jaraguá do Sul', state: 'SC', origin: 'whatsapp' as LeadOrigin,
  service: '', urgency: 'media' as UrgencyLevel, potentialValue: 0,
  availability: '', observations: '',
};

export const CRM: React.FC = () => {
  const { leads, addLead, updateLead, deleteLead } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOrigin, setFilterOrigin] = useState('all');
  const [view, setView] = useState<CRMView>('list');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);

  const filteredLeads = useMemo(() => leads.filter(l => {
    const q = searchQuery.toLowerCase();
    const matchSearch = l.name.toLowerCase().includes(q) || l.phone.includes(q) ||
      l.service.toLowerCase().includes(q) || (l.address||'').toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchOrigin = filterOrigin === 'all' || l.origin === filterOrigin;
    return matchSearch && matchStatus && matchOrigin;
  }), [leads, searchQuery, filterStatus, filterOrigin]);

  const statusOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'novo', label: 'Novo Lead' },
    { value: 'primeiro_atendimento', label: 'Primeiro Atendimento' },
    { value: 'qualificado', label: 'Qualificado' },
    { value: 'aguardando_medidas', label: 'Aguardando Medidas' },
    { value: 'orcamento_enviado', label: 'Em Orçamento' },
    { value: 'negociacao', label: 'Negociação' },
    { value: 'fechado', label: 'Fechado' },
    { value: 'producao', label: 'Produção' },
    { value: 'instalacao', label: 'Instalação' },
    { value: 'pos_venda', label: 'Pós-venda' },
    { value: 'perdido', label: 'Perdido' },
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
  const originColor: Record<string, string> = {
    whatsapp: 'bg-green-100 text-green-700',
    instagram: 'bg-pink-100 text-pink-700',
    telefone: 'bg-blue-100 text-blue-700',
    indicacao: 'bg-purple-100 text-purple-700',
    site: 'bg-cyan-100 text-cyan-700',
    outro: 'bg-gray-100 text-gray-700',
  };
  const originLabel: Record<string, string> = {
    whatsapp:'WhatsApp',instagram:'Instagram',telefone:'Telefone',
    indicacao:'Indicação',site:'Site',outro:'Outro'
  };

  const openNew = () => { setForm(BLANK_FORM); setIsEditing(false); setView('new'); };
  const openEdit = (lead: Lead) => {
    setForm({ name:lead.name, phone:lead.phone, email:lead.email||'', address:lead.address,
      neighborhood:lead.neighborhood||'', city:lead.city||'Jaraguá do Sul', state:lead.state||'SC',
      origin:lead.origin, service:lead.service, urgency:lead.urgency,
      potentialValue:lead.potentialValue||0, availability:lead.availability||'',
      observations:lead.observations||'' });
    setSelectedLead(lead); setIsEditing(true); setView('new');
  };
  const openDetail = (lead: Lead) => { setSelectedLead(lead); setView('detail'); };
  const handleDelete = (id: string) => {
    if (window.confirm('Excluir este lead?')) { deleteLead(id); setView('list'); toast.success('Lead excluído'); }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) { toast.error('Nome e telefone são obrigatórios'); return; }
    if (isEditing && selectedLead) {
      updateLead(selectedLead.id, { ...form });
      toast.success('Lead atualizado!');
    } else {
      addLead({ id: uuidv4(), ...form, zipCode:'', status:'novo' as LeadStatus,
        lastInteractionAt: new Date(), attachments:[], messages:[], createdAt:new Date(), updatedAt:new Date() });
      toast.success('Lead criado!');
    }
    setView('list');
  };
  const f = (v: Partial<typeof BLANK_FORM>) => setForm(prev => ({ ...prev, ...v }));

  // ─── FORM VIEW ───────────────────────────────────────────────────────────
  if (view === 'new') {
    return (
      <div className="animate-fadeIn">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-0 py-3 mb-5 flex items-center justify-between">
          <button onClick={() => setView('list')} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <ChevronLeft size={18}/> Voltar para CRM
          </button>
          <h2 className="text-base font-bold text-gray-900">{isEditing ? '✏️ Editar Lead' : '+ Novo Lead'}</h2>
          <div className="w-24"/>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pb-10">
          {/* Bloco 1: Contato */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-800 text-white text-xs font-bold uppercase tracking-wider">
              Dados de Contato
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nome completo *" value={form.name} onChange={e => f({name:e.target.value})} required placeholder="Ex: João da Silva"/>
              <Input label="Telefone / WhatsApp *" value={form.phone} onChange={e => f({phone:e.target.value})} required placeholder="(47) 99999-9999"/>
              <Input label="E-mail" type="email" value={form.email} onChange={e => f({email:e.target.value})} placeholder="email@exemplo.com"/>
              <Select label="Origem do lead" options={originOptions.filter(o=>o.value!=='all')} value={form.origin} onChange={e => f({origin:e.target.value as LeadOrigin})}/>
            </div>
          </div>

          {/* Bloco 2: Endereço */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-800 text-white text-xs font-bold uppercase tracking-wider">
              Endereço
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Rua / Avenida *" value={form.address} onChange={e => f({address:e.target.value})} required placeholder="Ex: Rua das Flores, 123" className="sm:col-span-2"/>
              <Input label="Bairro" value={form.neighborhood} onChange={e => f({neighborhood:e.target.value})} placeholder="Ex: Centro"/>
              <Input label="Cidade" value={form.city} onChange={e => f({city:e.target.value})}/>
            </div>
          </div>

          {/* Bloco 3: Serviço */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-800 text-white text-xs font-bold uppercase tracking-wider">
              Serviço e Detalhes
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Serviço solicitado *" value={form.service} onChange={e => f({service:e.target.value})} required placeholder="Ex: Calha platibanda, Rufo, Esquadria..." className="sm:col-span-2"/>
              <Select label="Urgência" options={[{value:'baixa',label:'🟢 Baixa'},{value:'media',label:'🟡 Média'},{value:'alta',label:'🔴 Alta'},{value:'urgente',label:'🚨 Urgente'}]} value={form.urgency} onChange={e => f({urgency:e.target.value as UrgencyLevel})}/>
              <Input label="Valor potencial (R$)" type="number" min="0" step="100" value={form.potentialValue} onChange={e => f({potentialValue:Number(e.target.value)})}/>
              <Input label="Disponibilidade de horário" value={form.availability} onChange={e => f({availability:e.target.value})} placeholder="Ex: Terça e quinta à tarde" className="sm:col-span-2"/>
              <TextArea label="Observações" value={form.observations} onChange={e => f({observations:e.target.value})} rows={3} placeholder="Detalhes adicionais sobre o pedido..." className="sm:col-span-2"/>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 justify-end pt-2 pb-6">
            <Button type="button" variant="ghost" onClick={() => setView('list')}>Cancelar</Button>
            <Button type="submit" icon={isEditing ? <CheckCircle size={16}/> : <Plus size={16}/>}>
              {isEditing ? 'Salvar Alterações' : 'Criar Lead'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // ─── DETAIL VIEW ─────────────────────────────────────────────────────────
  if (view === 'detail' && selectedLead) {
    const l = selectedLead;
    return (
      <div className="animate-fadeIn space-y-4 pb-8">
        <div className="flex items-center justify-between">
          <button onClick={() => setView('list')} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <ChevronLeft size={18}/> Voltar
          </button>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => openWhatsApp(l.phone, 'Olá '+l.name+'! Aqui é da Marquinhos.')} icon={<MessageSquare size={15}/>}>WhatsApp</Button>
            <Button size="sm" variant="ghost" onClick={() => openMap(l.address+', '+l.city)} icon={<ExternalLink size={15}/>}>Mapa</Button>
            <Button size="sm" variant="outline" onClick={() => openEdit(l)} icon={<Edit size={15}/>}>Editar</Button>
            <Button size="sm" variant="danger" onClick={() => handleDelete(l.id)} icon={<Trash2 size={15}/>}>Excluir</Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            <Avatar name={l.name} size="xl"/>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{l.name}</h2>
              <p className="text-gray-500 mt-0.5">{l.service}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <StatusBadge status={l.status}/>
                <UrgencyBadge urgency={l.urgency}/>
                {l.potentialValue > 0 && (
                  <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp size={11}/> R$ {l.potentialValue.toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Contato</h4>
            <div className="flex items-center gap-2 text-sm"><Phone size={15} className="text-gray-400 shrink-0"/><span className="font-semibold">{l.phone}</span></div>
            {l.email && <div className="flex items-center gap-2 text-sm"><Mail size={15} className="text-gray-400 shrink-0"/><span>{l.email}</span></div>}
            <div className="flex items-center gap-2 text-sm"><Tag size={15} className="text-gray-400 shrink-0"/>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${originColor[l.origin]||'bg-gray-100 text-gray-700'}`}>{originLabel[l.origin]||l.origin}</span>
            </div>
            <div className="flex items-center gap-2 text-sm"><Calendar size={15} className="text-gray-400 shrink-0"/><span className="text-gray-500">{format(new Date(l.createdAt),'dd/MM/yyyy',{locale:ptBR})}</span></div>
            {l.availability && <div className="flex items-center gap-2 text-sm"><Clock size={15} className="text-gray-400 shrink-0"/><span className="text-gray-600">{l.availability}</span></div>}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Endereço</h4>
            <div className="flex items-start gap-2 text-sm"><MapPin size={15} className="text-gray-400 shrink-0 mt-0.5"/>
              <div>
                <p className="font-semibold">{l.address}</p>
                {l.neighborhood && <span className="inline-block mt-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{l.neighborhood}</span>}
                {l.city && <p className="text-gray-500 text-xs mt-1">{l.city}{l.state?'/'+l.state:''}</p>}
              </div>
            </div>
          </div>
        </div>

        {(l.observations || l.aiSummary) && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Observações</h4>
            {l.aiSummary && <div className="p-3 bg-red-50 border border-red-100 rounded-lg mb-3"><p className="text-xs font-bold text-red-600 mb-1">RESUMO IA</p><p className="text-sm text-red-800">{l.aiSummary}</p></div>}
            {l.observations && <p className="text-sm text-gray-700 leading-relaxed">{l.observations}</p>}
          </div>
        )}

        {l.messages && l.messages.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Histórico ({l.messages.length})</h4>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {l.messages.map(msg => (
                <div key={msg.id} className={`p-3 rounded-lg text-sm ${msg.sender==='client'?'bg-gray-100':'bg-red-50'}`}>
                  <p>{msg.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{format(new Date(msg.timestamp),'dd/MM HH:mm',{locale:ptBR})}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────────────
  return (
    <div className="animate-fadeIn space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{filteredLeads.length} {filteredLeads.length===1?'cliente':'clientes'}</h2>
          <p className="text-sm text-gray-500">Gerencie seus leads e clientes</p>
        </div>
        <Button onClick={openNew} icon={<Plus size={18}/>}>Novo Lead</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input placeholder="Buscar nome, telefone, serviço..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} icon={<Search size={16}/>}/>
        </div>
        <Select options={statusOptions} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="sm:w-44"/>
        <Select options={originOptions} value={filterOrigin} onChange={e=>setFilterOrigin(e.target.value)} className="sm:w-36"/>
      </div>

      <div className="space-y-3">
        {filteredLeads.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-14 text-center">
            <Filter size={40} className="mx-auto text-gray-300 mb-3"/>
            <h3 className="font-semibold text-gray-700">Nenhum lead encontrado</h3>
            <p className="text-sm text-gray-400 mt-1 mb-4">Ajuste os filtros ou adicione um novo lead</p>
            <Button onClick={openNew} icon={<Plus size={16}/>}>Novo Lead</Button>
          </div>
        ) : filteredLeads.map(lead => (
          <div key={lead.id} className="bg-white rounded-xl border border-gray-200 hover:border-red-200 hover:shadow-sm transition-all">
            <div className="p-4 flex gap-3">
              <Avatar name={lead.name} size="md"/>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900 text-sm">{lead.name}</h3>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <UrgencyBadge urgency={lead.urgency}/>
                    <StatusBadge status={lead.status}/>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{lead.service}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Phone size={11}/>{lead.phone}</span>
                  {lead.neighborhood && (
                    <span className="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">{lead.neighborhood}</span>
                  )}
                  <span className="flex items-center gap-1 truncate"><MapPin size={11}/>{lead.address?.split(',')[0]}</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 rounded-b-xl flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${originColor[lead.origin]||'bg-gray-100 text-gray-700'}`}>{originLabel[lead.origin]||lead.origin}</span>
              <div className="flex gap-1">
                <button onClick={()=>openDetail(lead)} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"><Eye size={13}/>Ver</button>
                <button onClick={()=>openEdit(lead)} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"><Edit size={13}/>Editar</button>
                <button onClick={()=>openWhatsApp(lead.phone,'Olá '+lead.name+'!')} className="px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-1.5"><MessageSquare size={13}/>WA</button>
                <button onClick={()=>openMap(lead.address+', '+lead.city)} className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5"><ExternalLink size={13}/>Mapa</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};