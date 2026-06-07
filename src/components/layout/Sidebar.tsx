import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Palette,
  Table2,
  Factory,
  Wrench,
  BookOpen,
  Settings,
  ShoppingCart,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Target,
  ClipboardList,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStore } from '../../store/useStore';
import { Avatar } from '../ui/Avatar';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

type MenuItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  group: 'Principal' | 'Comercial' | 'Operação' | 'Sistema';
};

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Principal' },
  { id: 'central-ia', label: 'Central IA', icon: Sparkles, group: 'Principal' },
  { id: 'crm', label: 'CRM', icon: Users, group: 'Comercial' },
  { id: 'funil', label: 'Funil de Vendas', icon: Target, group: 'Comercial' },
  { id: 'agenda', label: 'Agenda', icon: Calendar, group: 'Comercial' },
  { id: 'visitas', label: 'Fichas de Visita', icon: ClipboardList, group: 'Comercial' },
  { id: 'orcamentos', label: 'Orçamentos', icon: FileText, group: 'Comercial' },
  { id: 'modelo-orcamento', label: 'Modelo do Orçamento', icon: Palette, group: 'Comercial' },
  { id: 'tabela-calhas', label: 'Tabela de Calhas', icon: Table2, group: 'Comercial' },
  { id: 'compras', label: 'Compras', icon: ShoppingCart, group: 'Operação' },
  { id: 'producao', label: 'Produção', icon: Factory, group: 'Operação' },
  { id: 'instalacao', label: 'Instalação', icon: Wrench, group: 'Operação' },
  { id: 'conhecimento', label: 'Base de Conhecimento', icon: BookOpen, group: 'Sistema' },
  { id: 'settings', label: 'Configurações', icon: Settings, group: 'Sistema' },
];

const roleAccess: Record<string, string[]> = {
  admin: menuItems.map((item) => item.id),
  gerente: menuItems.map((item) => item.id).filter((id) => id !== 'settings'),
  vendedor: ['dashboard', 'central-ia', 'crm', 'funil', 'agenda', 'visitas', 'orcamentos', 'modelo-orcamento', 'tabela-calhas'],
  secretaria: ['dashboard', 'central-ia', 'crm', 'funil', 'agenda', 'visitas'],
  compras: ['dashboard', 'compras', 'producao'],
  producao: ['dashboard', 'producao', 'compras'],
  instalador: ['dashboard', 'instalacao'],
};

const groups: MenuItem['group'][] = ['Principal', 'Comercial', 'Operação', 'Sistema'];

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ label, children, disabled }) => (
  <div className="group/tooltip relative">
    {children}
    {!disabled && (
      <div
        role="tooltip"
        className="pointer-events-none absolute left-[calc(100%+0.75rem)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-zinc-950/95 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-200 group-hover/tooltip:translate-x-1 group-hover/tooltip:opacity-100 group-focus-within/tooltip:translate-x-1 group-focus-within/tooltip:opacity-100"
      >
        {label}
      </div>
    )}
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { currentUser, logout, sidebarOpen, toggleSidebar } = useStore();
  const isExpanded = sidebarOpen;

  const accessibleItems = menuItems.filter((item) =>
    item.id !== 'settings' && currentUser && roleAccess[currentUser.role]?.includes(item.id)
  );

  const handlePageChange = (page: string) => {
    onPageChange(page);
    if (window.innerWidth < 768 && sidebarOpen) {
      toggleSidebar();
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden text-white',
          'border-r border-white/10 bg-black/78 shadow-[inset_-1px_0_0_rgba(255,255,255,0.05),18px_0_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl',
          'transition-[width,transform] duration-300 ease-out',
          isExpanded ? 'w-[18rem]' : 'w-[5.25rem]',
          'max-md:w-[18rem]',
          sidebarOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'
        )}
        aria-label="Navegação principal"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-black/90 to-red-950/78" />
          <div className="absolute -left-28 top-8 h-64 w-64 rounded-full bg-red-700/20 blur-3xl" />
          <div className="absolute bottom-24 right-[-7rem] h-72 w-72 rounded-full bg-red-600/16 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,transparent_30%,rgba(220,38,38,0.08)_100%)]" />
        </div>

        <div className="relative flex items-center gap-3 px-3.5 py-4">
          <button
            type="button"
            onClick={() => handlePageChange('dashboard')}
            className={cn(
              'flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5 text-left transition-all duration-200 hover:bg-white/5',
              !isExpanded && 'justify-center max-md:justify-start'
            )}
            aria-label="Ir para Dashboard"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-red-600 via-red-700 to-black font-bold shadow-lg shadow-red-950/35 ring-1 ring-red-400/20">
              M
            </div>
            <div className={cn('min-w-0 transition-all duration-200', !isExpanded && 'md:hidden')}>
              <h1 className="truncate text-sm font-bold tracking-wide text-white">Marquinhos</h1>
              <p className="truncate text-xs font-medium text-red-100/60">Sistema Inteligente</p>
            </div>
          </button>

          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/7 text-slate-300 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/12 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/60 md:flex"
            aria-label={isExpanded ? 'Recolher sidebar' : 'Expandir sidebar'}
          >
            {isExpanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>

        <nav className="relative min-h-0 flex-1 overflow-y-auto px-2.5 pb-3 scrollbar-thin" aria-label="Menu principal">
          {groups.map((group) => {
            const items = accessibleItems.filter((item) => item.group === group);
            if (!items.length) return null;

            return (
              <div key={group} className="mb-4">
                <div className={cn('mb-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-red-100/45', !isExpanded && 'md:text-center md:px-0')}>
                  <span className={cn(!isExpanded && 'md:hidden')}>{group}</span>
                  <span className={cn('hidden h-px w-8 bg-white/10', !isExpanded && 'md:inline-block')} />
                </div>

                <ul className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;

                    return (
                      <li key={item.id}>
                        <Tooltip label={item.label} disabled={isExpanded}>
                          <button
                            type="button"
                            onClick={() => handlePageChange(item.id)}
                            className={cn(
                              'group/navitem relative flex min-h-11 w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-semibold outline-none transition-all duration-200',
                              'focus-visible:ring-2 focus-visible:ring-red-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                              isExpanded ? 'justify-start' : 'justify-center md:px-2.5 max-md:justify-start max-md:px-3',
                              isActive
                                ? 'bg-red-600/18 text-white shadow-[inset_0_0_0_1px_rgba(248,113,113,0.28),0_12px_28px_rgba(127,29,29,0.22)]'
                                : 'text-slate-300/85 hover:-translate-y-0.5 hover:bg-white/8 hover:text-white hover:shadow-[0_12px_32px_rgba(0,0,0,0.22)]'
                            )}
                            aria-current={isActive ? 'page' : undefined}
                            aria-label={item.label}
                          >
                            {isActive && (
                              <>
                                <span className="absolute left-0 top-2 h-7 w-1 rounded-r-full bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.85)]" />
                                <span className="absolute inset-0 bg-gradient-to-r from-red-500/18 via-white/[0.03] to-transparent" />
                              </>
                            )}
                            <span
                              className={cn(
                                'relative grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-all duration-200',
                                'group-hover/navitem:scale-105 group-hover/navitem:rotate-[-2deg]',
                                isActive
                                  ? 'border-red-400/30 bg-red-500/22 text-red-100'
                                  : 'border-white/8 bg-white/6 text-slate-300'
                              )}
                            >
                              <Icon size={18} />
                            </span>
                            <span className={cn('relative truncate transition-all duration-200', !isExpanded && 'md:hidden')}>
                              {item.label}
                            </span>
                            {isActive && isExpanded && (
                              <ChevronRight size={16} className="relative ml-auto text-red-100/80" />
                            )}
                          </button>
                        </Tooltip>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="relative mt-auto border-t border-white/10 bg-black/25 p-2.5 backdrop-blur-xl">
          <Tooltip label={`${currentUser?.name || 'Perfil'} - ${currentUser?.role || ''}`} disabled={isExpanded}>
            <button
              type="button"
              onClick={() => handlePageChange('settings')}
              className={cn(
                'mb-2 flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/6 p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-red-400/25 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/70',
                !isExpanded && 'md:justify-center max-md:justify-start'
              )}
              aria-label="Abrir perfil e configurações"
            >
              <div className="rounded-full border border-red-400/30 p-0.5 shadow-lg shadow-red-950/20 transition-transform duration-200 hover:scale-105">
                <Avatar name={currentUser?.name || 'User'} size="md" />
              </div>
              <div className={cn('min-w-0 flex-1 transition-all duration-200', !isExpanded && 'md:hidden')}>
                <p className="truncate text-sm font-bold text-white">{currentUser?.name}</p>
                <p className="truncate text-xs text-red-100/55 capitalize">{currentUser?.role}</p>
              </div>
            </button>
          </Tooltip>

          <div className={cn('grid gap-2', isExpanded ? 'grid-cols-2' : 'grid-cols-1')}>
            {currentUser?.role === 'admin' && (
              <Tooltip label="Configurações" disabled={isExpanded}>
                <button
                  type="button"
                  onClick={() => handlePageChange('settings')}
                  className={cn(
                    'flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/6 px-3 text-sm font-semibold text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-400/25 hover:bg-red-500/12 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/70',
                    currentPage === 'settings' && 'border-red-400/30 bg-red-500/16 text-white'
                  )}
                  aria-label="Configurações"
                >
                  <Settings size={17} className="transition-transform duration-200 hover:scale-105" />
                  <span className={cn(!isExpanded && 'md:hidden')}>Config</span>
                </button>
              </Tooltip>
            )}

            <Tooltip label="Sair" disabled={isExpanded}>
              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-500/12 bg-red-500/8 px-3 text-sm font-semibold text-red-100 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-400/30 hover:bg-red-500/16 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/70"
                aria-label="Sair do sistema"
              >
                <LogOut size={17} className="transition-transform duration-200 hover:scale-105" />
                <span className={cn(!isExpanded && 'md:hidden')}>Sair</span>
              </button>
            </Tooltip>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={toggleSidebar}
          aria-label="Fechar menu lateral"
        />
      )}
    </>
  );
};
