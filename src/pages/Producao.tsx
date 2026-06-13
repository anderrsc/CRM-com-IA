import React, { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { 
  Factory, 
  CheckCircle, 
  Clock, 
  Package,
  Scissors,
  Hammer,
  Layers,
  Paintbrush,
  Box,
  ArrowRight,
  User,
  Calendar
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/Stats';

import { useStore } from '../store/useStore';
import { Production, ProductionStage } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../utils/cn';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

const stageConfig: Record<ProductionStage, { label: string; icon: React.ElementType; color: string }> = {
  corte: { label: 'Corte', icon: Scissors, color: 'text-red-600 bg-red-100' },
  montagem: { label: 'Montagem', icon: Hammer, color: 'text-red-600 bg-red-100' },
  vidro: { label: 'Vidro', icon: Layers, color: 'text-red-600 bg-red-100' },
  pintura: { label: 'Pintura', icon: Paintbrush, color: 'text-red-600 bg-red-100' },
  embalagem: { label: 'Embalagem', icon: Box, color: 'text-red-600 bg-red-100' },
  finalizado: { label: 'Finalizado', icon: CheckCircle, color: 'text-red-600 bg-red-100' },
};

const stages: ProductionStage[] = ['corte', 'montagem', 'vidro', 'pintura', 'embalagem', 'finalizado'];

export const Producao: React.FC = () => {
  const { productions, purchases, updateProduction, users, leads, installations, addInstallation, updateLeadStatus, addNotification } = useStore();
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleAdvanceStage = (production: Production) => {
    const currentIndex = stages.indexOf(production.currentStage);
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      const newProgress = ((currentIndex + 2) / stages.length) * 100;
      
      updateProduction(production.id, {
        currentStage: nextStage,
        progress: newProgress,
        history: [
          ...production.history,
          {
            stage: production.currentStage,
            completedAt: new Date(),
            completedBy: 'Operador',
          }
        ]
      });

      if (nextStage === 'finalizado') {
        updateLeadStatus(production.leadId, 'instalacao');

        const alreadyScheduled = installations.some((installation) => installation.productionId === production.id);
        if (!alreadyScheduled) {
          const lead = leads.find(l => l.id === production.leadId);
          const installDate = new Date();
          installDate.setDate(installDate.getDate() + 2);

          addInstallation({
            id: uuidv4(),
            productionId: production.id,
            leadId: production.leadId,
            leadName: production.leadName,
            address: lead ? `${lead.address} - ${lead.neighborhood}` : '',
            date: installDate,
            time: '08:00',
            team: ['4'],
            items: production.items,
            checklist: [
              { id: uuidv4(), description: 'Conferir medidas no local', completed: false },
              { id: uuidv4(), description: 'Separar peças e ferragens', completed: false },
              { id: uuidv4(), description: 'Instalar estrutura', completed: false },
              { id: uuidv4(), description: 'Conferir acabamento', completed: false },
              { id: uuidv4(), description: 'Limpeza final', completed: false },
            ],
            photosBefore: [],
            photosAfter: [],
            status: 'agendada',
            createdAt: new Date(),
          });
        }

        addNotification({
          id: uuidv4(),
          type: 'success',
          title: 'Produção finalizada',
          message: `${production.leadName} foi enviada para instalação`,
          read: false,
          createdAt: new Date(),
        });
        toast.success('Produção finalizada e instalação agendada');
      } else {
        toast.success(`Produção avançou para ${stageConfig[nextStage].label}`);
      }
    }
  };

  const handleOpenDetail = (production: Production) => {
    setSelectedProduction(production);
    setShowDetailModal(true);
  };

  const getProgressColor = (_progress: number): 'red' => 'red';

  // Stats
  const inProgressCount = productions.filter(p => p.currentStage !== 'finalizado').length;
  const completedCount = productions.filter(p => p.currentStage === 'finalizado').length;
  const receivedPurchases = purchases
    .filter((purchase) => purchase.status === 'recebido')
    .slice(0, 5);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Factory size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{productions.length}</p>
              <p className="text-xs text-gray-500">Total</p>
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
              <p className="text-xs text-gray-500">Finalizados</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Package size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {productions.filter(p => p.currentStage === 'embalagem').length}
              </p>
              <p className="text-xs text-gray-500">P/ Entregar</p>
            </div>
          </div>
        </Card>
      </div>

      {receivedPurchases.length > 0 && (
        <Card>
          <CardHeader
            title="Materiais recebidos"
            subtitle="Itens que chegaram e ja podem ser usados na producao"
            icon={<Package size={20} />}
          />
          <div className="grid gap-2">
            {receivedPurchases.map((purchase) => (
              <div key={purchase.id} className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{purchase.itemName}</p>
                  <p className="text-sm text-gray-500">
                    {purchase.quantity} {purchase.unit} - {purchase.supplier} - {purchase.leadName}
                  </p>
                </div>
                <Badge variant="success">
                  Chegou {purchase.receivedAt ? new Date(purchase.receivedAt).toLocaleDateString('pt-BR') : ''}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Stage Pipeline */}
      <Card>
        <CardHeader 
          title="Pipeline de Produção"
          icon={<Factory size={20} />}
        />
        <div className="flex gap-2 overflow-x-auto pb-2">
          {stages.map((stage, index) => {
            const config = stageConfig[stage];
            const count = productions.filter(p => p.currentStage === stage).length;
            const Icon = config.icon;
            
            return (
              <React.Fragment key={stage}>
                <div className={cn(
                  'flex-shrink-0 p-4 rounded-lg text-center min-w-32',
                  count > 0 ? config.color : 'bg-gray-50 text-gray-400'
                )}>
                  <Icon size={24} className="mx-auto mb-2" />
                  <p className="font-medium text-sm">{config.label}</p>
                  <p className="text-2xl font-bold mt-1">{count}</p>
                </div>
                {index < stages.length - 1 && (
                  <div className="flex items-center flex-shrink-0">
                    <ArrowRight size={20} className="text-gray-300" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Card>

      {/* Productions List */}
      <div className="grid gap-4">
        {productions.length === 0 ? (
          <Card className="text-center py-10">
            <Factory size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma produção</h3>
            <p className="text-gray-500">Pedidos fechados aparecerão aqui</p>
          </Card>
        ) : (
          productions.map((production) => {
            const stageConf = stageConfig[production.currentStage];
            const StageIcon = stageConf.icon;

            return (
              <Card key={production.id} hover padding="none">
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={cn('p-3 rounded-lg', stageConf.color)}>
                        <StageIcon size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{production.leadName}</h3>
                        <p className="text-sm text-gray-500">
                          {production.items.slice(0, 2).join(', ')}
                          {production.items.length > 2 && ` +${production.items.length - 2} itens`}
                        </p>
                      </div>
                    </div>
                    <Badge className={stageConf.color}>
                      {stageConf.label}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <ProgressBar 
                      value={production.progress} 
                      color={getProgressColor(production.progress)}
                      label="Progresso"
                    />
                  </div>

                  {/* Stages Timeline */}
                  <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
                    {stages.map((stage, index) => {
                      const conf = stageConfig[stage];
                      const Icon = conf.icon;
                      const isCompleted = stages.indexOf(production.currentStage) > index;
                      const isCurrent = production.currentStage === stage;

                      return (
                        <React.Fragment key={stage}>
                          <div 
                            className={cn(
                              'flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 transition-all',
                              isCompleted && 'bg-red-100',
                              isCurrent && conf.color,
                              !isCompleted && !isCurrent && 'bg-gray-100'
                            )}
                            title={conf.label}
                          >
                            {isCompleted ? (
                              <CheckCircle size={20} className="text-red-600" />
                            ) : (
                              <Icon size={18} className={cn(
                                isCurrent ? '' : 'text-gray-400'
                              )} />
                            )}
                          </div>
                          {index < stages.length - 1 && (
                            <div className={cn(
                              'h-0.5 w-8 flex-shrink-0',
                              isCompleted ? 'bg-red-400' : 'bg-gray-200'
                            )} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      Início: {format(new Date(production.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      Previsão: {format(new Date(production.estimatedEnd), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {users.find(u => production.assignedTeam.includes(u.id))?.name || 'Equipe'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    {production.currentStage !== 'finalizado' && (
                      <Button 
                        onClick={() => handleAdvanceStage(production)}
                        size="sm"
                        icon={<ArrowRight size={16} />}
                      >
                        Avançar Etapa
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleOpenDetail(production)}
                    >
                      Ver Detalhes
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
        title="Detalhes da Produção"
        size="lg"
      >
        {selectedProduction && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className={cn('p-4 rounded-lg', stageConfig[selectedProduction.currentStage].color)}>
                {React.createElement(stageConfig[selectedProduction.currentStage].icon, { size: 32 })}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{selectedProduction.leadName}</h3>
                <p className="text-gray-500">Pedido #{selectedProduction.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>

            {/* Progress */}
            <div>
              <ProgressBar 
                value={selectedProduction.progress} 
                color={getProgressColor(selectedProduction.progress)}
                label="Progresso Total"
                size="lg"
              />
            </div>

            {/* Items */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Itens</h4>
              <div className="space-y-2">
                {selectedProduction.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Package size={16} className="text-gray-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Data de Início</p>
                <p className="font-semibold">
                  {format(new Date(selectedProduction.startDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Previsão de Entrega</p>
                <p className="font-semibold">
                  {format(new Date(selectedProduction.estimatedEnd), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* History */}
            {selectedProduction.history.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Histórico</h4>
                <div className="space-y-3">
                  {selectedProduction.history.map((entry, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <CheckCircle size={18} className="text-red-600" />
                      <div>
                        <p className="font-medium">{stageConfig[entry.stage].label} concluído</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(entry.completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} por {entry.completedBy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              {selectedProduction.currentStage !== 'finalizado' && (
                <Button 
                  onClick={() => {
                    handleAdvanceStage(selectedProduction);
                    setShowDetailModal(false);
                  }}
                  icon={<ArrowRight size={18} />}
                >
                  Avançar para {stageConfig[stages[stages.indexOf(selectedProduction.currentStage) + 1]]?.label}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
