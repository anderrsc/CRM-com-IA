import React, { useEffect, useState } from 'react';
import { Printer, MapPin, Phone, Calendar, Clock, User, FileText, Download, MessageSquare, Navigation, CheckCircle, Plus, Trash2, ChevronLeft, ArrowRight, Save, Eye } from 'lucide-react';
import { Card } from '../components/ui/Card';
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

type View = 'list' | 'ficha';

export const Visitas: React.FC = () => {
  const { visits, measurementSheets, saveMeasurementSheet, leads, users, currentUser } = useStore();
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
    setMeasurementSheet({ ...measurementSheet, lines: [...measurementSheet.lines, { id: uuidv4(), location: `Ambiente ${measurementSheet.lines.length + 1}`, width: '', height: '', depth: '', quantity: 1, notes: '' }], updatedAt: new Date() });
  };
  const removeLine = (lineId: string) => {
    if (!measurementSheet) return;
    setMeasurementSheet({ ...measurementSheet, lines: measurementSheet.lines.filter(l => l.id !== lineId), updatedAt: new Date() });
  };
  const saveMeasurements = () => {
    if (!measurementSheet) return;
    saveMeasurementSheet({ ...measurementSheet, updatedAt: new Date() });
    toast.success('Folha de medicoes salva no sistema!');
  };
  const openVisit = (visit: Visit) => { setSelectedVisit(visit); setView('ficha'); };

  const handlePrint = () => {
    if (!selectedVisit || !measurementSheet) return;
    const lead = leads.find(l => l.id === selectedVisit.leadId);
    const medidor = users.find(u => u.id === selectedVisit.assignedTo)?.name || currentUser?.name || 'Tecnico';
    const tipo = /esquadr|janela|porta|box|vidro/i.test(selectedVisit.service) ? 'ESQUADRIAS' : 'CALHAS';
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>Ficha ${selectedVisit.leadName}</title>
<style>@page{margin:10mm 12mm;size:A4}*{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif}body{font-size:11px;color:#111}.header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #dc2626;padding-bottom:8px;margin-bottom:10px}.logo{width:44px;height:44px;background:linear-gradient(135deg,#dc2626,#991b1b);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:900}table{width:100%;border-collapse:collapse;margin-bottom:10px}thead{background:#1a1a2e;color:#fff}thead th{padding:7px 8px;font-size:10px;font-weight:700;text-align:left}tbody tr{border-bottom:1px solid #f0f0f0}tbody td{padding:8px;font-size:11px}.sig{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:15px;border-top:1px solid #cbd5e1;padding-top:12px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>
<div class="header"><div style="display:flex;align-items:center"><div class="logo">M</div><div style="margin-left:10px"><h1 style="font-size:16px;font-weight:900">Marquinhos</h1><p style="font-size:10px;color:#555">Calhas · Esquadrias · Aluminio</p></div></div>
<div style="text-align:right"><h2 style="font-size:18px;font-weight:900;color:#dc2626">FICHA DE MEDICAO · ${tipo}</h2><p style="font-size:10px;color:#777">N ${selectedVisit.id.slice(0,8).toUpperCase()} · ${format(new Date(selectedVisit.date),'dd/MM/yyyy',{locale:ptBR})} as ${selectedVisit.time}</p></div></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
<div style="border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;background:#f9fafb"><label style="font-size:9px;font-weight:700;text-transform:uppercase;color:#9ca3af;display:block;margin-bottom:3px">Cliente</label><p style="font-size:12px;font-weight:600">${selectedVisit.leadName}</p><p style="font-size:10px">${selectedVisit.phone||''}</p></div>
<div style="border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;background:#f9fafb"><label style="font-size:9px;font-weight:700;text-transform:uppercase;color:#9ca3af;display:block;margin-bottom:3px">Endereco</label><p style="font-size:12px;font-weight:600">${lead?.address||selectedVisit.address||''}</p><p style="font-size:10px">${lead?.city||''}</p></div>
<div style="border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;background:#f9fafb"><label style="font-size:9px;font-weight:700;text-transform:uppercase;color:#9ca3af;display:block;margin-bottom:3px">Servico</label><p style="font-size:12px;font-weight:600">${selectedVisit.service}</p></div>
<div style="border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;background:#f9fafb"><label style="font-size:9px;font-weight:700;text-transform:uppercase;color:#9ca3af;display:block;margin-bottom:3px">Tecnico</label><p style="font-size:12px;font-weight:600">${medidor}</p></div></div>
<table><thead><tr><th style="width:180px">Ambiente / Local</th><th style="text-align:center;width:80px">Largura(m)</th><th style="text-align:center;width:80px">Altura(m)</th><th style="text-align:center;width:80px">Prof(m)</th><th style="text-align:center;width:55px">Qtd</th><th>Obs</th></tr></thead><tbody>
${measurementSheet.lines.map(l=>`<tr><td>${l.location||''}</td><td style="text-align:center">${l.width||'___'}</td><td style="text-align:center">${l.height||'___'}</td><td style="text-align:center">${l.depth||'___'}</td><td style="text-align:center">${l.quantity||1}</td><td>${l.notes||''}</td></tr>`).join('')}
</tbody></table>
<div style="border:1px solid #e5e7eb;border-radius:6px;padding:10px;min-height:60px;background:#fffbeb;margin-bottom:16px"><p style="font-size:10px;font-weight:700;margin-bottom:4px">OBSERVACOES GERAIS:</p><p style="font-size:11px">${measurementSheet.generalNotes||''}</p></div>
<div class="sig"><div><div style="font-size:10px;color:#94a3b8;margin-bottom:28px">Assinatura do Tecnico</div><div style="border-top:1px solid #374151;width:200px;padding-top:4px;font-size:10px">${medidor}</div></div>
<div><div style="font-size:10px;color:#94a3b8;margin-bottom:28px">Assinatura do Cliente</div><div style="border-top:1px solid #374151;width:200px;padding-top:4px;font-size:10px">${selectedVisit.leadName}</div></div></div>
<p style="text-align:center;font-size:9px;color:#9ca3af;margin-top:8px;border-top:1px solid #e5e7eb;padding-top:6px">Marquinhos Calhas · Jaraguá do Sul - SC</p>
</body></html>`;
    const win = window.open('','_blank');
    if(!win){toast.error('Permita pop-ups');return;}
    win.document.write(html); win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  const handleWhatsApp = () => { if(!selectedVisit) return; openWhatsApp(selectedVisit.phone, buildVisitText(selectedVisit)); };
  const handleDownload = () => {
    if(!selectedVisit||!measurementSheet) return;
    const lines = measurementSheet.lines.map(l=>`${l.location}: L=${l.width||'-'} A=${l.height||'-'} P=${l.depth||'-'} Qtd=${l.quantity} ${l.notes?'| '+l.notes:''}`).join('\n');
    downloadTextFile(`ficha-${selectedVisit.leadName.replace(/\s+/g,'-')}.txt`,`${buildVisitText(selectedVisit)}\n\nMEDICOES:\n${lines}`);
    toast.success('Arquivo baixado');
  };
  const formatDate = (v?: Date|string) => { if(!v) return '-'; const d=new Date(v); return isNaN(d.getTime())?'-':format(d,'dd/MM/yyyy',{locale:ptBR}); };

  if (view === 'ficha' && selectedVisit && measurementSheet) {
    const lead = leads.find(l => l.id === selectedVisit.leadId);
    const medidor = users.find(u => u.id === selectedVisit.assignedTo)?.name || currentUser?.name || 'Tecnico';
    const isSaved = measurementSheets.some(s => s.visitId === selectedVisit.id);
    return (
      <div className="animate-fadeIn space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => { setView('list'); setSelectedVisit(null); }} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft size={18}/> Voltar para Fichas
          </button>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleWhatsApp} icon={<MessageSquare size={15}/>}>WhatsApp</Button>
            <Button size="sm" variant="ghost" onClick={() => openMap(selectedVisit.address)} icon={<Navigation size={15}/>}>Mapa</Button>
            <Button size="sm" variant="outline" onClick={handleDownload} icon={<Download size={15}/>}>Baixar</Button>
            <Button size="sm" variant="secondary" onClick={handlePrint} icon={<Printer size={15}/>}>Imprimir</Button>
            <Button size="sm" onClick={saveMeasurements} icon={<Save size={15}/>}>{isSaved ? 'Atualizar' : 'Salvar Medicoes'}</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[{label:'Cliente',value:selectedVisit.leadName,icon:<User size={16}/>},{label:'Telefone',value:selectedVisit.phone||'-',icon:<Phone size={16}/>},{label:'Data',value:`${formatDate(selectedVisit.date)} as ${selectedVisit.time}`,icon:<Calendar size={16}/>},{label:'Servico',value:selectedVisit.service,icon:<FileText size={16}/>}].map(item=>(
            <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-1">{item.icon}<span className="text-xs font-semibold uppercase tracking-wide">{item.label}</span></div>
              <p className="font-semibold text-gray-900 text-sm">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1"><MapPin size={16} className="text-red-500"/><span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Endereco</span></div>
          <p className="font-medium text-gray-900">{lead?.address||selectedVisit.address||'-'}{lead?.neighborhood?` · ${lead.neighborhood}`:''}{lead?.city?` · ${lead.city}${lead.state?`/${lead.state}`:''}`:''}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
            <div><h3 className="font-bold text-gray-900">Folha de Medicoes</h3><p className="text-xs text-gray-500 mt-0.5">Tecnico: {medidor} · {measurementSheet.lines.length} ambientes</p></div>
            <div className="flex items-center gap-2">
              {isSaved&&<span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle size={14}/> Salvo</span>}
              <Button size="sm" variant="outline" onClick={addLine} icon={<Plus size={14}/>}>Adicionar linha</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-white">
                <tr><th className="text-left px-4 py-3 font-semibold w-48">Ambiente</th><th className="text-center px-3 py-3 font-semibold w-28">Largura(m)</th><th className="text-center px-3 py-3 font-semibold w-28">Altura(m)</th><th className="text-center px-3 py-3 font-semibold w-28">Prof(m)</th><th className="text-center px-3 py-3 font-semibold w-20">Qtd</th><th className="text-left px-4 py-3 font-semibold">Obs</th><th className="px-3 py-3 w-12"></th></tr>
              </thead>
              <tbody>
                {measurementSheet.lines.map((line,idx)=>(
                  <tr key={line.id} className={cn('border-t border-gray-100',idx%2===1&&'bg-gray-50/50')}>
                    <td className="px-4 py-2.5"><input value={line.location} onChange={e=>updateLine(line.id,'location',e.target.value)} className="w-full bg-transparent border-b border-gray-200 focus:border-red-400 outline-none text-sm font-medium py-0.5"/></td>
                    {(['width','height','depth'] as const).map(field=>(<td key={field} className="px-3 py-2.5 text-center"><input type="number" step="0.01" min="0" value={line[field]} onChange={e=>updateLine(line.id,field,e.target.value)} placeholder="0,00" className="w-24 text-center bg-transparent border border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 outline-none text-sm py-1.5 px-2"/></td>))}
                    <td className="px-3 py-2.5 text-center"><input type="number" min="1" value={line.quantity} onChange={e=>updateLine(line.id,'quantity',Number(e.target.value))} className="w-16 text-center bg-transparent border border-gray-200 rounded-lg focus:border-red-400 outline-none text-sm py-1.5 px-2"/></td>
                    <td className="px-4 py-2.5"><input value={line.notes} onChange={e=>updateLine(line.id,'notes',e.target.value)} placeholder="Notas..." className="w-full bg-transparent border-b border-gray-200 focus:border-red-400 outline-none text-sm py-0.5"/></td>
                    <td className="px-3 py-2.5 text-center"><button onClick={()=>removeLine(line.id)} className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={14}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 border-t border-gray-100">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Observacoes Gerais</label>
            <textarea value={measurementSheet.generalNotes} onChange={e=>setMeasurementSheet({...measurementSheet,generalNotes:e.target.value})} placeholder="Ex: Calha precisa emenda, cliente prefere Natural..." rows={3} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:border-red-400 focus:ring-1 focus:ring-red-200 outline-none bg-amber-50/30"/>
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            <p className="text-xs text-gray-400">{isSaved?`Atualizado: ${format(new Date(measurementSheet.updatedAt),'dd/MM HH:mm',{locale:ptBR})}`:'Nao salvo ainda'}</p>
            <div className="flex gap-2"><Button size="sm" variant="outline" onClick={handlePrint} icon={<Printer size={14}/>}>Imprimir</Button><Button size="sm" onClick={saveMeasurements} icon={<Save size={14}/>}>{isSaved?'Atualizar no Banco':'Salvar no Banco'}</Button></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold text-gray-900">{pendingVisits.length} visitas pendentes</h2><p className="text-sm text-gray-500">Clique para abrir a ficha de medicao completa</p></div>
      </div>
      {pendingVisits.length===0?(
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center"><Calendar size={48} className="mx-auto mb-3 text-gray-300"/><h3 className="font-semibold text-gray-700">Nenhuma visita pendente</h3><p className="text-sm text-gray-400 mt-1">Agende visitas na tela de Agenda</p></div>
      ):(
        <div className="grid gap-4">
          {pendingVisits.map(visit=>{
            const hasMeasurement = measurementSheets.some(s=>s.visitId===visit.id);
            return (
              <div key={visit.id} onClick={()=>openVisit(visit)} className="bg-white rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-md transition-all cursor-pointer group">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-lg">{visit.leadName[0]}</div>
                      <div><h3 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">{visit.leadName}</h3><p className="text-sm text-gray-500">{visit.service}</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasMeasurement&&<span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium border border-green-100"><CheckCircle size={12}/> Medicao salva</span>}
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">{visit.status}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600"><Calendar size={14} className="text-gray-400"/><span>{formatDate(visit.date)}</span></div>
                    <div className="flex items-center gap-2 text-gray-600"><Clock size={14} className="text-gray-400"/><span>{visit.time||'-'}</span></div>
                    <div className="flex items-center gap-2 text-gray-600"><Phone size={14} className="text-gray-400"/><span>{visit.phone||'-'}</span></div>
                    <div className="flex items-center gap-2 text-gray-600"><MapPin size={14} className="text-gray-400"/><span className="truncate">{visit.address||'-'}</span></div>
                  </div>
                </div>
                <div className="px-5 py-3 bg-gray-50 rounded-b-xl border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{hasMeasurement?'Ficha preenchida':'Ficha pendente'}</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-red-600 group-hover:translate-x-1 transition-transform">Abrir Ficha <ArrowRight size={14}/></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};