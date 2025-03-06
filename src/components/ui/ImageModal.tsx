import Image from 'next/image';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText: string;
}

export default function ImageModal({ isOpen, onClose, imageUrl, altText }: ImageModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl w-full h-[80vh] bg-gray-900 rounded-lg overflow-hidden">
        <button
          onClick={(e) => {
            e.stopPropagation(); // Evitar que el click se propague al fondo
            onClose();
          }}
          className="absolute top-2 right-2 z-10 bg-gray-800 rounded-full p-2 hover:bg-gray-700 transition-colors"
        >
          <svg 
            className="w-6 h-6 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={imageUrl}
            alt={altText}
            className="max-h-full max-w-full object-contain"
            onError={(e) => {
              // Si la imagen falla, mostrar una imagen de fallback
              (e.target as HTMLImageElement).src = '/placeholder-image.png';
              (e.target as HTMLImageElement).alt = 'Imagen no disponible';
            }}
          />
        </div>
      </div>
    </div>
  );
} 