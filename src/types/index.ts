// User types
export type UserRole = 'admin' | 'gerente' | 'vendedor' | 'secretaria' | 'producao' | 'instalador';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  active: boolean;
  createdAt: Date;
}

// Lead/Client types
export type LeadStatus = 
  | 'novo'
  | 'primeiro_atendimento'
  | 'qualificado'
  | 'aguardando_medidas'
  | 'aguardando_info'
  | 'visita_agendada'
  | 'visita_realizada'
  | 'orcamento_enviado'
  | 'negociacao'
  | 'fechado'
  | 'producao'
  | 'instalacao'
  | 'pos_venda'
  | 'finalizado'
  | 'perdido';

export type LeadOrigin = 'whatsapp' | 'instagram' | 'telefone' | 'indicacao' | 'site' | 'outro';
export type UrgencyLevel = 'baixa' | 'media' | 'alta' | 'urgente';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode?: string;
  origin: LeadOrigin;
  service: string;
  status: LeadStatus;
  urgency: UrgencyLevel;
  availability?: string;
  observations?: string;
  aiSummary?: string;
  assignedTo?: string;
  potentialValue?: number;
  lastInteractionAt?: Date;
  attachments: Attachment[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: string;
  type: 'image' | 'audio' | 'document' | 'video';
  url: string;
  name: string;
  uploadedAt: Date;
}

export interface Message {
  id: string;
  content: string;
  sender: 'client' | 'system' | 'ai' | 'user';
  timestamp: Date;
  type: 'text' | 'audio' | 'image';
}

export type SubscriptionStatus = 'trial' | 'active' | 'overdue' | 'blocked' | 'canceled';
export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';

export interface Subscription {
  customerName: string;
  customerDocument: string;
  customerEmail: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  amount: number;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  maxUsers: number;
  dueDay: number;
  nextDueDate: Date;
  lastPaymentAt?: Date;
  paymentMethod: 'pix' | 'boleto' | 'credit_card' | 'manual';
  invoiceUrl?: string;
  notes?: string;
  updatedAt: Date;
}

// Visit types
export interface Visit {
  id: string;
  leadId: string;
  leadName: string;
  phone: string;
  address: string;
  service: string;
  date: Date;
  time: string;
  observations?: string;
  assignedTo: string;
  status: 'agendada' | 'realizada' | 'cancelada' | 'reagendada';
  photos?: string[];
  notes?: string;
  createdAt: Date;
}

export interface MeasurementLine {
  id: string;
  location: string;
  width: string;
  height: string;
  depth: string;
  quantity: number;
  notes: string;
}

export interface MeasurementSheet {
  id: string;
  visitId: string;
  leadId: string;
  leadName: string;
  service: string;
  lines: MeasurementLine[];
  generalNotes: string;
  createdAt: Date;
  updatedAt: Date;
}

// Budget/Quote types
export interface BudgetItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface Budget {
  id: string;
  leadId: string;
  leadName: string;
  items: BudgetItem[];
  laborCost: number;
  travelCost: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  subtotal: number;
  total: number;
  validity: number; // days
  paymentConditions: string;
  observations?: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Production types
export type ProductionStage = 'corte' | 'montagem' | 'vidro' | 'pintura' | 'embalagem' | 'finalizado';

export interface Production {
  id: string;
  budgetId: string;
  leadId: string;
  leadName: string;
  items: string[];
  currentStage: ProductionStage;
  progress: number;
  startDate: Date;
  estimatedEnd: Date;
  assignedTeam: string[];
  notes?: string;
  history: ProductionHistory[];
  createdAt: Date;
}

export interface ProductionHistory {
  stage: ProductionStage;
  completedAt: Date;
  completedBy: string;
  notes?: string;
}

// Installation types
export interface Installation {
  id: string;
  productionId: string;
  leadId: string;
  leadName: string;
  address: string;
  date: Date;
  time: string;
  team: string[];
  items: string[];
  checklist: ChecklistItem[];
  photosBefore: string[];
  photosAfter: string[];
  signature?: string;
  status: 'agendada' | 'em_andamento' | 'concluida' | 'problema';
  notes?: string;
  createdAt: Date;
}

export interface ChecklistItem {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: Date;
}

// Knowledge Base types
export interface KnowledgeItem {
  id: string;
  category: 'linhas' | 'vidros' | 'calhas' | 'ferragens' | 'outros';
  name: string;
  description: string;
  specifications?: string;
  priceRange?: string;
  images?: string[];
  tags: string[];
  active: boolean;
  createdAt: Date;
}

// Dashboard stats
export interface DashboardStats {
  newLeads: number;
  visitsToday: number;
  budgetsSent: number;
  closedDeals: number;
  conversionRate: number;
  productionInProgress: number;
  revenue: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}

// AI Analysis result
export interface AIAnalysisResult {
  name?: string;
  phone?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  service?: string;
  availability?: string;
  urgency: UrgencyLevel;
  summary: string;
  suggestedActions: string[];
  confidence: number;
}
