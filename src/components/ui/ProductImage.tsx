import Image from 'next/image';
import { useState, useEffect } from 'react';

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
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Determinar dimensiones basadas en el tamaño
  const dimensions = {
    small: { width: 60, height: 60 },
    medium: { width: 120, height: 120 },
    large: { width: 240, height: 240 }
  }[size];
  
  // URL de fallback si no hay imagen disponible o hay error
  const fallbackUrl = `https://via.placeholder.com/100x100?text=${encodeURIComponent(alt)}`;
  
  useEffect(() => {
    // Actualizar la imagen source cuando cambia la URL o hay un error
    setImageSrc(!src || error ? fallbackUrl : src);
    setIsLoading(true);
  }, [src, error, fallbackUrl]);
  
  // Resetear el error si cambia la URL
  useEffect(() => {
    if (src && error) {
      setError(false);
    }
  }, [src, error]);
  
  const handleImageLoad = () => {
    setIsLoading(false);
  };
  
  const cursorStyle = onClick ? 'cursor-pointer hover:shadow-lg' : '';
  
  return (
    <div 
      className={`relative flex items-center justify-center ${className} ${cursorStyle}`}
      onClick={onClick}
      title={onClick ? "Haz clic para ampliar" : alt}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <div className="animate-pulse h-6 w-6 rounded-full bg-gray-400"></div>
        </div>
      )}
      
      {imageSrc && (
        <img 
          src={imageSrc} 
          alt={alt}
          className={`w-full h-full object-contain transition-all duration-300 ${onClick ? 'hover:scale-105' : ''} ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onError={() => setError(true)}
          onLoad={handleImageLoad}
        />
      )}
    </div>
  );
} 