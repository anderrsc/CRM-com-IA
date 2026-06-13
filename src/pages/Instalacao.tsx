import React, { useState } from 'react';
import { 
  Wrench, 
  CheckCircle, 
  Clock, 
  MapPin,
  Camera,
  FileSignature,
  Calendar,
  Phone,
  AlertCircle,
  CheckSquare,
  Square,
  Upload,
  Navigation
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

import { TextArea } from '../components/ui/Input';
import { useStore } from '../store/useStore';
import { Installation } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import { callPhone, openMap } from '../utils/actions';
import { v4 as uuidv4 } from 'uuid';

export const Instalacao: React.FC = () => {
  const { installations, updateInstallation, users, leads, updateLeadStatus, addNotification } = useStore();
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);
  const [notes, setNotes] = useState('');

  const handleOpenDetail = (installation: Installation) => {
    setSelectedInstallation(installation);
    setNotes(installation.notes || '');
    ;
  };

  const handleToggleChecklist = (installationId: string, checklistId: string) => {
    const installation = installations.find(i => i.id === installationId);
    if (!installation) return;

    const updatedChecklist = installation.checklist.map(item => 
      item.id === checklistId 
        ? { ...item, completed: !item.completed, completedAt: !item.completed ? new Date() : undefined }
        : item
    );

    updateInstallation(installationId, { checklist: updatedChecklist });
    
    // Update selectedInstallation if modal is open
    if (selectedInstallation?.id === installationId) {
      setSelectedInstallation({ ...selectedInstallation, checklist: updatedChecklist });
    }
  };

  const handleStatusChange = (installationId: string, status: Installation['status']) => {
    const installation = installations.find(i => i.id === installationId);
    updateInstallation(installationId, { status, notes });
    if (installation && status === 'concluida') {
      updateLeadStatus(installation.leadId, 'pos_venda');
      addNotification({
        id: uuidv4(),
        type: 'success',
        title: 'InstalaÃ§Ã£o concluÃ­da',
        message: `${installation.leadName} foi finalizado`,
        read: false,
        createdAt: new Date(),
      });
      toast.success('InstalaÃ§Ã£o concluÃ­da e cliente finalizado');
    } else {
      toast.success('Status da instalaÃ§Ã£o atualizado');
    }
    ;
  };

  const handleOpenMap = (address: string) => {
    const ok = openMap(address);
    if (!ok) toast.error('EndereÃ§o nÃ£o informado');
  };

  const handleCall = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || !callPhone(lead.phone)) toast.error('Telefone nÃ£o encontrado');
  };

  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    agendada: { label: 'Agendada', color: 'bg-red-100 text-red-700', icon: Calendar },
    em_andamento: { label: 'Em Andamento', color: 'bg-red-100 text-red-700', icon: Clock },
    concluida: { label: 'ConcluÃ­da', color: 'bg-red-100 text-red-700', icon: CheckCircle },
    problema: { label: 'Problema', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  };

  // Stats
  const scheduledCount = installations.filter(i => i.status === 'agendada').length;
  const inProgressCount = installations.filter(i => i.status === 'em_andamento').length;
  const completedCount = installations.filter(i => i.status === 'concluida').length;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Calendar size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{scheduledCount}</p>
              <p className="text-xs text-gray-500">Agendadas</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inProgressCount}</p>
              <p className="text-xs text-gray-500">Em Andamento</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <CheckCircle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-xs text-gray-500">ConcluÃ­das</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Wrench size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{installations.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Installations List */}
      <div className="grid gap-4">
        {installations.length === 0 ? (
          <Card className="text-center py-10">
            <Wrench size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma instalaÃ§Ã£o</h3>
            <p className="text-gray-500">InstalaÃ§Ãµes de pedidos finalizados aparecerÃ£o aqui</p>
          </Card>
        ) : (
          installations.map((installation) => {
            const config = statusConfig[installation.status];
            const StatusIcon = config.icon;
            const completedItems = installation.checklist.filter(c => c.completed).length;
            const totalItems = installation.checklist.length;
            const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

            return (
              <Card key={installation.id} hover padding="none">
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={cn('p-3 rounded-lg', config.color.replace('text-', 'bg-').replace('-700', '-100'))}>
                        <StatusIcon size={24} className={config.color.split(' ')[1]} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{installation.leadName}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin size={14} />
                          {installation.address}
                        </p>
                      </div>
                    </div>
                    <Badge className={config.color}>
                      {config.label}
                    </Badge>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Data</p>
                      <p className="font-medium text-sm">
                        {format(new Date(installation.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">HorÃ¡rio</p>
                      <p className="font-medium text-sm">{installation.time}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Equipe</p>
                      <p className="font-medium text-sm">
                        {installation.team.map(t => users.find(u => u.id === t)?.name || t).join(', ')}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Checklist</p>
                      <p className="font-medium text-sm">{completedItems}/{totalItems} itens</p>
                    </div>
                  </div>

                  {/* Checklist Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Progresso do Checklist</span>
                      <span className="font-medium">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          'h-full rounded-full transition-all',
                          progress === 100 ? 'bg-red-500' : 'bg-red-500'
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>Itens:</strong> {installation.items.join(', ')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                    <Button 
                      size="sm"
                      onClick={() => handleOpenDetail(installation)}
                    >
                      Ver Detalhes
                    </Button>
                    <Button 
                      size="sm"
                      variant="secondary"
                      onClick={() => handleOpenMap(installation.address)}
                      icon={<Navigation size={16} />}
                    >
                      Abrir Mapa
                    </Button>
                    <Button 
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCall(installation.leadId)}
                      icon={<Phone size={16} />}
                    >
                      Ligar
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {/* removed */}
    </div>
  );
};
