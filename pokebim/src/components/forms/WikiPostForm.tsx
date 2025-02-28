import { useState, useEffect } from 'react';
import { WikiPost } from '@/lib/wikiService';

interface WikiPostFormProps {
  onSubmit: (data: Omit<WikiPost, 'id'>) => void;
  onCancel: () => void;
  initialData?: WikiPost | null;
}

export default function WikiPostForm({ onSubmit, onCancel, initialData }: WikiPostFormProps) {
  const [formData, setFormData] = useState<Omit<WikiPost, 'id'>>({
    title: '',
    content: '',
    author: '',
    category: '',
    tags: [],
    published: false,
    imageUrl: ''
  });
  
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Cargar datos iniciales si se está editando
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        content: initialData.content || '',
        author: initialData.author || '',
        category: initialData.category || '',
        tags: initialData.tags || [],
        published: initialData.published || false,
        imageUrl: initialData.imageUrl || ''
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Añadir formato HTML básico para los saltos de línea
    const content = e.target.value.replace(/\n/g, '<br>');
    setFormData(prev => ({ ...prev, content }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      if (!formData.title.trim()) {
        throw new Error('El título es requerido');
      }
      
      if (!formData.content.trim()) {
        throw new Error('El contenido es requerido');
      }
      
      onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al guardar el post. Por favor, inténtalo de nuevo.');
      setIsSubmitting(false);
    }
  };

  // Categorías predefinidas
  const predefinedCategories = [
    'Guías',
    'Noticias',
    'Productos',
    'Estrategias',
    'Eventos',
    'Colección',
    'Inversión',
    'Otra'
  ];

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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="author" className="block text-sm font-bold text-white mb-2">
            Autor
          </label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
          />
        </div>
        
        <div>
          <label htmlFor="category" className="block text-sm font-bold text-white mb-2">
            Categoría
          </label>
          <select
            id="category"
            name="category"
            value={formData.category || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
          >
            <option value="">Selecciona una categoría</option>
            {predefinedCategories.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <label htmlFor="imageUrl" className="block text-sm font-bold text-white mb-2">
          URL de imagen (opcional)
        </label>
        <input
          type="url"
          id="imageUrl"
          name="imageUrl"
          value={formData.imageUrl || ''}
          onChange={handleChange}
          placeholder="https://ejemplo.com/imagen.jpg"
          className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
        />
        {formData.imageUrl && (
          <div className="mt-2">
            <p className="text-sm text-gray-400 mb-1">Vista previa:</p>
            <img 
              src={formData.imageUrl} 
              alt="Vista previa" 
              className="h-40 rounded-md object-cover" 
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                setError('La URL de la imagen no es válida');
              }}
            />
          </div>
        )}
      </div>
      
      <div>
        <label htmlFor="content" className="block text-sm font-bold text-white mb-2">
          Contenido *
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content.replace(/<br>/g, '\n')}
          onChange={handleContentChange}
          rows={12}
          className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white font-mono"
          required
        />
        <p className="mt-1 text-sm text-gray-400">
          Puedes usar markdown básico para formatear el texto (enlaces, **negrita**, *cursiva*, etc.)
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-bold text-white mb-2">
          Etiquetas
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleTagKeyPress}
            placeholder="Añadir etiqueta"
            className="flex-grow px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Añadir
          </button>
        </div>
        
        {formData.tags && formData.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-800 text-gray-300">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-gray-200 focus:outline-none"
                >
                  <span className="sr-only">Eliminar etiqueta</span>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="published"
          name="published"
          checked={formData.published || false}
          onChange={handleChange}
          className="h-4 w-4 text-green-600 focus:ring-green-500 bg-gray-800 border-gray-700 rounded"
        />
        <label htmlFor="published" className="ml-2 block text-sm text-white">
          Publicar (visible para todos)
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
          {isSubmitting ? 'Guardando...' : initialData ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </form>
  );
} 