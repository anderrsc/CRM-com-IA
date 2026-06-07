import React, { useEffect, useRef, useState } from 'react';
import { 
  Printer, 
  MapPin, 
  Phone, 
  Calendar,
  Clock,
  User,
  FileText,
  Download,
  MessageSquare,
  Navigation,
  CheckCircle
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, TextArea } from '../components/ui/Input';
import { useStore } from '../store/useStore';
import { MeasurementSheet, Visit } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import { buildVisitText, downloadTextFile, openMap, openWhatsApp } from '../utils/actions';
import { v4 as uuidv4 } from 'uuid';

export const Visitas: React.FC = () => {
  const { visits, measurementSheets, saveMeasurementSheet, leads, users, currentUser } = useStore();
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [measurementSheet, setMeasurementSheet] = useState<MeasurementSheet | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const pendingVisits = visits.filter(v => v.status === 'agendada');

  useEffect(() => {
    if (!selectedVisit) {
      setMeasurementSheet(null);
      return;
    }

    const saved = measurementSheets.find((sheet) => sheet.visitId === selectedVisit.id);
    setMeasurementSheet(saved || {
      id: uuidv4(),
      visitId: selectedVisit.id,
      leadId: selectedVisit.leadId,
      leadName: selectedVisit.leadName,
      service: selectedVisit.service,
      lines: [
        { id: uuidv4(), location: 'Ambiente 1', width: '', height: '', depth: '', quantity: 1, notes: '' },
        { id: uuidv4(), location: 'Ambiente 2', width: '', height: '', depth: '', quantity: 1, notes: '' },
      ],
      generalNotes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }, [measurementSheets, selectedVisit]);

  const updateMeasurementLine = (lineId: string, field: string, value: string | number) => {
    if (!measurementSheet) return;

    setMeasurementSheet({
      ...measurementSheet,
      lines: measurementSheet.lines.map((line) => line.id === lineId ? { ...line, [field]: value } : line),
      updatedAt: new Date(),
    });
  };

  const addMeasurementLine = () => {
    if (!measurementSheet) return;

    setMeasurementSheet({
      ...measurementSheet,
      lines: [
        ...measurementSheet.lines,
        { id: uuidv4(), location: `Ambiente ${measurementSheet.lines.length + 1}`, width: '', height: '', depth: '', quantity: 1, notes: '' },
      ],
      updatedAt: new Date(),
    });
  };

  const saveMeasurements = () => {
    if (!measurementSheet) return;
    saveMeasurementSheet({ ...measurementSheet, updatedAt: new Date() });
    toast.success('Folha de medições salva');
  };

  const handlePrint = () => {
    if (!selectedVisit) return;
    window.print();
  };

  const handleWhatsApp = () => {
    if (!selectedVisit) return;
    const ok = openWhatsApp(selectedVisit.phone, buildVisitText(selectedVisit));
    if (!ok) toast.error('Telefone inválido para WhatsApp');
  };

  const handleOpenMap = () => {
    if (!selectedVisit) return;
    const ok = openMap(selectedVisit.address);
    if (!ok) toast.error('Endereço não informado');
  };

  const handleDownload = () => {
    if (!selectedVisit) return;
    const measurements = measurementSheet
      ? [
          '',
          'MEDICOES',
          ...measurementSheet.lines.map((line) =>
            `${line.location}: L ${line.width || '-'} x A ${line.height || '-'} x P ${line.depth || '-'} | Qtd ${line.quantity} | ${line.notes || ''}`
          ),
          measurementSheet.generalNotes ? `Observacoes gerais: ${measurementSheet.generalNotes}` : '',
        ].filter(Boolean).join('\n')
      : '';
    downloadTextFile(`ficha-visita-${selectedVisit.id.slice(0, 8)}.txt`, `${buildVisitText(selectedVisit)}${measurements}`);
    toast.success('Ficha de visita baixada');
  };

  const formatDateSafe = (value?: Date | string) => {
    if (!value) return 'A definir';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'A definir';
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const selectedLead = selectedVisit ? leads.find((lead) => lead.id === selectedVisit.leadId) : null;
  const measurerName = selectedVisit
    ? users.find((user) => user.id === selectedVisit.assignedTo)?.name || selectedVisit.assignedTo || currentUser?.name || 'A definir'
    : 'A definir';
  const visitKind = selectedVisit && /esquadr|janela|porta|box|vidro/i.test(selectedVisit.service)
    ? 'ESQUADRIAS'
    : 'CALHAS';
  const fullAddress = selectedVisit
    ? [
        selectedLead?.address || selectedVisit.address,
        selectedLead?.neighborhood ? `Bairro ${selectedLead.neighborhood}` : '',
        selectedLead?.city ? `${selectedLead.city}${selectedLead.state ? ` - ${selectedLead.state}` : ''}` : '',
        selectedLead?.zipCode ? `CEP ${selectedLead.zipCode}` : '',
      ].filter(Boolean).join(' | ')
    : '';
  const reference = selectedVisit
    ? selectedLead?.observations || selectedVisit.observations || 'Sem referencia informada'
    : 'Sem referencia informada';
  const availability = selectedVisit
    ? selectedLead?.availability || selectedVisit.time || 'A definir'
    : 'A definir';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fadeIn">
      {/* Visits List */}
      <div className="space-y-4">
        <Card>
          <CardHeader 
            title="Fichas de Visita"
            subtitle={`${pendingVisits.length} visitas pendentes`}
            icon={<FileText size={20} />}
          />
          
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
            {pendingVisits.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <Calendar size={48} className="mx-auto mb-3 opacity-50" />
                <p className="font-medium">Nenhuma visita pendente</p>
                <p className="text-sm">Agende visitas na tela de Agenda</p>
              </div>
            ) : (
              pendingVisits.map((visit) => (
                <div
                  key={visit.id}
                  onClick={() => setSelectedVisit(visit)}
                  className={cn(
                    'p-4 rounded-lg border-2 cursor-pointer transition-all',
                    selectedVisit?.id === visit.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <User size={20} className="text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{visit.leadName}</h4>
                        <p className="text-sm text-gray-600">{visit.service}</p>
                      </div>
                    </div>
                    <Badge variant="info">
                      {format(new Date(visit.date), 'dd/MM')}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-3">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {visit.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone size={14} />
                      {visit.phone}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Visit Card Preview */}
      <div className="space-y-4">
        {selectedVisit ? (
          <>
            {/* Action Buttons */}
            <Card padding="sm">
              <div className="flex flex-wrap gap-3">
                <Button onClick={handlePrint} icon={<Printer size={18} />}>
                  Imprimir
                </Button>
                <Button onClick={handleWhatsApp} variant="success" icon={<MessageSquare size={18} />}>
                  WhatsApp
                </Button>
                <Button onClick={handleOpenMap} variant="secondary" icon={<Navigation size={18} />}>
                  Abrir Mapa
                </Button>
                <Button variant="ghost" onClick={handleDownload} icon={<Download size={18} />}>
                  PDF
                </Button>
              </div>
            </Card>

            {measurementSheet && (
              <Card>
                <CardHeader
                  title="Folha de Medições"
                  subtitle="Preencha no local da visita e salve no sistema"
                  icon={<FileText size={20} />}
                  action={
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={addMeasurementLine}>
                        Adicionar linha
                      </Button>
                      <Button size="sm" onClick={saveMeasurements}>
                        Salvar
                      </Button>
                    </div>
                  }
                />
                <div className="space-y-3">
                  {measurementSheet.lines.map((line) => (
                    <div key={line.id} className="grid grid-cols-12 gap-2 rounded-lg border border-gray-200 p-3">
                      <div className="col-span-12 sm:col-span-3">
                        <Input
                          placeholder="Ambiente / peça"
                          value={line.location}
                          onChange={(event) => updateMeasurementLine(line.id, 'location', event.target.value)}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <Input
                          placeholder="Largura"
                          value={line.width}
                          onChange={(event) => updateMeasurementLine(line.id, 'width', event.target.value)}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <Input
                          placeholder="Altura"
                          value={line.height}
                          onChange={(event) => updateMeasurementLine(line.id, 'height', event.target.value)}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <Input
                          placeholder="Prof."
                          value={line.depth}
                          onChange={(event) => updateMeasurementLine(line.id, 'depth', event.target.value)}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-1">
                        <Input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(event) => updateMeasurementLine(line.id, 'quantity', Number(event.target.value))}
                        />
                      </div>
                      <div className="col-span-8 sm:col-span-2">
                        <Input
                          placeholder="Obs."
                          value={line.notes}
                          onChange={(event) => updateMeasurementLine(line.id, 'notes', event.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                  <TextArea
                    label="Observações gerais"
                    value={measurementSheet.generalNotes}
                    onChange={(event) => setMeasurementSheet({
                      ...measurementSheet,
                      generalNotes: event.target.value,
                      updatedAt: new Date(),
                    })}
                    rows={3}
                  />
                </div>
              </Card>
            )}

            {/* Printable Measurement Sheet */}
            <div id="print-area" ref={printRef} className="print:block">
              <div className="measurement-print-page bg-white rounded-lg border border-gray-200 shadow-sm print:rounded-none print:border-0 print:shadow-none">
                <section className="measurement-print-header">
                  <div className="flex items-start justify-between border-b-2 border-red-600 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-red-600 to-red-800 text-xl font-black text-white">
                        M
                      </div>
                      <div>
                        <h1 className="text-lg font-black leading-tight text-gray-950">Marquinhos Calhas e Esquadrias</h1>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                          Ficha integrada ao CRM
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h2 className="text-base font-black uppercase text-red-700">Ficha de Medição</h2>
                      <p className="text-[11px] font-semibold text-gray-500">Nº {selectedVisit.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-12 gap-2 text-[10px] leading-tight">
                    <div className="col-span-5 rounded-md border border-gray-200 bg-gray-50 p-2">
                      <p className="font-bold uppercase text-gray-500">Cliente</p>
                      <p className="mt-1 text-[12px] font-black text-gray-950">{selectedLead?.name || selectedVisit.leadName}</p>
                    </div>
                    <div className="col-span-3 rounded-md border border-gray-200 bg-gray-50 p-2">
                      <p className="font-bold uppercase text-gray-500">Telefone completo</p>
                      <p className="mt-1 text-[12px] font-black text-gray-950">{selectedLead?.phone || selectedVisit.phone}</p>
                    </div>
                    <div className="col-span-2 rounded-md border border-gray-200 bg-gray-50 p-2">
                      <p className="font-bold uppercase text-gray-500">Tipo</p>
                      <p className="mt-1 text-[12px] font-black text-gray-950">{visitKind}</p>
                    </div>
                    <div className="col-span-2 rounded-md border border-gray-200 bg-gray-50 p-2">
                      <p className="font-bold uppercase text-gray-500">Medidor</p>
                      <p className="mt-1 text-[12px] font-black text-gray-950">{measurerName}</p>
                    </div>

                    <div className="col-span-6 rounded-md border border-gray-200 p-2">
                      <p className="font-bold uppercase text-gray-500">Endereço completo com bairro</p>
                      <p className="mt-1 font-semibold text-gray-900">{fullAddress || 'Endereço não informado'}</p>
                    </div>
                    <div className="col-span-6 rounded-md border border-gray-200 p-2">
                      <p className="font-bold uppercase text-gray-500">Referência</p>
                      <p className="mt-1 font-semibold text-gray-900">{reference}</p>
                    </div>

                    <div className="col-span-4 rounded-md border border-red-100 bg-red-50 p-2">
                      <p className="font-bold uppercase text-red-700">Disponibilidade de horário</p>
                      <p className="mt-1 text-[12px] font-black text-red-900">{availability}</p>
                    </div>
                    <div className="col-span-4 rounded-md border border-red-100 bg-red-50 p-2">
                      <p className="font-bold uppercase text-red-700">Data de solicitação</p>
                      <p className="mt-1 text-[12px] font-black text-red-900">{formatDateSafe(selectedLead?.createdAt || selectedVisit.createdAt)}</p>
                    </div>
                    <div className="col-span-4 rounded-md border border-red-100 bg-red-50 p-2">
                      <p className="font-bold uppercase text-red-700">Data de medição</p>
                      <p className="mt-1 text-[12px] font-black text-red-900">
                        {formatDateSafe(selectedVisit.date)} {selectedVisit.time ? `às ${selectedVisit.time}` : ''}
                      </p>
                    </div>
                  </div>
                </section>
                <div className="measurement-print-blank" aria-label="Área em branco para medições manuais" />
              </div>

              <Card className="hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                      M
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">Marquinhos</h1>
                      <p className="text-sm text-gray-500">Esquadrias • Alumínio • Vidros • Calhas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-lg font-bold text-red-600">FICHA DE VISITA</h2>
                    <p className="text-sm text-gray-500">Nº {selectedVisit.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>

                {/* Visit Info */}
                <div className="space-y-5">
                  {/* Client Section */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <User size={18} />
                      DADOS DO CLIENTE
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Nome</p>
                        <p className="font-semibold text-lg">{selectedVisit.leadName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Telefone</p>
                        <p className="font-semibold text-lg">{selectedVisit.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Service Section */}
                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FileText size={18} />
                      SERVIÇO SOLICITADO
                    </h3>
                    <p className="text-lg font-medium text-red-900">{selectedVisit.service}</p>
                  </div>

                  {/* Address Section */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <MapPin size={18} />
                      ENDEREÇO
                    </h3>
                    <p className="text-lg">{selectedVisit.address}</p>
                  </div>

                  {/* Date/Time Section */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <h3 className="font-semibold text-gray-700 mb-2 flex items-center justify-center gap-2">
                        <Calendar size={18} />
                        DATA
                      </h3>
                      <p className="text-2xl font-bold text-red-700">
                        {format(new Date(selectedVisit.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <h3 className="font-semibold text-gray-700 mb-2 flex items-center justify-center gap-2">
                        <Clock size={18} />
                        HORÁRIO
                      </h3>
                      <p className="text-2xl font-bold text-red-700">{selectedVisit.time}</p>
                    </div>
                  </div>

                  {/* Observations */}
                  {selectedVisit.observations && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-700 mb-2">OBSERVAÇÕES</h3>
                      <p className="text-gray-700">{selectedVisit.observations}</p>
                    </div>
                  )}

                  {/* Notes Section (for printing) */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-2">ANOTAÇÕES DA VISITA</h3>
                    <div className="h-32 print:h-48"></div>
                  </div>

                  {/* Measurements Section (for printing) */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-2">MEDIDAS</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          <th className="py-2">Ambiente</th>
                          <th className="py-2">Largura</th>
                          <th className="py-2">Altura</th>
                          <th className="py-2">Prof.</th>
                          <th className="py-2">Qtd</th>
                          <th className="py-2">Obs.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(measurementSheet?.lines || []).map((line) => (
                          <tr key={line.id} className="border-b">
                            <td className="py-2">{line.location}</td>
                            <td className="py-2">{line.width || '____'}</td>
                            <td className="py-2">{line.height || '____'}</td>
                            <td className="py-2">{line.depth || '____'}</td>
                            <td className="py-2">{line.quantity}</td>
                            <td className="py-2">{line.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {measurementSheet?.generalNotes && (
                      <p className="mt-3 text-sm text-gray-700">{measurementSheet.generalNotes}</p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-red-500" />
                      <span>Gerado automaticamente por Marquinhos</span>
                    </div>
                    <span>{format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                </div>
              </Card>
            </div>
          </>
        ) : (
          <Card className="flex flex-col items-center justify-center h-96">
            <FileText size={64} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Selecione uma Visita</h3>
            <p className="text-gray-500 text-center">
              Clique em uma visita à esquerda para visualizar e imprimir a ficha
            </p>
          </Card>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            min-height: 297mm;
            background: white;
          }
          .measurement-print-page {
            width: 210mm;
            min-height: 297mm;
            padding: 10mm;
            background: white;
          }
          .measurement-print-header {
            max-height: 58mm;
            overflow: hidden;
          }
          .measurement-print-blank {
            height: 220mm;
            background: white;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
