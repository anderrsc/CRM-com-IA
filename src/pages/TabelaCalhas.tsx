import React, { useMemo, useState } from 'react';
import { Calculator, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { useStore } from '../store/useStore';
import { QuotePriceItem } from '../types';

const thicknesses = ['0.43', '0.50', '0.60', '0.80'];
const widths = ['150', '200', '250', '300', '330', '350', '400', '500', '600', '700', '800', '900', '1000', '1200'];
const colors = ['Natural', 'Branco', 'Preto', 'Bronze', 'Grafite'];

const keyFor = (width: string, thickness: string) => `${width}:${thickness}`;

export const TabelaCalhas: React.FC = () => {
  const { quotePriceItems, addQuotePriceItem, updateQuotePriceItem, deleteQuotePriceItem } = useStore();
  const [color, setColor] = useState('Natural');
  const [values, setValues] = useState<Record<string, string>>({});

  const gutterPrices = useMemo(() => {
    const map = new Map<string, QuotePriceItem>();

    quotePriceItems
      .filter((item) => item.category === 'calha' && item.unit === 'm' && item.active !== false && (item.color || 'Natural') === color)
      .forEach((item) => {
        if (item.cut && item.thickness) {
          map.set(keyFor(item.cut, item.thickness), item);
        }
      });

    return map;
  }, [quotePriceItems, color]);

  const getCellValue = (width: string, thickness: string) => {
    const key = keyFor(width, thickness);
    if (values[key] !== undefined) return values[key];

    const saved = gutterPrices.get(key);
    return saved?.unitPrice ? String(saved.unitPrice) : '';
  };

  const setCellValue = (width: string, thickness: string, value: string) => {
    setValues((current) => ({
      ...current,
      [keyFor(width, thickness)]: value,
    }));
  };

  const buildName = (width: string, thickness: string) => {
    return `Calha Aluminio ${thickness}mm C/${width} ${color}`;
  };

  const handleSave = () => {
    let savedCount = 0;

    widths.forEach((width) => {
      thicknesses.forEach((thickness) => {
        const rawValue = getCellValue(width, thickness);
        const unitPrice = Number(String(rawValue).replace(',', '.'));
        const existing = gutterPrices.get(keyFor(width, thickness));

        if (!unitPrice || unitPrice <= 0) {
          if (existing) {
            deleteQuotePriceItem(existing.id);
            savedCount += 1;
          }
          return;
        }

        if (existing) {
          updateQuotePriceItem(existing.id, {
            name: buildName(width, thickness),
            thickness,
            cut: width,
            color,
            unit: 'm',
            unitPrice,
            active: true,
          });
        } else {
          addQuotePriceItem({
            id: uuidv4(),
            name: buildName(width, thickness),
            category: 'calha',
            thickness,
            cut: width,
            color,
            unit: 'm',
            unitPrice,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        savedCount += 1;
      });
    });

    setValues({});
    toast.success(`${savedCount} valores atualizados`);
  };

  const handleClear = () => {
    if (!window.confirm(`Apagar todos os valores de calhas na cor ${color}?`)) return;

    gutterPrices.forEach((item) => deleteQuotePriceItem(item.id));
    setValues({});
    toast.success('Tabela limpa');
  };

  const filledCount = widths.reduce((count, width) => {
    return count + thicknesses.filter((thickness) => Number(getCellValue(width, thickness)) > 0).length;
  }, 0);

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tabela de Valores de Calhas</h2>
          <p className="text-sm text-gray-500">Largura/corte x espessura, com valor por metro</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select
            label="Cor"
            options={colors.map((item) => ({ value: item, label: item }))}
            value={color}
            onChange={(event) => {
              setColor(event.target.value);
              setValues({});
            }}
            className="sm:w-44"
          />
          <div className="flex items-end gap-2">
            <Button type="button" variant="ghost" onClick={handleClear} icon={<Trash2 size={16} />}>
              Limpar
            </Button>
            <Button type="button" onClick={handleSave} icon={<Save size={16} />}>
              Salvar tabela
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2 text-red-700">
              <Calculator size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold">{filledCount}</p>
              <p className="text-xs text-gray-500">valores preenchidos</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <p className="text-2xl font-bold">{widths.length}</p>
          <p className="text-xs text-gray-500">larguras/cortes</p>
        </Card>
        <Card padding="sm">
          <p className="text-2xl font-bold">{thicknesses.length}</p>
          <p className="text-xs text-gray-500">espessuras</p>
        </Card>
      </div>

      <Card padding="none">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-900">Calha aluminio por metro</span>
            <Badge className="bg-red-100 text-red-700">{color}</Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 z-10 w-36 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-700">
                  Largura / corte
                </th>
                {thicknesses.map((thickness) => (
                  <th key={thickness} className="px-3 py-3 text-left font-semibold text-gray-700">
                    {thickness}mm
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {widths.map((width) => (
                <tr key={width} className="border-t border-gray-100">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 font-semibold text-gray-900">
                    C/{width}
                  </td>
                  {thicknesses.map((thickness) => (
                    <td key={thickness} className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={getCellValue(width, thickness)}
                        onChange={(event) => setCellValue(width, thickness, event.target.value)}
                        placeholder="R$/m"
                        className="h-10"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
