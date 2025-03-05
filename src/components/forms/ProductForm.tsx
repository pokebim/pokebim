'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';
import { Product } from '@/lib/productService';

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
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

export default function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<Product>({
    name: '',
    language: 'es',
    type: 'regular',
    description: '',
    notes: '',
    imageUrl: '',
    cardmarketUrl: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [showFullPreview, setShowFullPreview] = useState(false);

  useEffect(() => {
    if (product) {
      console.log('ProductForm useEffect - Producto recibido:', product);
      
      // Normalizar el valor del idioma
      let normalizedLanguage = product.language;
      if (product.language === 'Japanese') normalizedLanguage = 'jp';
      if (product.language === 'English') normalizedLanguage = 'en';
      if (product.language === 'Chinese') normalizedLanguage = 'cn';
      if (product.language === 'Korean') normalizedLanguage = 'kr';
      if (product.language === 'Español') normalizedLanguage = 'es';

      // Asegurarse de que los valores del producto existente se mantengan
      const formDataToSet = {
        id: product.id,
        name: product.name || '',
        language: normalizedLanguage || 'es',
        type: product.type || 'regular',
        description: product.description || '',
        notes: product.notes || '',
        imageUrl: product.imageUrl || '',
        cardmarketUrl: product.cardmarketUrl || ''
      };
      console.log('ProductForm useEffect - Estableciendo formData:', formDataToSet);
      setFormData(formDataToSet);
      if (product.imageUrl) {
        setImagePreviewUrl(product.imageUrl);
      }
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log('ProductForm handleChange -', name, ':', value);
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      console.log('ProductForm handleChange - Nuevo formData:', newData);
      return newData;
    });
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
    
    console.log('ProductForm handleSubmit - Estado actual del formulario:', formData);
    const submissionData = {
      ...formData,
      imageUrl: formData.imageUrl || 'https://via.placeholder.com/400x250?text=Product+Image'
    };
    console.log('ProductForm handleSubmit - Datos a enviar:', submissionData);
    
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
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Nombre
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm px-4 py-2"
          />
        </div>
        
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Idioma
          </label>
          <select
            id="language"
            name="language"
            value={formData.language}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm px-4 py-2"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="jp">Japanese</option>
            <option value="cn">Chinese</option>
            <option value="kr">Korean</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Tipo
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm px-4 py-2"
          >
            <option value="regular">Regular</option>
            <option value="special">Special</option>
            <option value="promo">Promotional</option>
            <option value="booster">Booster Box</option>
            <option value="starter">Starter Deck</option>
            <option value="collection">Collection Box</option>
            <option value="gift">Gift Box</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm px-4 py-2"
          />
        </div>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Notas
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm px-4 py-2"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            URL de la imagen
          </label>
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleImageUrlChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm px-4 py-2 ${
              imageError ? 'border-yellow-500' : ''
            }`}
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
          <label htmlFor="cardmarketUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            URL de Cardmarket
          </label>
          <input
            type="url"
            id="cardmarketUrl"
            name="cardmarketUrl"
            value={formData.cardmarketUrl}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white sm:text-sm px-4 py-2"
            placeholder="https://www.cardmarket.com/..."
          />
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : product ? 'Actualizar' : 'Crear'}
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