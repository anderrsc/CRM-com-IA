import React, { useEffect, useState } from 'react';
import {
  Printer, MapPin, Phone, Calendar, Clock, User, FileText,
  Download, MessageSquare, Navigation, CheckCircle, Plus,
  Trash2, ChevronLeft, ArrowRight, Save
} from 'lucide-react';
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
      lines: [], generalNotes: '', createdAt: new Date(), updatedAt: new Date(),
    });
  }, [selectedVisit, measurementSheets]);

  const updateLine = (id: string, field: string, value: string | number) => {
    if (!measurementSheet) return;
    setMeasurementSheet({ ...measurementSheet, lines: measurementSheet.lines.map(l => l.id === id ? { ...l, [field]: value } : l), updatedAt: new Date() });
  };
  const addLine = () => {
    if (!measurementSheet) return;
    setMeasurementSheet({ ...measurementSheet, lines: [...measurementSheet.lines, { id: uuidv4(), location: 'Ambiente ' + (measurementSheet.lines.length + 1), width: '', height: '', depth: '', quantity: 1, notes: '' }], updatedAt: new Date() });
  };
  const removeLine = (id: string) => {
    if (!measurementSheet) return;
    setMeasurementSheet({ ...measurementSheet, lines: measurementSheet.lines.filter(l => l.id !== id), updatedAt: new Date() });
  };
  const saveMeasurements = () => {
    if (!measurementSheet) return;
    saveMeasurementSheet({ ...measurementSheet, updatedAt: new Date() });
    toast.success('Folha de medições salva!');
  };
  const openVisit = (v: Visit) => { setSelectedVisit(v); setView('ficha'); };

  const handlePrint = () => {
    if (!selectedVisit || !measurementSheet) return;
    const lead = leads.find(l => l.id === selectedVisit.leadId);
    const medidor = users.find(u => u.id === selectedVisit.assignedTo)?.name || currentUser?.name || 'Técnico';
    const tipo = /esquadr|janela|porta|box|vidro/i.test(selectedVisit.service) ? 'ESQUADRIAS' : 'CALHAS';
    const qs = quoteSettings as any;
    const logoUrl = qs?.logoUrl || '';
    const empresa = qs?.companyName || 'Marquinhos';
    const tel = qs?.phone || '';
    const agora = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    const hasLines = measurementSheet.lines.length > 0;
    const tipoColor = tipo === 'CALHAS' ? '#1d4ed8' : '#be185d';
    const tipoBg = tipo === 'CALHAS' ? '#dbeafe' : '#fce7f3';
    const tipoEmoji = tipo === 'CALHAS' ? '🏗 Calhas' : '🪟 Esquadrias';

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
<title>Ficha ${selectedVisit.leadName}</title>
<style>
  @page{margin:8mm 10mm;size:A4}
  *{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif}
  body{font-size:10px;color:#111;line-height:1.3}
  .hdr{display:flex;align-items:center;justify-content:space-between;border-bottom:2.5px solid #dc2626;padding-bottom:6px;margin-bottom:8px}
  .hdr-l{display:flex;align-items:center;gap:8px}
  .logo-img{width:36px;height:36px;object-fit:contain;border-radius:5px}
  .logo-fb{width:36px;height:36px;background:linear-gradient(135deg,#dc2626,#991b1b);border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:17px;font-weight:900}
  .co-name{font-size:14px;font-weight:900;color:#1a1a2e}
  .co-sub{font-size:9px;color:#666}
  .hdr-r{text-align:right}
  .tipo{font-size:14px;font-weight:900;color:#dc2626}
  .num{font-size:8.5px;color:#888;margin-top:1px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:8px}
  .cell{border:1px solid #e5e7eb;border-radius:5px;padding:5px 8px;background:#f9fafb}
  .cell label{font-size:7.5px;font-weight:700;text-transform:uppercase;color:#9ca3af;letter-spacing:.06em;display:block;margin-bottom:2px}
  .cell .v{font-size:11px;font-weight:700;color:#111;line-height:1.3}
  .cell .s{font-size:9px;color:#555;margin-top:1px}
  .bairro{display:inline-block;background:#dc2626;color:#fff;font-size:8px;font-weight:700;padding:1.5px 7px;border-radius:20px;margin-top:3px;letter-spacing:.04em}
  .tbadge{display:inline-block;font-size:9px;font-weight:700;padding:2px 8px;border-radius:20px;margin-top:3px}
  .sec{background:#1a1a2e;color:#fff;padding:4px 8px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
  table{width:100%;border-collapse:collapse;margin-bottom:8px}
  thead th{background:#374151;color:#fff;padding:4px 6px;font-size:8.5px;font-weight:700;text-align:left;text-transform:uppercase}
  thead th.c{text-align:center}
  tbody tr{border-bottom:1px solid #f0f0f0}
  tbody tr:nth-child(even){background:#f9fafb}
  tbody td{padding:5px 6px;font-size:10px;vertical-align:middle}
  tbody td.c{text-align:center}
  .obs-box{border:1px solid #e5e7eb;border-radius:0 0 5px 5px;padding:8px;background:#fffbeb;min-height:44px;margin-bottom:10px}
  .obs-t{font-size:10px;color:#333;line-height:1.5}
  .obs-e{font-size:9px;color:#aaa;font-style:italic}
  .sig{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:10px}
  .sb{text-align:center}
  .sb .sl{font-size:9px;color:#777;margin-bottom:22px}
  .sb .sline{border-top:1px solid #374151;padding-top:3px;font-size:10px;font-weight:600}
  .footer{text-align:center;font-size:8px;color:#9ca3af;margin-top:8px;border-top:1px solid #e5e7eb;padding-top:5px}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>

<div class="hdr">
  <div class="hdr-l">
    ${logoUrl ? `<img src="${logoUrl}" class="logo-img" onerror="this.style.display='none'"/>` : '<div class="logo-fb" style="display:flex;align-items:center;justify-content:center">M</div>'}
    <div><div class="co-name">${empresa}</div><div class="co-sub">Calhas · Esquadrias · Alumínio</div></div>
  </div>
  <div class="hdr-r">
    <div class="tipo">FICHA DE MEDIÇÃO · ${tipo}</div>
    <div class="num">Nº ${selectedVisit.id.slice(0, 8).toUpperCase()} · ${format(new Date(selectedVisit.date), 'dd/MM/yyyy', { locale: ptBR })} às ${selectedVisit.time} · Impresso: ${agora}</div>
  </div>
</div>

<div class="grid2">
  <div class="cell">
    <label>Cliente</label>
    <div class="v">${selectedVisit.leadName}</div>
    <div class="s">${selectedVisit.phone || '—'}</div>
    <span class="tbadge" style="background:${tipoBg};color:${tipoColor}">${tipoEmoji}</span>
  </div>
  <div class="cell">
    <label>Endereço</label>
    <div class="v">${lead?.address || selectedVisit.address || '—'}</div>
    ${lead?.neighborhood ? `<span class="bairro">${lead.neighborhood}</span>` : ''}
    ${lead?.city ? `<div class="s" style="margin-top:3px">${lead.city}${lead.state ? '/' + lead.state : ''}</div>` : ''}
  </div>
  <div class="cell">
    <label>Serviço / Descrição</label>
    <div class="v" style="font-size:10px;white-space:normal;line-height:1.4">${selectedVisit.service}</div>
  </div>
  <div class="cell">
    <label>Técnico · Disponibilidade do cliente</label>
    <div class="v">${medidor}</div>
    <div class="s">${(lead as any)?.availability || 'Disponibilidade não informada'}</div>
  </div>
</div>

${hasLines ? `
<div class="sec">Folha de Medições</div>
<table>
  <thead><tr>
    <th style="width:155px">Ambiente / Local</th>
    <th class="c" style="width:66px">Largura(m)</th>
    <th class="c" style="width:66px">Altura(m)</th>
    <th class="c" style="width:66px">Prof.(m)</th>
    <th class="c" style="width:42px">Qtd</th>
    <th>Observações</th>
  </tr></thead>
  <tbody>
    ${measurementSheet.lines.map(l => `<tr><td style="font-weight:600">${l.location || ''}</td><td class="c">${l.width || '—'}</td><td class="c">${l.height || '—'}</td><td class="c">${l.depth || '—'}</td><td class="c">${l.quantity || 1}</td><td>${l.notes || ''}</td></tr>`).join('')}
    <tr style="border-top:1.5px dashed #e5e7eb"><td colspan="6" style="height:20px;text-align:center;color:#bbb;font-size:8.5px;font-style:italic">Linha adicional se necessário</td></tr>
  </tbody>
</table>` : ''}

<div class="sec" style="margin-bottom:0">Observações Gerais</div>
<div class="obs-box">
  ${measurementSheet.generalNotes ? `<p class="obs-t">${measurementSheet.generalNotes}</p>` : '<p class="obs-e">Nenhuma observação. Use este espaço no local da visita.</p>'}
</div>

<div class="sig">
  <div class="sb"><div class="sl">Assinatura do Técnico</div><div class="sline">${medidor}</div></div>
  <div class="sb"><div class="sl">Assinatura do Cliente (ciente da visita)</div><div class="sline">${selectedVisit.leadName}</div></div>
</div>

<div class="footer">${empresa}${tel ? ' · ' + tel : ''} · Jaraguá do Sul – SC · Ficha de visita técnica de medição · ${agora}</div>
</body></html>`;

    const win = window.open('', '_blank');
    if (!win) { toast.error('Permita pop-ups para imprimir'); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  const handleWhatsApp = () => { if (!selectedVisit) return; openWhatsApp(selectedVisit.phone, buildVisitText(selectedVisit)); };
  const handleDownload = () => {
    if (!selectedVisit || !measurementSheet) return;
    const lines = measurementSheet.lines.map(l => l.location + ': L=' + (l.width || '-') + ' A=' + (l.height || '-') + ' P=' + (l.depth || '-') + ' Qtd=' + l.quantity + (l.notes ? ' | ' + l.notes : '')).join('\n');
    downloadTextFile('ficha-' + selectedVisit.leadName.replace(/\s+/g, '-') + '.txt', buildVisitText(selectedVisit) + '\n\nMEDIÇÕES:\n' + lines + (measurementSheet.generalNotes ? '\n\nObs: ' + measurementSheet.generalNotes : ''));
    toast.success('Arquivo baixado');
  };
  const fmtDate = (v?: Date | string) => { if (!v) return '—'; const d = new Date(v); return isNaN(d.getTime()) ? '—' : format(d, 'dd/MM/yyyy', { locale: ptBR }); };

  // ── FICHA VIEW ──────────────────────────────────────────────────────
  if (view === 'ficha' && selectedVisit && measurementSheet) {
    const lead = leads.find(l => l.id === selectedVisit.leadId);
    const medidor = users.find(u => u.id === selectedVisit.assignedTo)?.name || currentUser?.name || 'Técnico';
    const isSaved = measurementSheets.some(s => s.visitId === selectedVisit.id);
    return (
      <div className="animate-fadeIn space-y-4 pb-8">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <button onClick={() => { setView('list'); setSelectedVisit(null); }} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <ChevronLeft size={18} /> Voltar para Fichas
          </button>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="ghost" onClick={handleWhatsApp} icon={<MessageSquare size={14} />}>WhatsApp</Button>
            <Button size="sm" variant="ghost" onClick={() => openMap(selectedVisit.address)} icon={<Navigation size={14} />}>Mapa</Button>
            <Button size="sm" variant="outline" onClick={handleDownload} icon={<Download size={14} />}>Baixar</Button>
            <Button size="sm" variant="secondary" onClick={handlePrint} icon={<Printer size={14} />}>Imprimir</Button>
            <Button size="sm" onClick={saveMeasurements} icon={<Save size={14} />}>{isSaved ? 'Atualizar' : 'Salvar Medições'}</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Cliente', value: selectedVisit.leadName, icon: <User size={14} /> },
            { label: 'Telefone', value: selectedVisit.phone || '—', icon: <Phone size={14} /> },
            { label: 'Data / Hora', value: fmtDate(selectedVisit.date) + ' às ' + selectedVisit.time, icon: <Calendar size={14} /> },
            { label: 'Serviço', value: selectedVisit.service, icon: <FileText size={14} /> },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-3.5">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">{item.icon}<span className="text-xs font-semibold uppercase tracking-wide">{item.label}</span></div>
              <p className="font-semibold text-gray-900 text-sm leading-tight">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-start gap-2">
            <MapPin size={15} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wide text-gray-400 block mb-1">Endereço</span>
              <p className="font-semibold text-gray-900 text-sm">{lead?.address || selectedVisit.address || '—'}</p>
              {lead?.neighborhood && <span className="inline-block mt-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{lead.neighborhood}</span>}
              {lead?.city && <p className="text-xs text-gray-500 mt-1">{lead.city}{lead.state ? '/' + lead.state : ''}</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Folha de Medições</h3>
              <p className="text-xs text-gray-500">Técnico: {medidor} · {measurementSheet.lines.length} linha(s)</p>
            </div>
            <div className="flex items-center gap-2">
              {isSaved && <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle size={13} /> Salvo</span>}
              <Button size="sm" variant="outline" onClick={addLine} icon={<Plus size={13} />}>+ Linha</Button>
            </div>
          </div>

          {measurementSheet.lines.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-400">Nenhuma linha de medição ainda.</p>
              <button onClick={addLine} className="mt-2 text-sm text-red-600 hover:underline font-medium">+ Adicionar primeira linha</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold text-xs">Ambiente</th>
                    <th className="text-center px-2 py-2.5 font-semibold text-xs w-24">Largura(m)</th>
                    <th className="text-center px-2 py-2.5 font-semibold text-xs w-24">Altura(m)</th>
                    <th className="text-center px-2 py-2.5 font-semibold text-xs w-24">Prof.(m)</th>
                    <th className="text-center px-2 py-2.5 font-semibold text-xs w-16">Qtd</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-xs">Obs</th>
                    <th className="px-2 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {measurementSheet.lines.map((line, idx) => (
                    <tr key={line.id} className={cn('border-t border-gray-100', idx % 2 === 1 && 'bg-gray-50/50')}>
                      <td className="px-4 py-2"><input value={line.location} onChange={e => updateLine(line.id, 'location', e.target.value)} className="w-full bg-transparent border-b border-gray-200 focus:border-red-400 outline-none text-sm font-semibold py-0.5" /></td>
                      {(['width', 'height', 'depth'] as const).map(f => (
                        <td key={f} className="px-2 py-2 text-center"><input type="number" step="0.01" min="0" value={line[f]} onChange={e => updateLine(line.id, f, e.target.value)} placeholder="—" className="w-20 text-center bg-transparent border border-gray-200 rounded focus:border-red-400 outline-none text-sm py-1 px-1.5" /></td>
                      ))}
                      <td className="px-2 py-2 text-center"><input type="number" min="1" value={line.quantity} onChange={e => updateLine(line.id, 'quantity', Number(e.target.value))} className="w-14 text-center bg-transparent border border-gray-200 rounded focus:border-red-400 outline-none text-sm py-1" /></td>
                      <td className="px-4 py-2"><input value={line.notes} onChange={e => updateLine(line.id, 'notes', e.target.value)} placeholder="Notas..." className="w-full bg-transparent border-b border-gray-200 focus:border-red-400 outline-none text-sm py-0.5" /></td>
                      <td className="px-2 py-2 text-center"><button onClick={() => removeLine(line.id)} className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors"><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-4 py-3 border-t border-gray-100">
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5">Observações Gerais</label>
            <textarea value={measurementSheet.generalNotes} onChange={e => setMeasurementSheet({ ...measurementSheet, generalNotes: e.target.value })}
              placeholder="Ex: Calha com emenda no meio, cliente prefere cor Natural..." rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:border-red-400 focus:ring-1 focus:ring-red-200 outline-none bg-amber-50/30" />
          </div>
          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            <p className="text-xs text-gray-400">{isSaved ? 'Salvo em ' + format(new Date(measurementSheet.updatedAt), 'dd/MM HH:mm', { locale: ptBR }) : 'Não salvo ainda'}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handlePrint} icon={<Printer size={13} />}>Imprimir Ficha</Button>
              <Button size="sm" onClick={saveMeasurements} icon={<Save size={13} />}>{isSaved ? 'Atualizar' : 'Salvar no Banco'}</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ───────────────────────────────────────────────────────
  return (
    <div className="animate-fadeIn space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{pendingVisits.length} visitas pendentes</h2>
          <p className="text-sm text-gray-500">Clique para abrir a ficha de medição</p>
        </div>
      </div>
      {pendingVisits.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-14 text-center">
          <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
          <h3 className="font-semibold text-gray-700">Nenhuma visita pendente</h3>
          <p className="text-sm text-gray-400 mt-1">Agende visitas na tela de Agenda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingVisits.map(visit => {
            const hasM = measurementSheets.some(s => s.visitId === visit.id);
            const vl = leads.find(l => l.id === visit.leadId);
            return (
              <div key={visit.id} onClick={() => openVisit(visit)} className="bg-white rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-sm transition-all cursor-pointer group">
                <div className="p-4 flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-base shrink-0">
                    {visit.leadName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm group-hover:text-red-600 transition-colors">{visit.leadName}</h3>
                        <p className="text-xs text-gray-500 truncate">{visit.service}</p>
                        {vl?.neighborhood && <span className="inline-block mt-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full leading-none">{vl.neighborhood}</span>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasM && <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium border border-green-100"><CheckCircle size={11} /> Salvo</span>}
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">{visit.status}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Calendar size={11} />{fmtDate(visit.date)}</span>
                      <span className="flex items-center gap-1"><Clock size={11} />{visit.time || '—'}</span>
                      <span className="flex items-center gap-1"><Phone size={11} />{visit.phone || '—'}</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2 bg-gray-50 rounded-b-xl border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400 flex items-center gap-1.5"><MapPin size={11} />{visit.address || '—'}</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-red-600 group-hover:translate-x-1 transition-transform">Abrir <ArrowRight size={13} /></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
