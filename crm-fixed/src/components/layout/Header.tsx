import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Menu,
  X,
  MessageSquare,
  Calendar,
  ChevronDown,
  Settings,
  User,
  LogOut
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useStore } from '../../store/useStore';
import { Avatar } from '../ui/Avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onNavigate?: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onNavigate }) => {
  const { notifications, markNotificationRead, toggleSidebar, currentUser, logout } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 lg:px-6 py-3">
        {/* Left side */}
        <div className="flex min-w-0 items-center gap-3">
          <button 
            onClick={toggleSidebar}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Abrir menu lateral"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg lg:text-xl font-bold text-gray-900 truncate">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-shrink-0 items-center gap-1.5 lg:gap-2">
          {/* Search */}
          <div className="hidden md:flex items-center bg-gray-100/80 rounded-lg px-3 py-2 group focus-within:ring-2 focus-within:ring-red-500/20 focus-within:bg-white transition-all">
            <Search size={18} className="text-gray-400 group-focus-within:text-red-500" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none ml-2 w-44 text-sm placeholder:text-gray-400"
            />
          </div>

          {/* Quick Actions */}
          <button
            onClick={() => onNavigate?.('central-ia')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:flex items-center justify-center"
            title="Central IA"
          >
            <MessageSquare size={20} className="text-gray-500" />
          </button>
          <button
            onClick={() => onNavigate?.('agenda')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:flex items-center justify-center"
            title="Agenda"
          >
            <Calendar size={20} className="text-gray-500" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
            >
              <Bell size={20} className="text-gray-500" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-soft">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50 animate-scaleIn">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Notificações</h3>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell size={24} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">Nenhuma notificação</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => markNotificationRead(notification.id)}
                        className={cn(
                          'p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors',
                          !notification.read && 'bg-red-50/50'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                            notification.type === 'success' && 'bg-red-500',
                            notification.type === 'warning' && 'bg-red-500',
                            notification.type === 'error' && 'bg-red-500',
                            notification.type === 'info' && 'bg-red-500'
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-500 truncate">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {format(new Date(notification.createdAt), 'HH:mm', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1.5 pr-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Avatar name={currentUser?.name || 'User'} size="sm" />
              <ChevronDown size={16} className={cn(
                'text-gray-400 transition-transform hidden sm:block',
                showUserMenu && 'rotate-180'
              )} />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50 animate-scaleIn">
                <div className="p-4 border-b border-gray-100">
                  <p className="font-bold text-gray-900">{currentUser?.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{currentUser?.role}</p>
                </div>
                <div className="p-2">
                  <button onClick={() => onNavigate?.('settings')} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left">
                    <User size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-700">Meu Perfil</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors text-left">
                    <Settings size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-700">Configurações</span>
                  </button>
                  <div className="border-t border-gray-100 my-2" />
                  <button 
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-lg transition-colors text-left group"
                  >
                    <LogOut size={18} className="text-gray-400 group-hover:text-red-500" />
                    <span className="text-sm text-gray-700 group-hover:text-red-600">Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
