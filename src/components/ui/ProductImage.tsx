import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
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
  // Usamos useRef para mantener el estado de la imagen incluso cuando el componente se re-renderiza
  const hasErrorRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const loadStartTimeRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(!hasLoadedRef.current && !!src);
  const [key, setKey] = useState(0); // Key para forzar la re-renderización cuando sea necesario
  
  // Determinar dimensiones basadas en el tamaño
  const dimensions = {
    small: { width: 60, height: 60 },
    medium: { width: 120, height: 120 },
    large: { width: 240, height: 240 }
  }[size];
  
  // Si no hay URL o hay un error previo con esta URL, mostrar imagen por defecto
  if (!src || hasErrorRef.current) {
    return (
      <div 
        className={`relative ${className}`}
        onClick={onClick}
        title={onClick ? "Haz clic para ampliar" : alt}
        style={{ minWidth: dimensions.width, minHeight: dimensions.height }}
      >
        <DefaultProductImage 
          productName={alt} 
          className="w-full h-full"
          showName={false}
        />
      </div>
    );
  }
  
  const handleImageLoad = () => {
    hasLoadedRef.current = true;
    loadStartTimeRef.current = null;
    setIsLoading(false);
  };
  
  const handleImageError = () => {
    console.error(`Error al cargar imagen: ${src}`);
    hasErrorRef.current = true;
    loadStartTimeRef.current = null;
    setIsLoading(false);
    // Forzar re-renderización para mostrar el fallback
    setKey(prev => prev + 1);
  };
  
  // Iniciar tiempo de carga si es necesario
  if (!loadStartTimeRef.current && !hasLoadedRef.current && !hasErrorRef.current) {
    loadStartTimeRef.current = Date.now();
  }
  
  // Verificar si ha pasado demasiado tiempo cargando
  if (loadStartTimeRef.current && Date.now() - loadStartTimeRef.current > 10000) {
    console.warn(`Timeout al cargar imagen: ${src}`);
    hasErrorRef.current = true;
    loadStartTimeRef.current = null;
    // Forzar re-renderización para mostrar el fallback
    setKey(prev => prev + 1);
  }
  
  const cursorStyle = onClick ? 'cursor-pointer hover:shadow-lg' : '';
  
  return (
    <div 
      key={key}
      className={`relative flex items-center justify-center ${className} ${cursorStyle}`}
      onClick={onClick}
      title={onClick ? "Haz clic para ampliar" : alt}
      style={{ minWidth: dimensions.width, minHeight: dimensions.height }}
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
        loading="lazy"
      />
    </div>
  );
} 