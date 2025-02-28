import { useState, useEffect } from 'react';
import { LinkGroup } from '@/lib/linkService';

interface LinkGroupFormProps {
  onSubmit: (data: Omit<LinkGroup, 'id' | 'order'>) => Promise<void>;
  onCancel: () => void;
  initialData?: LinkGroup | null;
}

export default function LinkGroupForm({ onSubmit, onCancel, initialData }: LinkGroupFormProps) {
  const [formData, setFormData] = useState<Omit<LinkGroup, 'id' | 'order'>>({
    name: '',
    description: '',
    icon: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Cargar datos iniciales si se está editando
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        icon: initialData.icon || ''
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      if (!formData.name.trim()) {
        throw new Error('El nombre del grupo es requerido');
      }
      
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al guardar el grupo. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-900 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-white">{error}</p>
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-bold text-white mb-2">
          Nombre del grupo *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
          required
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-bold text-white mb-2">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
        />
        <p className="mt-1 text-xs text-gray-400">Breve descripción de este grupo de enlaces.</p>
      </div>
      
      <div>
        <label htmlFor="icon" className="block text-sm font-bold text-white mb-2">
          Icono (opcional)
        </label>
        <input
          type="text"
          id="icon"
          name="icon"
          value={formData.icon || ''}
          onChange={handleChange}
          placeholder="ej: 🔗, 📱, 📁"
          className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
        />
        <p className="mt-1 text-xs text-gray-400">Puedes usar un emoji como icono.</p>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-700 rounded-md bg-gray-800 text-white hover:bg-gray-700"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear grupo'}
        </button>
      </div>
    </form>
  );
} 