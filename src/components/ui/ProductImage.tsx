import { useState } from 'react';
import Image from 'next/image';
import ImageModal from './ImageModal';
import DefaultProductImage from './DefaultProductImage';

interface ProductImageProps {
  imageUrl: string;
  productName: string;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  className?: string;
  clickable?: boolean;
}

const sizes = {
  tiny: { width: 150, height: 150 },
  small: { width: 200, height: 200 },
  medium: { width: 300, height: 300 },
  large: { width: 400, height: 400 },
};

/**
 * Componente reutilizable para mostrar imágenes de productos
 * con soporte para diferentes tamaños y fallback para imágenes no disponibles
 */
export default function ProductImage({ 
  imageUrl, 
  productName, 
  size = 'medium',
  className = '',
  clickable = true
}: ProductImageProps) {
  const [showModal, setShowModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { width, height } = sizes[size];

  const handleClick = () => {
    if (clickable && !imageError && imageUrl) {
      setShowModal(true);
    }
  };

  if (!imageUrl || imageError) {
    return (
      <div style={{ width, height }}>
        <DefaultProductImage productName={productName} className={className} />
      </div>
    );
  }

  return (
    <>
      <div 
        className={`relative ${className} ${clickable ? 'cursor-pointer transition-transform hover:scale-105' : ''}`} 
        style={{ width, height }}
        onClick={handleClick}
      >
        <Image
          src={imageUrl}
          alt={productName || 'Product image'}
          fill
          className="object-cover rounded-lg"
          sizes={`(max-width: 768px) 100vw, ${width}px`}
          onError={() => setImageError(true)}
        />
      </div>

      <ImageModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        imageUrl={imageUrl}
        altText={productName}
      />
    </>
  );
} 