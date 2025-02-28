'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import Modal from '@/components/ui/Modal';
import { 
  PhotoAlbum, 
  Photo,
  getAlbumById,
  getPhotosByAlbum,
  updatePhoto,
  deletePhoto,
  setAlbumCoverPhoto,
  uploadPhoto
} from '@/lib/photoService';
import PhotoGallery from '@/components/gallery/PhotoGallery';
import PhotoUploadForm from '@/components/forms/PhotoUploadForm';

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

interface EditPhotoForm {
  name: string;
  description?: string;
  tags?: string[];
}

export default function AlbumDetailPage({ params }: { params: { id: string } }) {
  const [album, setAlbum] = useState<PhotoAlbum | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editForm, setEditForm] = useState<EditPhotoForm>({ name: '' });
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'success'
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Cargar datos del álbum y fotos al montar el componente
  useEffect(() => {
    fetchAlbumData();
  }, [params.id]);

  const fetchAlbumData = async () => {
    setLoading(true);
    try {
      // Obtener detalles del álbum
      const albumData = await getAlbumById(params.id);
      
      if (!albumData) {
        setError('Álbum no encontrado');
        setLoading(false);
        return;
      }
      
      setAlbum(albumData);
      
      // Obtener fotos del álbum
      const albumPhotos = await getPhotosByAlbum(params.id);
      setPhotos(albumPhotos);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching album data:', err);
      setError('Error al cargar los datos del álbum. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUploadPhoto = async (file: File, metadata: Omit<Photo, 'id' | 'url' | 'storageRef'>) => {
    try {
      const uploadedPhoto = await uploadPhoto(file, params.id, metadata);
      
      // Añadir la foto a la lista
      setPhotos(prev => [uploadedPhoto, ...prev]);
      
      // Actualizar contador de fotos en el álbum
      if (album) {
        setAlbum({
          ...album,
          photoCount: (album.photoCount || 0) + 1,
          // Si es la primera foto, actualizar la portada
          coverPhotoUrl: album.coverPhotoUrl || uploadedPhoto.url
        });
      }
      
      showNotification('Foto subida correctamente');
    } catch (err) {
      console.error('Error uploading photo:', err);
      showNotification('Error al subir la foto', 'error');
      throw err; // Propagar el error para que el formulario lo maneje
    }
  };
  
  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta foto?')) {
      return;
    }
    
    try {
      await deletePhoto(photoId);
      
      // Eliminar la foto de la lista
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
      
      // Actualizar contador de fotos en el álbum
      if (album) {
        setAlbum({
          ...album,
          photoCount: Math.max((album.photoCount || 0) - 1, 0)
        });
      }
      
      showNotification('Foto eliminada correctamente');
    } catch (err) {
      console.error('Error deleting photo:', err);
      showNotification('Error al eliminar la foto', 'error');
    }
  };
  
  const handleEditPhoto = (photo: Photo) => {
    setEditingPhoto(photo);
    setEditForm({
      name: photo.name,
      description: photo.description,
      tags: photo.tags
    });
    setEditModalOpen(true);
  };
  
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddTag = (tag: string) => {
    if (tag.trim() && !editForm.tags?.includes(tag.trim())) {
      setEditForm(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag.trim()]
      }));
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }));
  };
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingPhoto) return;
    
    try {
      const updateData: Partial<Photo> = {
        name: editForm.name,
        description: editForm.description,
        tags: editForm.tags
      };
      
      await updatePhoto(editingPhoto.id!, updateData);
      
      // Actualizar la foto en la lista
      setPhotos(prev => prev.map(photo => {
        if (photo.id === editingPhoto.id) {
          return {
            ...photo,
            ...updateData
          };
        }
        return photo;
      }));
      
      setEditModalOpen(false);
      setEditingPhoto(null);
      showNotification('Foto actualizada correctamente');
    } catch (err) {
      console.error('Error updating photo:', err);
      showNotification('Error al actualizar la foto', 'error');
    }
  };
  
  const handleSetAsCover = async (photoUrl: string) => {
    try {
      await setAlbumCoverPhoto(params.id, photoUrl);
      
      // Actualizar el álbum localmente
      if (album) {
        setAlbum({
          ...album,
          coverPhotoUrl: photoUrl
        });
      }
      
      showNotification('Portada del álbum actualizada');
    } catch (err) {
      console.error('Error setting album cover:', err);
      showNotification('Error al establecer la portada del álbum', 'error');
    }
  };
  
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });
    
    setTimeout(() => {
      setNotification({
        show: false,
        message: '',
        type: 'success'
      });
    }, 3000);
  };

  return (
    <MainLayout>
      {notification.show && (
        <div className={`fixed top-5 right-5 p-4 rounded-md shadow-xl z-50 ${
          notification.type === 'success' ? 'bg-green-700 text-white border-l-4 border-green-400' : 'bg-red-700 text-white border-l-4 border-red-400'
        } transition-opacity duration-300 ease-in-out`}>
          {notification.message}
        </div>
      )}
      
      {/* Modal para subir fotos */}
      <Modal 
        isOpen={uploadModalOpen} 
        onClose={() => setUploadModalOpen(false)}
        title="Subir fotos al álbum"
      >
        <PhotoUploadForm 
          albumId={params.id}
          onSubmit={handleUploadPhoto}
          onCancel={() => setUploadModalOpen(false)}
          isMultiple={true}
        />
      </Modal>
      
      {/* Modal para editar foto */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingPhoto(null);
        }}
        title="Editar información de la foto"
      >
        {editingPhoto && (
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-white mb-2">
                Nombre *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={editForm.name}
                onChange={handleEditFormChange}
                className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-bold text-white mb-2">
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                value={editForm.description || ''}
                onChange={handleEditFormChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Etiquetas
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="tag-input"
                  className="flex-1 px-3 py-2 border border-gray-700 bg-gray-800 rounded-l-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
                  placeholder="Añadir etiqueta"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <button
                  type="button"
                  className="px-4 py-2 bg-green-700 text-white rounded-r-md hover:bg-green-600"
                  onClick={() => {
                    const input = document.getElementById('tag-input') as HTMLInputElement;
                    handleAddTag(input.value);
                    input.value = '';
                  }}
                >
                  Añadir
                </button>
              </div>
              
              {editForm.tags && editForm.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {editForm.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-800 text-gray-300">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
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
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingPhoto(null);
                }}
                className="px-4 py-2 border border-gray-700 rounded-md bg-gray-800 text-white hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        )}
      </Modal>
      
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          {/* Cabecera y navegación */}
          <div className="mb-6">
            <Link href="/photos" className="text-gray-400 hover:text-white flex items-center">
              <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Volver a álbumes
            </Link>
          </div>
          
          {error ? (
            <div className="mt-4 bg-red-900 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : album ? (
            <div>
              {/* Cabecera del álbum */}
              <div className="bg-gray-900 shadow rounded-lg p-6 mb-8">
                <div className="md:flex md:items-center md:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white">{album.name}</h1>
                    {album.description && (
                      <p className="mt-1 text-gray-400">{album.description}</p>
                    )}
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="mr-3">{album.photoCount || 0} {album.photoCount === 1 ? 'foto' : 'fotos'}</span>
                      <span>Creado: {album.createdAt ? new Date(album.createdAt.seconds * 1000).toLocaleDateString() : 'Fecha desconocida'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0">
                    <button
                      type="button"
                      onClick={() => setUploadModalOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      Subir fotos
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Galería de fotos */}
              <PhotoGallery
                photos={photos}
                onDelete={handleDeletePhoto}
                onEdit={handleEditPhoto}
                onSetAsCover={handleSetAsCover}
              />
            </div>
          ) : (
            <div className="bg-gray-900 shadow rounded-lg p-6 text-center">
              <p className="text-gray-300">Álbum no encontrado.</p>
              <Link href="/photos" className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                Volver a álbumes
              </Link>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
} 