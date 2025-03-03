import { useState, useEffect } from 'react';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';

interface Product {
  id?: string;
  name?: string;
  language?: string;
  type?: string;
  imageUrl?: string;
  description?: string;
}

interface ProductFormProps {
  onSubmit: (data: Product) => void;
  onCancel: () => void;
  initialData?: Product;
}

// Función para validar URLs de imágenes - versión más permisiva
const validateImageUrl = async (url: string): Promise<boolean> => {
  if (!url) return false;
  
  // Primero, verificar si es una URL válida
  try {
    new URL(url);
  } catch (e) {
    return false;
  }
  
  // Para URLs de dominios conocidos, asumimos que son imágenes válidas para evitar
  // problemas con CORS o restricciones de cabeceras
  const trustedDomains = [
    'firebasestorage.googleapis.com',
    'flashstore.es',
    'vrarestore.com',
    'krystalkollectz.com',
    'unsplash.com',
    'picsum.photos',
    'via.placeholder.com',
    'cdn.shopify.com',
    'cloudfront.net',
    'amazonaws.com'
  ];
  
  try {
    const urlObj = new URL(url);
    // Si el dominio está en nuestra lista de confianza, lo aceptamos sin verificar
    if (trustedDomains.some(domain => urlObj.hostname.includes(domain) || 
                                      urlObj.hostname.endsWith(`.${domain}`))) {
      return true;
    }
    
    // Para otros dominios, intentamos validar con HEAD request
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return true; // Si llegamos aquí sin error, consideramos válida la URL
  } catch (error) {
    console.warn('Error validando URL de imagen, pero la aceptaremos:', error);
    // Aún así, permitimos la URL para evitar falsos negativos
    return true;
  }
};

export default function ProductForm({ onSubmit, onCancel, initialData }: ProductFormProps) {
  const [formData, setFormData] = useState<Product>({
    name: '',
    language: 'Japanese',
    type: 'Booster Box',
    imageUrl: '',
    description: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [showFullPreview, setShowFullPreview] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if (initialData.imageUrl) {
        setImagePreviewUrl(initialData.imageUrl);
      }
    }
  }, [initialData]);

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
      setImagePreviewUrl(url); // Mostrar la imagen inmediatamente como vista previa
      
      try {
        const isValid = await validateImageUrl(url);
        
        if (!isValid) {
          setImageError('La URL proporcionada no parece ser una imagen válida, pero se intentará cargar igualmente');
        }
      } catch (error) {
        setImageError('Error al validar la URL de la imagen, pero se intentará cargar igualmente');
      } finally {
        setIsValidatingImage(false);
      }
    } else {
      setImagePreviewUrl('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    const submissionData = {
      ...formData,
      imageUrl: formData.imageUrl || 'https://via.placeholder.com/400x250?text=Product+Image'
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

  const openFullPreview = () => {
    if (imagePreviewUrl) {
      setShowFullPreview(true);
    }
  };

  return (
    <>
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
        
        <div className="space-y-2">
          <label htmlFor="imageUrl" className="block text-sm font-bold text-white">
            URL de la imagen
          </label>
          <input
            type="text"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleImageUrlChange}
            className={`mt-1 block w-full rounded-md border border-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 text-white bg-gray-800 px-3 py-2 ${
              imageError ? 'border-yellow-500' : ''
            }`}
            placeholder="Introduce la URL de la imagen"
          />
          {isValidatingImage && (
            <p className="text-sm text-gray-400">Validando URL de imagen...</p>
          )}
          {imageError && (
            <p className="text-sm text-yellow-500">{imageError}</p>
          )}

          {/* Vista previa de la imagen */}
          {imagePreviewUrl && (
            <div className="mt-4">
              <p className="block text-sm font-bold text-white mb-2">Vista previa:</p>
              <div 
                className="relative w-full h-64 rounded-md overflow-hidden border border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={openFullPreview}
              >
                <Image 
                  src={imagePreviewUrl}
                  alt="Vista previa"
                  fill
                  className="object-contain"
                  unoptimized
                  onError={() => {
                    setImageError('No se pudo cargar la imagen. La URL podría ser incorrecta o tener restricciones de acceso.');
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-40 transition-opacity">
                  <span className="text-white font-medium px-3 py-1 bg-gray-800 rounded-md">
                    Click para ampliar
                  </span>
                </div>
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

      {/* Modal para vista previa a pantalla completa */}
      {imagePreviewUrl && (
        <Modal
          isOpen={showFullPreview}
          onClose={() => setShowFullPreview(false)}
          title="Vista previa de imagen"
        >
          <div className="relative w-full h-[70vh] rounded-md">
            <Image 
              src={imagePreviewUrl}
              alt="Vista previa ampliada"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setShowFullPreview(false)}
              className="px-4 py-2 bg-gray-700 text-white rounded-md"
            >
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </>
  );
} 