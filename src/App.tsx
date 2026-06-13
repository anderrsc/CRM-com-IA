import React, { useEffect, useRef, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useStore } from './store/useStore';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CentralIA } from './pages/CentralIA';
import { CRM } from './pages/CRM';
import { Funil } from './pages/Funil';
import { Agenda } from './pages/Agenda';
import { Visitas } from './pages/Visitas';
import { Orcamentos } from './pages/Orcamentos';
import { TabelaCalhas } from './pages/TabelaCalhas';
import { Compras } from './pages/Compras';
import { Producao } from './pages/Producao';
import { Instalacao } from './pages/Instalacao';
import { Conhecimento } from './pages/Conhecimento';
import { ModeloOrcamento } from './pages/ModeloOrcamento';
import { cn } from './utils/cn';
import { copyText, downloadTextFile, formatCurrency } from './utils/actions';
import { api, ApiStatus } from './services/api';
import { UserRole } from './types';
import { Badge } from './components/ui/Badge';
import { Button } from './components/ui/Button';
import { Input, Select, TextArea } from './components/ui/Input';
import { 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  Shield, 
  Zap as ZapIcon,
  MessageSquare,
  Calendar,
  Map,
  Printer,
  Bot,
  CreditCard,
  DollarSign,
  Lock,
  Unlock,
  ReceiptText,
  Copy,
  Download,
  AlertTriangle,
  CheckCircle2,
  Users,
  UserPlus,
  Trash2
} from 'lucide-react';

const pageConfig: Record<string, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão geral do sistema' },
  'central-ia': { title: 'Central IA', subtitle: 'Inteligência Artificial' },
  crm: { title: 'CRM', subtitle: 'Gestão de Clientes' },
  funil: { title: 'Funil de Vendas', subtitle: 'Acompanhe o pipeline' },
  agenda: { title: 'Agenda', subtitle: 'Visitas e compromissos' },
  visitas: { title: 'Fichas de Visita', subtitle: 'Gerar e imprimir fichas' },
  orcamentos: { title: 'Orçamentos', subtitle: 'Crie e envie orçamentos' },
  'orcamentos-calhas': { title: 'Orçamentos · Calhas', subtitle: 'Orçamentos de calhas e rufos' },
  'orcamentos-esquadrias': { title: 'Orçamentos · Esquadrias', subtitle: 'Orçamentos de janelas e portas' },
  'tabela-calhas': { title: 'Tabela de Preços · Calhas', subtitle: 'Gerencie os valores por largura e espessura' },
  compras: { title: 'Compras', subtitle: 'Materiais, fornecedores e recebimentos' },
  producao: { title: 'Produção', subtitle: 'Acompanhe a produção' },
  instalacao: { title: 'Instalação', subtitle: 'Gerenciar instalações' },
  conhecimento: { title: 'Base de Conhecimento', subtitle: 'Produtos e serviços' },
  settings: { title: 'Configurações', subtitle: 'Configurar sistema' },
};

const App: React.FC = () => {
  const { isAuthenticated, sidebarOpen, toggleSidebar, hydrateFromDatabase, databaseHydrated } = useStore();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const checkedInitialViewport = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !databaseHydrated) {
      hydrateFromDatabase();
    }
  }, [isAuthenticated, databaseHydrated, hydrateFromDatabase]);

  useEffect(() => {
    if (!isAuthenticated || checkedInitialViewport.current) return;

    checkedInitialViewport.current = true;
    if (window.innerWidth < 768 && sidebarOpen) {
      toggleSidebar();
    }
  }, [isAuthenticated, sidebarOpen, toggleSidebar]);

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'central-ia':
        return <CentralIA />;
      case 'crm':
        return <CRM />;
      case 'funil':
        return <Funil />;
      case 'agenda':
        return <Agenda />;
      case 'visitas':
        return <Visitas />;
      case 'orcamentos':
        return <Orcamentos type="calhas" />;
      case 'orcamentos-calhas':
        return <Orcamentos type="calhas" />;
      case 'orcamentos-esquadrias':
        return <Orcamentos type="esquadrias" />;
      case 'modelo-orcamento':
        return <ModeloOrcamento />;
      case 'tabela-calhas':
        return <TabelaCalhas />;
      case 'compras':
        return <Compras />;
      case 'producao':
        return <Producao />;
      case 'instalacao':
        return <Instalacao />;
      case 'conhecimento':
        return <Conhecimento />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-red-50/30">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      
      {/* Main Content */}
      <main
        className="app-shell-main transition-all duration-300 min-h-screen"
        style={{ '--sidebar-offset': sidebarOpen ? '18rem' : '5.5rem' } as React.CSSProperties}
      >
        <Header 
          title={pageConfig[currentPage]?.title || 'Dashboard'} 
          subtitle={pageConfig[currentPage]?.subtitle}
          onNavigate={setCurrentPage}
        />
        <div className="px-4 py-4 sm:px-5 lg:px-6 lg:py-5 max-w-[1480px] mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

// Settings Page Component
const SettingsPage: React.FC = () => {
  const { subscription, updateSubscription, users, addUser, updateUser, deleteUser, currentUser } = useStore();
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    login: '',
    password: '',
    role: 'vendedor' as UserRole,
    phone: '',
  });

  useEffect(() => {
    api.health().then(setApiStatus).catch(() => setApiStatus(null));
  }, []);

  const toInputDate = (value: Date | string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  };

  const addDays = (date: Date, days: number) => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  };

  const planLabels = {
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
  };

  const statusConfig = {
    trial: { label: 'Teste', variant: 'warning' as const },
    active: { label: 'Ativa', variant: 'success' as const },
    overdue: { label: 'Vencida', variant: 'danger' as const },
    blocked: { label: 'Bloqueada', variant: 'danger' as const },
    canceled: { label: 'Cancelada', variant: 'default' as const },
  };

  const cycleDays = {
    monthly: 30,
    quarterly: 90,
    annual: 365,
  };

  const nextDueDate = new Date(subscription.nextDueDate);
  const daysToDue = Math.ceil((nextDueDate.getTime() - Date.now()) / 86400000);
  const isBlocked = subscription.status === 'blocked' || subscription.status === 'canceled';
  const isOverdue = subscription.status === 'overdue' || daysToDue < 0;

  const buildChargeText = () => [
    'COBRANCA DE ASSINATURA - Marquinhos',
    '',
    `Cliente: ${subscription.customerName}`,
    `Documento: ${subscription.customerDocument}`,
    `Plano: ${planLabels[subscription.plan]}`,
    `Ciclo: ${subscription.billingCycle === 'monthly' ? 'Mensal' : subscription.billingCycle === 'quarterly' ? 'Trimestral' : 'Anual'}`,
    `Valor: ${formatCurrency(subscription.amount)}`,
    `Vencimento: ${nextDueDate.toLocaleDateString('pt-BR')}`,
    `Forma de pagamento: ${subscription.paymentMethod.toUpperCase()}`,
    subscription.invoiceUrl ? `Link de pagamento: ${subscription.invoiceUrl}` : '',
    '',
    'Se o pagamento ja foi realizado, por favor desconsidere esta mensagem.',
  ].filter(Boolean).join('\n');

  const handleRegisterPayment = () => {
    updateSubscription({
      status: 'active',
      lastPaymentAt: new Date(),
      nextDueDate: addDays(new Date(), cycleDays[subscription.billingCycle]),
    });
    toast.success('Pagamento registrado e assinatura liberada');
  };

  const handleCopyCharge = async () => {
    await copyText(buildChargeText());
    toast.success('Texto de cobranca copiado');
  };

  const handleDownloadCharge = () => {
    downloadTextFile(`cobranca-${subscription.customerName.toLowerCase().replace(/\s+/g, '-')}.txt`, buildChargeText());
    toast.success('Cobranca gerada em arquivo');
  };

  const handleCreateUser = () => {
    if (!newUser.name.trim() || !newUser.login.trim() || !newUser.password.trim()) {
      toast.error('Preencha nome, login e senha');
      return;
    }

    addUser({
      id: globalThis.crypto?.randomUUID?.() || `user-${Date.now()}`,
      name: newUser.name.trim(),
      email: newUser.login.trim().toLowerCase(),
      password: newUser.password,
      role: newUser.role,
      phone: newUser.phone.trim() || undefined,
      active: true,
      createdAt: new Date(),
    });
    setNewUser({ name: '', login: '', password: '', role: 'vendedor', phone: '' });
    toast.success('Usuario criado');
  };

  const integrationStatus = (enabled?: boolean) => ({
    status: enabled ? 'Conectado' : 'Pendente',
    statusColor: enabled ? 'bg-green-500' : 'bg-amber-500',
  });

  const integrations = [
    { name: 'Supabase', icon: Shield, ...integrationStatus(apiStatus?.supabaseConfigured) },
    { name: 'WhatsApp Business', icon: MessageSquare, ...integrationStatus(apiStatus?.whatsappConfigured) },
    { name: 'OpenAI', icon: Bot, ...integrationStatus(apiStatus?.openAiConfigured) },
    { name: 'Instagram', icon: Globe, status: 'Nao configurado', statusColor: 'bg-gray-400' },
    { name: 'Google Agenda', icon: Calendar, status: 'Nao configurado', statusColor: 'bg-gray-400' },
    { name: 'Google Maps', icon: Map, status: 'Nao configurado', statusColor: 'bg-gray-400' },
    { name: 'Impressora de Rede', icon: Printer, status: 'Local', statusColor: 'bg-gray-400' },
  ];

  return (
    <div className="space-y-5 animate-fadeIn max-w-4xl">
      {/* Company Info */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 rounded-lg text-white">
            <Building2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Informações da Empresa</h3>
            <p className="text-gray-500">Dados cadastrais do sistema</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Nome', value: 'Marquinhos', icon: Building2 },
            { label: 'CNPJ', value: '00.000.000/0001-00', icon: Shield },
            { label: 'Telefone', value: '(44) 99999-0000', icon: Phone },
            { label: 'E-mail', value: 'contato@marquinhos.com', icon: Mail },
          ].map((item) => (
            <div key={item.label} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <item.icon size={16} />
                <span className="text-sm">{item.label}</span>
              </div>
              <p className="font-semibold text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {currentUser?.role === 'admin' && (
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 rounded-lg text-white">
              <Users size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Usuarios do Sistema</h3>
              <p className="text-gray-500">Crie logins, senhas e permissoes da equipe</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome"
              value={newUser.name}
              onChange={(event) => setNewUser((user) => ({ ...user, name: event.target.value }))}
            />
            <Input
              label="Login"
              value={newUser.login}
              onChange={(event) => setNewUser((user) => ({ ...user, login: event.target.value }))}
            />
            <Input
              label="Senha"
              type="password"
              value={newUser.password}
              onChange={(event) => setNewUser((user) => ({ ...user, password: event.target.value }))}
            />
            <Select
              label="Perfil"
              value={newUser.role}
              onChange={(event) => setNewUser((user) => ({ ...user, role: event.target.value as UserRole }))}
              options={[
                { value: 'gerente', label: 'Gerente' },
                { value: 'vendedor', label: 'Vendedor' },
                { value: 'secretaria', label: 'Secretaria' },
                { value: 'compras', label: 'Compras' },
                { value: 'producao', label: 'Producao' },
                { value: 'instalador', label: 'Instalador' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
              <Input
                label="Telefone"
                value={newUser.phone}
                onChange={(event) => setNewUser((user) => ({ ...user, phone: event.target.value }))}
              />
              <div className="flex items-end">
                <Button fullWidth onClick={handleCreateUser} icon={<UserPlus size={18} />}>
                  Criar usuario
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {users.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
                Nenhum usuario carregado do banco ainda.
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email} - {user.role}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={user.active ? 'outline' : 'secondary'}
                      onClick={() => updateUser(user.id, { active: !user.active })}
                    >
                      {user.active ? 'Desativar' : 'Ativar'}
                    </Button>
                    {user.id !== currentUser.id && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          deleteUser(user.id);
                          toast.success('Usuario removido');
                        }}
                      >
                        <Trash2 size={16} />
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Subscription Control */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-black to-red-700 rounded-lg text-white">
              <CreditCard size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Painel de Assinatura</h3>
              <p className="text-gray-500">Controle cobrança, acesso e vencimento do cliente</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={statusConfig[subscription.status].variant} dot>
              {statusConfig[subscription.status].label}
            </Badge>
            <Badge variant={isOverdue ? 'danger' : 'info'}>
              {isOverdue ? `${Math.abs(daysToDue)} dias em atraso` : `${daysToDue} dias para vencer`}
            </Badge>
          </div>
        </div>

        <div className={cn(
          'mb-5 grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-4',
          isBlocked ? 'border-red-300 bg-red-50' : isOverdue ? 'border-red-200 bg-red-50/70' : 'border-gray-200 bg-gray-50'
        )}>
          {[
            { label: 'Plano', value: planLabels[subscription.plan], icon: ReceiptText },
            { label: 'Mensalidade', value: formatCurrency(subscription.amount), icon: DollarSign },
            { label: 'Vencimento', value: nextDueDate.toLocaleDateString('pt-BR'), icon: AlertTriangle },
            { label: 'Usuarios', value: `${users.filter(user => user.active).length}/${subscription.maxUsers}`, icon: Users },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-lg bg-white p-3 border border-gray-200">
              <div className="p-2 rounded-lg bg-red-50 text-red-700">
                <item.icon size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="font-bold text-gray-900">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Cliente"
              value={subscription.customerName}
              onChange={(event) => updateSubscription({ customerName: event.target.value })}
            />
            <Input
              label="Documento"
              value={subscription.customerDocument}
              onChange={(event) => updateSubscription({ customerDocument: event.target.value })}
            />
            <Input
              label="E-mail financeiro"
              type="email"
              value={subscription.customerEmail}
              onChange={(event) => updateSubscription({ customerEmail: event.target.value })}
            />
            <Select
              label="Status"
              value={subscription.status}
              onChange={(event) => updateSubscription({ status: event.target.value as typeof subscription.status })}
              options={[
                { value: 'trial', label: 'Teste' },
                { value: 'active', label: 'Ativa' },
                { value: 'overdue', label: 'Vencida' },
                { value: 'blocked', label: 'Bloqueada' },
                { value: 'canceled', label: 'Cancelada' },
              ]}
            />
            <Select
              label="Plano"
              value={subscription.plan}
              onChange={(event) => updateSubscription({ plan: event.target.value as typeof subscription.plan })}
              options={[
                { value: 'starter', label: 'Starter' },
                { value: 'professional', label: 'Professional' },
                { value: 'enterprise', label: 'Enterprise' },
              ]}
            />
            <Select
              label="Ciclo"
              value={subscription.billingCycle}
              onChange={(event) => updateSubscription({ billingCycle: event.target.value as typeof subscription.billingCycle })}
              options={[
                { value: 'monthly', label: 'Mensal' },
                { value: 'quarterly', label: 'Trimestral' },
                { value: 'annual', label: 'Anual' },
              ]}
            />
            <Input
              label="Valor"
              type="number"
              min="0"
              step="1"
              value={subscription.amount}
              onChange={(event) => updateSubscription({ amount: Number(event.target.value) })}
            />
            <Input
              label="Limite de usuários"
              type="number"
              min="1"
              value={subscription.maxUsers}
              onChange={(event) => updateSubscription({ maxUsers: Number(event.target.value) })}
            />
            <Input
              label="Dia de vencimento"
              type="number"
              min="1"
              max="31"
              value={subscription.dueDay}
              onChange={(event) => updateSubscription({ dueDay: Number(event.target.value) })}
            />
            <Input
              label="Próximo vencimento"
              type="date"
              value={toInputDate(subscription.nextDueDate)}
              onChange={(event) => updateSubscription({ nextDueDate: new Date(`${event.target.value}T12:00:00`) })}
            />
            <Select
              label="Pagamento"
              value={subscription.paymentMethod}
              onChange={(event) => updateSubscription({ paymentMethod: event.target.value as typeof subscription.paymentMethod })}
              options={[
                { value: 'pix', label: 'PIX' },
                { value: 'boleto', label: 'Boleto' },
                { value: 'credit_card', label: 'Cartão' },
                { value: 'manual', label: 'Manual' },
              ]}
            />
            <Input
              label="Link de cobrança"
              value={subscription.invoiceUrl || ''}
              placeholder="https://..."
              onChange={(event) => updateSubscription({ invoiceUrl: event.target.value })}
            />
            <div className="sm:col-span-2">
              <TextArea
                label="Observações internas"
                rows={3}
                value={subscription.notes || ''}
                onChange={(event) => updateSubscription({ notes: event.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Button fullWidth variant="gradient" onClick={handleRegisterPayment}>
              <CheckCircle2 size={18} />
              Registrar pagamento
            </Button>
            <Button fullWidth variant={isBlocked ? 'success' : 'danger'} onClick={() => {
              updateSubscription({ status: isBlocked ? 'active' : 'blocked' });
              toast.success(isBlocked ? 'Assinatura liberada' : 'Assinatura bloqueada');
            }}>
              {isBlocked ? <Unlock size={18} /> : <Lock size={18} />}
              {isBlocked ? 'Liberar acesso' : 'Bloquear acesso'}
            </Button>
            <Button fullWidth variant="outline" onClick={() => updateSubscription({ status: 'overdue' })}>
              <AlertTriangle size={18} />
              Marcar como vencida
            </Button>
            <Button fullWidth variant="outline" onClick={handleCopyCharge}>
              <Copy size={18} />
              Copiar cobrança
            </Button>
            <Button fullWidth variant="secondary" onClick={handleDownloadCharge}>
              <Download size={18} />
              Baixar cobrança
            </Button>

            <div className="rounded-lg bg-zinc-950 p-4 text-white">
              <p className="text-sm text-red-100">Último pagamento</p>
              <p className="mt-1 text-lg font-bold">
                {subscription.lastPaymentAt
                  ? new Date(subscription.lastPaymentAt).toLocaleDateString('pt-BR')
                  : 'Ainda não registrado'}
              </p>
              <p className="mt-3 text-xs text-white/60">
                Atualizado em {new Date(subscription.updatedAt).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 rounded-lg text-white">
            <ZapIcon size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Integrações</h3>
            <p className="text-gray-500">Serviços conectados ao sistema</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {integrations.map((integration) => (
            <div key={integration.name} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gray-100 rounded-lg">
                  <integration.icon size={20} className="text-gray-600" />
                </div>
                <span className="font-semibold text-gray-900">{integration.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', integration.statusColor)} />
                <span className="text-sm text-gray-600">{integration.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Settings */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-5 text-white">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 rounded-lg animate-glow">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Configurações da IA</h3>
            <p className="text-slate-400">Personalizar comportamento da inteligência artificial</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {[
            { title: 'Atendimento Automático', desc: 'A IA responde automaticamente mensagens recebidas', enabled: true },
            { title: 'Geração de Resumos', desc: 'Criar resumos automáticos de conversas', enabled: true },
            { title: 'Detecção de Urgência', desc: 'Identificar automaticamente a urgência das solicitações', enabled: true },
            { title: 'Agendamento Automático', desc: 'Criar visitas automaticamente quando datas são identificadas', enabled: false },
          ].map((setting) => (
            <div key={setting.title} className="flex items-center justify-between gap-4 p-3.5 bg-white/5 rounded-lg border border-white/10">
              <div>
                <p className="font-semibold">{setting.title}</p>
                <p className="text-sm text-slate-400">{setting.desc}</p>
              </div>
              <div className={cn(
                'w-12 h-6 rounded-full relative cursor-pointer transition-colors',
                setting.enabled ? 'bg-red-600' : 'bg-slate-600'
              )}>
                <div className={cn(
                  'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all',
                  setting.enabled ? 'right-1' : 'left-1'
                )} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Informações do Sistema</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Versão', value: '1.0.0' },
            { label: 'Atualização', value: 'Março 2024' },
            { label: 'Banco de dados', value: apiStatus?.supabaseConfigured ? 'Supabase' : 'Demo local' },
            { label: 'Status', value: apiStatus?.ok ? 'Online' : 'Offline', valueColor: apiStatus?.ok ? 'text-green-600' : 'text-red-600' },
          ].map((item) => (
            <div key={item.label} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">{item.label}</p>
              <p className={cn('font-bold', item.valueColor || 'text-gray-900')}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
