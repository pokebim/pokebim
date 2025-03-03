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
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Determinar dimensiones basadas en el tamaño
  const dimensions = {
    small: { width: 80, height: 60 },
    medium: { width: 120, height: 90 },
    large: { width: 240, height: 180 }
  }[size];
  
  // URL de fallback si no hay imagen disponible o hay error
  const fallbackUrl = `https://via.placeholder.com/200x200?text=${encodeURIComponent(productName)}`;
  
  // Limpiar la URL (eliminar parámetros de consulta que pueden causar problemas)
  const cleanImageUrl = (url: string) => {
    if (!url) return null;
    
    try {
      // Conservar solo la parte base de la URL para evitar problemas con parámetros
      const urlObj = new URL(url);
      // Mantenemos los parámetros ya que son importantes para algunas CDNs
      return url;
    } catch (e) {
      console.error('URL inválida:', url);
      return null;
    }
  };
  
  useEffect(() => {
    // Si hay una URL de imagen, limpiarla
    const cleanedUrl = imageUrl ? cleanImageUrl(imageUrl) : null;
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
  
  const cursorStyle = onClick ? 'cursor-pointer hover:shadow-lg' : '';
  
  return (
    <div 
      className={`relative overflow-hidden rounded-md ${className} ${cursorStyle}`}
      style={{ 
        width: dimensions.width,
        height: dimensions.height,
        minHeight: size === 'small' ? '60px' : (size === 'medium' ? '90px' : '180px'),
        background: '#1f2937'
      }}
      onClick={onClick}
      title={onClick ? "Haz clic para ampliar" : productName}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="animate-pulse h-6 w-6 rounded-full bg-gray-600"></div>
        </div>
      )}
      
      {imageSrc && (
        <Image 
          src={imageSrc} 
          alt={productName}
          fill
          sizes={`(max-width: 768px) 100vw, ${dimensions.width}px`}
          className={`transition-all duration-300 object-contain ${onClick ? 'hover:scale-105' : ''} ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onError={() => setError(true)}
          onLoad={handleImageLoad}
          priority={size === 'large'}
          unoptimized
        />
      )}
    </div>
  );
} 