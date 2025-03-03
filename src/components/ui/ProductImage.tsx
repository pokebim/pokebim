import Image from 'next/image';
import { useState, useEffect } from 'react';
import DefaultProductImage from './DefaultProductImage';

interface ProductImageProps {
  src?: string;
  alt?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onClick?: () => void;
}

/**
 * Componente reutilizable para mostrar imágenes de productos
 * con soporte para diferentes tamaños y fallback para imágenes no disponibles
 */
export default function ProductImage({ 
  src, 
  alt = 'Product', 
  size = 'small',
  className = '',
  onClick
}: ProductImageProps) {
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!src);
  
  // Determinar dimensiones basadas en el tamaño
  const dimensions = {
    small: { width: 60, height: 60 },
    medium: { width: 120, height: 120 },
    large: { width: 240, height: 240 }
  }[size];
  
  // Resetear el error si cambia la URL
  useEffect(() => {
    if (src) {
      setError(false);
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [src]);
  
  const handleImageLoad = () => {
    setIsLoading(false);
  };
  
  const handleImageError = () => {
    setError(true);
    setIsLoading(false);
  };
  
  const cursorStyle = onClick ? 'cursor-pointer hover:shadow-lg' : '';
  
  // Si no hay src o hay un error, mostrar imagen por defecto
  if (!src || error) {
    return (
      <div 
        className={`relative ${className} ${cursorStyle}`}
        onClick={onClick}
        title={onClick ? "Haz clic para ampliar" : alt}
      >
        <DefaultProductImage 
          productName={alt} 
          className="w-full h-full"
        />
      </div>
    );
  }
  
  return (
    <div 
      className={`relative flex items-center justify-center ${className} ${cursorStyle}`}
      onClick={onClick}
      title={onClick ? "Haz clic para ampliar" : alt}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="animate-pulse h-6 w-6 rounded-full bg-gray-400"></div>
        </div>
      )}
      
      <img 
        src={src}
        alt={alt}
        className={`w-full h-full object-contain transition-all duration-300 ${onClick ? 'hover:scale-105' : ''} ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
} 