import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  TableProperties,
  Info,
  Calculator,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { useStore } from '../store/useStore';
import { QuotePriceItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PriceRow {
  thickness: string; // "0.50" | "0.60" | "0.70" | "1.00"
  cut: string;       // "150" | "200" | … | "1200"
  multiplier: number; // factor applied per metre
  unitPrice: number;  // computed = base * multiplier, or manually set
  isManual: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const THICKNESSES = ['0.50', '0.60', '0.70', '1.00'];
const CUTS = ['150', '200', '250', '300', '330', '350', '400', '500', '600', '700', '800', '900', '1000', '1200'];
const COLORS = ['Natural', 'Branco', 'Preto', 'Bronze', 'Grafite'];
const PRODUCTS = ['Calha', 'Rufo', 'Rufo com Pingadeira', 'Pingadeira', 'Condutor'];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// ─── Component ────────────────────────────────────────────────────────────────

export const TabelaCalhas: React.FC = () => {
  const {
    quotePriceItems,
    addQuotePriceItem,
    updateQuotePriceItem,
    deleteQuotePriceItem,
  } = useStore();

  // ── Local UI state ────────────────────────────────────────────────────────

  const [activeTab, setActiveTab] = useState<'matrix' | 'list'>('matrix');

  // Matrix builder state
  const [matrixProduct, setMatrixProduct] = useState('Calha');
  const [matrixColor, setMatrixColor] = useState('Natural');
  const [matrixBasePrice, setMatrixBasePrice] = useState<number>(0);
  const [matrixRows, setMatrixRows] = useState<PriceRow[]>([]);
  const [showMatrixInfo, setShowMatrixInfo] = useState(false);

  // Single item form
  const [singleForm, setSingleForm] = useState({
    product: 'Calha',
    thickness: '0.50',
    cut: '300',
    color: 'Natural',
    unit: 'm',
    unitPrice: 0,
  });

  // Edit state for list items
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);

  // Filter
  const [filterProduct, setFilterProduct] = useState('');
  const [filterThickness, setFilterThickness] = useState('');
  const [filterColor, setFilterColor] = useState('');

  // ── Matrix helpers ────────────────────────────────────────────────────────

  const generateMatrix = () => {
    if (matrixBasePrice <= 0) {
      toast.error('Informe o preço base por metro');
      return;
    }

    // Generate rows: for each thickness x cut combo
    const rows: PriceRow[] = [];
    THICKNESSES.forEach(thickness => {
      const thickFactor = {
        '0.50': 1.00,
        '0.60': 1.20,
        '0.70': 1.40,
        '1.00': 2.00,
      }[thickness] ?? 1;

      CUTS.forEach(cut => {
        const cutMm = Number(cut);
        // multiplier: width in mm / 300 (reference width) × thickness factor
        const multiplier = parseFloat(((cutMm / 300) * thickFactor).toFixed(4));
        rows.push({
          thickness,
          cut,
          multiplier,
          unitPrice: parseFloat((matrixBasePrice * multiplier).toFixed(2)),
          isManual: false,
        });
      });
    });

    setMatrixRows(rows);
    toast.success('Matriz gerada! Ajuste os valores e salve.');
  };

  const updateRowPrice = (idx: number, price: number) => {
    setMatrixRows(prev =>
      prev.map((r, i) =>
        i === idx ? { ...r, unitPrice: price, isManual: true } : r
      )
    );
  };

  const updateRowMultiplier = (idx: number, mult: number) => {
    setMatrixRows(prev =>
      prev.map((r, i) =>
        i === idx
          ? { ...r, multiplier: mult, unitPrice: parseFloat((matrixBasePrice * mult).toFixed(2)), isManual: false }
          : r
      )
    );
  };

  const saveMatrix = () => {
    if (matrixRows.length === 0) return;

    let saved = 0;
    matrixRows.forEach(row => {
      const name = `${matrixProduct} Aluminio ${row.thickness}mm C/${row.cut} ${matrixColor}`;
      const existing = quotePriceItems.find(i => i.name === name && i.active);

      if (existing) {
        updateQuotePriceItem(existing.id, { unitPrice: row.unitPrice, updatedAt: new Date() });
      } else {
        const item: QuotePriceItem = {
          id: uuidv4(),
          name,
          category: 'calha',
          thickness: row.thickness,
          cut: row.cut,
          color: matrixColor,
          unit: 'm',
          unitPrice: row.unitPrice,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        addQuotePriceItem(item);
      }
      saved++;
    });

    toast.success(`${saved} preços salvos na tabela`);
    setMatrixRows([]);
  };

  // ── Single item save ──────────────────────────────────────────────────────

  const saveSingleItem = () => {
    if (singleForm.unitPrice <= 0) {
      toast.error('Informe o valor unitário');
      return;
    }
    const name = `${singleForm.product} Aluminio ${singleForm.thickness}mm C/${singleForm.cut} ${singleForm.color}`;
    const item: QuotePriceItem = {
      id: uuidv4(),
      name,
      category: 'calha',
      thickness: singleForm.thickness,
      cut: singleForm.cut,
      color: singleForm.color,
      unit: singleForm.unit,
      unitPrice: singleForm.unitPrice,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addQuotePriceItem(item);
    toast.success('Preço adicionado');
    setSingleForm(prev => ({ ...prev, unitPrice: 0 }));
  };

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    return quotePriceItems
      .filter(i => i.active)
      .filter(i => !filterProduct || i.name.toLowerCase().includes(filterProduct.toLowerCase()))
      .filter(i => !filterThickness || i.thickness === filterThickness)
      .filter(i => !filterColor || i.color === filterColor)
      .sort((a, b) => {
        if (a.thickness !== b.thickness) return a.thickness!.localeCompare(b.thickness!);
        return Number(a.cut) - Number(b.cut);
      });
  }, [quotePriceItems, filterProduct, filterThickness, filterColor]);

  // Group by thickness for the list view
  const groupedItems = useMemo(() => {
    const groups: Record<string, QuotePriceItem[]> = {};
    filteredItems.forEach(item => {
      const key = item.thickness ?? 'outro';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [filteredItems]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Page tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {(['matrix', 'list'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors',
              activeTab === tab
                ? 'bg-white border border-b-white border-gray-200 text-red-600 -mb-px'
                : 'text-gray-500 hover:text-gray-800',
            ].join(' ')}
          >
            {tab === 'matrix' ? '📐 Gerador de Matriz' : '📋 Tabela Atual'}
          </button>
        ))}
      </div>

      {/* ── MATRIX TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'matrix' && (
        <div className="space-y-5">
          {/* Info banner */}
          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            <Info size={18} className="mt-0.5 shrink-0 text-blue-500" />
            <div>
              <p className="font-semibold mb-1">Como funciona a Matriz de Preços</p>
              <p>
                Cada combinação de <strong>Largura (corte)</strong> × <strong>Espessura</strong> recebe um
                <strong> multiplicador</strong>. O preço final = <em>Preço Base × Multiplicador</em>.
                O multiplicador padrão é calculado como <em>(Corte mm ÷ 300) × Fator de espessura</em>.
                Você pode ajustar qualquer valor manualmente antes de salvar.
              </p>
            </div>
          </div>

          {/* Config row */}
          <Card padding="sm">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calculator size={16} className="text-red-600" />
              Configurar Matriz
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Select
                label="Produto"
                options={PRODUCTS.map(p => ({ value: p, label: p }))}
                value={matrixProduct}
                onChange={e => setMatrixProduct(e.target.value)}
              />
              <Select
                label="Cor / Acabamento"
                options={COLORS.map(c => ({ value: c, label: c }))}
                value={matrixColor}
                onChange={e => setMatrixColor(e.target.value)}
              />
              <Input
                label="Preço base (R$/m) — ref. 0.50mm C/300"
                type="number"
                min={0}
                step={0.01}
                value={matrixBasePrice || ''}
                onChange={e => setMatrixBasePrice(Number(e.target.value))}
              />
              <div className="flex items-end">
                <Button fullWidth onClick={generateMatrix} icon={<RefreshCw size={16} />}>
                  Gerar Matriz
                </Button>
              </div>
            </div>
          </Card>

          {/* Matrix table */}
          {matrixRows.length > 0 && (
            <Card padding="none">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h4 className="font-semibold text-gray-900">
                  Matriz gerada — {matrixProduct} {matrixColor}
                </h4>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setMatrixRows([])}>
                    Descartar
                  </Button>
                  <Button size="sm" onClick={saveMatrix} icon={<Save size={15} />}>
                    Salvar todos na tabela
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 w-24">Espessura</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 w-24">Corte</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600 w-36">
                        Multiplicador
                        <span className="ml-1 text-xs text-gray-400 font-normal">(× base)</span>
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600 w-40">Preço (R$/m)</th>
                      <th className="px-4 py-3 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixRows.map((row, idx) => {
                      const isNewThickness =
                        idx === 0 || matrixRows[idx - 1].thickness !== row.thickness;
                      return (
                        <React.Fragment key={`${row.thickness}-${row.cut}`}>
                          {isNewThickness && (
                            <tr className="bg-red-50/70">
                              <td
                                colSpan={5}
                                className="px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-red-700"
                              >
                                Espessura {row.thickness}mm
                              </td>
                            </tr>
                          )}
                          <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2.5 text-gray-500">{row.thickness}mm</td>
                            <td className="px-4 py-2.5 font-medium">C/{row.cut}</td>
                            <td className="px-4 py-2.5 text-right">
                              <input
                                type="number"
                                min={0.01}
                                step={0.0001}
                                value={row.multiplier}
                                onChange={e => updateRowMultiplier(idx, Number(e.target.value))}
                                className="w-24 text-right rounded border border-gray-200 px-2 py-1 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-300"
                              />
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <input
                                type="number"
                                min={0.01}
                                step={0.01}
                                value={row.unitPrice}
                                onChange={e => updateRowPrice(idx, Number(e.target.value))}
                                className={[
                                  'w-28 text-right rounded border px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-1',
                                  row.isManual
                                    ? 'border-amber-300 bg-amber-50 text-amber-800 focus:border-amber-400 focus:ring-amber-200'
                                    : 'border-gray-200 focus:border-red-400 focus:ring-red-300',
                                ].join(' ')}
                              />
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {row.isManual && (
                                <span
                                  title="Valor editado manualmente"
                                  className="text-xs text-amber-600 font-bold"
                                >
                                  ✏️
                                </span>
                              )}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500">
                  {matrixRows.length} combinações · itens com ✏️ foram editados manualmente
                </p>
                <Button size="sm" onClick={saveMatrix} icon={<Save size={15} />}>
                  Salvar na tabela
                </Button>
              </div>
            </Card>
          )}

          {/* Single item adder */}
          <Card padding="sm">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Plus size={16} className="text-red-600" />
              Adicionar item avulso
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Select
                label="Produto"
                options={PRODUCTS.map(p => ({ value: p, label: p }))}
                value={singleForm.product}
                onChange={e => setSingleForm(prev => ({ ...prev, product: e.target.value }))}
              />
              <Select
                label="Espessura"
                options={THICKNESSES.map(v => ({ value: v, label: `${v}mm` }))}
                value={singleForm.thickness}
                onChange={e => setSingleForm(prev => ({ ...prev, thickness: e.target.value }))}
              />
              <Select
                label="Corte"
                options={CUTS.map(v => ({ value: v, label: `C/${v}` }))}
                value={singleForm.cut}
                onChange={e => setSingleForm(prev => ({ ...prev, cut: e.target.value }))}
              />
              <Select
                label="Cor"
                options={COLORS.map(v => ({ value: v, label: v }))}
                value={singleForm.color}
                onChange={e => setSingleForm(prev => ({ ...prev, color: e.target.value }))}
              />
              <Input
                label="Preço R$/m"
                type="number"
                min={0}
                step={0.01}
                value={singleForm.unitPrice || ''}
                onChange={e => setSingleForm(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
              />
              <div className="flex items-end">
                <Button fullWidth onClick={saveSingleItem} icon={<Plus size={16} />}>
                  Adicionar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── LIST TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card padding="sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Buscar produto"
                placeholder="Calha, Rufo…"
                value={filterProduct}
                onChange={e => setFilterProduct(e.target.value)}
              />
              <Select
                label="Espessura"
                options={[
                  { value: '', label: 'Todas' },
                  ...THICKNESSES.map(v => ({ value: v, label: `${v}mm` })),
                ]}
                value={filterThickness}
                onChange={e => setFilterThickness(e.target.value)}
              />
              <Select
                label="Cor"
                options={[
                  { value: '', label: 'Todas' },
                  ...COLORS.map(v => ({ value: v, label: v })),
                ]}
                value={filterColor}
                onChange={e => setFilterColor(e.target.value)}
              />
            </div>
          </Card>

          {filteredItems.length === 0 ? (
            <Card className="text-center py-10">
              <TableProperties size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">
                Nenhum preço cadastrado. Use o Gerador de Matriz ou adicione itens avulsos.
              </p>
            </Card>
          ) : (
            Object.entries(groupedItems).map(([thickness, items]) => (
              <Card key={thickness} padding="none">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-red-50/60">
                  <span className="text-sm font-bold text-red-700 uppercase tracking-wide">
                    Espessura {thickness}mm
                  </span>
                  <span className="ml-auto text-xs text-gray-400">{items.length} itens</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Nome</th>
                        <th className="text-center px-4 py-2.5 font-semibold text-gray-600">Corte</th>
                        <th className="text-center px-4 py-2.5 font-semibold text-gray-600">Cor</th>
                        <th className="text-center px-4 py-2.5 font-semibold text-gray-600">Un.</th>
                        <th className="text-right px-4 py-2.5 font-semibold text-gray-600">Preço</th>
                        <th className="px-4 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-2.5 truncate max-w-[220px]">{item.name}</td>
                          <td className="px-4 py-2.5 text-center">C/{item.cut}</td>
                          <td className="px-4 py-2.5 text-center">{item.color}</td>
                          <td className="px-4 py-2.5 text-center">{item.unit}</td>
                          <td className="px-4 py-2.5 text-right font-semibold">
                            {editingId === item.id ? (
                              <input
                                type="number"
                                min={0.01}
                                step={0.01}
                                value={editPrice}
                                onChange={e => setEditPrice(Number(e.target.value))}
                                className="w-28 text-right rounded border border-red-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-red-400"
                                autoFocus
                              />
                            ) : (
                              <span className="text-gray-900">{formatCurrency(item.unitPrice)}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-end gap-1">
                              {editingId === item.id ? (
                                <>
                                  <button
                                    onClick={() => {
                                      updateQuotePriceItem(item.id, { unitPrice: editPrice });
                                      setEditingId(null);
                                      toast.success('Preço atualizado');
                                    }}
                                    className="rounded p-1.5 text-green-600 hover:bg-green-50"
                                    title="Salvar"
                                  >
                                    <Save size={15} />
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100"
                                    title="Cancelar"
                                  >
                                    <X size={15} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingId(item.id);
                                      setEditPrice(item.unitPrice);
                                    }}
                                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                                    title="Editar preço"
                                  >
                                    <Edit3 size={15} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      deleteQuotePriceItem(item.id);
                                      toast.success('Item removido');
                                    }}
                                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                    title="Remover"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))
          )}

          {filteredItems.length > 0 && (
            <p className="text-xs text-center text-gray-400">
              {filteredItems.length} itens ativos na tabela de preços
            </p>
          )}
        </div>
      )}
    </div>
  );
};
