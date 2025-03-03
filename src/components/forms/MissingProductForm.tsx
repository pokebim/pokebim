import React, { useState, useEffect } from 'react';
import { MissingProduct } from '@/lib/missingProductService';

interface MissingProductFormProps {
  initialData?: MissingProduct;
  onSubmit: (data: Omit<MissingProduct, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export default function MissingProductForm({
  initialData,
  onSubmit,
  onCancel
}: MissingProductFormProps) {
  const [formData, setFormData] = useState<Omit<MissingProduct, 'id'>>({
    name: '',
    link: '',
    price: undefined,
    quantity: undefined,
    purpose: '',
    notes: '',
    priority: 'medium'
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Inicializar form con datos existentes si los hay
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        link: initialData.link || '',
        price: initialData.price,
        quantity: initialData.quantity,
        purpose: initialData.purpose || '',
        notes: initialData.notes || '',
        priority: initialData.priority || 'medium'
      });
    }
  }, [initialData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'quantity' 
        ? value === '' ? undefined : Number(value) 
        : value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('El nombre del producto es obligatorio');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error al guardar el producto:', error);
      setError('Ha ocurrido un error al guardar los datos. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white">
          Nombre del producto *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>
      
      <div>
        <label htmlFor="link" className="block text-sm font-medium text-white">
          Enlace (Aliexpress u otro)
        </label>
        <input
          type="url"
          id="link"
          name="link"
          value={formData.link || ''}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-white">
            Precio aproximado (€)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price !== undefined ? formData.price : ''}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-white">
            Cantidad necesaria
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity !== undefined ? formData.quantity : ''}
            onChange={handleChange}
            min="1"
            className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="purpose" className="block text-sm font-medium text-white">
          Para qué se necesita
        </label>
        <input
          type="text"
          id="purpose"
          name="purpose"
          value={formData.purpose || ''}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-white">
          Prioridad
        </label>
        <select
          id="priority"
          name="priority"
          value={formData.priority || 'medium'}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-white">
          Notas adicionales
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Añadir'}
        </button>
      </div>
    </form>
  );
} 