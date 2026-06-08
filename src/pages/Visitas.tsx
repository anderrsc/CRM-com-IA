import React, { useEffect, useState } from 'react';
import { Printer, MapPin, Phone, Calendar, Clock, User, FileText, Download, MessageSquare, Navigation, CheckCircle, Plus, Trash2, ChevronLeft, ArrowRight, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useStore } from '../store/useStore';
import { MeasurementSheet, Visit } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import { buildVisitText, downloadTextFile, openMap, openWhatsApp } from '../utils/actions';
import { v4 as uuidv4 } from 'uuid';

type View = 'list' | 'ficha';

export const Visitas: React.FC = () => {
  const { visits, measurementSheets, saveMeasurementSheet, leads, users, currentUser, quoteSettings } = useStore();
  const [view, setView] = useState<View>('list');
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [measurementSheet, setMeasurementSheet] = useState<MeasurementSheet | null>(null);

  const pendingVisits = visits.filter(v => v.status === 'agendada');

  useEffect(() => {
    if (!selectedVisit) return;
    const saved = measurementSheets.find(s => s.visitId === selectedVisit.id);
    setMeasurementSheet(saved || {
      id: uuidv4(), visitId: selectedVisit.id, leadId: selectedVisit.leadId,
      leadName: selectedVisit.leadName, service: selectedVisit.service,
      lines: [
        { id: uuidv4(), location: 'Fachada Principal', width: '', height: '', depth: '', quantity: 1, notes: '' },
        { id: uuidv4(), location: 'Lateral Direita', width: '', height: '', depth: '', quantity: 1, notes: '' },
        { id: uuidv4(), location: 'Lateral Esquerda', width: '', height: '', depth: '', quantity: 1, notes: '' },
        { id: uuidv4(), location: 'Fundos', width: '', height: '', depth: '', quantity: 1, notes: '' },
      ],
      generalNotes: '', createdAt: new Date(), updatedAt: new Date(),
    });
  }, [selectedVisit, measurementSheets]);

  const updateLine = (lineId: string, field: string, value: string | number) => {
    if (!measurementSheet) return;
    setMeasurementSheet({ ...measurementSheet, lines: measurementSheet.lines.map(l => l.id === lineId ? { ...l, [field]: value } : l), updatedAt: new Date() });
  };
  const addLine = () => {
    if (!measurementSheet) return;
    setMeasurementSheet({ ...measurementSheet, lines: [...measurementSheet.lines, { id: uuidv4(), location: 'Novo Ambiente', width: '', height: '', depth: '', quantity: 1, notes: '' }], updatedAt: new Date() });
  };
  const removeLine = (lineId: string) => {
    if (!measurementSheet) return;
    setMeasurementSheet({ ...measurementSheet, lines: measurementSheet.lines.filter(l => l.id !== lineId), updatedAt: new Date() });
  };
  const saveMeasurements = () => {
    if (!measurementSheet) return;
    saveMeasurementSheet({ ...measurementSheet, updatedAt: new Date() });
    toast.success('Folha de medições salva!');
  };
  const openVisit = (visit: Visit) => { setSelectedVisit(visit); setView('ficha'); };

  const handlePrint = () => {
    if (!selectedVisit || !measurementSheet) return;
    const lead = leads.find(l => l.id === selectedVisit.leadId);
    const medidor = users.find(u => u.id === selectedVisit.assignedTo)?.name || currentUser?.name || 'Técnico';
    const tipo = /esquadr|janela|porta|box|vidro/i.test(selectedVisit.service) ? 'ESQUADRIAS' : 'CALHAS';
    const logoUrl = (quoteSettings as any)?.logoUrl || '';
    const companyName = (quoteSettings as any)?.companyName || 'Marquinhos';
    const companyPhone = (quoteSettings as any)?.phone || '';

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"/>
<title>Ficha ${selectedVisit.leadName}</title>
<style>
  @page { margin: 10mm 12mm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
  body { font-size: 11px; color: #111; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #dc2626; padding-bottom: 8px; margin-bottom: 10px; }
  .logo-area { display: flex; align-items: center; gap: 10px; }
  .logo-img { width: 44px; height: 44px; object-fit: contain; border-radius: 6px; }
  .logo-fallback { width: 44px; height: 44px; background: linear-gradient(135deg,#dc2626,#991b1b); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 20px; font-weight: 900; }
  .co h1 { font-size: 16px; font-weight: 900; color: #1a1a2e; }
  .co p { font-size: 10px; color: #555; }
  .title-right { text-align: right; }
  .title-right h2 { font-size: 17px; font-weight: 900; color: #dc2626; }
  .title-right p { font-size: 10px; color: #777; margin-top: 2px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-bottom: 10px; }
  .ib { border: 1px solid #e5e7eb; border-radius: 6px; padding: 7px 10px; background: #f9fafb; }
  .ib label { font-size: 8.5px; font-weight: 700; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.06em; display: block; margin-bottom: 3px; }
  .ib .v { font-size: 12px; font-weight: 700; color: #111; }
  .ib .vs { font-size: 10px; color: #555; margin-top: 1px; }
  .bairro { display: inline-block; background: #dc2626; color: #fff; font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 20px; margin-top: 4px; letter-spacing: 0.04em; }
  .sec { background: #1a1a2e; color: #fff; padding: 5px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  thead { background: #374151; color: #fff; }
  thead th { padding: 6px 8px; font-size: 10px; font-weight: 700; text-align: left; text-transform: uppercase; }
  thead th.c { text-align: center; }
  tbody tr { border-bottom: 1px solid #f0f0f0; }
  tbody tr:nth-child(even) { background: #f9fafb; }
  tbody td { padding: 7px 8px; font-size: 11px; }
  tbody td.c { text-align: center; }
  .obs-box { border: 1px solid #e5e7eb; border-radius: 0 0 6px 6px; padding: 10px; min-height: 50px; background: #fffbeb; font-size: 11px; margin-bottom: 12px; }
  .obs-empty { color: #9ca3af; font-style: italic; font-size: 10px; }
  .sig { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 14px; }
  .sb { padding-top: 5px; text-align: center; }
  .sb .sl { font-size: 10px; color: #666; margin-bottom: 24px; }
  .sb .sline { border-top: 1px solid #374151; padding-top: 4px; font-size: 11px; font-weight: 600; }
  .footer { text-align: center; font-size: 9px; color: #9ca3af; margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 5px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>

<div class="header">
  <div class="logo-area">
    ${logoUrl
      ? '<img src="' + logoUrl + '" class="logo-img" onerror="this.style.display=\'none\'" />'
      : '<div class="logo-fallback" style="display:flex;align-items:center;justify-content:center">M</div>'
    }
    <div class="co">
      <h1>${companyName}</h1>
      <p>Calhas · Esquadrias · Alumínio</p>
    </div>
  </div>
  <div class="title-right">
    <h2>FICHA DE MEDIÇÃO · ${tipo}</h2>
    <p>N ${selectedVisit.id.slice(0,8).toUpperCase()} · ${format(new Date(selectedVisit.date),'dd/MM/yyyy',{locale:ptBR})} às ${selectedVisit.time}</p>
  </div>
</div>

<div class="info-grid">
  <div class="ib">
    <label>Cliente</label>
    <div class="v">${selectedVisit.leadName}</div>
    <div class="vs">${selectedVisit.phone || '—'}</div>
  </div>
  <div class="ib">
    <label>Endereço</label>
    <div class="v">${lead?.address || selectedVisit.address || '—'}</div>
    ${lead?.neighborhood ? '<span class="bairro">' + lead.neighborhood + '</span>' : ''}
    ${lead?.city ? '<div class="vs" style="margin-top:4px">' + lead.city + (lead.state ? '/' + lead.state : '') + '</div>' : ''}
  </div>
  <div class="ib">
    <label>Serviço</label>
    <div class="v">${selectedVisit.service}</div>
  </div>
  <div class="ib">
    <label>Técnico Responsável</label>
    <div class="v">${medidor}</div>
  </div>
</div>

${measurementSheet.lines.length > 0 ? `
<div class="sec">Folha de Medições</div>
<table>
  <thead><tr>
    <th style="width:185px">Ambiente / Local</th>
    <th class="c" style="width:80px">Largura (m)</th>
    <th class="c" style="width:80px">Altura (m)</th>
    <th class="c" style="width:80px">Prof. (m)</th>
    <th class="c" style="width:50px">Qtd</th>
    <th>Observações</th>
  </tr></thead>
  <tbody>
    ${measurementSheet.lines.map(l => '<tr><td style="font-weight:600">' + (l.location||'') + '</td><td class="c">' + (l.width||'—') + '</td><td class="c">' + (l.height||'—') + '</td><td class="c">' + (l.depth||'—') + '</td><td class="c">' + (l.quantity||1) + '</td><td>' + (l.notes||'') + '</td></tr>').join('')}
  </tbody>
</table>` : ''}

<div class="sec" style="margin-bottom:0">Observações Gerais</div>
<div class="obs-box">
  ${measurementSheet.generalNotes
    ? '<p style="line-height:1.5">' + measurementSheet.generalNotes + '</p>'
    : '<p class="obs-empty">Nenhuma observação registrada.</p>'
  }
</div>

<div class="sig">
  <div class="sb"><div class="sl">Assinatura do Técnico</div><div class="sline">${medidor}</div></div>
  <div class="sb"><div class="sl">Assinatura do Cliente (ciente da visita)</div><div class="sline">${selectedVisit.leadName}</div></div>
</div>

<div class="footer">${companyName}${companyPhone ? ' · ' + companyPhone : ''} · Jaraguá do Sul – SC · Ficha de visita técnica de medição.</div>
</body></html>`;

    const win = window.open('', '_blank');
    if (!win) { toast.error('Permita pop-ups para imprimir'); return; }
    win.document.write(html); win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  const handleWhatsApp = () => { if (!selectedVisit) return; openWhatsApp(selectedVisit.phone, buildVisitText(selectedVisit)); };
  const handleDownload = () => {
    if (!selectedVisit || !measurementSheet) return;
    const lines = measurementSheet.lines.map(l => l.location + ': L=' + (l.width||'-') + ' A=' + (l.height||'-') + ' P=' + (l.depth||'-') + ' Qtd=' + l.quantity + (l.notes ? ' | ' + l.notes : '')).join('\n');
    downloadTextFile('ficha-' + selectedVisit.leadName.replace(/\s+/g,'-') + '.txt', buildVisitText(selectedVisit) + '\n\nMEDIÇÕES:\n' + lines + (measurementSheet.generalNotes ? '\n\nObs: ' + measurementSheet.generalNotes : ''));
    toast.success('Arquivo baixado');
  };
  const formatDate = (v?: Date | string) => { if (!v) return '—'; const d = new Date(v); return isNaN(d.getTime()) ? '—' : format(d, 'dd/MM/yyyy', { locale: ptBR }); };

  // ── FICHA VIEW ──────────────────────────────────────────────────────
  if (view === 'ficha' && selectedVisit && measurementSheet) {
    const lead = leads.find(l => l.id === selectedVisit.leadId);
    const medidor = users.find(u => u.id === selectedVisit.assignedTo)?.name || currentUser?.name || 'Técnico';
    const isSaved = measurementSheets.some(s => s.visitId === selectedVisit.id);
    return (
      <div className="animate-fadeIn space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => { setView('list'); setSelectedVisit(null); }} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft size={18}/> Voltar para Fichas
          </button>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button size="sm" variant="ghost" onClick={handleWhatsApp} icon={<MessageSquare size={15}/>}>WhatsApp</Button>
            <Button size="sm" variant="ghost" onClick={() => openMap(selectedVisit.address)} icon={<Navigation size={15}/>}>Mapa</Button>
            <Button size="sm" variant="outline" onClick={handleDownload} icon={<Download size={15}/>}>Baixar</Button>
            <Button size="sm" variant="secondary" onClick={handlePrint} icon={<Printer size={15}/>}>Imprimir</Button>
            <Button size="sm" onClick={saveMeasurements} icon={<Save size={15}/>}>{isSaved ? 'Atualizar' : 'Salvar Medições'}</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Cliente', value: selectedVisit.leadName, icon: <User size={16}/> },
            { label: 'Telefone', value: selectedVisit.phone || '—', icon: <Phone size={16}/> },
            { label: 'Data', value: formatDate(selectedVisit.date) + ' às ' + selectedVisit.time, icon: <Calendar size={16}/> },
            { label: 'Serviço', value: selectedVisit.service, icon: <FileText size={16}/> },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-1">{item.icon}<span className="text-xs font-semibold uppercase tracking-wide">{item.label}</span></div>
              <p className="font-semibold text-gray-900 text-sm">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-red-500"/>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Endereço</span>
          </div>
          <p className="font-semibold text-gray-900">{lead?.address || selectedVisit.address || '—'}</p>
          {lead?.neighborhood && (
            <span className="inline-block mt-1.5 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              {lead.neighborhood}
            </span>
          )}
          {lead?.city && <p className="text-sm text-gray-500 mt-1">{lead.city}{lead.state ? '/' + lead.state : ''}</p>}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
            <div>
              <h3 className="font-bold text-gray-900">Folha de Medições</h3>
              <p className="text-xs text-gray-500 mt-0.5">Técnico: {medidor} · {measurementSheet.lines.length} ambiente(s)</p>
            </div>
            <div className="flex items-center gap-2">
              {isSaved && <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle size={14}/> Salvo</span>}
              <Button size="sm" variant="outline" onClick={addLine} icon={<Plus size={14}/>}>Adicionar linha</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold w-48">Ambiente / Local</th>
                  <th className="text-center px-3 py-3 font-semibold w-28">Largura (m)</th>
                  <th className="text-center px-3 py-3 font-semibold w-28">Altura (m)</th>
                  <th className="text-center px-3 py-3 font-semibold w-28">Prof. (m)</th>
                  <th className="text-center px-3 py-3 font-semibold w-20">Qtd</th>
                  <th className="text-left px-4 py-3 font-semibold">Observações</th>
                  <th className="px-3 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {measurementSheet.lines.map((line, idx) => (
                  <tr key={line.id} className={cn('border-t border-gray-100', idx % 2 === 1 && 'bg-gray-50/50')}>
                    <td className="px-4 py-2.5">
                      <input value={line.location} onChange={e => updateLine(line.id, 'location', e.target.value)}
                        className="w-full bg-transparent border-b border-gray-200 focus:border-red-400 outline-none text-sm font-semibold py-0.5"/>
                    </td>
                    {(['width','height','depth'] as const).map(field => (
                      <td key={field} className="px-3 py-2.5 text-center">
                        <input type="number" step="0.01" min="0" value={line[field]}
                          onChange={e => updateLine(line.id, field, e.target.value)} placeholder="0,00"
                          className="w-24 text-center bg-transparent border border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 outline-none text-sm py-1.5 px-2"/>
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-center">
                      <input type="number" min="1" value={line.quantity}
                        onChange={e => updateLine(line.id, 'quantity', Number(e.target.value))}
                        className="w-16 text-center bg-transparent border border-gray-200 rounded-lg focus:border-red-400 outline-none text-sm py-1.5 px-2"/>
                    </td>
                    <td className="px-4 py-2.5">
                      <input value={line.notes} onChange={e => updateLine(line.id, 'notes', e.target.value)}
                        placeholder="Notas..." className="w-full bg-transparent border-b border-gray-200 focus:border-red-400 outline-none text-sm py-0.5"/>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={() => removeLine(line.id)}
                        className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={14}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 border-t border-gray-100">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Observações Gerais</label>
            <textarea value={measurementSheet.generalNotes}
              onChange={e => setMeasurementSheet({ ...measurementSheet, generalNotes: e.target.value })}
              placeholder="Ex: Calha precisa emenda, cliente prefere cor Natural..."
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:border-red-400 focus:ring-1 focus:ring-red-200 outline-none bg-amber-50/30"/>
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            <p className="text-xs text-gray-400">
              {isSaved ? 'Salvo em ' + format(new Date(measurementSheet.updatedAt), 'dd/MM HH:mm', { locale: ptBR }) : 'Ainda não salvo'}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handlePrint} icon={<Printer size={14}/>}>Imprimir Ficha</Button>
              <Button size="sm" onClick={saveMeasurements} icon={<Save size={14}/>}>{isSaved ? 'Atualizar no Banco' : 'Salvar no Banco'}</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ───────────────────────────────────────────────────────
  return (
    <div className="animate-fadeIn space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{pendingVisits.length} visitas pendentes</h2>
          <p className="text-sm text-gray-500">Clique em uma visita para abrir a ficha de medição</p>
        </div>
      </div>
      {pendingVisits.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <Calendar size={48} className="mx-auto mb-3 text-gray-300"/>
          <h3 className="font-semibold text-gray-700">Nenhuma visita pendente</h3>
          <p className="text-sm text-gray-400 mt-1">Agende visitas na tela de Agenda</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingVisits.map(visit => {
            const hasMeasurement = measurementSheets.some(s => s.visitId === visit.id);
            const visitLead = leads.find(l => l.id === visit.leadId);
            return (
              <div key={visit.id} onClick={() => openVisit(visit)}
                className="bg-white rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-md transition-all cursor-pointer group">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-lg">
                        {visit.leadName[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">{visit.leadName}</h3>
                        <p className="text-sm text-gray-500">{visit.service}</p>
                        {visitLead?.neighborhood && (
                          <span className="inline-block mt-1 bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {visitLead.neighborhood}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasMeasurement && (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium border border-green-100">
                          <CheckCircle size={12}/> Medição salva
                        </span>
                      )}
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">{visit.status}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600"><Calendar size={14} className="text-gray-400"/><span>{formatDate(visit.date)}</span></div>
                    <div className="flex items-center gap-2 text-gray-600"><Clock size={14} className="text-gray-400"/><span>{visit.time || '—'}</span></div>
                    <div className="flex items-center gap-2 text-gray-600"><Phone size={14} className="text-gray-400"/><span>{visit.phone || '—'}</span></div>
                    <div className="flex items-center gap-2 text-gray-600"><MapPin size={14} className="text-gray-400"/><span className="truncate">{visit.address || '—'}</span></div>
                  </div>
                </div>
                <div className="px-5 py-3 bg-gray-50 rounded-b-xl border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{hasMeasurement ? 'Ficha preenchida' : 'Ficha pendente'}</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-red-600 group-hover:translate-x-1 transition-transform">
                    Abrir Ficha <ArrowRight size={14}/>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};