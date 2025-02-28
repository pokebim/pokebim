'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/currencyConverter';
import Modal from '@/components/ui/Modal';
import ProductForm from '@/components/forms/ProductForm';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Product, 
  getAllProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct 
} from '@/lib/productService';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Obtener datos desde Firebase
      const firebaseProducts = await getAllProducts();
      console.log('FIREBASE: Loaded products:', firebaseProducts);
      
      // Validate image URLs in stored products
      const validatedProducts = firebaseProducts.map((product: Product) => {
        // If imageUrl is missing or empty, generate a placeholder
        if (!product.imageUrl || product.imageUrl.trim() === '') {
          return {
            ...product,
            imageUrl: `https://via.placeholder.com/400x250?text=${encodeURIComponent(product.name || 'Product')}`
          };
        }
        
        // Check if the URL is valid
        try {
          new URL(product.imageUrl);
          return product;
        } catch (e) {
          // If invalid, replace with a placeholder
          console.warn('Fixed invalid image URL for product:', product.name);
          return {
            ...product,
            imageUrl: `https://via.placeholder.com/400x250?text=${encodeURIComponent(product.name || 'Product')}`
          };
        }
      });
      
      // Establecer los productos validados en el estado
      setProducts(validatedProducts);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('No se pudieron cargar los productos. Por favor, inténtalo de nuevo más tarde.');
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        // Eliminar de Firebase
        await deleteProduct(productId);
        console.log(`FIREBASE: Deleted product ${productId}`);
        
        // Actualizar estado local
        setProducts(prev => prev.filter(product => product.id !== productId));
        
        showNotification('Producto eliminado correctamente');
      } catch (err) {
        console.error('Error eliminando producto:', err);
        showNotification('Error al eliminar el producto', 'error');
      }
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (data.id) {
        // Actualizar producto existente en Firebase
        await updateProduct(data.id, data);
        console.log(`FIREBASE: Updated product ${data.id}`);
        
        // Actualizar estado local
        setProducts(prev => prev.map(product => 
          product.id === data.id ? { ...product, ...data } : product
        ));
        
        showNotification('Producto actualizado correctamente');
      } else {
        // Crear nuevo producto en Firebase
        const newId = await addProduct(data);
        console.log(`FIREBASE: Added new product with ID ${newId}`);
        
        // Actualizar estado local con el nuevo producto
        const newProduct = {
          ...data,
          id: newId
        };
        
        setProducts(prev => [...prev, newProduct]);
        
        showNotification('Producto añadido correctamente');
      }
      
      setShowModal(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('Error creating/updating product:', err);
      showNotification('Error al procesar el producto', 'error');
    }
  };

  const showNotification = (message: string, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Helper para obtener un background color para productos sin imagen
  const getRandomBgColor = (id: string) => {
    const colors = ['bg-gray-800', 'bg-gray-900', 'bg-black'];
    const index = parseInt(id) % colors.length;
    return colors[index];
  };

  // Filtrar productos basado en el término de búsqueda
  const filteredProducts = products.filter(product => {
    return (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.type && product.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <MainLayout>
      {notification.show && (
        <div className={`fixed top-5 right-5 p-4 rounded-md shadow-xl z-50 ${
          notification.type === 'success' ? 'bg-green-800 text-white border-l-4 border-green-500' : 'bg-red-800 text-white border-l-4 border-red-500'
        } transition-opacity duration-300 ease-in-out font-medium`}>
          {notification.message}
        </div>
      )}
      
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? "Editar producto" : "Añadir nuevo producto"}
      >
        <ProductForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowModal(false);
            setEditingProduct(null);
          }}
          initialData={editingProduct}
        />
      </Modal>
      
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Productos</h1>
          <button
            onClick={() => {
              setEditingProduct(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Añadir Producto
          </button>
        </div>
        
        {/* Agregar el buscador */}
        <div className="relative w-full max-w-md mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
          </div>
          <input
            type="text"
            className="block w-full p-2 pl-10 text-sm border rounded-lg bg-gray-800 border-gray-700 placeholder-gray-400 text-white focus:ring-green-500 focus:border-green-500"
            placeholder="Buscar productos por nombre, idioma, tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {error && (
          <div className="bg-red-600 text-white p-4 rounded mb-6">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div key={product.id} className="bg-gray-900 shadow overflow-hidden rounded-lg">
                  <div className="relative h-48 w-full overflow-hidden">
                    {product.imageUrl && product.imageUrl.trim() !== '' ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name || 'Product'}
                        width={400}
                        height={250}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        priority
                      />
                    ) : (
                      <div className={`flex items-center justify-center h-full ${getRandomBgColor(product.id || '1')}`}>
                        <span className="text-2xl font-bold text-white">
                          {product.name ? product.name.charAt(0).toUpperCase() : 'P'}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-0 right-0 p-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-200">
                        {product.type || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 py-4">
                    <h3 className="text-lg font-medium text-white truncate" title={product.name}>
                      {product.name || 'Sin nombre'}
                    </h3>
                    <div className="mt-1 flex items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.language === 'Japanese' ? 'bg-red-900 text-white' : 
                        product.language === 'English' ? 'bg-blue-900 text-white' : 
                        'bg-green-900 text-white'
                      }`}>
                        {product.language || 'N/A'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-400 line-clamp-3">
                      {product.description || 'Sin descripción disponible.'}
                    </p>
                  </div>
                  <div className="border-t border-gray-800 px-4 py-3 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="px-3 py-1 bg-green-800 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(product.id || '')}
                        className="px-3 py-1 bg-red-800 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-400 py-8">
                {searchTerm ? 'No se encontraron productos que coincidan con la búsqueda.' : 'No hay productos disponibles.'}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 