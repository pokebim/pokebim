'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { addWikiPost, WikiPost } from '@/lib/wikiService';
import WikiPostForm from '@/components/forms/WikiPostForm';
import Link from 'next/link';

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function NewWikiPostPage() {
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'success'
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (formData: Omit<WikiPost, 'id'>) => {
    setLoading(true);
    try {
      const postId = await addWikiPost(formData);
      console.log(`FIREBASE: Added new wiki post with ID ${postId}`);
      
      showNotification('Post creado correctamente', 'success');
      
      // Redirigir a la página del post después de crear
      setTimeout(() => {
        router.push(`/wiki/${postId}`);
      }, 1500);
    } catch (err) {
      console.error('Error creating wiki post:', err);
      showNotification('Error al crear el post', 'error');
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
              Crear nuevo artículo
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Añade un nuevo artículo a la base de conocimientos.
            </p>
          </div>
          
          <div className="bg-gray-900 shadow rounded-lg p-6">
            <WikiPostForm
              onSubmit={handleSubmit}
              onCancel={() => router.push('/wiki')}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 