import { useState, useEffect, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/config';
import Image from 'next/image';

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

interface ProductFormData extends Product {
  imageFile?: File | null;
}

// Función para validar URLs de imágenes
const validateImageUrl = async (url: string): Promise<boolean> => {
  if (!url) return false;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    return response.ok && contentType?.startsWith('image/');
  } catch (error) {
    console.error('Error validating image URL:', error);
    return false;
  }
};

export default function ProductForm({ onSubmit, onCancel, initialData, suppliers = [] }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    language: 'Japanese',
    type: 'Booster Box',
    imageUrl: '',
    description: '',
    supplierId: '',
    imageFile: null
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [suppliersList, setSuppliersList] = useState<Supplier[]>(suppliers);
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageInputType, setImageInputType] = useState<'url' | 'file'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if (initialData.imageUrl) {
        setImageInputType('url');
        setImagePreview(initialData.imageUrl);
      }
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

  // Validar URL de imagen cuando cambia
  const handleImageUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, imageUrl: url }));
    
    if (url) {
      setIsValidatingImage(true);
      setImageError('');
      
      const isValid = await validateImageUrl(url);
      
      if (!isValid) {
        setImageError('La URL proporcionada no es una imagen válida');
      }
      
      setIsValidatingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file, imageUrl: '' }));
      setImageError('');
      
      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageTypeChange = (type: 'url' | 'file') => {
    setImageInputType(type);
    setImageError('');
    setFormData(prev => ({ ...prev, imageUrl: '', imageFile: null }));
    setImagePreview('');
    if (type === 'file' && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      let finalImageUrl = formData.imageUrl;

      // Si hay un archivo de imagen, subirlo a Firebase Storage
      if (formData.imageFile) {
        const fileRef = ref(storage, `product-images/${Date.now()}-${formData.imageFile.name}`);
        await uploadBytes(fileRef, formData.imageFile);
        finalImageUrl = await getDownloadURL(fileRef);
      } else if (formData.imageUrl) {
        // Validar URL si se proporcionó una
        const isValid = await validateImageUrl(formData.imageUrl);
        if (!isValid) {
          setImageError('La URL proporcionada no es una imagen válida');
          setIsSubmitting(false);
          return;
        }
      }

      const submissionData = {
        ...formData,
        imageUrl: finalImageUrl || 'https://via.placeholder.com/400x250?text=Product+Image',
        supplierId: formData.supplierId || 'default-supplier'
      };
      
      delete submissionData.imageFile; // Eliminar el campo imageFile antes de enviar
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
          <option value="Chinese">Chino</option>
          <option value="Korean">Coreano</option>
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
      
      <div className="space-y-4">
        <label className="block text-sm font-bold text-white">
          Imagen del producto
        </label>
        
        <div className="flex space-x-4 mb-4">
          <button
            type="button"
            onClick={() => handleImageTypeChange('url')}
            className={`px-4 py-2 rounded-md ${
              imageInputType === 'url'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            URL de imagen
          </button>
          <button
            type="button"
            onClick={() => handleImageTypeChange('file')}
            className={`px-4 py-2 rounded-md ${
              imageInputType === 'file'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            Subir archivo
          </button>
        </div>

        {imageInputType === 'url' ? (
          <div className="space-y-2">
            <input
              type="text"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleImageUrlChange}
              placeholder="https://ejemplo.com/imagen.jpg"
              className={`mt-1 block w-full rounded-md border-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 bg-gray-800 text-white px-3 py-2 ${
                imageError ? 'border-red-500' : ''
              }`}
            />
            {isValidatingImage && (
              <p className="text-sm text-gray-400">Validando URL de imagen...</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-green-600 file:text-white
                hover:file:bg-green-700"
            />
          </div>
        )}

        {imageError && (
          <p className="text-sm text-red-500">{imageError}</p>
        )}

        {(imagePreview || formData.imageUrl) && (
          <div className="mt-4">
            <p className="text-sm font-medium text-white mb-2">Vista previa:</p>
            <div className="relative w-48 h-48 rounded-lg overflow-hidden">
              <Image
                src={imagePreview || formData.imageUrl || 'https://via.placeholder.com/400x250?text=Preview'}
                alt="Preview"
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}
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