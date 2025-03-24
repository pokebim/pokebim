'use client';

import { useState, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';

// Definimos las interfaces para los estados
interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string;
  thumbnailUrl?: string;
  isProcessing: boolean;
  error?: string;
}

export default function WordpressThumbnailsPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedSize, setSelectedSize] = useState(150);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Tamaños predefinidos comunes en WordPress
  const thumbnailSizes = [
    { name: 'Thumbnail', value: 150 },
    { name: 'Medium', value: 300 },
    { name: 'Medium Large', value: 768 },
    { name: 'Large', value: 1024 },
  ];

  // Manejar la selección de archivos
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    const newFiles: UploadedFile[] = Array.from(selectedFiles)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        isProcessing: false
      }));
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  // Manejar drop de archivos
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Procesar una imagen
  const processImage = async (fileId: string) => {
    const fileToProcess = files.find(f => f.id === fileId);
    if (!fileToProcess) return;

    // Actualizar estado a procesando
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, isProcessing: true, error: undefined } : f
    ));

    try {
      const formData = new FormData();
      formData.append('image', fileToProcess.file);

      const response = await fetch(`/api/wordpress-thumbnails?size=${selectedSize}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      // Obtener el blob de la imagen procesada
      const thumbnailBlob = await response.blob();
      const thumbnailUrl = URL.createObjectURL(thumbnailBlob);

      // Actualizar estado con la URL del thumbnail
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, thumbnailUrl, isProcessing: false } 
          : f
      ));
    } catch (error) {
      console.error('Error procesando imagen:', error);
      // Actualizar estado con el error
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, isProcessing: false, error: (error as Error).message } 
          : f
      ));
    }
  };

  // Procesar todas las imágenes
  const processAllImages = async () => {
    setIsUploading(true);
    
    try {
      // Procesar solo las imágenes que no tienen thumbnail y no están en proceso
      const filesToProcess = files.filter(f => !f.thumbnailUrl && !f.isProcessing);
      
      for (const file of filesToProcess) {
        await processImage(file.id);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Eliminar una imagen
  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const updatedFiles = prev.filter(f => f.id !== fileId);
      // Limpiar URLs de objetos para evitar fugas de memoria
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
        if (fileToRemove.thumbnailUrl) {
          URL.revokeObjectURL(fileToRemove.thumbnailUrl);
        }
      }
      return updatedFiles;
    });
  };

  // Limpiar todas las imágenes
  const clearAllFiles = () => {
    // Limpiar URLs de objetos
    files.forEach(file => {
      URL.revokeObjectURL(file.previewUrl);
      if (file.thumbnailUrl) {
        URL.revokeObjectURL(file.thumbnailUrl);
      }
    });
    setFiles([]);
  };

  // Descargar un thumbnail
  const downloadThumbnail = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file?.thumbnailUrl) {
      const a = document.createElement('a');
      a.href = file.thumbnailUrl;
      a.download = `wp-thumb-${file.file.name.replace(/\.[^/.]+$/, "")}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <MainLayout>
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-semibold leading-tight text-white">
                Thumbnails para WordPress
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Sube imágenes y conviértelas en thumbnails optimizados para WordPress
              </p>
            </div>
          </div>

          {/* Selector de tamaño */}
          <div className="mt-4 bg-gray-800 p-4 rounded-lg">
            <label htmlFor="size-select" className="block text-sm font-medium text-gray-300">
              Tamaño del thumbnail
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {thumbnailSizes.map(size => (
                <button
                  key={size.value}
                  onClick={() => setSelectedSize(size.value)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    selectedSize === size.value
                      ? 'bg-green-700 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {size.name} ({size.value}px)
                </button>
              ))}
              <div className="flex items-center ml-4">
                <label htmlFor="custom-size" className="mr-2 text-sm text-gray-300">
                  Personalizado:
                </label>
                <input
                  id="custom-size"
                  type="number"
                  min="50"
                  max="2000"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600"
                />
                <span className="ml-1 text-sm text-gray-400">px</span>
              </div>
            </div>
          </div>

          {/* Área de subida */}
          <div 
            className={`mt-6 border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? 'border-green-500 bg-green-900 bg-opacity-10' : 'border-gray-700'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Seleccionar archivos
              </button>
              <p className="mt-1 text-sm text-gray-500">
                o arrastra y suelta imágenes aquí
              </p>
            </div>
          </div>

          {/* Lista de imágenes */}
          {files.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">
                  Imágenes ({files.length})
                </h3>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={processAllImages}
                    disabled={isUploading || files.every(f => f.thumbnailUrl || f.isProcessing)}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      isUploading || files.every(f => f.thumbnailUrl || f.isProcessing)
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-green-700 text-white hover:bg-green-600'
                    }`}
                  >
                    {isUploading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando...
                      </span>
                    ) : 'Procesar todas'}
                  </button>
                  <button
                    type="button"
                    onClick={clearAllFiles}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-red-700 text-white hover:bg-red-600"
                  >
                    Limpiar todo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {files.map(file => (
                  <div key={file.id} className="bg-gray-800 rounded-lg overflow-hidden">
                    {/* Imagen original */}
                    <div className="relative pb-[100%] bg-gray-900">
                      <img 
                        src={file.previewUrl} 
                        alt={file.file.name}
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    </div>
                    
                    {/* Información y controles */}
                    <div className="p-4">
                      <div className="flex justify-between">
                        <h4 className="text-sm font-medium text-white truncate" title={file.file.name}>
                          {file.file.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="text-gray-400 hover:text-gray-200"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <p className="mt-1 text-xs text-gray-400">
                        {Math.round(file.file.size / 1024)} KB
                      </p>
                      
                      {/* Thumbnail generado */}
                      {file.thumbnailUrl && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-green-400 mb-2">
                            Thumbnail generado:
                          </p>
                          <div className="relative w-full pb-[100%] bg-gray-900 rounded overflow-hidden">
                            <img 
                              src={file.thumbnailUrl} 
                              alt="Thumbnail"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => downloadThumbnail(file.id)}
                            className="mt-2 w-full px-3 py-1.5 text-xs font-medium rounded bg-blue-700 text-white hover:bg-blue-600"
                          >
                            Descargar
                          </button>
                        </div>
                      )}
                      
                      {/* Mensaje de error */}
                      {file.error && (
                        <div className="mt-2 text-xs text-red-400">
                          Error: {file.error}
                        </div>
                      )}
                      
                      {/* Botón de procesar individual */}
                      {!file.thumbnailUrl && !file.isProcessing && !file.error && (
                        <button
                          type="button"
                          onClick={() => processImage(file.id)}
                          className="mt-2 w-full px-3 py-1.5 text-xs font-medium rounded bg-green-700 text-white hover:bg-green-600"
                        >
                          Generar thumbnail
                        </button>
                      )}
                      
                      {/* Loader */}
                      {file.isProcessing && (
                        <div className="mt-2 flex justify-center items-center py-1.5">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-400"></div>
                          <span className="ml-2 text-xs text-green-400">Procesando...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
} 