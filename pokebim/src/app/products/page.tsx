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
      
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-white">Productos</h1>
              <p className="mt-1 text-sm text-gray-300">Gestiona tu catálogo de productos Pokémon</p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-800 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Añadir Producto
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-gray-900 shadow overflow-hidden sm:rounded-md p-6 text-center">
              <p className="text-gray-200">No hay productos registrados aún.</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-800 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Añade tu primer producto
              </button>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
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
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
} 