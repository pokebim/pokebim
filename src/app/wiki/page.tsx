'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { WikiPost, getAllWikiPosts, deleteWikiPost } from '@/lib/wikiService';
import Link from 'next/link';
import DetailView, { DetailField, DetailGrid, DetailSection, DetailBadge, DetailLink } from '@/components/ui/DetailView';

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function WikiPage() {
  const [posts, setPosts] = useState<WikiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'success'
  });
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const router = useRouter();
  
  // Nuevos estados para vista detallada
  const [detailViewOpen, setDetailViewOpen] = useState<boolean>(false);
  const [selectedPost, setSelectedPost] = useState<WikiPost | null>(null);
  
  // Obtener todos los posts al cargar la página
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const fetchedPosts = await getAllWikiPosts();
      console.log('FIREBASE: Loaded wiki posts:', fetchedPosts);
      setPosts(fetchedPosts);
      setError(null);
    } catch (err) {
      console.error('Error fetching wiki posts:', err);
      setError('Error al cargar los posts. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este post?')) {
      try {
        await deleteWikiPost(id);
        console.log(`FIREBASE: Deleted wiki post ${id}`);
        setPosts(prevPosts => prevPosts.filter(post => post.id !== id));
        showNotification('Post eliminado correctamente');
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

  // Filtrar posts según término de búsqueda y categoría
  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchTerm === '' || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === '' || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Obtener todas las categorías únicas
  const categories = Array.from(new Set(posts.map(post => post.category).filter(Boolean)));

  // Formatear fecha para mostrar
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Fecha desconocida';
    
    // Si es un timestamp de Firestore, convertirlo a Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Nueva función para ver detalles
  const handleViewDetail = (post: WikiPost) => {
    setSelectedPost(post);
    setDetailViewOpen(true);
  };

  // En la tarjeta de cada post, agregar un botón Ver
  const renderPosts = () => {
    if (loading) return <div className="text-center py-8">Cargando artículos...</div>;
    if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
    if (posts.length === 0) return <div className="text-center py-8">No hay artículos en la wiki.</div>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <div key={post.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {/* Contenido existente de la tarjeta */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white">{post.title}</h3>
              <p className="text-gray-400 mt-1 line-clamp-2">{post.description || 'Sin descripción'}</p>
              <div className="mt-4 flex justify-between items-center">
                <div className="space-x-2">
                  <button
                    onClick={() => handleViewDetail(post)}
                    className="px-3 py-1 text-xs bg-indigo-700 text-white rounded hover:bg-indigo-600 transition-colors"
                  >
                    Ver
                  </button>
                  <Link href={`/wiki/${post.id}`}>
                    <button className="px-3 py-1 text-xs bg-blue-700 text-white rounded hover:bg-blue-600 transition-colors">
                      Abrir
                    </button>
                  </Link>
                </div>
                <Link href={`/wiki/edit/${post.id}`}>
                  <button className="px-3 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600 transition-colors">
                    Editar
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
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
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-semibold leading-tight text-white">
                Wiki Pokebim
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Base de conocimientos y artículos sobre Pokémon TCG.
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                type="button"
                onClick={() => router.push('/wiki/new')}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Nuevo Artículo
              </button>
            </div>
          </div>
          
          {/* Filtros y búsqueda */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <div className="relative">
                <input
                  type="text"
                  className="block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white pl-10 py-2"
                  placeholder="Buscar artículos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <select
                className="block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
              </select>
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
          
          {/* Lista de artículos */}
          <div className="mt-8">
            {renderPosts()}
          </div>
        </div>
      </div>
      
      {/* Vista detallada del post de wiki */}
      {selectedPost && (
        <DetailView
          isOpen={detailViewOpen}
          onClose={() => setDetailViewOpen(false)}
          title={`Detalle de Artículo: ${selectedPost.title}`}
          actions={
            <>
              <Link href={`/wiki/${selectedPost.id}`}>
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Ver completo
                </button>
              </Link>
              <Link href={`/wiki/edit/${selectedPost.id}`}>
                <button
                  type="button" 
                  className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Editar
                </button>
              </Link>
              <button
                type="button"
                onClick={() => setDetailViewOpen(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cerrar
              </button>
            </>
          }
        >
          <DetailSection title="Información del Artículo">
            <DetailGrid>
              <DetailField 
                label="Título" 
                value={<span className="font-semibold">{selectedPost.title}</span>} 
              />
              {selectedPost.category && (
                <DetailField 
                  label="Categoría" 
                  value={
                    <DetailBadge color="blue">
                      {selectedPost.category}
                    </DetailBadge>
                  } 
                />
              )}
              <DetailField 
                label="Fecha de Creación" 
                value={selectedPost.createdAt ? new Date(selectedPost.createdAt).toLocaleDateString() : 'No disponible'} 
              />
              <DetailField 
                label="Última Actualización" 
                value={selectedPost.updatedAt ? new Date(selectedPost.updatedAt).toLocaleDateString() : 'No disponible'} 
              />
            </DetailGrid>
          </DetailSection>

          {selectedPost.description && (
            <DetailSection title="Descripción">
              <p className="text-gray-300 whitespace-pre-line">{selectedPost.description}</p>
            </DetailSection>
          )}

          <DetailSection title="Vista Previa del Contenido">
            <div className="bg-gray-900 p-4 rounded-md">
              <p className="text-gray-300">
                {selectedPost.content ? (
                  selectedPost.content.length > 300 
                    ? selectedPost.content.substring(0, 300) + '...' 
                    : selectedPost.content
                ) : (
                  'Sin contenido'
                )}
              </p>
              <div className="mt-4">
                <Link href={`/wiki/${selectedPost.id}`}>
                  <button className="text-blue-400 hover:text-blue-300 hover:underline">
                    Ver artículo completo →
                  </button>
                </Link>
              </div>
            </div>
          </DetailSection>
        </DetailView>
      )}
    </MainLayout>
  );
} 