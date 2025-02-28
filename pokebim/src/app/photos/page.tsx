'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { 
  PhotoAlbum, 
  getAllAlbums,
  createAlbum,
  deleteAlbum
} from '@/lib/photoService';
import AlbumCard from '@/components/gallery/AlbumCard';
import AlbumForm from '@/components/forms/AlbumForm';
import Modal from '@/components/ui/Modal';

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function PhotosPage() {
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<PhotoAlbum | null>(null);
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'success'
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Cargar álbumes al montar el componente
  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const allAlbums = await getAllAlbums();
      console.log('FIREBASE: Loaded albums:', allAlbums);
      setAlbums(allAlbums);
      setError(null);
    } catch (err) {
      console.error('Error fetching albums:', err);
      setError('Error al cargar los álbumes. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateAlbum = async (albumData: Omit<PhotoAlbum, 'id'>) => {
    try {
      const albumId = await createAlbum(albumData);
      
      // Añadir el álbum creado a la lista
      const newAlbum: PhotoAlbum = {
        id: albumId,
        ...albumData,
        photoCount: 0,
        createdAt: new Date(), // Para mostrar algo inmediatamente
        updatedAt: new Date()
      };
      
      setAlbums(prev => [newAlbum, ...prev]);
      
      // Cerrar modal y mostrar notificación
      setModalOpen(false);
      showNotification('Álbum creado correctamente');
      
      // Redirigir al álbum para añadir fotos
      setTimeout(() => {
        router.push(`/photos/albums/${albumId}`);
      }, 1000);
    } catch (err) {
      console.error('Error creating album:', err);
      showNotification('Error al crear el álbum', 'error');
    }
  };
  
  const handleUpdateAlbum = (album: PhotoAlbum) => {
    setEditingAlbum(album);
    setModalOpen(true);
  };
  
  const handleDeleteAlbum = async (albumId: string) => {
    try {
      const deletePhotos = window.confirm('¿Deseas eliminar también todas las fotos del álbum?');
      await deleteAlbum(albumId, deletePhotos);
      
      // Actualizar lista de álbumes
      setAlbums(prev => prev.filter(album => album.id !== albumId));
      
      showNotification('Álbum eliminado correctamente');
    } catch (err) {
      console.error('Error deleting album:', err);
      showNotification('Error al eliminar el álbum', 'error');
    }
  };
  
  const handleSubmitAlbumForm = async (albumData: Omit<PhotoAlbum, 'id'>) => {
    if (editingAlbum) {
      // Actualizar álbum existente
      try {
        await updateAlbum(editingAlbum.id!, albumData);
        
        // Actualizar lista de álbumes
        setAlbums(prev => prev.map(album => {
          if (album.id === editingAlbum.id) {
            return {
              ...album,
              ...albumData,
              updatedAt: new Date()
            };
          }
          return album;
        }));
        
        // Cerrar modal y mostrar notificación
        setModalOpen(false);
        setEditingAlbum(null);
        showNotification('Álbum actualizado correctamente');
      } catch (err) {
        console.error('Error updating album:', err);
        showNotification('Error al actualizar el álbum', 'error');
      }
    } else {
      // Crear nuevo álbum
      await handleCreateAlbum(albumData);
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
      
      <Modal 
        isOpen={modalOpen} 
        onClose={() => {
          setModalOpen(false);
          setEditingAlbum(null);
        }}
        title={editingAlbum ? 'Editar álbum' : 'Crear nuevo álbum'}
      >
        <AlbumForm 
          initialData={editingAlbum}
          onSubmit={handleSubmitAlbumForm} 
          onCancel={() => {
            setModalOpen(false);
            setEditingAlbum(null);
          }}
        />
      </Modal>
      
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-semibold leading-tight text-white">
                Fotos
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Organiza y visualiza tus fotos en álbumes
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Nuevo Álbum
              </button>
            </div>
          </div>
          
          {error && (
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
          )}
          
          {/* Lista de álbumes */}
          <div className="mt-8">
            {loading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : albums.length === 0 ? (
              <div className="bg-gray-900 shadow rounded-lg p-6 text-center">
                <p className="text-gray-300">No hay álbumes creados.</p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Crear tu primer álbum
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {albums.map(album => (
                  <AlbumCard 
                    key={album.id} 
                    album={album} 
                    onEdit={handleUpdateAlbum}
                    onDelete={handleDeleteAlbum}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 