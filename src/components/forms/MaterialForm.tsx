import React, { useState, useEffect } from 'react';
import { Material } from '@/lib/materialService';

interface MaterialFormProps {
  initialData?: Material;
  onSubmit: (data: Omit<Material, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export default function MaterialForm({
  initialData,
  onSubmit,
  onCancel
}: MaterialFormProps) {
  const [formData, setFormData] = useState<Omit<Material, 'id'>>({
    name: '',
    description: '',
    quantity: undefined,
    location: '',
    purchasedAt: '',
    purchasePrice: undefined,
    supplier: '',
    minStock: undefined,
    notes: ''
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Inicializar form con datos existentes si los hay
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        quantity: initialData.quantity,
        location: initialData.location || '',
        purchasedAt: initialData.purchasedAt 
          ? typeof initialData.purchasedAt === 'string' 
            ? initialData.purchasedAt 
            : initialData.purchasedAt.toISOString().split('T')[0]
          : '',
        purchasePrice: initialData.purchasePrice,
        supplier: initialData.supplier || '',
        minStock: initialData.minStock,
        notes: initialData.notes || ''
      });
    }
  }, [initialData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: ['quantity', 'purchasePrice', 'minStock'].includes(name)
        ? value === '' ? undefined : Number(value) 
        : value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('El nombre del material es obligatorio');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error al guardar el material:', error);
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
          Nombre del material *
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
        <label htmlFor="description" className="block text-sm font-medium text-white">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          rows={2}
          className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-white">
            Cantidad
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity !== undefined ? formData.quantity : ''}
            onChange={handleChange}
            min="0"
            className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label htmlFor="minStock" className="block text-sm font-medium text-white">
            Stock mínimo
          </label>
          <input
            type="number"
            id="minStock"
            name="minStock"
            value={formData.minStock !== undefined ? formData.minStock : ''}
            onChange={handleChange}
            min="0"
            className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-white">
          Ubicación
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location || ''}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="purchasedAt" className="block text-sm font-medium text-white">
            Fecha de compra
          </label>
          <input
            type="date"
            id="purchasedAt"
            name="purchasedAt"
            value={formData.purchasedAt || ''}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <label htmlFor="purchasePrice" className="block text-sm font-medium text-white">
            Precio de compra (€)
          </label>
          <input
            type="number"
            id="purchasePrice"
            name="purchasePrice"
            value={formData.purchasePrice !== undefined ? formData.purchasePrice : ''}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="supplier" className="block text-sm font-medium text-white">
          Proveedor
        </label>
        <input
          type="text"
          id="supplier"
          name="supplier"
          value={formData.supplier || ''}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
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