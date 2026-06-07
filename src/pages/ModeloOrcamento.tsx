import React from 'react';
import { Image, Palette, QrCode, Signature, Type } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select, TextArea } from '../components/ui/Input';
import { useStore } from '../store/useStore';

const colorPresets = [
  { name: 'Vermelho Marquinhos', accent: '#b91c1c', secondary: '#111827' },
  { name: 'Preto elegante', accent: '#111827', secondary: '#374151' },
  { name: 'Grafite e vermelho', accent: '#dc2626', secondary: '#27272a' },
  { name: 'Azul tecnico', accent: '#1d4ed8', secondary: '#1f2937' },
];

export const ModeloOrcamento: React.FC = () => {
  const { quoteSettings, updateQuoteSettings } = useStore();

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Modelo do Orçamento</h2>
          <p className="text-sm text-gray-500">Personalize o PDF de calhas com logo, cabecalho, cores, PIX e assinatura</p>
        </div>
        <Button type="button" onClick={() => updateQuoteSettings({ updatedAt: new Date() })}>
          Salvar modelo
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5">
        <div className="space-y-5">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Image size={18} className="text-red-700" />
              <h3 className="font-semibold text-gray-900">Identidade</h3>
            </div>
            <div className="space-y-3">
              <Input
                label="Nome da empresa"
                value={quoteSettings.companyName}
                onChange={(event) => updateQuoteSettings({ companyName: event.target.value })}
              />
              <Input
                label="Documento"
                value={quoteSettings.document}
                onChange={(event) => updateQuoteSettings({ document: event.target.value })}
              />
              <Input
                label="URL da logo"
                value={quoteSettings.logoUrl || ''}
                onChange={(event) => updateQuoteSettings({ logoUrl: event.target.value })}
                placeholder="Cole o link da imagem da logo"
              />
              <Input
                label="Telefone"
                value={quoteSettings.phone || ''}
                onChange={(event) => updateQuoteSettings({ phone: event.target.value })}
              />
              <Input
                label="E-mail"
                value={quoteSettings.email || ''}
                onChange={(event) => updateQuoteSettings({ email: event.target.value })}
              />
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Palette size={18} className="text-red-700" />
              <h3 className="font-semibold text-gray-900">Aparencia</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Cor principal"
                type="color"
                value={quoteSettings.accentColor || '#b91c1c'}
                onChange={(event) => updateQuoteSettings({ accentColor: event.target.value })}
              />
              <Input
                label="Cor do texto"
                type="color"
                value={quoteSettings.secondaryColor || '#111827'}
                onChange={(event) => updateQuoteSettings({ secondaryColor: event.target.value })}
              />
              <Select
                label="Fonte"
                options={[
                  { value: 'Arial', label: 'Arial' },
                  { value: 'Inter', label: 'Inter' },
                  { value: 'Georgia', label: 'Georgia' },
                  { value: 'Times New Roman', label: 'Times' },
                ]}
                value={quoteSettings.fontFamily || 'Arial'}
                onChange={(event) => updateQuoteSettings({ fontFamily: event.target.value })}
              />
              <Select
                label="Layout"
                options={[
                  { value: 'moderno', label: 'Moderno' },
                  { value: 'classico', label: 'Classico' },
                  { value: 'compacto', label: 'Compacto' },
                ]}
                value={quoteSettings.layoutStyle || 'moderno'}
                onChange={(event) => updateQuoteSettings({ layoutStyle: event.target.value as 'moderno' | 'classico' | 'compacto' })}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => updateQuoteSettings({ accentColor: preset.accent, secondaryColor: preset.secondary })}
                  className="rounded-lg border border-gray-200 p-3 text-left text-sm hover:border-red-300"
                >
                  <span className="mb-2 flex gap-1">
                    <span className="h-4 w-8 rounded" style={{ background: preset.accent }} />
                    <span className="h-4 w-8 rounded" style={{ background: preset.secondary }} />
                  </span>
                  {preset.name}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <QrCode size={18} className="text-red-700" />
              <h3 className="font-semibold text-gray-900">PIX e assinatura</h3>
            </div>
            <div className="space-y-3">
              <Input
                label="Chave PIX"
                value={quoteSettings.pixKey || ''}
                onChange={(event) => updateQuoteSettings({ pixKey: event.target.value })}
              />
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={quoteSettings.showQrCode !== false}
                  onChange={(event) => updateQuoteSettings({ showQrCode: event.target.checked })}
                  className="h-4 w-4 accent-red-700"
                />
                Mostrar QR Code PIX
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={quoteSettings.showSignature !== false}
                  onChange={(event) => updateQuoteSettings({ showSignature: event.target.checked })}
                  className="h-4 w-4 accent-red-700"
                />
                Mostrar assinatura digital
              </label>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Type size={18} className="text-red-700" />
              <h3 className="font-semibold text-gray-900">Textos do PDF</h3>
            </div>
            <div className="space-y-3">
              <TextArea
                label="Texto do cabecalho"
                rows={4}
                value={quoteSettings.headerText}
                onChange={(event) => updateQuoteSettings({ headerText: event.target.value })}
              />
              <TextArea
                label="Texto final"
                rows={4}
                value={quoteSettings.footerText}
                onChange={(event) => updateQuoteSettings({ footerText: event.target.value })}
              />
              <Input
                label="Marca d'agua"
                value={quoteSettings.watermarkText || ''}
                onChange={(event) => updateQuoteSettings({ watermarkText: event.target.value })}
                placeholder="Ex: MARQUINHOS"
              />
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Signature size={18} className="text-red-700" />
              <h3 className="font-semibold text-gray-900">Previa do orçamento</h3>
            </div>
            <div
              className="relative overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
              style={{ fontFamily: quoteSettings.fontFamily || 'Arial', color: quoteSettings.secondaryColor || '#111827' }}
            >
              {quoteSettings.watermarkText && (
                <div className="pointer-events-none absolute left-10 top-1/2 -rotate-12 text-5xl font-black opacity-[0.06]">
                  {quoteSettings.watermarkText}
                </div>
              )}
              <div className="flex items-start justify-between border-b pb-5" style={{ borderColor: quoteSettings.accentColor || '#b91c1c' }}>
                <div className="flex items-center gap-4">
                  {quoteSettings.logoUrl ? (
                    <img src={quoteSettings.logoUrl} alt={quoteSettings.companyName} className="h-16 w-16 rounded-lg border object-contain" />
                  ) : (
                    <div className="grid h-16 w-16 place-items-center rounded-lg text-2xl font-black text-white" style={{ background: quoteSettings.accentColor || '#b91c1c' }}>
                      M
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-black">{quoteSettings.companyName}</h1>
                    <p className="text-sm text-gray-500">{quoteSettings.document}</p>
                    <p className="text-sm text-gray-500">{quoteSettings.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black" style={{ color: quoteSettings.accentColor || '#b91c1c' }}>ORCAMENTO DE CALHAS</p>
                  <p className="text-sm text-gray-500">#PREVIA</p>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-gray-200 p-4 text-sm">
                {quoteSettings.headerText || 'Texto do cabecalho do orçamento.'}
              </div>
              <div className="mt-5 overflow-hidden rounded-lg border border-gray-200">
                <div className="grid grid-cols-[1fr_90px_100px] bg-gray-50 p-3 text-sm font-bold">
                  <span>Descricao</span>
                  <span className="text-right">Qtd</span>
                  <span className="text-right">Total</span>
                </div>
                <div className="grid grid-cols-[1fr_90px_100px] p-3 text-sm">
                  <span>CALHA DE BEIRAL EM ALUMÍNIO 0.5MM C/300MM NA COR NATURAL</span>
                  <span className="text-right">10 m</span>
                  <span className="text-right">R$ 0,00</span>
                </div>
              </div>
              <div className="mt-5 flex items-end justify-between">
                {quoteSettings.showQrCode !== false && quoteSettings.pixKey ? (
                  <div className="rounded-lg border border-gray-200 p-3 text-sm">
                    QR Code PIX
                  </div>
                ) : <span />}
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-black" style={{ color: quoteSettings.accentColor || '#b91c1c' }}>R$ 0,00</p>
                </div>
              </div>
              {quoteSettings.showSignature !== false && (
                <div className="mt-12 grid grid-cols-2 gap-8 text-center text-sm text-gray-500">
                  <div className="border-t pt-2">Assinatura do cliente</div>
                  <div className="border-t pt-2">{quoteSettings.companyName}</div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
