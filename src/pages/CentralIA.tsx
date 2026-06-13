import React, { useEffect, useState } from 'react';
import { 
  MessageSquare, 
  Bot, 
  User, 
  Sparkles,
  CheckCircle,
  AlertCircle,
  Copy,
  ArrowRight,
  Phone,
  MapPin,
  Calendar,
  Wrench,
  Zap,
  Brain,
  Mic,
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TextArea } from '../components/ui/Input';
import { Badge, UrgencyBadge } from '../components/ui/Badge';
import { useStore } from '../store/useStore';
import { AIAnalysisResult, Lead } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import { copyText } from '../utils/actions';
import { api, ApiStatus, WhatsAppInboxMessage } from '../services/api';

export const CentralIA: React.FC = () => {
  const { addLead, addNotification, addVisit } = useStore();
  const [inputMessage, setInputMessage] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
  }>>([]);
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [whatsAppMessages, setWhatsAppMessages] = useState<WhatsAppInboxMessage[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);

  const refreshWhatsAppInbox = async () => {
    setLoadingInbox(true);
    try {
      const [status, messages] = await Promise.all([
        api.health(),
        api.getWhatsAppMessages(),
      ]);
      setApiStatus(status);
      setWhatsAppMessages(messages);
    } catch {
      setApiStatus({ ok: false, whatsappConfigured: false, openAiConfigured: false, supabaseConfigured: false });
    } finally {
      setLoadingInbox(false);
    }
  };

  useEffect(() => {
    refreshWhatsAppInbox();
    const interval = window.setInterval(refreshWhatsAppInbox, 15000);
    return () => window.clearInterval(interval);
  }, []);

  // Simulated AI analysis function
  const analyzeMessage = async (message: string): Promise<AIAnalysisResult> => {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const lowerMessage = message.toLowerCase();
    
    // Extract information using patterns
    const namePatterns = [
      /(?:sou|meu nome é|me chamo|aqui é|é o|é a)\s+([A-Za-zÀ-ÿ]+)/i,
      /^(?:oi|olá|bom dia|boa tarde|boa noite)[,!]?\s*(?:sou|aqui é)?\s*([A-Za-zÀ-ÿ]+)/i,
    ];
    let name = '';
    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match) {
        name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        break;
      }
    }

    const phoneMatch = message.match(/\(?\d{2}\)?\s*\d{4,5}[-.\s]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0] : '';

    const addressPatterns = [/(?:rua|av\.?|avenida|alameda)\s+[^,.\n]+(?:\s*,?\s*\d+)?/i];
    let address = '';
    for (const pattern of addressPatterns) {
      const match = message.match(pattern);
      if (match) {
        address = match[0];
        break;
      }
    }

    let neighborhood = '';
    const neighborhoodMatch = message.match(/(?:bairro|no|na)\s+([A-Za-zÀ-ÿ\s]+?)(?:\s*,|\s+em|\s+na|\s+no|$)/i);
    if (neighborhoodMatch) neighborhood = neighborhoodMatch[1].trim();

    const availabilityPatterns = [
      /(segunda|terça|quarta|quinta|sexta|sábado|domingo)(?:\s+(?:feira|à|às|depois|após|das?|de manhã|de tarde|à noite))?\s*(?:(?:às?|depois das?|após as?)\s*)?(\d{1,2}(?:h|:\d{2})?)?/gi,
    ];
    let availability = '';
    for (const pattern of availabilityPatterns) {
      const match = message.match(pattern);
      if (match) {
        availability = match[0];
        break;
      }
    }

    const services: Record<string, string[]> = {
      'Calha': ['calha', 'calhas', 'calhão'],
      'Rufo': ['rufo', 'rufos'],
      'Pingadeira': ['pingadeira', 'pingadeiras'],
      'Janela': ['janela', 'janelas'],
      'Porta': ['porta', 'portas'],
      'Box de Vidro': ['box', 'banheiro'],
      'Vidro Temperado': ['vidro', 'vidros', 'temperado', 'laminado'],
      'Guarda-corpo': ['guarda-corpo', 'guarda corpo', 'sacada'],
      'Fechamento': ['fechamento', 'área gourmet', 'varanda'],
      'Manutenção': ['manutenção', 'conserto', 'reparo', 'arrumar', 'trocar'],
    };

    let service = '';
    for (const [serviceName, keywords] of Object.entries(services)) {
      if (keywords.some(k => lowerMessage.includes(k))) {
        service = serviceName;
        break;
      }
    }

    let urgency: AIAnalysisResult['urgency'] = 'media';
    if (lowerMessage.includes('urgente') || lowerMessage.includes('vazando') || lowerMessage.includes('quebr')) {
      urgency = 'urgente';
    } else if (lowerMessage.includes('rápido') || lowerMessage.includes('logo') || lowerMessage.includes('preciso')) {
      urgency = 'alta';
    } else if (lowerMessage.includes('quando puder') || lowerMessage.includes('sem pressa')) {
      urgency = 'baixa';
    }

    const parts = [];
    if (name) parts.push(`Cliente ${name}`);
    if (service) parts.push(`precisa de ${service.toLowerCase()}`);
    if (address) parts.push(`em ${address}`);
    if (availability) parts.push(`disponível ${availability}`);
    
    const summary = parts.length > 0 
      ? parts.join(', ') + '.'
      : 'Informações insuficientes para criar resumo completo.';

    const suggestedActions: string[] = [];
    if (!name) suggestedActions.push('Solicitar nome do cliente');
    if (!phone) suggestedActions.push('Solicitar telefone para contato');
    if (!address) suggestedActions.push('Solicitar endereço completo');
    if (!service) suggestedActions.push('Identificar serviço desejado');
    if (!availability) suggestedActions.push('Verificar disponibilidade para visita');
    if (name && service && (address || phone)) {
      suggestedActions.push('Agendar visita técnica');
      suggestedActions.push('Criar cadastro no CRM');
    }

    const confidence = [name, phone, address, service, availability].filter(Boolean).length / 5;

    return {
      name,
      phone,
      address,
      neighborhood,
      service,
      availability,
      urgency,
      summary,
      suggestedActions,
      confidence,
    };
  };

  const handleAnalyze = async () => {
    if (!inputMessage.trim()) return;

    setAnalyzing(true);
    setConversationHistory(prev => [...prev, {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    }]);

    try {
      let result: AIAnalysisResult;
      try {
        result = await api.analyze<AIAnalysisResult>(inputMessage);
      } catch {
        result = await analyzeMessage(inputMessage);
      }
      setAnalysis(result);

      setConversationHistory(prev => [...prev, {
        role: 'ai',
        content: result.summary,
        timestamp: new Date(),
      }]);

    } catch (error) {
      console.error('Error analyzing message:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUseWhatsAppMessage = async (message: WhatsAppInboxMessage) => {
    setInputMessage(message.text);
    setConversationHistory([{
      role: 'user',
      content: message.text,
      timestamp: new Date(message.timestamp),
    }]);

    if (message.analysis) {
      setAnalysis(message.analysis as AIAnalysisResult);
    } else {
      try {
        setAnalysis(await api.analyze<AIAnalysisResult>(message.text));
      } catch {
        setAnalysis(await analyzeMessage(message.text));
      }
    }

    await api.markWhatsAppRead(message.id).catch(() => undefined);
    refreshWhatsAppInbox();
  };

  const createLeadFromAnalysis = () => {
    if (!analysis) return null;

    const newLead: Lead = {
      id: uuidv4(),
      name: analysis.name || 'Novo Lead',
      phone: analysis.phone || '',
      address: analysis.address || '',
      neighborhood: analysis.neighborhood || '',
      city: 'Maringá',
      state: 'PR',
      origin: 'whatsapp',
      service: analysis.service || 'A definir',
      status: 'novo',
      urgency: analysis.urgency,
      availability: analysis.availability,
      aiSummary: analysis.summary,
      attachments: [],
      messages: conversationHistory.map((msg, i) => ({
        id: `msg-${i}`,
        content: msg.content,
        sender: msg.role === 'user' ? 'client' : 'ai',
        timestamp: msg.timestamp,
        type: 'text',
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addLead(newLead);
    setCreatedLeadId(newLead.id);
    
    addNotification({
      id: uuidv4(),
      type: 'success',
      title: 'Lead criado com sucesso!',
      message: `${newLead.name} foi adicionado ao CRM`,
      read: false,
      createdAt: new Date(),
    });

    return newLead;
  };

  const handleCreateLead = () => {
    if (!analysis) return;

    const newLead = createLeadFromAnalysis();
    if (!newLead) return;
    toast.success('Lead criado no CRM');

    setInputMessage('');
    setAnalysis(null);
    setConversationHistory([]);
  };

  const handleScheduleVisit = () => {
    if (!analysis) return;

    const linkedLead = createdLeadId
      ? { id: createdLeadId, name: analysis.name || 'Novo Cliente' }
      : createLeadFromAnalysis();

    if (!linkedLead) return;

    const visitDate = new Date();
    visitDate.setDate(visitDate.getDate() + 1);

    addVisit({
      id: uuidv4(),
      leadId: linkedLead.id,
      leadName: linkedLead.name,
      phone: analysis.phone || '',
      address: analysis.address || '',
      service: analysis.service || 'A definir',
      date: visitDate,
      time: '10:00',
      observations: analysis.availability,
      assignedTo: '2',
      status: 'agendada',
      createdAt: new Date(),
    });

    addNotification({
      id: uuidv4(),
      type: 'info',
      title: 'Visita agendada',
      message: `Visita para ${analysis.name || 'Novo Cliente'} foi criada`,
      read: false,
      createdAt: new Date(),
    });
    toast.success('Visita agendada para amanhã às 10:00');
  };

  const handleCopyAnalysis = async () => {
    if (!analysis) return;
    await copyText(analysis.summary);
    toast.success('Resumo copiado');
  };

  const exampleMessages = [
    "Oi, sou João, preciso trocar uma calha na Rua XV 255 e posso terça depois das 15h",
    "Bom dia! Meu nome é Maria, preciso de um orçamento para box de vidro. Meu telefone é 44 99999-8888",
    "Boa tarde, aqui é o Pedro. Tenho uma janela quebrada urgente! Estou na Av. Brasil 500",
  ];

  return (
    <div className="space-y-5">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-red-600 via-red-600 to-red-500 p-8 text-white">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative flex items-center gap-5">
          <div className="p-4 bg-white/20 rounded-lg backdrop-blur-sm animate-float">
            <Brain size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Central de Inteligência Artificial</h1>
            <p className="text-red-100 max-w-lg">
              Receba mensagens pelo WhatsApp Cloud API, extraia informações automaticamente,
              crie leads e agende visitas em segundos.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Input Area */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader
              title="Entrada do WhatsApp"
              subtitle={apiStatus?.whatsappConfigured ? 'Webhook conectado à API local' : 'Configure o .env para receber mensagens reais'}
              icon={<MessageSquare size={20} />}
              action={
                <Button size="sm" variant="ghost" onClick={refreshWhatsAppInbox} loading={loadingInbox}>
                  Atualizar
                </Button>
              }
            />
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {whatsAppMessages.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-5 text-center">
                  <p className="font-medium text-gray-700">Nenhuma mensagem recebida ainda</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Assim que a Meta chamar o webhook, as mensagens aparecem aqui sem copiar e colar.
                  </p>
                </div>
              ) : (
                whatsAppMessages.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => handleUseWhatsAppMessage(message)}
                    className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:border-red-300 hover:bg-red-50/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{message.contactName || message.from}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-gray-600">{message.text}</p>
                      </div>
                      <Badge variant={message.status === 'received' ? 'info' : 'default'} size="sm">
                        {message.status === 'received' ? 'Nova' : 'Lida'}
                      </Badge>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card>
            {/* Conversation History */}
            {conversationHistory.length > 0 && (
              <div className="mb-5 space-y-4 max-h-72 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white rounded-lg">
                {conversationHistory.map((msg, index) => (
                  <div 
                    key={index}
                    className={cn(
                      'flex gap-3 animate-slideInUp',
                      msg.role === 'ai' ? '' : 'flex-row-reverse'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      msg.role === 'ai' 
                        ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    )}>
                      {msg.role === 'ai' ? <Bot size={18} /> : <User size={18} />}
                    </div>
                    <div className={cn(
                      'max-w-[80%] p-4 rounded-lg',
                      msg.role === 'ai' 
                        ? 'bg-white border border-gray-100 shadow-sm' 
                        : 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                    )}>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="space-y-4">
              <div className="relative">
                <TextArea
                  placeholder="Cole aqui a mensagem do cliente do WhatsApp, Instagram ou qualquer outro canal..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  rows={4}
                  className="pr-24 resize-none"
                />
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                    <Mic size={18} />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                    <ImageIcon size={18} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleAnalyze}
                  loading={analyzing}
                  icon={<Sparkles size={18} />}
                  variant="gradient"
                  className="flex-1"
                  size="lg"
                >
                  {analyzing ? 'Analisando...' : 'Analisar com IA'}
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => {
                    setInputMessage('');
                    setAnalysis(null);
                    setConversationHistory([]);
                  }}
                >
                  Limpar
                </Button>
              </div>
            </div>

            {/* Example Messages */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-3">💡 Exemplos de mensagens:</p>
              <div className="flex flex-wrap gap-2">
                {exampleMessages.map((msg, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(msg)}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-red-50 hover:text-red-700 rounded-full text-gray-600 transition-all"
                  >
                    "{msg.slice(0, 35)}..."
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Analysis Result */}
          {analysis && (
            <Card className="animate-slideInUp border-2 border-red-100">
              <CardHeader 
                title="Resultado da Análise" 
                subtitle={`Confiança: ${(analysis.confidence * 100).toFixed(0)}%`}
                icon={<CheckCircle size={20} />}
                iconBg="bg-gradient-to-br from-red-500 to-red-600"
              />

              <div className="space-y-5">
                {/* Extracted Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { icon: User, label: 'Nome', value: analysis.name },
                    { icon: Phone, label: 'Telefone', value: analysis.phone },
                    { icon: MapPin, label: 'Endereço', value: analysis.address },
                    { icon: Wrench, label: 'Serviço', value: analysis.service },
                    { icon: Calendar, label: 'Disponibilidade', value: analysis.availability },
                  ].map((item, index) => (
                    <div 
                      key={item.label}
                      className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-100 animate-scaleIn"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <item.icon size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-500">{item.label}</span>
                      </div>
                      <p className={cn(
                        'font-semibold',
                        item.value ? 'text-gray-900' : 'text-gray-300 italic'
                      )}>
                        {item.value || 'Não identificado'}
                      </p>
                    </div>
                  ))}
                  
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-500">Urgência</span>
                    </div>
                    <UrgencyBadge urgency={analysis.urgency} />
                  </div>
                </div>

                {/* Summary */}
                <div className="p-5 bg-gradient-to-r from-red-50 to-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
                      <Sparkles size={16} className="text-white" />
                    </div>
                    <span className="font-bold text-gray-900">Resumo IA</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
                </div>

                {/* Suggested Actions */}
                {analysis.suggestedActions.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">📋 Próximas ações sugeridas:</p>
                    <div className="space-y-2">
                      {analysis.suggestedActions.map((action, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-3 text-sm text-gray-600 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <ArrowRight size={14} className="text-red-500 flex-shrink-0" />
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                  <Button onClick={handleCreateLead} icon={<User size={18} />} size="lg">
                    Criar Lead no CRM
                  </Button>
                  <Button onClick={handleScheduleVisit} variant="secondary" icon={<Calendar size={18} />} size="lg">
                    Agendar Visita
                  </Button>
                  <Button variant="ghost" onClick={handleCopyAnalysis} icon={<Copy size={18} />}>
                    Copiar
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* AI Status */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-lg animate-glow">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="font-bold">IA Ativa</h3>
                <p className="text-sm text-slate-400">Processamento em tempo real</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/10 rounded-lg">
                <p className="text-2xl font-bold">47</p>
                <p className="text-xs text-slate-400">Análises hoje</p>
              </div>
              <div className="p-3 bg-white/10 rounded-lg">
                <p className="text-2xl font-bold">94%</p>
                <p className="text-xs text-slate-400">Taxa de sucesso</p>
              </div>
            </div>
          </Card>

          {/* Capabilities */}
          <Card>
            <CardHeader 
              title="Capacidades" 
              icon={<Brain size={20} />}
              iconBg="bg-gradient-to-br from-red-500 to-red-600"
            />
            <div className="space-y-2">
              {[
                'Extrair nome do cliente',
                'Identificar telefone',
                'Detectar endereço',
                'Reconhecer serviço',
                'Identificar disponibilidade',
                'Avaliar urgência',
                'Gerar resumo automático',
              ].map((capability, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <CheckCircle size={16} className="text-red-500 flex-shrink-0" />
                  <span className="text-gray-700">{capability}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Integrations */}
          <Card>
            <CardHeader 
              title="Canais Integrados" 
              icon={<MessageSquare size={20} />}
              iconBg="bg-gradient-to-br from-red-500 to-red-600"
            />
            <div className="space-y-3">
              {[
                { name: 'WhatsApp', color: 'bg-red-500', status: 'Ativo' },
                { name: 'Instagram', color: 'bg-gradient-to-r from-red-500 to-red-500', status: 'Ativo' },
                { name: 'OpenAI GPT-4', color: 'bg-slate-800', status: 'Ativo' },
              ].map((integration) => (
                <div key={integration.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded-lg', integration.color)} />
                    <span className="text-sm font-medium">{integration.name}</span>
                  </div>
                  <Badge variant="success" size="sm">{integration.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
