import React from 'react';
import { 
  Users, 
  Calendar, 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  Factory,
  Clock,
  AlertCircle,
  ArrowRight,
  MessageSquare,
  MapPin,
  Zap,
  Target,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { useStore } from '../store/useStore';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../utils/cn';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  gradient: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  gradient,
  delay = 0
}) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div 
      className={cn(
        'relative overflow-hidden rounded-lg p-4 text-white animate-slideInUp',
        gradient
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
            {icon}
          </div>
          {change !== undefined && (
            <div className={cn(
              'flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm',
              isPositive && 'bg-red-400/30 text-red-100',
              isNegative && 'bg-red-400/30 text-red-100',
              !isPositive && !isNegative && 'bg-white/20 text-white/80'
            )}>
              {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
              {isNegative && <TrendingUp className="w-3.5 h-3.5 rotate-180" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <h3 className="text-3xl font-bold mb-1">{value}</h3>
        <p className="text-sm text-white/80 font-medium">{title}</p>
        {changeLabel && (
          <p className="text-white/60 text-sm mt-1">{changeLabel}</p>
        )}
      </div>
    </div>
  );
};

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { leads, visits, budgets, productions, currentUser } = useStore();

  // Calculate stats
  const newLeads = leads.filter(l => l.status === 'novo').length;
  const visitsToday = visits.filter(v => isToday(new Date(v.date))).length;
  const budgetsSent = budgets.filter(b => b.status === 'sent' || b.status === 'approved').length;
  const closedDeals = leads.filter(l => ['fechado', 'producao', 'instalacao', 'finalizado'].includes(l.status)).length;
  const productionCount = productions.filter(p => p.currentStage !== 'finalizado').length;
  const conversionRate = leads.length > 0 ? ((closedDeals / leads.length) * 100).toFixed(1) : '0';
  const totalRevenue = budgets.filter(b => b.status === 'approved').reduce((sum, b) => sum + b.total, 0);

  // Chart data
  const salesData = [
    { name: 'Jan', vendas: 12000, leads: 28 },
    { name: 'Fev', vendas: 19000, leads: 42 },
    { name: 'Mar', vendas: 15000, leads: 35 },
    { name: 'Abr', vendas: 22000, leads: 48 },
    { name: 'Mai', vendas: 28000, leads: 62 },
    { name: 'Jun', vendas: 32000, leads: 55 },
  ];

  const originData = [
    { name: 'WhatsApp', value: 45, color: '#DC2626' },
    { name: 'Instagram', value: 25, color: '#991B1B' },
    { name: 'Indicação', value: 20, color: '#18181B' },
    { name: 'Telefone', value: 10, color: '#71717A' },
  ];

  const weeklyData = [
    { day: 'Seg', visitas: 4, orcamentos: 3 },
    { day: 'Ter', visitas: 6, orcamentos: 4 },
    { day: 'Qua', visitas: 5, orcamentos: 5 },
    { day: 'Qui', visitas: 8, orcamentos: 6 },
    { day: 'Sex', visitas: 7, orcamentos: 4 },
    { day: 'Sáb', visitas: 3, orcamentos: 2 },
  ];

  const todayVisits = visits.filter(v => isToday(new Date(v.date)));
  const recentLeads = leads.slice(0, 5);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-black via-zinc-950 to-red-900 p-5 md:p-5 text-white animate-fadeIn">
        <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/20 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-red-200 mb-1">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
            <h1 className="text-2xl font-bold mb-2">
              Olá, {currentUser?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-red-100/80 max-w-lg">
              Você tem <span className="font-semibold text-white">{visitsToday} visitas</span> agendadas para hoje e{' '}
              <span className="font-semibold text-white">{newLeads} novos leads</span> aguardando atendimento.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => onNavigate?.('agenda')} className="border-white/30 text-white hover:bg-white/10">
              <Calendar className="w-4 h-4" />
              Ver Agenda
            </Button>
            <Button onClick={() => onNavigate?.('central-ia')} className="bg-white text-red-900 hover:bg-red-50 shadow-xl">
              <Zap className="w-4 h-4" />
              Central IA
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3.5">
        <StatCard
          title="Novos Leads"
          value={newLeads}
          change={12}
          changeLabel="vs semana passada"
          icon={<Users size={24} />}
          gradient="bg-gradient-to-br from-zinc-950 to-red-700"
          delay={0}
        />
        <StatCard
          title="Visitas Hoje"
          value={visitsToday}
          icon={<Calendar size={24} />}
          gradient="bg-gradient-to-br from-red-950 to-red-600"
          delay={50}
        />
        <StatCard
          title="Orçamentos"
          value={budgetsSent}
          change={8}
          icon={<FileText size={24} />}
          gradient="bg-gradient-to-br from-zinc-900 to-red-700"
          delay={100}
        />
        <StatCard
          title="Fechamentos"
          value={closedDeals}
          change={15}
          icon={<CheckCircle size={24} />}
          gradient="bg-gradient-to-br from-red-800 to-zinc-950"
          delay={150}
        />
        <StatCard
          title="Conversão"
          value={`${conversionRate}%`}
          change={5}
          icon={<Target size={24} />}
          gradient="bg-gradient-to-br from-zinc-950 to-red-600"
          delay={200}
        />
        <StatCard
          title="Em Produção"
          value={productionCount}
          icon={<Factory size={24} />}
          gradient="bg-gradient-to-br from-red-700 to-black"
          delay={250}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sales Chart */}
        <Card className="lg:col-span-2 animate-fadeIn" style={{ animationDelay: '100ms' }}>
          <CardHeader 
            title="Performance de Vendas" 
            subtitle="Últimos 6 meses"
            icon={<TrendingUp size={20} />}
            iconBg="bg-gradient-to-br from-red-500 to-red-600"
            action={
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-gray-600">Vendas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-gray-600">Leads</span>
                </div>
              </div>
            }
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.28}/>
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#18181B" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#18181B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value, name) => [
                    name === 'vendas' ? formatCurrency(Number(value)) : value,
                    name === 'vendas' ? 'Vendas' : 'Leads'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="#DC2626" 
                  strokeWidth={3}
                  fill="url(#colorVendas)"
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#18181B" 
                  strokeWidth={3}
                  fill="url(#colorLeads)"
                  yAxisId={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Origin Chart */}
        <Card className="animate-fadeIn" style={{ animationDelay: '150ms' }}>
          <CardHeader 
            title="Origem dos Leads" 
            subtitle="Distribuição por canal"
            icon={<MessageSquare size={20} />}
            iconBg="bg-gradient-to-br from-red-500 to-red-600"
          />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={originData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {originData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => [`${value}%`, 'Porcentagem']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {originData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600 truncate">{item.name}</span>
                <span className="text-sm font-bold text-gray-900 ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Activity */}
        <Card className="animate-fadeIn" style={{ animationDelay: '200ms' }}>
          <CardHeader 
            title="Atividade Semanal" 
            icon={<BarChart3 size={20} />}
            iconBg="bg-gradient-to-br from-red-500 to-red-600"
          />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="visitas" fill="#DC2626" radius={[6, 6, 0, 0]} name="Visitas" />
                <Bar dataKey="orcamentos" fill="#18181B" radius={[6, 6, 0, 0]} name="Orçamentos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Today's Schedule */}
        <Card className="animate-fadeIn" style={{ animationDelay: '250ms' }}>
          <CardHeader 
            title="Agenda de Hoje" 
            subtitle={format(new Date(), "EEEE", { locale: ptBR })}
            icon={<Calendar size={20} />}
            iconBg="bg-gradient-to-br from-red-500 to-red-600"
            action={
              <Badge variant="info" className="animate-pulse-soft">{todayVisits.length} visitas</Badge>
            }
          />
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {todayVisits.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar size={28} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Nenhuma visita hoje</p>
                <p className="text-gray-400 text-sm">Aproveite para organizar a semana</p>
              </div>
            ) : (
              todayVisits.map((visit, index) => (
                <div 
                  key={visit.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-100',
                    'hover:border-red-200 hover:shadow-md transition-all cursor-pointer',
                    'animate-slideInLeft'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col items-center justify-center w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-lg text-white">
                    <span className="text-lg font-bold">{visit.time.split(':')[0]}</span>
                    <span className="text-xs opacity-80">{visit.time.split(':')[1]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{visit.leadName}</p>
                    <p className="text-sm text-gray-500 truncate">{visit.service}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <MapPin size={10} />
                      <span className="truncate">{visit.address.split('-')[0]}</span>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-gray-300" />
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Leads */}
        <Card className="animate-fadeIn" style={{ animationDelay: '300ms' }}>
          <CardHeader 
            title="Leads Recentes" 
            icon={<Users size={20} />}
            iconBg="bg-gradient-to-br from-red-500 to-red-600"
            action={
              <Button variant="ghost" size="xs" onClick={() => onNavigate?.('crm')}>
                Ver todos <ArrowRight size={14} />
              </Button>
            }
          />
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {recentLeads.map((lead, index) => (
              <div 
                key={lead.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-100',
                  'hover:border-red-200 hover:shadow-md transition-all cursor-pointer',
                  'animate-slideInRight'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Avatar name={lead.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{lead.name}</p>
                  <p className="text-sm text-gray-500 truncate">{lead.service}</p>
                </div>
                <StatusBadge status={lead.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Alerts Section */}
      <Card className="animate-fadeIn" style={{ animationDelay: '350ms' }}>
        <CardHeader 
          title="Alertas e Pendências" 
          icon={<AlertCircle size={20} />}
          iconBg="bg-gradient-to-br from-red-500 to-red-600"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            {
              title: 'Aguardando Resposta',
              value: leads.filter(l => l.status === 'aguardando_info').length,
              subtitle: 'leads sem resposta',
              icon: Clock,
              gradient: 'from-red-50 to-red-50',
              border: 'border-red-200',
              iconColor: 'text-red-600',
              textColor: 'text-red-900'
            },
            {
              title: 'Orçamentos Pendentes',
              value: leads.filter(l => l.status === 'visita_realizada').length,
              subtitle: 'aguardando orçamento',
              icon: FileText,
              gradient: 'from-red-50 to-red-50',
              border: 'border-red-200',
              iconColor: 'text-red-600',
              textColor: 'text-red-900'
            },
            {
              title: 'Em Negociação',
              value: leads.filter(l => l.status === 'negociacao').length,
              subtitle: 'aguardando fechamento',
              icon: DollarSign,
              gradient: 'from-red-50 to-zinc-50',
              border: 'border-red-200',
              iconColor: 'text-red-600',
              textColor: 'text-red-900'
            },
            {
              title: 'Pronto p/ Instalar',
              value: productions.filter(p => p.currentStage === 'finalizado').length,
              subtitle: 'pedidos finalizados',
              icon: CheckCircle,
              gradient: 'from-red-50 to-red-50',
              border: 'border-red-200',
              iconColor: 'text-red-600',
              textColor: 'text-red-900'
            },
          ].map((alert, index) => (
            <div 
              key={alert.title}
              className={cn(
                'p-4 rounded-lg bg-gradient-to-br border transition-all hover:shadow-md cursor-pointer',
                alert.gradient,
                alert.border,
                'animate-scaleIn'
              )}
              style={{ animationDelay: `${400 + index * 50}ms` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <alert.icon size={18} className={alert.iconColor} />
                <span className={cn('font-semibold text-sm', alert.textColor)}>{alert.title}</span>
              </div>
              <p className={cn('text-3xl font-bold mb-1', alert.textColor)}>{alert.value}</p>
              <p className="text-sm text-gray-500">{alert.subtitle}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Revenue Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="bg-gradient-to-br from-zinc-950 to-red-700 text-white animate-fadeIn" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 mb-1">Faturamento Aprovado</p>
              <h3 className="text-4xl font-bold">{formatCurrency(totalRevenue)}</h3>
              <p className="text-red-100 mt-2 flex items-center gap-2">
                <TrendingUp size={16} />
                <span>+23% vs mês anterior</span>
              </p>
            </div>
            <div className="p-4 bg-white/20 rounded-lg backdrop-blur-sm">
              <DollarSign size={40} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-black to-red-950 text-white animate-fadeIn" style={{ animationDelay: '450ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 mb-1">Inteligência Artificial</p>
              <h3 className="text-2xl font-bold mb-2">Central IA Ativa</h3>
              <p className="text-red-100/75 text-sm">
                47 mensagens analisadas • 12 leads criados hoje
              </p>
              <Button size="sm" onClick={() => onNavigate?.('central-ia')} className="mt-3 bg-white/10 hover:bg-white/20 border border-white/20">
                Abrir Central IA
              </Button>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-lg animate-glow">
              <Zap size={40} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
