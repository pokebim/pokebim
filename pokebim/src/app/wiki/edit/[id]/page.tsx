'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { WikiPost, getWikiPostById, updateWikiPost } from '@/lib/wikiService';
import WikiPostForm from '@/components/forms/WikiPostForm';
import Link from 'next/link';

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function EditWikiPostPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<WikiPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'success'
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Cargar el post al iniciar la página
  useEffect(() => {
    fetchPost();
  }, [params.id]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const fetchedPost = await getWikiPostById(params.id);
      console.log('FIREBASE: Loaded wiki post for editing:', fetchedPost);
      
      if (!fetchedPost) {
        setError('Post no encontrado');
      } else {
        setPost(fetchedPost);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching wiki post for editing:', err);
      setError('Error al cargar el post. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: Omit<WikiPost, 'id'>) => {
    setLoading(true);
    try {
      await updateWikiPost(params.id, formData);
      console.log(`FIREBASE: Updated wiki post ${params.id}`);
      
      showNotification('Post actualizado correctamente', 'success');
      
      // Redirigir a la página del post después de actualizar
      setTimeout(() => {
        router.push(`/wiki/${params.id}`);
      }, 1500);
    } catch (err) {
      console.error('Error updating wiki post:', err);
      showNotification('Error al actualizar el post', 'error');
      setLoading(false);
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
      {notification?.show && (
        <div className={`fixed top-5 right-5 p-4 rounded-md shadow-xl z-50 ${
          notification.type === 'success' ? 'bg-green-700 text-white border-l-4 border-green-400' : 'bg-red-700 text-white border-l-4 border-red-400'
        } transition-opacity duration-300 ease-in-out`}>
          {notification.message}
        </div>
      )}
      
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <div className="mb-6">
            <Link href="/wiki" className="text-gray-400 hover:text-white flex items-center">
              <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Volver a la Wiki
            </Link>
          </div>
          
          <div className="mb-6">
            <h2 className="text-2xl font-semibold leading-tight text-white">
              Editar artículo
            </h2>
            {post && (
              <p className="mt-1 text-sm text-gray-400">
                Editando: {post.title}
              </p>
            )}
          </div>
          
          {error && (
            <div className="mb-6 bg-red-900 border-l-4 border-red-500 p-4">
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
          
          {loading && !post ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : post ? (
            <div className="bg-gray-900 shadow rounded-lg p-6">
              <WikiPostForm
                initialData={post}
                onSubmit={handleSubmit}
                onCancel={() => router.push(`/wiki/${params.id}`)}
              />
            </div>
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