'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';
import ProductForm from '@/components/forms/ProductForm';
import { 
  Product, 
  getAllProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct,
  updateProductPrice 
} from '@/lib/productService';
import DetailView, { DetailField, DetailGrid, DetailSection, DetailBadge, DetailImage } from '@/components/ui/DetailView';
import ProductImage from '@/components/ui/ProductImage';

// Componente principal del contenido de productos
export default function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para la vista detallada
  const [detailViewOpen, setDetailViewOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  // Estado para el modal de imagen ampliada
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [updatingPrices, setUpdatingPrices] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    console.log("Cargando productos...");
    
    try {
      // Obtener todos los productos
      const firebaseProducts = await getAllProducts();
      console.log(`FIREBASE: Cargados ${firebaseProducts.length} productos`);
      
      setProducts(firebaseProducts);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setError('No se pudieron cargar los productos. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    console.log('handleEdit - Producto original:', product);
    
    // Normalizar el valor del idioma
    let normalizedLanguage = product.language;
    if (product.language === 'Japanese') normalizedLanguage = 'jp';
    if (product.language === 'English') normalizedLanguage = 'en';
    if (product.language === 'Chinese') normalizedLanguage = 'cn';
    if (product.language === 'Korean') normalizedLanguage = 'kr';
    if (product.language === 'Español') normalizedLanguage = 'es';

    // Asegurarse de que todos los campos del producto estén presentes
    const productToEdit = {
      ...product,
      language: normalizedLanguage || 'es',
      type: product.type || 'regular'
    };
    console.log('handleEdit - Producto a editar:', productToEdit);
    setEditingProduct(productToEdit);
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
    console.log('handleSubmit - Datos recibidos:', data);
    try {
      if (data.id) {
        console.log('handleSubmit - Actualizando producto existente:', data);
        // Actualizar producto existente en Firebase
        await updateProduct(data.id, data);
        console.log(`FIREBASE: Updated product ${data.id}`, data);
        
        // Actualizar estado local
        setProducts(prev => prev.map(product => 
          product.id === data.id ? { ...product, ...data } : product
        ));
        
        showNotification('Producto actualizado correctamente');
      } else {
        // Crear nuevo producto en Firebase
        const newId = await addProduct(data);
        console.log(`FIREBASE: Added new product with ID ${newId}`, data);
        
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

  // Función para abrir la vista detallada
  const handleViewDetail = (product: Product) => {
    setSelectedProduct(product);
    setDetailViewOpen(true);
  };

  // Función para manejar la apertura del modal de imagen
  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageModalOpen(true);
  };

  // Función para actualizar el precio de un producto
  const updatePrice = async (product: Product) => {
    if (!product.cardmarketUrl) return;

    try {
      setUpdatingPrices(prev => ({ ...prev, [product.id]: true }));
      
      const response = await fetch(`/api/cardmarket-price?url=${encodeURIComponent(product.cardmarketUrl)}`);
      const data = await response.json();
      
      if (data.price) {
        await updateProductPrice(product.id, data.price);
        // Actualizar el estado local
        setProducts(prev => prev.map(p => 
          p.id === product.id 
            ? { ...p, cardmarketPrice: data.price, lastPriceUpdate: new Date() } 
            : p
        ));
        showNotification('Precio actualizado correctamente');
      }
    } catch (error) {
      console.error('Error actualizando precio:', error);
      showNotification('Error al actualizar el precio', 'error');
    } finally {
      setUpdatingPrices(prev => ({ ...prev, [product.id]: false }));
    }
  };

  // Función para actualizar todos los precios
  const updateAllPrices = async () => {
    const productsWithUrl = products.filter(p => p.cardmarketUrl);
    
    for (const product of productsWithUrl) {
      await updatePrice(product);
      // Pequeña pausa entre cada solicitud para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Barra superior con búsqueda, botón de añadir y actualizar precios */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        <div className="flex space-x-4">
          <button
            onClick={updateAllPrices}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Actualizar Precios
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Añadir Producto
          </button>
        </div>
      </div>

      {/* Notificación */}
      {notification.show && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white z-50`}>
          {notification.message}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-12">
          <div className="text-red-500 text-lg">{error}</div>
          <button
            onClick={fetchProducts}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Grid de productos */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-700"
            >
              {/* Imagen del producto */}
              <div 
                className="relative h-48 bg-gray-900 cursor-pointer"
                onClick={() => handleImageClick(product.imageUrl)}
              >
                <ProductImage
                  src={product.imageUrl}
                  alt={product.name}
                  className="object-contain w-full h-full"
                />
              </div>

              {/* Información del producto */}
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 truncate text-white">
                  {product.name}
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-gray-700 text-gray-200 text-sm rounded">
                    {product.language}
                  </span>
                  {product.type && (
                    <span className="px-2 py-1 bg-purple-900 text-purple-200 text-sm rounded">
                      {product.type}
                    </span>
                  )}
                  {product.cardmarketPrice && (
                    <span className="px-2 py-1 bg-green-900 text-green-200 text-sm rounded flex items-center gap-1">
                      <span>{product.cardmarketPrice.toFixed(2)}€</span>
                      {product.lastPriceUpdate && (
                        <span className="text-xs opacity-75" title={new Date(product.lastPriceUpdate).toLocaleString()}>
                          ({new Date(product.lastPriceUpdate).toLocaleDateString()})
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => handleViewDetail(product)}
                    className="px-3 py-1 bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
                  >
                    Ver detalles
                  </button>
                  <div className="flex space-x-2">
                    {product.cardmarketUrl && (
                      <button
                        onClick={() => updatePrice(product)}
                        disabled={updatingPrices[product.id]}
                        className={`px-3 py-1 ${
                          updatingPrices[product.id]
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700'
                        } text-white rounded`}
                      >
                        {updatingPrices[product.id] ? '...' : '↻'}
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(product)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de formulario */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProduct(null);
        }}
      >
        <ProductForm
          product={editingProduct}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowModal(false);
            setEditingProduct(null);
          }}
        />
      </Modal>

      {/* Modal de imagen */}
      <Modal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
      >
        <div className="relative w-full h-[80vh] max-w-4xl mx-auto bg-gray-900 rounded-lg overflow-hidden">
          <ProductImage
            src={selectedImageUrl}
            alt="Imagen ampliada"
            className="w-full h-full"
          />
          <button
            onClick={() => setImageModalOpen(false)}
            className="absolute top-4 right-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700 focus:outline-none"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </Modal>

      {/* Vista detallada */}
      <DetailView
        isOpen={detailViewOpen}
        onClose={() => setDetailViewOpen(false)}
        title={selectedProduct?.name || ''}
      >
        {selectedProduct && (
          <>
            <DetailGrid>
              <DetailSection title="Información General">
                <DetailField label="Nombre" value={selectedProduct.name} />
                <DetailField label="Idioma" value={
                  selectedProduct.language === 'es' ? 'Español' :
                  selectedProduct.language === 'en' ? 'English' :
                  selectedProduct.language === 'jp' ? 'Japanese' :
                  selectedProduct.language === 'cn' ? 'Chinese' :
                  selectedProduct.language === 'kr' ? 'Korean' :
                  selectedProduct.language
                } />
                <DetailField label="Tipo" value={
                  selectedProduct.type === 'regular' ? 'Regular' :
                  selectedProduct.type === 'special' ? 'Special' :
                  selectedProduct.type === 'promo' ? 'Promotional' :
                  selectedProduct.type === 'booster' ? 'Booster Box' :
                  selectedProduct.type === 'starter' ? 'Starter Deck' :
                  selectedProduct.type === 'collection' ? 'Collection Box' :
                  selectedProduct.type === 'gift' ? 'Gift Box' :
                  selectedProduct.type
                } />
              </DetailSection>
              
              <DetailSection title="Detalles">
                <DetailField 
                  label="Descripción" 
                  value={selectedProduct.description || 'Sin descripción'} 
                  multiline 
                />
                <DetailField 
                  label="Notas" 
                  value={selectedProduct.notes || 'Sin notas'} 
                  multiline 
                />
                {selectedProduct.cardmarketUrl && (
                  <DetailField 
                    label="Cardmarket" 
                    value={
                      <a 
                        href={selectedProduct.cardmarketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300"
                      >
                        Ver en Cardmarket
                      </a>
                    }
                  />
                )}
              </DetailSection>
            </DetailGrid>

            <DetailSection title="Imagen del Producto">
              <DetailImage
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                onClick={() => handleImageClick(selectedProduct.imageUrl)}
              />
            </DetailSection>
          </>
        )}
      </DetailView>
    </div>
  );
} 