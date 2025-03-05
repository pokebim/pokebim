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
  deleteProduct 
} from '@/lib/productService';
import { 
  updateCardmarketPriceForProduct, 
  updateAllCardmarketPrices,
  getCardmarketPriceForProduct
} from '@/lib/cardmarketService';
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
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);

  // Estado para controlar la carga de precios
  const [loadingPrices, setLoadingPrices] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    console.log("Cargando productos...");
    
    try {
      // 1. Obtener todos los productos
      const firebaseProducts = await getAllProducts();
      console.log(`FIREBASE: Cargados ${firebaseProducts.length} productos`);
      
      // 2. Procesamos los productos para garantizar campos consistentes
      const productsWithDefaults = firebaseProducts.map(product => ({
        ...product,
        cardmarketUrl: product.cardmarketUrl || '',
        // No inicializamos cardmarketPrice aquí
      }));
      
      // 3. Cargar la lista inicial sin precios para mostrar algo rápido
      setProducts(productsWithDefaults);
      setLoading(false);
      
      // 4. Ahora, cargar los precios para cada producto (en segundo plano)
      setLoadingPrices(true);
      
      const productsWithPrices = [...productsWithDefaults];
      let pricesLoaded = 0;
      
      // Iterar por los productos para obtener sus precios
      for (const product of productsWithPrices) {
        try {
          // Intenta obtener el precio desde la colección de precios
          const priceData = await getCardmarketPriceForProduct(product.id);
          
          if (priceData) {
            // Si encontramos precio, lo asignamos al producto
            const index = productsWithPrices.findIndex(p => p.id === product.id);
            if (index !== -1) {
              productsWithPrices[index] = {
                ...productsWithPrices[index],
                cardmarketPrice: priceData.price,
                cardmarketUrl: priceData.url,
                lastPriceUpdate: priceData.updatedAt
              };
              
              pricesLoaded++;
              console.log(`Precio cargado para ${product.name}: ${priceData.price}€`);
            }
          }
        } catch (err) {
          console.error(`Error al cargar precio para ${product.name}:`, err);
        }
      }
      
      // 5. Actualizar el estado con los productos que tienen precios
      setProducts(productsWithPrices);
      console.log(`Precios cargados: ${pricesLoaded} de ${productsWithPrices.length} productos`);
      
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setError('No se pudieron cargar los productos. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
      setLoadingPrices(false);
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

  // Nueva función para actualizar el precio de Cardmarket para un solo producto
  const handleUpdateCardmarketPrice = async (productId: string, productName: string, cardmarketUrl: string) => {
    console.log(`Solicitando actualización de precio para ${productName} (${productId})`);
    
    if (!productId) {
      showNotification('No se puede actualizar el precio. Falta ID del producto.', 'error');
      return;
    }
    
    if (!cardmarketUrl) {
      showNotification('No se puede actualizar el precio. Primero añade un enlace a Cardmarket en la información del producto.', 'error');
      return;
    }
    
    try {
      // Mostrar notificación de carga
      setNotification({
        show: true,
        message: 'Actualizando precio desde Cardmarket...',
        type: 'success'
      });
      
      // Llamar al servicio actualizado para actualizar el precio
      // Pasamos true como último parámetro para forzar la actualización (elimina precio anterior)
      const result = await updateCardmarketPriceForProduct(productId, productName, cardmarketUrl, true);
      
      if (result.success && result.price) {
        // Recargamos los productos para obtener los datos actualizados
        await fetchProducts();
        
        // Mostrar notificación de éxito
        showNotification(`Precio actualizado correctamente: ${result.price.toFixed(2)} €`);
        
        // Si estamos viendo un detalle, también lo actualizamos
        if (selectedProduct && selectedProduct.id === productId) {
          // Obtener el precio actualizado
          const updatedPrice = await getCardmarketPriceForProduct(productId);
          if (updatedPrice) {
            setSelectedProduct({
              ...selectedProduct,
              cardmarketPrice: updatedPrice.price,
              cardmarketUrl: updatedPrice.url,
              lastPriceUpdate: updatedPrice.updatedAt
            });
          }
        }
      } else {
        showNotification(result.error || 'Error al actualizar el precio. Verifica que la URL sea correcta.', 'error');
      }
    } catch (error) {
      console.error('Error al actualizar precio:', error);
      showNotification('Error inesperado al conectar con Cardmarket. Inténtalo de nuevo más tarde.', 'error');
    }
  };

  // Función auxiliar para formatear fechas de forma segura
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return '';
    
    try {
      // Si es string ISO
      if (typeof dateValue === 'string') {
        return new Date(dateValue).toLocaleDateString();
      }
      
      // Si es objeto de Firebase con método toDate()
      if (typeof dateValue === 'object' && dateValue && typeof dateValue.toDate === 'function') {
        return dateValue.toDate().toLocaleDateString();
      }
      
      // Si es objeto Date
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString();
      }
      
      return '';
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return '';
    }
  }

  // Función para actualizar todos los precios de Cardmarket
  const handleUpdateAllPrices = async () => {
    if (isUpdatingPrices || loadingPrices) return;
    
    if (!window.confirm('¿Deseas actualizar los precios de todos los productos? Esta operación puede tardar varios minutos.')) {
      return;
    }
    
    setIsUpdatingPrices(true);
    
    try {
      // Mostrar notificación inicial
      setNotification({
        show: true,
        message: 'Iniciando actualización de precios desde Cardmarket...',
        type: 'success'
      });
      
      // Filtrar productos que tienen URL de Cardmarket
      const productsWithUrl = products.filter(p => p.cardmarketUrl && p.cardmarketUrl.trim() !== '');
      
      if (productsWithUrl.length === 0) {
        showNotification('No hay productos con URL de Cardmarket configurada. Edita algún producto para añadirla.', 'error');
        setIsUpdatingPrices(false);
        return;
      }
      
      // Actualizar precios usando la nueva función con forceUpdate=true
      const result = await updateAllCardmarketPrices(productsWithUrl, true);
      
      if (result.success) {
        // Recargar todos los productos para obtener los precios actualizados
        await fetchProducts();
        
        showNotification(`Se actualizaron ${result.updated} precios correctamente.`);
      } else if (result.updated > 0) {
        // Recargar productos aunque hayan fallado algunos
        await fetchProducts();
        
        showNotification(`Actualización parcial: ${result.updated} actualizados y ${result.failed} fallidos.`, 'error');
      } else {
        showNotification(`Error al actualizar precios. ${result.failed} actualizaciones fallidas.`, 'error');
      }
    } catch (error) {
      console.error('Error al actualizar todos los precios:', error);
      showNotification('Error al actualizar los precios de Cardmarket. Inténtalo de nuevo más tarde.', 'error');
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  // Modificar la función para renderizar los productos
  const renderProducts = () => {
    if (loading) return <div className="text-center py-8">Cargando productos...</div>;
    if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
    if (products.length === 0) return <div className="text-center py-8">No hay productos registrados.</div>;

    const filteredProducts = products.filter(product => 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.language?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (filteredProducts.length === 0) return <div className="text-center py-8">No se encontraron productos con el término de búsqueda.</div>;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-gray-800 rounded-md shadow overflow-hidden flex flex-col border border-gray-700 hover:border-gray-500 transition-colors">
            {/* Contenedor de imagen con tamaño fijo y mejor aprovechamiento del espacio */}
            <div className="h-48 flex items-center justify-center bg-gray-900 relative">
              <ProductImage 
                src={product.imageUrl} 
                alt={product.name}
                size="medium"
                className="w-full h-full object-contain p-2"
                onClick={() => product.imageUrl && handleImageClick(product.imageUrl)}
              />
              
              {/* Componente Badge para precios */}
              <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
                {/* Badge de precio */}
                {product.cardmarketPrice > 0 && (
                  <div className="bg-green-600 text-white px-3 py-1.5 rounded-lg font-bold text-base shadow-lg flex items-center">
                    <span>{product.cardmarketPrice.toFixed(2)} €</span>
                  </div>
                )}
                
                {/* Badge para actualizar precio si tiene URL pero no precio */}
                {product.cardmarketUrl && !product.cardmarketPrice && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateCardmarketPrice(product.id, product.name, product.cardmarketUrl);
                    }}
                    className="bg-indigo-600 text-white px-2 py-1 rounded text-xs shadow-lg flex items-center hover:bg-indigo-500"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Obtener precio
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-3 flex-grow flex flex-col">
              <div className="flex justify-between items-start gap-1">
                <h3 className="text-sm font-medium text-white line-clamp-1">{product.name}</h3>
                <span className="px-1.5 py-0.5 bg-blue-900 text-blue-200 text-xs rounded-full whitespace-nowrap">
                  {product.language || 'Sin idioma'}
                </span>
              </div>
              <div className="mt-1 text-gray-400 text-xs flex-grow">
                <p>Tipo: {product.type || 'No especificado'}</p>
                {product.description && (
                  <p className="line-clamp-1">{product.description}</p>
                )}
                
                {/* Enlace a Cardmarket con precio adicional para más visibilidad */}
                {product.cardmarketUrl && (
                  <div className="mt-2 flex items-center">
                    <a 
                      href={product.cardmarketUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-400 hover:text-blue-300 text-xs"
                    >
                      <svg className="w-3.5 h-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 6V8H5V19H16V14H18V20C18 20.5523 17.5523 21 17 21H4C3.44772 21 3 20.5523 3 20V7C3 6.44772 3.44772 6 4 6H10ZM21 3V12L17.206 8.207L11.2071 14.2071L9.79289 12.7929L15.792 6.793L12 3H21Z"></path>
                      </svg>
                      Ver en Cardmarket
                    </a>
                  </div>
                )}
                
              </div>
              <div className="mt-2 flex justify-between items-center">
                <div className="flex space-x-1">
                  <button 
                    onClick={() => handleViewDetail(product)} 
                    className="px-1.5 py-1 bg-indigo-700 text-white text-xs rounded hover:bg-indigo-600 transition-colors"
                  >
                    Ver
                  </button>
                  <button 
                    onClick={() => handleEdit(product)} 
                    className="px-1.5 py-1 bg-green-700 text-white text-xs rounded hover:bg-green-600 transition-colors"
                  >
                    Editar
                  </button>
                </div>
                <button 
                  onClick={() => handleDelete(product.id)} 
                  className="px-1.5 py-1 bg-red-700 text-white text-xs rounded hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <>
      {notification.show && (
        <div className={`fixed top-5 right-5 p-4 rounded-md shadow-xl z-50 ${
          notification.type === 'success' ? 'bg-green-700 text-white' : 'bg-red-700 text-white'
        }`}>
          {notification.message}
        </div>
      )}
      
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? "Editar Producto" : "Añadir Producto"}
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
      
      {/* Modal para imagen ampliada */}
      <Modal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        title="Vista ampliada"
      >
        <div className="relative w-full h-[70vh]">
          {selectedImageUrl && (
            <Image 
              src={selectedImageUrl}
              alt="Imagen ampliada"
              fill
              className="object-contain"
              unoptimized
            />
          )}
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={() => setImageModalOpen(false)}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
          >
            Cerrar
          </button>
        </div>
      </Modal>
      
      {/* Vista detallada del producto */}
      <Modal isOpen={detailViewOpen} onClose={() => setDetailViewOpen(false)}>
        {selectedProduct && (
          <DetailView 
            title={selectedProduct.name || 'Producto'}
            onClose={() => setDetailViewOpen(false)}
            actions={
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setDetailViewOpen(false);
                    handleEdit(selectedProduct);
                  }}
                  className="px-3 py-1.5 bg-green-700 text-white rounded hover:bg-green-600"
                >
                  Editar
                </button>
                <button
                  onClick={() => setDetailViewOpen(false)}
                  className="px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Cerrar
                </button>
              </div>
            }
          >
            {/* Información del producto */}
            <DetailSection title="Información del producto">
              <DetailGrid>
                <DetailField label="Nombre" value={selectedProduct.name || '-'} />
                <DetailField 
                  label="Idioma" 
                  value={
                    <DetailBadge color={
                      selectedProduct.language === 'Japanese' ? 'red' : 
                      selectedProduct.language === 'English' ? 'blue' : 
                      'green'
                    }>
                      {selectedProduct.language || 'No especificado'}
                    </DetailBadge>
                  } 
                />
                <DetailField label="Tipo" value={selectedProduct.type || '-'} />
                <DetailField label="Descripción" value={selectedProduct.description || '-'} />
              </DetailGrid>
              
              {/* Enlace a Cardmarket */}
              {selectedProduct.cardmarketUrl && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-white">Enlace a Cardmarket:</h4>
                  <a 
                    href={selectedProduct.cardmarketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 break-all"
                  >
                    {selectedProduct.cardmarketUrl}
                  </a>
                </div>
              )}
              
              {/* Precio de Cardmarket */}
              {selectedProduct.cardmarketPrice > 0 ? (
                <div className="mt-6 p-4 bg-gray-850 rounded-lg border border-gray-700">
                  <h4 className="text-sm font-medium text-white mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-14a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z" clipRule="evenodd"></path>
                    </svg>
                    Precio actual en Cardmarket:
                  </h4>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="text-3xl font-bold text-green-500 bg-gray-900 px-3 py-2 rounded-lg inline-flex">
                      {selectedProduct.cardmarketPrice.toFixed(2)} €
                    </span>
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                      {selectedProduct.lastPriceUpdate && (
                        <span className="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded">
                          Actualizado: {formatDate(selectedProduct.lastPriceUpdate)}
                        </span>
                      )}
                      <div className="flex-grow"></div>
                      <button 
                        onClick={() => handleUpdateCardmarketPrice(selectedProduct.id, selectedProduct.name, selectedProduct.cardmarketUrl)}
                        className="px-3 py-1.5 bg-indigo-700 text-white text-sm rounded hover:bg-indigo-600 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Actualizar precio
                      </button>
                    </div>
                  </div>
                  {selectedProduct.cardmarketUrl && (
                    <div className="mt-3 text-sm">
                      <a 
                        href={selectedProduct.cardmarketUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M10 6V8H5V19H16V14H18V20C18 20.5523 17.5523 21 17 21H4C3.44772 21 3 20.5523 3 20V7C3 6.44772 3.44772 6 4 6H10ZM21 3V12L17.206 8.207L11.2071 14.2071L9.79289 12.7929L15.792 6.793L12 3H21Z"></path>
                        </svg>
                        Ver producto en Cardmarket
                      </a>
                    </div>
                  )}
                </div>
              ) : selectedProduct.cardmarketUrl ? (
                <div className="mt-6 p-4 bg-gray-850 rounded-lg border border-gray-700">
                  <h4 className="text-sm font-medium text-white mb-2">Precio en Cardmarket:</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">No hay datos de precio disponibles</span>
                    <button 
                      onClick={() => handleUpdateCardmarketPrice(selectedProduct.id, selectedProduct.name, selectedProduct.cardmarketUrl)}
                      className="px-3 py-1.5 bg-indigo-700 text-white text-sm rounded hover:bg-indigo-600 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Obtener precio
                    </button>
                  </div>
                </div>
              ) : null}
            </DetailSection>
            
            {/* Imagen del producto */}
            {selectedProduct.imageUrl && (
              <DetailSection title="Imagen">
                <div className="flex justify-center">
                  <div className="relative w-full max-w-md h-64 rounded overflow-hidden">
                    <DetailImage 
                      src={selectedProduct.imageUrl} 
                      alt={selectedProduct.name || 'Producto'}
                      onClick={() => handleImageClick(selectedProduct.imageUrl)}
                    />
                  </div>
                </div>
              </DetailSection>
            )}
          </DetailView>
        )}
      </Modal>
      
      <div className="py-6 px-4 sm:px-6 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Productos</h1>
            <div className="flex items-center">
              <p className="text-gray-400 mr-3">
                Total: {products.length} productos
              </p>
              
              {/* Indicador de carga de precios */}
              {loadingPrices && (
                <div className="flex items-center text-gray-400">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Cargando precios...</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
            {/* Botón para actualizar todos los precios */}
            <button
              onClick={() => handleUpdateAllPrices()}
              disabled={isUpdatingPrices || loadingPrices}
              className="px-4 py-2 bg-indigo-700 text-white rounded hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isUpdatingPrices ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Actualizar precios de Cardmarket
                </>
              )}
            </button>
            
            {/* Botón para añadir producto */}
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600 flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Añadir Producto
            </button>
          </div>
        </div>
        
        {/* Banner informativo sobre precios de Cardmarket */}
        <div className="mb-6 p-4 bg-blue-900 bg-opacity-40 rounded-lg border border-blue-800">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-300 mt-1 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Precios de Cardmarket</h2>
              <p className="text-gray-300 text-sm mb-2">
                Para utilizar la integración con Cardmarket:
              </p>
              <ol className="text-gray-300 text-sm list-decimal list-inside space-y-1 ml-2">
                <li>Edita un producto y añade la URL completa de su página en Cardmarket</li>
                <li>Guarda el producto. La próxima vez que actualices precios, se obtendrá automáticamente</li>
                <li>Puedes actualizar todos los precios a la vez con el botón "Actualizar precios"</li>
              </ol>
              <div className="mt-2 text-gray-400 text-xs flex flex-wrap items-center">
                <span className="mr-2">Última actualización:</span>
                {products.some(p => p.lastPriceUpdate) ? (
                  <span>
                    {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                  </span>
                ) : (
                  <span>Nunca</span>
                )}
                <button 
                  onClick={() => fetchProducts()} 
                  className="ml-3 text-blue-400 hover:text-blue-300 flex items-center"
                  disabled={loading || loadingPrices}
                >
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Recargar precios
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Buscador de productos */}
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
          <div className="bg-gray-900 rounded-lg p-4">
            {renderProducts()}
          </div>
        )}
      </div>
    </>
  );
} 