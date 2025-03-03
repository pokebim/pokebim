import Image from 'next/image';
import { useState, useEffect } from 'react';

interface ProductImageProps {
  imageUrl?: string;
  productName?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Componente reutilizable para mostrar imágenes de productos
 * con soporte para diferentes tamaños y fallback para imágenes no disponibles
 */
export default function ProductImage({ 
  imageUrl, 
  productName = 'Product', 
  size = 'small',
  className = ''
}: ProductImageProps) {
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  
  // Determinar dimensiones basadas en el tamaño
  const dimensions = {
    small: { width: 12, height: 12 },
    medium: { width: 24, height: 24 },
    large: { width: 48, height: 48 }
  }[size];
  
  // URL de fallback si no hay imagen disponible o hay error
  const fallbackUrl = `https://via.placeholder.com/400x400?text=${encodeURIComponent(productName)}`;
  
  useEffect(() => {
    // Actualizar la imagen source cuando cambia la URL o hay un error
    setImageSrc(!imageUrl || error ? fallbackUrl : imageUrl);
  }, [imageUrl, error, fallbackUrl]);
  
  // Resetear el error si cambia la URL
  useEffect(() => {
    if (imageUrl && error) {
      setError(false);
    }
  }, [imageUrl]);
  
  return (
    <div 
      className={`relative overflow-hidden rounded-md ${className}`}
      style={{ 
        width: `${dimensions.width}rem`, 
        height: `${dimensions.height}rem` 
      }}
    >
      <Image 
        src={imageSrc} 
        alt={productName}
        fill
        sizes={`${dimensions.width}rem`}
        className="transition-all duration-300 object-contain"
        onError={() => setError(true)}
        priority={size === 'large'}
      />
    </div>
  );
} 