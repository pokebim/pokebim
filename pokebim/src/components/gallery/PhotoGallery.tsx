import { useState, useEffect } from 'react';
import { Photo } from '@/lib/photoService';

interface PhotoGalleryProps {
  photos: Photo[];
  onDelete?: (photoId: string) => void;
  onEdit?: (photo: Photo) => void;
  onSetAsCover?: (photoUrl: string) => void;
}

export default function PhotoGallery({ photos, onDelete, onEdit, onSetAsCover }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  // Actualizar índice cuando cambia la foto seleccionada
  useEffect(() => {
    if (selectedPhoto) {
      const index = photos.findIndex(p => p.id === selectedPhoto.id);
      if (index !== -1) {
        setPhotoIndex(index);
      }
    }
  }, [selectedPhoto, photos]);
  
  const openLightbox = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsLightboxOpen(true);
    
    // Bloquear el scroll del body mientras el lightbox está abierto
    document.body.style.overflow = 'hidden';
  };
  
  const closeLightbox = () => {
    setIsLightboxOpen(false);
    
    // Restaurar el scroll del body
    document.body.style.overflow = 'auto';
  };
  
  const navigateToPhoto = (direction: 'next' | 'prev') => {
    if (!photos.length) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (photoIndex + 1) % photos.length;
    } else {
      newIndex = (photoIndex - 1 + photos.length) % photos.length;
    }
    
    setPhotoIndex(newIndex);
    setSelectedPhoto(photos[newIndex]);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isLightboxOpen) {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        navigateToPhoto('next');
      } else if (e.key === 'ArrowLeft') {
        navigateToPhoto('prev');
      }
    }
  };
  
  const downloadPhoto = (photo: Photo) => {
    // Crear link de descarga
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.name || 'photo';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Desconocido';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };
  
  // Renderizar las fotos en una cuadrícula
  return (
    <div className="space-y-4" onKeyDown={handleKeyDown} tabIndex={0}>
      {photos.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No hay fotos en este álbum.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {photos.map(photo => (
            <div key={photo.id} className="group relative">
              <div 
                className="aspect-square overflow-hidden rounded-lg bg-gray-800 cursor-pointer group"
                onClick={() => openLightbox(photo)}
              >
                <img 
                  src={photo.url} 
                  alt={photo.name} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button className="p-2 bg-black bg-opacity-50 rounded-full text-white">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Opciones rápidas al hover */}
              <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {onEdit && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(photo); }}
                    className="p-1.5 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80"
                    title="Editar foto"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                
                <button 
                  onClick={(e) => { e.stopPropagation(); downloadPhoto(photo); }}
                  className="p-1.5 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80"
                  title="Descargar foto"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                
                {onDelete && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(photo.id!); }}
                    className="p-1.5 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80"
                    title="Eliminar foto"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Título de la foto */}
              <div className="mt-2">
                <h3 className="text-sm font-medium text-white truncate" title={photo.name}>
                  {photo.name}
                </h3>
                {photo.tags && photo.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {photo.tags.slice(0, 2).map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-300">
                        #{tag}
                      </span>
                    ))}
                    {photo.tags.length > 2 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-300">
                        +{photo.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Lightbox */}
      {isLightboxOpen && selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
          {/* Botón de cierre */}
          <button 
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 z-10"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Navegación */}
          <button 
            onClick={() => navigateToPhoto('prev')}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 z-10"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            onClick={() => navigateToPhoto('next')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 z-10"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Imagen y detalles */}
          <div className="max-h-screen max-w-screen-lg p-4 flex flex-col">
            <div className="flex-grow flex items-center justify-center mb-4">
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.name}
                className="max-h-[calc(100vh-180px)] max-w-full object-contain"
              />
            </div>
            
            <div className="bg-gray-900 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedPhoto.name}</h2>
                  {selectedPhoto.description && (
                    <p className="mt-1 text-gray-300">{selectedPhoto.description}</p>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {onSetAsCover && (
                    <button 
                      onClick={() => onSetAsCover(selectedPhoto.url)}
                      className="px-3 py-1 bg-blue-700 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                      title="Establecer como portada del álbum"
                    >
                      Usar como portada
                    </button>
                  )}
                  
                  <button 
                    onClick={() => downloadPhoto(selectedPhoto)}
                    className="px-3 py-1 bg-green-700 text-white text-sm rounded hover:bg-green-600 transition-colors"
                  >
                    Descargar
                  </button>
                  
                  {onEdit && (
                    <button 
                      onClick={() => { closeLightbox(); onEdit(selectedPhoto); }}
                      className="px-3 py-1 bg-yellow-700 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
                    >
                      Editar
                    </button>
                  )}
                  
                  {onDelete && (
                    <button 
                      onClick={() => { closeLightbox(); onDelete(selectedPhoto.id!); }}
                      className="px-3 py-1 bg-red-700 text-white text-sm rounded hover:bg-red-600 transition-colors"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-400">
                <div>
                  <p><span className="font-medium">Tamaño:</span> {formatFileSize(selectedPhoto.size)}</p>
                  <p><span className="font-medium">Tipo:</span> {selectedPhoto.type || 'Desconocido'}</p>
                </div>
                <div>
                  <p><span className="font-medium">Creado:</span> {selectedPhoto.createdAt ? new Date(selectedPhoto.createdAt.seconds * 1000).toLocaleString() : 'Desconocido'}</p>
                  {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="font-medium">Etiquetas:</span>
                      {selectedPhoto.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-300">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 