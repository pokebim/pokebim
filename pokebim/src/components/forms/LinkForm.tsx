import { useState, useEffect } from 'react';
import { Link } from '@/lib/linkService';

interface LinkFormProps {
  groupId: string;
  onSubmit: (data: Omit<Link, 'id' | 'order' | 'clicks'>) => Promise<void>;
  onCancel: () => void;
  initialData?: Link | null;
}

export default function LinkForm({ groupId, onSubmit, onCancel, initialData }: LinkFormProps) {
  const [formData, setFormData] = useState<Omit<Link, 'id' | 'order' | 'clicks'>>({
    groupId,
    title: '',
    url: '',
    description: '',
    icon: '',
    active: true
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [urlValidationError, setUrlValidationError] = useState('');

  // Cargar datos iniciales si se está editando
  useEffect(() => {
    if (initialData) {
      setFormData({
        groupId: initialData.groupId,
        title: initialData.title || '',
        url: initialData.url || '',
        description: initialData.description || '',
        icon: initialData.icon || '',
        active: initialData.active
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Validar URL cuando cambia
    if (name === 'url') {
      validateUrl(value);
    }
  };
  
  const validateUrl = (url: string) => {
    if (!url) {
      setUrlValidationError('La URL es requerida');
      return false;
    }
    
    try {
      // Intentar añadir https:// si no existe un protocolo
      let urlToTest = url;
      if (!/^https?:\/\//i.test(url)) {
        urlToTest = `https://${url}`;
      }
      
      new URL(urlToTest);
      setUrlValidationError('');
      return true;
    } catch (err) {
      setUrlValidationError('La URL ingresada no es válida');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Validar campos obligatorios
      if (!formData.title.trim()) {
        throw new Error('El título del enlace es requerido');
      }
      
      if (!formData.url.trim() || !validateUrl(formData.url)) {
        throw new Error('La URL es requerida y debe ser válida');
      }
      
      // Formatear URL si es necesario
      let formattedUrl = formData.url;
      if (!/^https?:\/\//i.test(formData.url)) {
        formattedUrl = `https://${formData.url}`;
      }
      
      await onSubmit({
        ...formData,
        url: formattedUrl
      });
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al guardar el enlace. Por favor, inténtalo de nuevo.');
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
        <label htmlFor="title" className="block text-sm font-bold text-white mb-2">
          Título *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
          required
        />
      </div>
      
      <div>
        <label htmlFor="url" className="block text-sm font-bold text-white mb-2">
          URL *
        </label>
        <input
          type="text"
          id="url"
          name="url"
          value={formData.url}
          onChange={handleChange}
          placeholder="ejemplo.com o https://ejemplo.com"
          className={`w-full px-3 py-2 border ${urlValidationError ? 'border-red-500' : 'border-gray-700'} bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white`}
          required
        />
        {urlValidationError && (
          <p className="mt-1 text-sm text-red-400">{urlValidationError}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">Si no incluyes http:// o https://, se añadirá automáticamente.</p>
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
          rows={2}
          className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
        />
        <p className="mt-1 text-xs text-gray-400">Breve descripción o información adicional sobre el enlace.</p>
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
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="active"
          name="active"
          checked={formData.active}
          onChange={handleChange}
          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-700 rounded bg-gray-800"
        />
        <label htmlFor="active" className="ml-2 block text-sm text-white">
          Enlace activo
        </label>
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
          {isSubmitting ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear enlace'}
        </button>
      </div>
    </form>
  );
} 