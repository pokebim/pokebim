import { useState, useEffect } from 'react';

interface Product {
  id?: string;
  name?: string;
  language?: string;
  type?: string;
  imageUrl?: string;
  description?: string;
  supplierId?: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface ProductFormProps {
  onSubmit: (data: Product) => void;
  onCancel: () => void;
  initialData?: Product;
  suppliers?: Supplier[];
}

export default function ProductForm({ onSubmit, onCancel, initialData, suppliers = [] }: ProductFormProps) {
  const [formData, setFormData] = useState<Product>({
    name: '',
    language: 'Japanese',
    type: 'Booster Box',
    imageUrl: 'https://via.placeholder.com/400x250?text=Product+Image',
    description: '',
    supplierId: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [suppliersList, setSuppliersList] = useState<Supplier[]>(suppliers);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);
  
  useEffect(() => {
    if (suppliers.length > 0 && suppliersList.length === 0) {
      setSuppliersList(suppliers);
    } 
    else if (suppliers.length === 0 && suppliersList.length === 0) {
      setLoadingSuppliers(true);
      try {
        const storedSuppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
        
        const formattedSuppliers = storedSuppliers.map((supplier: any) => ({
          id: supplier.id,
          name: supplier.name
        }));
        
        setSuppliersList(formattedSuppliers);
      } catch (err) {
        console.error('Error al cargar proveedores:', err);
        setError('No se pudieron cargar los proveedores. Por favor, inténtalo de nuevo.');
      } finally {
        setLoadingSuppliers(false);
      }
    }
  }, []);
  
  useEffect(() => {
    if (suppliersList.length > 0 && !formData.supplierId && !initialData) {
      setFormData(prev => ({ ...prev, supplierId: suppliersList[0].id }));
    }
  }, [suppliersList, formData.supplierId, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    if (!formData.supplierId) {
      if (suppliersList.length > 0) {
        setFormData(prev => ({ ...prev, supplierId: suppliersList[0].id }));
      } else {
        setFormData(prev => ({ ...prev, supplierId: 'default-supplier' }));
      }
    }
    
    let validatedImageUrl = formData.imageUrl;
    
    if (!validatedImageUrl || validatedImageUrl.trim() === '') {
      validatedImageUrl = `https://via.placeholder.com/400x250?text=${encodeURIComponent(formData.name || 'Product Image')}`;
    } else {
      if (!validatedImageUrl.startsWith('http://') && !validatedImageUrl.startsWith('https://')) {
        validatedImageUrl = 'https://' + validatedImageUrl;
      }
      
      try {
        new URL(validatedImageUrl);
      } catch (e) {
        console.error('Invalid URL even after adding protocol:', e);
        validatedImageUrl = `https://via.placeholder.com/400x250?text=${encodeURIComponent(formData.name || 'Product Image')}`;
      }
    }
    
    const submissionData = {
      ...formData,
      imageUrl: validatedImageUrl,
      supplierId: formData.supplierId || 'default-supplier'
    };
    
    try {
      onSubmit(submissionData);
    } catch (err) {
      setError('Ocurrió un error al guardar el producto. Por favor, inténtalo de nuevo.');
      console.error('Error al enviar formulario:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-900 border-l-4 border-red-700 p-4 mb-4">
          <p className="text-white">{error}</p>
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-bold text-white">
          Nombre
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 text-white bg-gray-800 px-3 py-2"
        />
      </div>
      
      <div>
        <label htmlFor="supplierId" className="block text-sm font-bold text-white">
          Proveedor
        </label>
        <select
          id="supplierId"
          name="supplierId"
          value={formData.supplierId}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 text-white bg-gray-800 px-3 py-2"
          disabled={loadingSuppliers}
        >
          <option value="">Seleccionar proveedor (opcional)</option>
          {loadingSuppliers ? (
            <option>Cargando proveedores...</option>
          ) : suppliersList.length === 0 ? (
            <option value="">No hay proveedores disponibles</option>
          ) : (
            suppliersList.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))
          )}
        </select>
      </div>
      
      <div>
        <label htmlFor="language" className="block text-sm font-bold text-white">
          Idioma
        </label>
        <select
          id="language"
          name="language"
          value={formData.language}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 text-white bg-gray-800 px-3 py-2"
        >
          <option value="Japanese">Japonés</option>
          <option value="English">Inglés</option>
          <option value="Spanish">Español</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="type" className="block text-sm font-bold text-white">
          Tipo de Producto
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 text-white bg-gray-800 px-3 py-2"
        >
          <option value="Booster Box">Booster Box</option>
          <option value="Elite Trainer Box">Elite Trainer Box</option>
          <option value="Booster Pack">Booster Pack</option>
          <option value="Single Card">Carta Individual</option>
          <option value="Premium Collection">Colección Premium</option>
          <option value="Special Set">Set Especial</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="imageUrl" className="block text-sm font-bold text-white">
          URL de Imagen (opcional)
        </label>
        <input
          type="text"
          id="imageUrl"
          name="imageUrl"
          value={formData.imageUrl}
          onChange={handleChange}
          placeholder="https://ejemplo.com/imagen.jpg"
          className="mt-1 block w-full rounded-md border border-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 text-white bg-gray-800 px-3 py-2"
        />
        <p className="mt-1 text-sm text-gray-400">
          Deja en blanco para usar una imagen generada automáticamente
        </p>
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-bold text-white">
          Descripción (opcional)
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 text-white bg-gray-800 px-3 py-2"
        ></textarea>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-700 rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-800 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : initialData ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </form>
  );
} 