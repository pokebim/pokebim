'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/currencyConverter';
import Modal from '@/components/ui/Modal';
import ProductForm from '@/components/forms/ProductForm';
import { 
  Product, 
  getAllProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct 
} from '@/lib/productService';
import DetailView, { DetailField, DetailGrid, DetailSection, DetailBadge, DetailImage } from '@/components/ui/DetailView';
import ProductImage from '@/components/ui/ProductImage';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Nuevos estados para la vista detallada
  const [detailViewOpen, setDetailViewOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  // Estado para el modal de imagen ampliada
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');

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
            {/* Contenedor de imagen con ratio fijo */}
            <div className="pt-[60%] relative bg-gray-900">
              <ProductImage 
                imageUrl={product.imageUrl} 
                productName={product.name}
                size="small"
                className="absolute inset-0"
                onClick={() => product.imageUrl && handleImageClick(product.imageUrl)}
              />
            </div>
            <div className="p-2 flex-grow flex flex-col">
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
      {selectedProduct && (
        <DetailView
          isOpen={detailViewOpen}
          onClose={() => setDetailViewOpen(false)}
          title={`Detalle de Producto: ${selectedProduct.name}`}
          actions={
            <>
              <button
                type="button"
                onClick={() => {
                  setDetailViewOpen(false);
                  setEditingProduct(selectedProduct);
                  setShowModal(true);
                }}
                className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Editar
              </button>
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
          <DetailSection title="Información General">
            {/* Mostrar imagen del producto */}
            {selectedProduct.imageUrl && (
              <div className="mb-6 flex justify-center">
                <div 
                  className="relative w-full h-80 cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => handleImageClick(selectedProduct.imageUrl || '')}
                >
                  <ProductImage 
                    imageUrl={selectedProduct.imageUrl} 
                    productName={selectedProduct.name}
                    size="large"
                    className="border-2 border-gray-700"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-30 transition-opacity">
                    <span className="text-white font-medium px-3 py-1 bg-gray-800 rounded-md">
                      Click para ampliar
                    </span>
                  </div>
                </div>
              </div>
            )}
            <DetailGrid>
              <DetailField label="Nombre" value={selectedProduct.name || 'Sin nombre'} />
              <DetailField 
                label="Idioma" 
                value={
                  <DetailBadge color="blue">
                    {selectedProduct.language || 'No especificado'}
                  </DetailBadge>
                } 
              />
              <DetailField 
                label="Tipo" 
                value={selectedProduct.type || 'No especificado'} 
              />
              <DetailField 
                label="ID" 
                value={
                  <span className="text-xs font-mono bg-gray-700 px-2 py-1 rounded">
                    {selectedProduct.id}
                  </span>
                } 
              />
            </DetailGrid>
          </DetailSection>

          {selectedProduct.description && (
            <DetailSection title="Descripción">
              <p className="text-gray-300 whitespace-pre-line">{selectedProduct.description}</p>
            </DetailSection>
          )}

          {selectedProduct.notes && (
            <DetailSection title="Notas">
              <p className="text-gray-300 whitespace-pre-line">{selectedProduct.notes}</p>
            </DetailSection>
          )}
        </DetailView>
      )}
      
      <div className="py-6 px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Productos</h1>
            <p className="mt-1 text-gray-400 text-sm">Gestiona el catálogo de productos de tu tienda</p>
          </div>
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
        
        {/* Buscador */}
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