import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Tag,
  Layers,
  Box,
  Wrench,
  Grid,
  List
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select, TextArea } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useStore } from '../store/useStore';
import { KnowledgeItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../utils/cn';

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  linhas: { label: 'Linhas', icon: Grid, color: 'bg-red-100 text-red-700' },
  vidros: { label: 'Vidros', icon: Layers, color: 'bg-red-100 text-red-700' },
  calhas: { label: 'Calhas', icon: Box, color: 'bg-red-100 text-red-700' },
  ferragens: { label: 'Ferragens', icon: Wrench, color: 'bg-red-100 text-red-700' },
  outros: { label: 'Outros', icon: Tag, color: 'bg-gray-100 text-gray-700' },
};

export const Conhecimento: React.FC = () => {
  const { knowledgeBase, addKnowledgeItem, updateKnowledgeItem, deleteKnowledgeItem } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    category: 'linhas' as KnowledgeItem['category'],
    name: '',
    description: '',
    specifications: '',
    priceRange: '',
    tags: '',
  });

  // Filter items
  const filteredItems = useMemo(() => {
    return knowledgeBase.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      
      return matchesSearch && matchesCategory && item.active;
    });
  }, [knowledgeBase, searchQuery, filterCategory]);

  const handleOpenNew = () => {
    setFormData({
      category: 'linhas',
      name: '',
      description: '',
      specifications: '',
      priceRange: '',
      tags: '',
    });
    setIsEditing(false);
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: KnowledgeItem) => {
    setFormData({
      category: item.category,
      name: item.name,
      description: item.description,
      specifications: item.specifications || '',
      priceRange: item.priceRange || '',
      tags: item.tags.join(', '),
    });
    setIsEditing(true);
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      deleteKnowledgeItem(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const itemData = {
      category: formData.category,
      name: formData.name,
      description: formData.description,
      specifications: formData.specifications || undefined,
      priceRange: formData.priceRange || undefined,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      active: true,
    };

    if (isEditing && selectedItem) {
      updateKnowledgeItem(selectedItem.id, itemData);
    } else {
      addKnowledgeItem({
        id: uuidv4(),
        ...itemData,
        createdAt: new Date(),
      });
    }

    setShowModal(false);
  };

  const categoryOptions = [
    { value: 'all', label: 'Todas as categorias' },
    { value: 'linhas', label: 'Linhas' },
    { value: 'vidros', label: 'Vidros' },
    { value: 'calhas', label: 'Calhas' },
    { value: 'ferragens', label: 'Ferragens' },
    { value: 'outros', label: 'Outros' },
  ];

  // Group by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, KnowledgeItem[]> = {};
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Base de Conhecimento
          </h2>
          <p className="text-sm text-gray-500">
            {knowledgeBase.filter(k => k.active).length} itens cadastrados
          </p>
        </div>
        <Button onClick={handleOpenNew} icon={<Plus size={18} />}>
          Novo Item
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <Input
              placeholder="Buscar por nome, descrição ou tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={18} />}
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Select
              options={categoryOptions}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full sm:w-48"
            />
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'grid' ? 'bg-red-100 text-red-600' : 'bg-white text-gray-500 hover:bg-gray-50'
                )}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'list' ? 'bg-red-100 text-red-600' : 'bg-white text-gray-500 hover:bg-gray-50'
                )}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Category Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {Object.entries(categoryConfig).map(([key, config]) => {
          const Icon = config.icon;
          const count = knowledgeBase.filter(k => k.category === key && k.active).length;

          return (
            <Card 
              key={key} 
              padding="sm" 
              hover
              className={cn(
                'cursor-pointer transition-all',
                filterCategory === key && 'ring-2 ring-red-500'
              )}
              onClick={() => setFilterCategory(filterCategory === key ? 'all' : key)}
            >
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', config.color)}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-xs text-gray-500">{config.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Items */}
      {filteredItems.length === 0 ? (
        <Card className="text-center py-10">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum item encontrado</h3>
          <p className="text-gray-500 mb-4">Adicione itens à base de conhecimento</p>
          <Button onClick={handleOpenNew} icon={<Plus size={18} />}>
            Adicionar Item
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([category, items]) => {
            const config = categoryConfig[category];
            const Icon = config.icon;

            return (
              <div key={category}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn('p-2 rounded-lg', config.color)}>
                    <Icon size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{config.label}</h3>
                  <Badge variant="default">{items.length}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <Card key={item.id} hover>
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Edit size={16} className="text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                      {item.specifications && (
                        <p className="text-xs text-gray-500 mb-3 p-2 bg-gray-50 rounded">
                          {item.specifications}
                        </p>
                      )}
                      {item.priceRange && (
                        <p className="text-sm font-medium text-red-600 mb-3">
                          {item.priceRange}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card padding="none">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">Nome</th>
                <th className="text-left p-4 font-medium text-gray-700">Categoria</th>
                <th className="text-left p-4 font-medium text-gray-700 hidden sm:table-cell">Descrição</th>
                <th className="text-left p-4 font-medium text-gray-700 hidden md:table-cell">Faixa de Preço</th>
                <th className="text-right p-4 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const config = categoryConfig[item.category];

                return (
                  <tr key={item.id} className="border-t hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-medium text-gray-900">{item.name}</p>
                    </td>
                    <td className="p-4">
                      <Badge className={config.color}>{config.label}</Badge>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <p className="text-sm text-gray-600 truncate max-w-xs">{item.description}</p>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <p className="text-sm font-medium text-red-600">{item.priceRange || '-'}</p>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit size={16} className="text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEditing ? 'Editar Item' : 'Novo Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Categoria *"
            options={categoryOptions.filter(o => o.value !== 'all')}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as KnowledgeItem['category'] })}
            required
          />
          <Input
            label="Nome *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Ex: Linha 25, Vidro Temperado..."
          />
          <TextArea
            label="Descrição *"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows={3}
            placeholder="Descreva o produto ou serviço..."
          />
          <TextArea
            label="Especificações"
            value={formData.specifications}
            onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
            rows={2}
            placeholder="Espessura, cores, dimensões..."
          />
          <Input
            label="Faixa de Preço"
            value={formData.priceRange}
            onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
            placeholder="Ex: R$ 350-600/m²"
          />
          <Input
            label="Tags (separadas por vírgula)"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="residencial, premium, acústico..."
          />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
