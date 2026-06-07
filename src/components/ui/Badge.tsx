import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'red';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  dot = false,
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700 ring-gray-200/50',
    success: 'bg-red-50 text-red-700 ring-red-200/50',
    warning: 'bg-red-50 text-red-700 ring-red-200/50',
    danger: 'bg-red-50 text-red-700 ring-red-200/50',
    info: 'bg-red-50 text-red-700 ring-red-200/50',
    red: 'bg-red-50 text-red-700 ring-red-200/50',
  };

  const dotColors = {
    default: 'bg-gray-500',
    success: 'bg-red-500',
    warning: 'bg-red-500',
    danger: 'bg-red-500',
    info: 'bg-red-500',
    red: 'bg-red-500',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 font-semibold rounded-full ring-1',
      variants[variant],
      sizes[size],
      className
    )}>
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  );
};

// Status specific badge
interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; variant: BadgeProps['variant']; dot?: boolean }> = {
  novo: { label: 'Novo Lead', variant: 'info', dot: true },
  primeiro_atendimento: { label: 'Primeiro Atendimento', variant: 'info', dot: true },
  qualificado: { label: 'Qualificado', variant: 'success', dot: true },
  aguardando_medidas: { label: 'Aguardando Medidas', variant: 'warning', dot: true },
  aguardando_info: { label: 'Aguardando', variant: 'warning', dot: true },
  visita_agendada: { label: 'Visita Agendada', variant: 'red', dot: true },
  visita_realizada: { label: 'Visita OK', variant: 'info' },
  orcamento_enviado: { label: 'Em Orcamento', variant: 'red' },
  negociacao: { label: 'Negociacao', variant: 'warning', dot: true },
  fechado: { label: 'Fechado', variant: 'success' },
  producao: { label: 'Producao', variant: 'warning' },
  instalacao: { label: 'Instalacao', variant: 'info' },
  pos_venda: { label: 'Pos-venda', variant: 'info' },
  finalizado: { label: 'Finalizado', variant: 'success' },
  perdido: { label: 'Perdido', variant: 'default' },
};
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] || { label: status, variant: 'default' };
  return (
    <Badge variant={config.variant} dot={config.dot} size="sm">
      {config.label}
    </Badge>
  );
};

// Urgency badge
interface UrgencyBadgeProps {
  urgency: 'baixa' | 'media' | 'alta' | 'urgente';
}

const urgencyConfig: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  baixa: { label: 'Baixa', variant: 'default' },
  media: { label: 'Média', variant: 'info' },
  alta: { label: 'Alta', variant: 'warning' },
  urgente: { label: 'Urgente', variant: 'danger' },
};

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ urgency }) => {
  const config = urgencyConfig[urgency];
  return (
    <Badge variant={config.variant} size="sm">
      {config.label}
    </Badge>
  );
};
