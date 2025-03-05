import React, { useState } from 'react';
import Image from 'next/image';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Componente reutilizable para mostrar imágenes de productos
 * con soporte para diferentes tamaños y fallback para imágenes no disponibles
 */
export default function ProductImage({ src, alt, className = '' }: ProductImageProps) {
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fallbackImage = `https://via.placeholder.com/400x400?text=${encodeURIComponent(alt || 'Imagen no disponible')}`;

  return (
    <div className={`relative min-h-[200px] w-full ${className}`} style={{ aspectRatio: '1/1' }}>
      <Image
        src={error ? fallbackImage : src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority
        className={`object-contain transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onError={() => setError(true)}
        onLoad={() => setIsLoading(false)}
        unoptimized
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      )}
    </div>
  );
} 