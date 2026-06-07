import React, { useState } from 'react';
import { 
  DndContext, 
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Phone, 
  MapPin, 
  GripVertical,
  TrendingUp,
  Users,
  Target,
  Zap,
  ChevronLeft,
  ChevronRight,
  MessageCircle
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { UrgencyBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { useStore } from '../store/useStore';
import { Lead, LeadStatus } from '../types';
import { cn } from '../utils/cn';
import { openMap, openWhatsApp } from '../utils/actions';
import toast from 'react-hot-toast';

interface Column {
  id: LeadStatus;
  title: string;
  color: string;
  bgColor: string;
  gradient: string;
}

const columns: Column[] = [
  { id: 'novo', title: 'Novo Lead', color: 'bg-red-500', bgColor: 'bg-red-50', gradient: 'from-red-500 to-red-600' },
  { id: 'primeiro_atendimento', title: 'Primeiro Atendimento', color: 'bg-red-500', bgColor: 'bg-red-50', gradient: 'from-red-500 to-red-500' },
  { id: 'qualificado', title: 'Qualificado', color: 'bg-red-500', bgColor: 'bg-red-50', gradient: 'from-red-500 to-red-500' },
  { id: 'aguardando_medidas', title: 'Aguardando Medidas', color: 'bg-red-500', bgColor: 'bg-red-50', gradient: 'from-red-500 to-red-500' },
  { id: 'orcamento_enviado', title: 'Em Orcamento', color: 'bg-red-500', bgColor: 'bg-red-50', gradient: 'from-red-500 to-red-500' },
  { id: 'negociacao', title: 'Negociacao', color: 'bg-red-500', bgColor: 'bg-red-50', gradient: 'from-red-500 to-red-500' },
  { id: 'fechado', title: 'Fechado', color: 'bg-red-500', bgColor: 'bg-red-50', gradient: 'from-red-500 to-red-500' },
  { id: 'producao', title: 'Producao', color: 'bg-red-500', bgColor: 'bg-red-50', gradient: 'from-red-500 to-red-500' },
  { id: 'instalacao', title: 'Instalacao', color: 'bg-red-500', bgColor: 'bg-red-50', gradient: 'from-red-500 to-red-500' },
  { id: 'pos_venda', title: 'Pos-venda', color: 'bg-red-500', bgColor: 'bg-red-50', gradient: 'from-red-500 to-red-500' },
  { id: 'perdido', title: 'Perdido', color: 'bg-gray-500', bgColor: 'bg-gray-50', gradient: 'from-gray-600 to-gray-700' },
];

const formatCurrencyShort = (value?: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0);

const formatLastInteraction = (value?: Date | string) => {
  if (!value) return 'Sem interacao';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem interacao';
  return date.toLocaleDateString('pt-BR');
};
// Lead Card Component
interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
  canMoveBack?: boolean;
  canMoveForward?: boolean;
  onMoveBack?: () => void;
  onMoveForward?: () => void;
}

const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  isDragging,
  canMoveBack,
  canMoveForward,
  onMoveBack,
  onMoveForward
}) => {
  const stopDrag = (event: React.PointerEvent | React.MouseEvent) => {
    event.stopPropagation();
  };

  const handleWhatsApp = (event: React.MouseEvent) => {
    stopDrag(event);
    const opened = openWhatsApp(
      lead.phone,
      `Olá, ${lead.name}! Aqui é da Marquinhos. Estou entrando em contato sobre: ${lead.service}.`
    );
    if (!opened) toast.error('Telefone inválido para WhatsApp');
  };

  const handleMap = (event: React.MouseEvent) => {
    stopDrag(event);
    const opened = openMap(`${lead.address} ${lead.neighborhood} ${lead.city} ${lead.state}`);
    if (!opened) toast.error('Endereço inválido para abrir no Maps');
  };

  return (
    <div className={cn(
      'bg-white rounded-lg border border-gray-200 p-3 shadow-sm',
      'cursor-grab active:cursor-grabbing transition-all duration-200',
      'hover:border-red-200 hover:shadow-md',
      isDragging && 'opacity-60 shadow-2xl rotate-2 scale-105 border-red-400'
    )}>
      <div className="flex items-start gap-2">
        <GripVertical size={14} className="text-gray-300 mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Avatar name={lead.name} size="sm" />
            <span className="font-semibold text-sm text-gray-900 truncate">{lead.name}</span>
          </div>
          <p className="text-xs text-gray-500 truncate mb-2">{lead.service}</p>
          <div className="mb-2 grid grid-cols-2 gap-1 text-[11px] text-gray-500">
            <span className="truncate">{lead.city || 'Cidade'}</span>
            <span className="text-right font-semibold text-gray-700">{formatCurrencyShort(lead.potentialValue)}</span>
            <span className="truncate capitalize">{lead.origin}</span>
            <span className="text-right">{formatLastInteraction(lead.lastInteractionAt || lead.updatedAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Phone size={10} />
              {lead.phone.slice(0, 10)}...
            </span>
            <UrgencyBadge urgency={lead.urgency} />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            <button
              type="button"
              className="h-8 rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-500"
              disabled={!canMoveBack}
              title="Voltar etapa"
              onPointerDown={stopDrag}
              onClick={(event) => {
                stopDrag(event);
                onMoveBack?.();
              }}
            >
              <ChevronLeft size={15} className="mx-auto" />
            </button>
            <button
              type="button"
              className="h-8 rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              title="Enviar WhatsApp"
              onPointerDown={stopDrag}
              onClick={handleWhatsApp}
            >
              <MessageCircle size={15} className="mx-auto" />
            </button>
            <button
              type="button"
              className="h-8 rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              title="Abrir no Maps"
              onPointerDown={stopDrag}
              onClick={handleMap}
            >
              <MapPin size={15} className="mx-auto" />
            </button>
            <button
              type="button"
              className="h-8 rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-500"
              disabled={!canMoveForward}
              title="Avançar etapa"
              onPointerDown={stopDrag}
              onClick={(event) => {
                stopDrag(event);
                onMoveForward?.();
              }}
            >
              <ChevronRight size={15} className="mx-auto" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sortable Lead Card
interface SortableLeadCardProps {
  lead: Lead;
  canMoveBack: boolean;
  canMoveForward: boolean;
  onMoveBack: () => void;
  onMoveForward: () => void;
}

const SortableLeadCard: React.FC<SortableLeadCardProps> = ({
  lead,
  canMoveBack,
  canMoveForward,
  onMoveBack,
  onMoveForward
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard
        lead={lead}
        isDragging={isDragging}
        canMoveBack={canMoveBack}
        canMoveForward={canMoveForward}
        onMoveBack={onMoveBack}
        onMoveForward={onMoveForward}
      />
    </div>
  );
};

// Column Component
interface FunnelColumnProps {
  column: Column;
  leads: Lead[];
  onMoveLead: (leadId: string, status: LeadStatus) => void;
}

const FunnelColumn: React.FC<FunnelColumnProps> = ({ column, leads, onMoveLead }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const columnIndex = columns.findIndex(col => col.id === column.id);

  const getPreviousStatus = (lead: Lead) => {
    const currentIndex = columns.findIndex(col => col.id === lead.status);
    return currentIndex > 0 ? columns[currentIndex - 1].id : null;
  };

  const getNextStatus = (lead: Lead) => {
    const currentIndex = columns.findIndex(col => col.id === lead.status);
    return currentIndex >= 0 && currentIndex < columns.length - 1 ? columns[currentIndex + 1].id : null;
  };

  return (
    <div className="flex-shrink-0 w-72">
      {/* Column Header */}
      <div className={cn(
        'rounded-t-lg p-3 bg-gradient-to-r text-white shadow-sm',
        column.gradient
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/50" />
            <h3 className="font-bold text-sm">{column.title}</h3>
          </div>
          <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
            {leads.length}
          </span>
        </div>
      </div>
      
      {/* Column Body */}
      <div className={cn(
        'min-h-[calc(100vh-380px)] rounded-b-lg border border-t-0 p-2 space-y-2',
        'bg-gradient-to-b from-white to-gray-50/50',
        column.bgColor.replace('bg-', 'border-').replace('-50', '-100'),
        isOver && 'ring-2 ring-red-500 ring-offset-2 bg-red-50'
      )}>
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          <div ref={setNodeRef} className="min-h-[calc(100vh-420px)] space-y-2">
          {leads.map((lead, index) => (
            <div 
              key={lead.id}
              className="animate-scaleIn"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <SortableLeadCard
                lead={lead}
                canMoveBack={columnIndex > 0}
                canMoveForward={columnIndex < columns.length - 1}
                onMoveBack={() => {
                  const previousStatus = getPreviousStatus(lead);
                  if (previousStatus) onMoveLead(lead.id, previousStatus);
                }}
                onMoveForward={() => {
                  const nextStatus = getNextStatus(lead);
                  if (nextStatus) onMoveLead(lead.id, nextStatus);
                }}
              />
            </div>
          ))}
        
          {leads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center mb-2', column.bgColor)}>
                <MapPin size={18} className={column.color.replace('bg-', 'text-')} />
              </div>
              <p className="text-xs">Arraste leads aqui</p>
            </div>
          )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export const Funil: React.FC = () => {
  const { leads, updateLeadStatus } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleMoveLead = (leadId: string, status: LeadStatus) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.status === status) return;

    const targetColumn = columns.find(col => col.id === status);
    updateLeadStatus(leadId, status);
    toast.success(`${lead.name} movido para ${targetColumn?.title || status}`);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dropped over a column
    const targetColumn = columns.find(col => col.id === overId);
    if (targetColumn) {
      handleMoveLead(activeId, targetColumn.id);
    } else {
      // Dropped over another lead - find which column
      const targetLead = leads.find(l => l.id === overId);
      if (targetLead) {
        handleMoveLead(activeId, targetLead.status);
      }
    }

    setActiveId(null);
  };

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  // Stats
  const totalLeads = leads.length;
  const closedLeads = leads.filter(l => ['fechado', 'producao', 'instalacao', 'pos_venda', 'finalizado'].includes(l.status)).length;
  const conversionRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : '0';
  const negotiationLeads = leads.filter(l => l.status === 'negociacao').length;

  return (
    <div className="space-y-5">
      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { 
            title: 'Total de Leads', 
            value: totalLeads, 
            icon: Users, 
            gradient: 'from-red-500 to-red-500',
            bg: 'bg-red-50'
          },
          { 
            title: 'Fechados', 
            value: closedLeads, 
            icon: Target, 
            gradient: 'from-red-500 to-red-500',
            bg: 'bg-red-50'
          },
          { 
            title: 'Conversão', 
            value: `${conversionRate}%`, 
            icon: TrendingUp, 
            gradient: 'from-red-500 to-red-500',
            bg: 'bg-red-50'
          },
          { 
            title: 'Em Negociação', 
            value: negotiationLeads, 
            icon: Zap, 
            gradient: 'from-red-500 to-red-500',
            bg: 'bg-red-50'
          },
        ].map((stat, index) => (
          <Card 
            key={stat.title} 
            padding="sm" 
            className="animate-slideInUp"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className={cn('p-2.5 rounded-lg bg-gradient-to-br text-white', stat.gradient)}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 font-medium">{stat.title}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 min-w-max">
            {columns.map((column, index) => (
              <div 
                key={column.id}
                className="animate-slideInUp"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <FunnelColumn
                  column={column}
                  leads={leads.filter(l => l.status === column.id)}
                  onMoveLead={handleMoveLead}
                />
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeLead && <LeadCard lead={activeLead} isDragging />}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 items-center justify-center pt-4 border-t border-gray-100">
        <Button size="sm" variant="outline" onClick={() => window.scrollTo({ left: 0, top: 0, behavior: 'smooth' })}>
          Voltar ao topo
        </Button>
        {columns.slice(0, 5).map((col) => (
          <div key={col.id} className="flex items-center gap-2 text-sm text-gray-600">
            <div className={cn('w-3 h-3 rounded-full', col.color)} />
            <span>{col.title}</span>
          </div>
        ))}
        <span className="text-gray-300">•••</span>
      </div>
    </div>
  );
};
