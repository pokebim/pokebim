import Image from 'next/image';
import { useState } from 'react';

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
  
  // Determinar dimensiones basadas en el tamaño
  const dimensions = {
    small: { width: 12, height: 12 },
    medium: { width: 24, height: 24 },
    large: { width: 48, height: 48 }
  }[size];
  
  // URL de fallback si no hay imagen disponible o hay error
  const fallbackUrl = `https://via.placeholder.com/100x100?text=${encodeURIComponent(productName)}`;
  
  // Resetear el error si cambia la URL
  const handleNewImage = () => {
    if (error) setError(false);
  };
  
  return (
    <div 
      className={`relative overflow-hidden rounded-md ${className}`}
      style={{ 
        width: `${dimensions.width}rem`, 
        height: `${dimensions.height}rem` 
      }}
    >
      <Image 
        src={!imageUrl || error ? fallbackUrl : imageUrl} 
        alt={productName}
        fill
        sizes={`${dimensions.width}rem`}
        className="transition-all hover:scale-110 duration-300 object-cover"
        onError={() => setError(true)}
        onLoadingComplete={handleNewImage}
      />
    </div>
  );
} 