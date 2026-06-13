import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Phone,
  User,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Edit,
  Navigation
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select, TextArea } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useStore } from '../store/useStore';
import { Visit } from '../types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import { openMap } from '../utils/actions';

export const Agenda: React.FC = () => {
  const { visits, leads, addVisit, updateVisit, updateLeadStatus } = useStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [agendaView, setAgendaView] = useState<'list'|'new'|'detail'>('list');
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    leadId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    observations: '',
  });

  // Calendar navigation
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { locale: ptBR });
    const endDate = endOfWeek(monthEnd, { locale: ptBR });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Get visits for a specific day
  const getVisitsForDay = (date: Date) => {
    return visits.filter(visit => isSameDay(new Date(visit.date), date));
  };

  // Selected day visits
  const selectedDayVisits = getVisitsForDay(selectedDate);

  // Today's visits
  const todayVisits = visits.filter(visit => isToday(new Date(visit.date)));

  const handleOpenNew = () => {
    setFormData({
      leadId: '',
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: '09:00',
      observations: '',
    });
    setEditingVisitId(null);
    setAgendaView('new');
  };

  const handleOpenDetail = (visit: Visit) => {
    setSelectedVisit(visit);
    setAgendaView('detail');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedLead = leads.find(l => l.id === formData.leadId);
    if (!selectedLead) return;

    if (editingVisitId) {
      updateVisit(editingVisitId, {
        leadId: formData.leadId,
        leadName: selectedLead.name,
        phone: selectedLead.phone,
        address: `${selectedLead.address} - ${selectedLead.neighborhood}`,
        service: selectedLead.service,
        date: new Date(formData.date),
        time: formData.time,
        observations: formData.observations,
      });
      updateLeadStatus(formData.leadId, 'visita_agendada');
      toast.success('Visita atualizada com sucesso');
      setEditingVisitId(null);
      setAgendaView('list');
      return;
    }

    const newVisit: Visit = {
      id: uuidv4(),
      leadId: formData.leadId,
      leadName: selectedLead.name,
      phone: selectedLead.phone,
      address: `${selectedLead.address} - ${selectedLead.neighborhood}`,
      service: selectedLead.service,
      date: new Date(formData.date),
      time: formData.time,
      observations: formData.observations,
      assignedTo: '2',
      status: 'agendada',
      createdAt: new Date(),
    };

    addVisit(newVisit);
    updateLeadStatus(formData.leadId, 'visita_agendada');
    toast.success('Visita agendada com sucesso');
    setAgendaView('list');
  };

  const handleStatusChange = (visitId: string, status: Visit['status']) => {
    const visit = visits.find(v => v.id === visitId);
    updateVisit(visitId, { status });
    if (visit && status === 'realizada') {
      updateLeadStatus(visit.leadId, 'visita_realizada');
      toast.success('Visita marcada como realizada');
    }
    if (status === 'cancelada') {
      toast.success('Visita cancelada');
    }
    setAgendaView('list');
  };

  const handleOpenMap = (address: string) => {
    const ok = openMap(address);
    if (!ok) toast.error('EndereÃ§o nÃ£o informado');
  };

  const statusColors = {
    agendada: 'bg-red-100 text-red-700',
    realizada: 'bg-red-100 text-red-700',
    cancelada: 'bg-red-100 text-red-700',
    reagendada: 'bg-red-100 text-red-700',
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'SÃ¡b'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fadeIn">
      {/* Calendar */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader 
            title={format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
            icon={<CalendarIcon size={20} />}
            action={
              <div className="flex items-center gap-2">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Hoje
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            }
          />

          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const dayVisits = getVisitsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'min-h-24 p-1 rounded-lg border transition-all text-left',
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50',
                    isSelected ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-100 hover:border-gray-200',
                  )}
                >
                  <div className={cn(
                    'text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full',
                    isTodayDate && 'bg-red-600 text-white',
                    !isTodayDate && isCurrentMonth && 'text-gray-900',
                    !isCurrentMonth && 'text-gray-400'
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayVisits.slice(0, 2).map((visit) => (
                      <div
                        key={visit.id}
                        className="text-xs truncate px-1.5 py-0.5 rounded bg-red-100 text-red-700"
                      >
                        {visit.time} {visit.leadName.split(' ')[0]}
                      </div>
                    ))}
                    {dayVisits.length > 2 && (
                      <div className="text-xs text-gray-500 px-1">
                        +{dayVisits.length - 2} mais
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-5">
        {/* Selected Day */}
        <Card>
          <CardHeader 
            title={format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
            subtitle={format(selectedDate, 'EEEE', { locale: ptBR })}
            icon={<Clock size={20} />}
            action={
              <Button size="sm" onClick={handleOpenNew} icon={<Plus size={16} />}>
                Nova
              </Button>
            }
          />

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {selectedDayVisits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon size={32} className="mx-auto mb-2 opacity-50" />
                <p>Nenhuma visita agendada</p>
              </div>
            ) : (
              selectedDayVisits.map((visit) => (
                <div
                  key={visit.id}
                  onClick={() => handleOpenDetail(visit)}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-500" />
                      <span className="font-semibold text-gray-900">{visit.time}</span>
                    </div>
                    <Badge className={statusColors[visit.status]}>
                      {visit.status}
                    </Badge>
                  </div>
                  <p className="font-medium text-gray-900 mb-1">{visit.leadName}</p>
                  <p className="text-sm text-gray-600 truncate">{visit.service}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <MapPin size={12} />
                    <span className="truncate">{visit.address}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Today's Summary */}
        <Card>
          <CardHeader 
            title="Resumo de Hoje"
            icon={<CheckCircle size={20} />}
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm text-red-700">Visitas agendadas</span>
              <span className="font-bold text-red-900">{todayVisits.filter(v => v.status === 'agendada').length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm text-red-700">Realizadas</span>
              <span className="font-bold text-red-900">{todayVisits.filter(v => v.status === 'realizada').length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm text-red-700">Canceladas</span>
              <span className="font-bold text-red-900">{todayVisits.filter(v => v.status === 'cancelada').length}</span>
            </div>
          </div>
        </Card>

        {/* Quick List */}
        <Card>
          <CardHeader 
            title="PrÃ³ximas Visitas"
            icon={<Navigation size={20} />}
          />
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {visits
              .filter(v => new Date(v.date) >= new Date() && v.status === 'agendada')
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 5)
              .map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => handleOpenDetail(visit)}
                >
                  <div className="w-10 text-center">
                    <p className="text-xs text-gray-500">{format(new Date(visit.date), 'dd/MM')}</p>
                    <p className="text-sm font-semibold">{visit.time}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{visit.leadName}</p>
                    <p className="text-xs text-gray-500 truncate">{visit.service}</p>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>

      {/* New Visit Modal */}
      {/* Modal converted */}

      {/* Visit Detail Modal */}
      {/* Modal converted */}
    </div>
  );
};
