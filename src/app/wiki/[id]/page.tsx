'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { WikiPost, getWikiPostById, deleteWikiPost } from '@/lib/wikiService';
import Link from 'next/link';

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function WikiPostPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<WikiPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'success'
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Obtener el post al cargar la página
  useEffect(() => {
    fetchPost();
  }, [params.id]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const fetchedPost = await getWikiPostById(params.id);
      console.log('FIREBASE: Loaded wiki post:', fetchedPost);
      
      if (!fetchedPost) {
        setError('Post no encontrado');
      } else {
        setPost(fetchedPost);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching wiki post:', err);
      setError('Error al cargar el post. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este post?')) {
      try {
        await deleteWikiPost(params.id);
        console.log(`FIREBASE: Deleted wiki post ${params.id}`);
        showNotification('Post eliminado correctamente');
        
        // Redirigir a la página principal de la wiki después de eliminar
        setTimeout(() => {
          router.push('/wiki');
        }, 1500);
      } catch (err) {
        console.error('Error deleting wiki post:', err);
        showNotification('Error al eliminar el post', 'error');
      }
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

  // Formatear fecha para mostrar
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Fecha desconocida';
    
    // Si es un timestamp de Firestore, convertirlo a Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <MainLayout>
      {notification?.show && (
        <div className={`fixed top-5 right-5 p-4 rounded-md shadow-xl z-50 ${
          notification.type === 'success' ? 'bg-green-700 text-white border-l-4 border-green-400' : 'bg-red-700 text-white border-l-4 border-red-400'
        } transition-opacity duration-300 ease-in-out`}>
          {notification.message}
        </div>
      )}
      
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          {/* Botón de regreso */}
          <div className="mb-4">
            <Link href="/wiki" className="text-gray-400 hover:text-white flex items-center">
              <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Volver a la Wiki
            </Link>
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
          
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : post ? (
            <article className="bg-gray-900 shadow rounded-lg p-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-white">{post.title}</h1>
                  
                  <div className="mt-2 flex items-center flex-wrap gap-2">
                    {post.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200">
                        {post.category}
                      </span>
                    )}
                    {!post.published && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900 text-yellow-200">
                        Borrador
                      </span>
                    )}
                    {post.author && (
                      <span className="text-sm text-gray-400">
                        Por: {post.author}
                      </span>
                    )}
                    <span className="text-sm text-gray-400">
                      Actualizado: {formatDate(post.updatedAt || post.createdAt)}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-1">
                    {post.tags?.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-300">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push(`/wiki/edit/${post.id}`)}
                    className="px-3 py-1 bg-green-700 text-white text-sm rounded hover:bg-green-600 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1 bg-red-700 text-white text-sm rounded hover:bg-red-600 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              
              {post.imageUrl && (
                <div className="mt-6">
                  <img 
                    src={post.imageUrl} 
                    alt={post.title} 
                    className="w-full max-h-96 object-cover rounded-lg" 
                  />
                </div>
              )}
              
              <div 
                className="mt-6 prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </article>
          ) : (
            <div className="bg-gray-900 shadow rounded-lg p-6 text-center">
              <p className="text-gray-300">Post no encontrado.</p>
              <Link href="/wiki" className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                Volver a la Wiki
              </Link>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
} 