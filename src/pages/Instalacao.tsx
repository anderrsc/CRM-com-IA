import React, { useState } from 'react';
import { Modal } from '../components/ui/Modal';
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [notes, setNotes] = useState('');

  const handleOpenDetail = (installation: Installation) => {
    setSelectedInstallation(installation);
    setNotes(installation.notes || '');
    setShowDetailModal(true);
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
        title: 'Instalação concluída',
        message: `${installation.leadName} foi finalizado`,
        read: false,
        createdAt: new Date(),
      });
      toast.success('Instalação concluída e cliente finalizado');
    } else {
      toast.success('Status da instalação atualizado');
    }
    setShowDetailModal(false);
  };

  const handleOpenMap = (address: string) => {
    const ok = openMap(address);
    if (!ok) toast.error('Endereço não informado');
  };

  const handleCall = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || !callPhone(lead.phone)) toast.error('Telefone não encontrado');
  };

  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    agendada: { label: 'Agendada', color: 'bg-red-100 text-red-700', icon: Calendar },
    em_andamento: { label: 'Em Andamento', color: 'bg-red-100 text-red-700', icon: Clock },
    concluida: { label: 'Concluída', color: 'bg-red-100 text-red-700', icon: CheckCircle },
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
              <p className="text-xs text-gray-500">Concluídas</p>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma instalação</h3>
            <p className="text-gray-500">Instalações de pedidos finalizados aparecerão aqui</p>
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
                      <p className="text-xs text-gray-500 mb-1">Horário</p>
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
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detalhes da Instalação"
        size="lg"
      >
        {selectedInstallation && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{selectedInstallation.leadName}</h3>
                <p className="text-gray-500 flex items-center gap-1">
                  <MapPin size={16} />
                  {selectedInstallation.address}
                </p>
              </div>
              <Badge className={statusConfig[selectedInstallation.status].color}>
                {statusConfig[selectedInstallation.status].label}
              </Badge>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Calendar size={16} />
                  <span className="text-sm">Data</span>
                </div>
                <p className="font-semibold">
                  {format(new Date(selectedInstallation.date), "d 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Clock size={16} />
                  <span className="text-sm">Horário</span>
                </div>
                <p className="font-semibold">{selectedInstallation.time}</p>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Itens para Instalar</h4>
              <div className="space-y-2">
                {selectedInstallation.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Wrench size={16} className="text-gray-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Checklist</h4>
              <div className="space-y-2">
                {selectedInstallation.checklist.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => handleToggleChecklist(selectedInstallation.id, item.id)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                      item.completed ? 'bg-red-50' : 'bg-gray-50 hover:bg-gray-100'
                    )}
                  >
                    {item.completed ? (
                      <CheckSquare size={20} className="text-red-600" />
                    ) : (
                      <Square size={20} className="text-gray-400" />
                    )}
                    <span className={cn(item.completed && 'line-through text-gray-500')}>
                      {item.description}
                    </span>
                    {item.completedAt && (
                      <span className="text-xs text-gray-400 ml-auto">
                        {format(new Date(item.completedAt), 'HH:mm')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Photos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Camera size={18} />
                  Fotos Antes
                </h4>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Clique para adicionar fotos</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Camera size={18} />
                  Fotos Depois
                </h4>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Clique para adicionar fotos</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Observações</h4>
              <TextArea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Adicione observações sobre a instalação..."
              />
            </div>

            {/* Signature */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileSignature size={18} />
                Assinatura do Cliente
              </h4>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                <FileSignature size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Clique para coletar assinatura</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              {selectedInstallation.status === 'agendada' && (
                <Button 
                  onClick={() => handleStatusChange(selectedInstallation.id, 'em_andamento')}
                  variant="warning"
                  icon={<Clock size={18} />}
                >
                  Iniciar Instalação
                </Button>
              )}
              {selectedInstallation.status === 'em_andamento' && (
                <>
                  <Button 
                    onClick={() => handleStatusChange(selectedInstallation.id, 'concluida')}
                    variant="success"
                    icon={<CheckCircle size={18} />}
                  >
                    Concluir
                  </Button>
                  <Button 
                    onClick={() => handleStatusChange(selectedInstallation.id, 'problema')}
                    variant="danger"
                    icon={<AlertCircle size={18} />}
                  >
                    Reportar Problema
                  </Button>
                </>
              )}
              <Button variant="secondary" onClick={() => handleOpenMap(selectedInstallation.address)} icon={<Navigation size={18} />}>
                Abrir no Mapa
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
