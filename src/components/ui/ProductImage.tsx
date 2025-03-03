import Image from 'next/image';
import { useState, useEffect } from 'react';

interface ProductImageProps {
  imageUrl?: string;
  productName?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onClick?: () => void;
}

/**
 * Componente reutilizable para mostrar imágenes de productos
 * con soporte para diferentes tamaños y fallback para imágenes no disponibles
 */
export default function ProductImage({ 
  imageUrl, 
  productName = 'Product', 
  size = 'small',
  className = '',
  onClick
}: ProductImageProps) {
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Determinar dimensiones basadas en el tamaño
  const dimensions = {
    small: { width: 12, height: 10 },
    medium: { width: 24, height: 20 },
    large: { width: 48, height: 30 }
  }[size];
  
  // URL de fallback si no hay imagen disponible o hay error
  const fallbackUrl = `https://via.placeholder.com/400x400?text=${encodeURIComponent(productName)}`;
  
  // Limpiar la URL (eliminar parámetros de consulta que pueden causar problemas)
  const cleanImageUrl = (url: string) => {
    if (!url) return '';
    
    try {
      // Conservar solo la parte base de la URL para evitar problemas con parámetros
      const urlObj = new URL(url);
      // Mantenemos los parámetros ya que son importantes para algunas CDNs
      return url;
    } catch (e) {
      console.error('URL inválida:', url);
      return '';
    }
  };
  
  useEffect(() => {
    // Si hay una URL de imagen, limpiarla
    const cleanedUrl = imageUrl ? cleanImageUrl(imageUrl) : '';
    // Actualizar la imagen source cuando cambia la URL o hay un error
    setImageSrc(!cleanedUrl || error ? fallbackUrl : cleanedUrl);
    setIsLoading(true);
  }, [imageUrl, error, fallbackUrl]);
  
  // Resetear el error si cambia la URL
  useEffect(() => {
    if (imageUrl && error) {
      setError(false);
    }
  }, [imageUrl, error]);
  
  const handleImageLoad = () => {
    setIsLoading(false);
  };
  
  const cursorStyle = onClick ? 'cursor-pointer' : '';
  
  return (
    <div 
      className={`relative overflow-hidden rounded-md ${className} ${cursorStyle}`}
      style={{ 
        width: '100%', 
        height: `${dimensions.height}rem`,
        minHeight: '150px',
        background: '#1f2937'
      }}
      onClick={onClick}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="animate-pulse h-12 w-12 rounded-full bg-gray-600"></div>
        </div>
      )}
      
      <Image 
        src={imageSrc} 
        alt={productName}
        fill
        sizes={`(max-width: 768px) 100vw, ${dimensions.width}rem`}
        className={`transition-all duration-300 object-contain hover:scale-105 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onError={() => setError(true)}
        onLoad={handleImageLoad}
        priority={size === 'large'}
        unoptimized
      />
    </div>
  );
} 