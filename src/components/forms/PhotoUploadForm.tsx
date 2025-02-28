import { useState, useRef, useEffect } from 'react';
import { Photo } from '@/lib/photoService';

interface PhotoUploadFormProps {
  albumId: string;
  onSubmit: (file: File, metadata: Omit<Photo, 'id' | 'url' | 'storageRef'>) => Promise<void>;
  onCancel: () => void;
  isMultiple?: boolean;
}

export default function PhotoUploadForm({ albumId, onSubmit, onCancel, isMultiple = false }: PhotoUploadFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // Metadatos para la foto actual
  const [photoName, setPhotoName] = useState('');
  const [photoDescription, setPhotoDescription] = useState('');
  const [photoTags, setPhotoTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generar previsualizaciones cuando cambian los archivos seleccionados
  useEffect(() => {
    if (!selectedFiles.length) {
      setPreviews([]);
      return;
    }

    const newPreviews: string[] = [];
    
    selectedFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === selectedFiles.length) {
            setPreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    // Actualizar nombre con el nombre del archivo actual
    if (selectedFiles[currentIndex]) {
      setPhotoName(selectedFiles[currentIndex].name.replace(/\.[^/.]+$/, ""));
    }

    return () => {
      // Limpiar las URLs de objeto cuando se desmonta el componente
      previews.forEach(preview => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [selectedFiles, currentIndex]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const imageFiles = filesArray.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length === 0) {
        setError('Por favor, selecciona archivos de imagen válidos (jpg, png, gif, etc.)');
        return;
      }
      
      setSelectedFiles(isMultiple ? imageFiles : [imageFiles[0]]);
      setCurrentIndex(0);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      const imageFiles = filesArray.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length === 0) {
        setError('Por favor, arrastra archivos de imagen válidos (jpg, png, gif, etc.)');
        return;
      }
      
      setSelectedFiles(isMultiple ? imageFiles : [imageFiles[0]]);
      setCurrentIndex(0);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const navigatePhotos = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentIndex < selectedFiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !photoTags.includes(tagInput.trim())) {
      setPhotoTags([...photoTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setPhotoTags(photoTags.filter(t => t !== tag));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFiles.length) {
      setError('Por favor, selecciona al menos una imagen para subir');
      return;
    }
    
    const currentFile = selectedFiles[currentIndex];
    
    if (!photoName.trim()) {
      setError('Por favor, introduce un nombre para la foto');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const metadata: Omit<Photo, 'id' | 'url' | 'storageRef'> = {
        name: photoName.trim(),
        description: photoDescription.trim() || undefined,
        albumId,
        tags: photoTags.length ? photoTags : undefined
      };
      
      await onSubmit(currentFile, metadata);
      
      // Si es la última foto, cerrar el formulario
      if (currentIndex === selectedFiles.length - 1) {
        setIsLoading(false);
      } else {
        // Pasar a la siguiente foto
        setCurrentIndex(currentIndex + 1);
        setPhotoName(selectedFiles[currentIndex + 1].name.replace(/\.[^/.]+$/, ""));
        setPhotoDescription('');
        setPhotoTags([]);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error al subir la foto:', err);
      setError('Error al subir la foto. Por favor, inténtalo de nuevo.');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      {error && (
        <div className="mb-4 bg-red-900 border-l-4 border-red-500 p-4">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Área de selección de archivos */}
        {selectedFiles.length === 0 ? (
          <div
            className={`border-2 border-dashed p-8 rounded-lg text-center cursor-pointer mb-6 ${
              isDragActive ? 'border-green-500 bg-green-900 bg-opacity-10' : 'border-gray-700'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={triggerFileInput}
          >
            <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            
            <h3 className="mt-2 text-sm font-medium text-gray-300">
              {isDragActive ? 'Suelta las imágenes aquí' : 'Haz clic para seleccionar o arrastra tus imágenes'}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              PNG, JPG, GIF hasta 10MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={isMultiple}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="mb-6">
            {/* Previsualización y navegación entre fotos */}
            <div className="flex flex-col items-center">
              <div className="relative w-full">
                {previews[currentIndex] && (
                  <img 
                    src={previews[currentIndex]} 
                    alt="Previsualización" 
                    className="h-64 mx-auto object-contain rounded-lg"
                  />
                )}
                
                {selectedFiles.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => navigatePhotos('prev')}
                      disabled={currentIndex === 0}
                      className={`p-1 rounded-full bg-black bg-opacity-50 text-white ${
                        currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-opacity-70'
                      }`}
                    >
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigatePhotos('next')}
                      disabled={currentIndex === selectedFiles.length - 1}
                      className={`p-1 rounded-full bg-black bg-opacity-50 text-white ${
                        currentIndex === selectedFiles.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-opacity-70'
                      }`}
                    >
                      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              
              {selectedFiles.length > 1 && (
                <div className="mt-2 text-sm text-gray-400">
                  Foto {currentIndex + 1} de {selectedFiles.length} ({selectedFiles[currentIndex].name})
                </div>
              )}
              
              <button
                type="button"
                onClick={triggerFileInput}
                className="mt-4 text-sm text-blue-400 hover:text-blue-300"
              >
                Cambiar selección
              </button>
            </div>
          </div>
        )}
        
        {selectedFiles.length > 0 && (
          <>
            {/* Detalles de la foto */}
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label htmlFor="photo-name" className="block text-sm font-medium text-white mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  id="photo-name"
                  value={photoName}
                  onChange={(e) => setPhotoName(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
                  required
                />
              </div>
              
              {/* Descripción */}
              <div>
                <label htmlFor="photo-description" className="block text-sm font-medium text-white mb-1">
                  Descripción
                </label>
                <textarea
                  id="photo-description"
                  value={photoDescription}
                  onChange={(e) => setPhotoDescription(e.target.value)}
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
                />
              </div>
              
              {/* Etiquetas */}
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Etiquetas
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    placeholder="Añadir etiqueta"
                    className="flex-grow px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Añadir
                  </button>
                </div>
                
                {photoTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {photoTags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-800 text-gray-300">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-gray-200 focus:outline-none"
                        >
                          <span className="sr-only">Eliminar etiqueta</span>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Barra de progreso */}
            {uploadProgress !== null && (
              <div className="mt-4">
                <div className="bg-gray-700 w-full h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-green-500 h-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">{uploadProgress.toFixed(0)}%</p>
              </div>
            )}
            
            {/* Botones de acción */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-700 rounded-md bg-gray-800 text-white hover:bg-gray-700"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Subiendo...' : 'Subir foto'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
} 