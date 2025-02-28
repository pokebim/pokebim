'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Modal from '@/components/ui/Modal';
import PriceForm from '@/components/forms/PriceForm';
import { formatCurrency, convertCurrency, type Currency } from '@/lib/currencyConverter';
import DataTable from '@/components/ui/DataTable';
import { createColumnHelper } from '@tanstack/react-table';
import { 
  Price, 
  getAllPrices, 
  addPrice, 
  updatePrice, 
  deletePrice 
} from '@/lib/priceService';
import { 
  Product, 
  getAllProducts 
} from '@/lib/productService';
import { 
  Supplier, 
  getAllSuppliers 
} from '@/lib/supplierService';

interface EnrichedPrice extends Price {
  product: {
    name: string;
    language: string;
    type: string;
  };
  supplier: {
    name: string;
    country: string;
  };
}

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

// Tipo para el resumen de precios más bajos
interface BestPriceProduct {
  productId: string;
  productName: string;
  productType: string;
  productLanguage: string;
  bestPrice: number;
  bestPriceCurrency: Currency;
  bestPriceInEUR: number;
  supplierName: string;
  supplierCountry: string;
}

export default function PricesPage() {
  const [prices, setPrices] = useState<EnrichedPrice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<Notification | null>({
    show: false,
    message: '',
    type: 'success'
  });
  const [editingPrice, setEditingPrice] = useState<EnrichedPrice | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Cargar productos y proveedores primero para poder enriquecer los precios
      await loadProductsAndSuppliers();
      
      // Luego cargar precios
      await fetchPrices();
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos. Por favor, inténtalo de nuevo más tarde.');
      setLoading(false);
    }
  };

  const fetchPrices = async () => {
    try {
      // Obtener precios desde Firebase
      const firebasePrices = await getAllPrices();
      console.log('FIREBASE: Loaded prices:', firebasePrices);
      
      // Enriquecer los datos de precios con información de productos y proveedores
      const enrichedPrices = firebasePrices.map((price: Price) => {
        const product = products.find(p => p.id === price.productId) || { 
          name: 'Producto desconocido', 
          language: 'N/A', 
          type: 'N/A' 
        };
        
        const supplier = suppliers.find(s => s.id === price.supplierId) || { 
          name: 'Proveedor desconocido', 
          country: 'N/A' 
        };
        
        return {
          ...price,
          product: {
            name: product.name || 'Producto desconocido',
            language: product.language || 'N/A',
            type: product.type || 'N/A'
          },
          supplier: {
            name: supplier.name || 'Proveedor desconocido',
            country: supplier.country || 'N/A'
          }
        };
      });
      
      setPrices(enrichedPrices);
    } catch (err) {
      console.error('Error fetching prices:', err);
      setError('No se pudieron cargar los precios. Por favor, inténtalo de nuevo más tarde.');
    }
  };

  const loadProductsAndSuppliers = async () => {
    try {
      // Cargar productos de Firebase
      const firebaseProducts = await getAllProducts();
      console.log('FIREBASE: Loaded products for prices page:', firebaseProducts);
      setProducts(firebaseProducts);
      
      // Cargar proveedores de Firebase
      const firebaseSuppliers = await getAllSuppliers();
      console.log('FIREBASE: Loaded suppliers for prices page:', firebaseSuppliers);
      setSuppliers(firebaseSuppliers);
    } catch (error) {
      console.error('Error loading products and suppliers:', error);
      setError('Error al cargar productos y proveedores');
    }
  };

  const handleEdit = (price: EnrichedPrice) => {
    setEditingPrice(price);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // Eliminar precio de Firebase
      await deletePrice(id);
      console.log(`FIREBASE: Deleted price ${id}`);
      
      // Actualizar el estado local
      setPrices(prev => prev.filter(price => price.id !== id));
      
      // Mostrar notificación
      showNotification('Precio eliminado con éxito');
    } catch (error) {
      console.error('Error deleting price:', error);
      showNotification('Error al eliminar el precio', 'error');
    }
  };

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    try {
      // Encontrar el producto y proveedor seleccionados
      const selectedProduct = products.find(p => p.id === formData.productId) || { 
        name: 'Producto desconocido', 
        language: 'N/A', 
        type: 'N/A' 
      };
      
      const selectedSupplier = suppliers.find(s => s.id === formData.supplierId) || { 
        name: 'Proveedor desconocido', 
        country: 'N/A' 
      };
      
      if (editingPrice && editingPrice.id) {
        // Actualizar precio existente en Firebase
        await updatePrice(editingPrice.id, formData);
        console.log(`FIREBASE: Updated price ${editingPrice.id}`);
        
        // Actualizar estado local
        setPrices(prev => prev.map(price => {
          if (price.id === editingPrice.id) {
            return {
              ...price,
              ...formData,
              product: {
                name: selectedProduct.name || 'Producto desconocido',
                language: selectedProduct.language || 'N/A',
                type: selectedProduct.type || 'N/A'
              },
              supplier: {
                name: selectedSupplier.name || 'Proveedor desconocido',
                country: selectedSupplier.country || 'N/A'
              }
            };
          }
          return price;
        }));
        
        showNotification('Precio actualizado con éxito');
      } else {
        // Crear nuevo precio en Firebase
        const newId = await addPrice(formData);
        console.log(`FIREBASE: Added new price with ID ${newId}`);
        
        // Actualizar estado local
        const newPrice = {
          ...formData,
          id: newId,
          product: {
            name: selectedProduct.name || 'Producto desconocido',
            language: selectedProduct.language || 'N/A',
            type: selectedProduct.type || 'N/A'
          },
          supplier: {
            name: selectedSupplier.name || 'Proveedor desconocido',
            country: selectedSupplier.country || 'N/A'
          }
        };
        
        setPrices(prev => [...prev, newPrice]);
        
        showNotification('Precio añadido con éxito');
      }
      
      // Cerrar modal y limpiar estado de edición
      setModalOpen(false);
      setEditingPrice(null);
      setLoading(false);
    } catch (error) {
      console.error('Error submitting price:', error);
      showNotification('Error al guardar el precio', 'error');
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
        type
      });
    }, 3000);
  };

  // Calcular los productos con los precios más bajos
  const bestPrices = useMemo(() => {
    // Agrupar precios por producto
    const productGroups: {[key: string]: EnrichedPrice[]} = {};
    
    prices.forEach(price => {
      if (!productGroups[price.productId]) {
        productGroups[price.productId] = [];
      }
      productGroups[price.productId].push(price);
    });
    
    // Encontrar el mejor precio para cada producto
    const bestPriceProducts: BestPriceProduct[] = [];
    
    Object.entries(productGroups).forEach(([productId, productPrices]) => {
      // Convertir todos los precios a EUR para comparar
      const pricesInEUR = productPrices.map(price => {
        const priceInEUR = convertCurrency(price.price || 0, price.currency as Currency, 'EUR');
        return {
          price,
          priceInEUR
        };
      });
      
      // Ordenar por precio en EUR (de menor a mayor)
      pricesInEUR.sort((a, b) => a.priceInEUR - b.priceInEUR);
      
      // Tomar el precio más bajo
      if (pricesInEUR.length > 0) {
        const bestOption = pricesInEUR[0];
        
        bestPriceProducts.push({
          productId,
          productName: bestOption.price.product.name,
          productType: bestOption.price.product.type,
          productLanguage: bestOption.price.product.language,
          bestPrice: bestOption.price.price || 0,
          bestPriceCurrency: bestOption.price.currency as Currency,
          bestPriceInEUR: bestOption.priceInEUR,
          supplierName: bestOption.price.supplier.name,
          supplierCountry: bestOption.price.supplier.country
        });
      }
    });
    
    return bestPriceProducts;
  }, [prices]);

  // Preparar columnas para la tabla de precios
  const columnHelper = createColumnHelper<EnrichedPrice>();
  
  const columns = useMemo(() => [
    columnHelper.accessor('product.name', {
      header: 'Producto',
      cell: info => <span className="font-medium text-white">{info.getValue()}</span>
    }),
    columnHelper.accessor('product.language', {
      header: 'Idioma',
      cell: info => {
        const language = info.getValue();
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            language === 'Japanese' ? 'bg-red-900 text-white' : 
            language === 'English' ? 'bg-blue-900 text-white' : 
            'bg-green-900 text-white'
          }`}>
            {language}
          </span>
        );
      }
    }),
    columnHelper.accessor('supplier.name', {
      header: 'Proveedor',
      cell: info => <span className="text-gray-300">{info.getValue()}</span>
    }),
    columnHelper.accessor('supplier.country', {
      header: 'País',
      cell: info => <span className="text-gray-300">{info.getValue()}</span>
    }),
    columnHelper.accessor(row => ({ price: row.price, currency: row.currency }), {
      id: 'priceFormatted',
      header: 'Precio',
      cell: info => {
        const { price, currency } = info.getValue();
        return (
          <span className="text-gray-300">
            {formatCurrency(price || 0, currency as Currency)}
          </span>
        );
      }
    }),
    columnHelper.accessor(row => ({ price: row.price, currency: row.currency }), {
      id: 'priceEUR',
      header: 'Precio (EUR)',
      cell: info => {
        const { price, currency } = info.getValue();
        return (
          <span className="text-gray-300">
            {formatCurrency(convertCurrency(price || 0, currency as Currency, 'EUR'), 'EUR')}
          </span>
        );
      }
    }),
    columnHelper.accessor('notes', {
      header: 'Notas',
      cell: info => <span className="text-gray-300 max-w-xs truncate">{info.getValue() || '-'}</span>
    }),
    columnHelper.accessor('id', {
      header: 'Acciones',
      cell: info => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(info.row.original)}
            className="px-3 py-1 bg-green-700 text-white text-sm rounded hover:bg-green-600 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => handleDelete(info.getValue())}
            className="px-3 py-1 bg-red-700 text-white text-sm rounded hover:bg-red-600 transition-colors"
          >
            Eliminar
          </button>
        </div>
      )
    })
  ], []);

  // Preparar columnas para la tabla de mejores precios
  const bestPriceColumnHelper = createColumnHelper<BestPriceProduct>();
  
  const bestPriceColumns = useMemo(() => [
    bestPriceColumnHelper.accessor('productName', {
      header: 'Producto',
      cell: info => <span className="font-medium text-white">{info.getValue()}</span>
    }),
    bestPriceColumnHelper.accessor('productLanguage', {
      header: 'Idioma',
      cell: info => {
        const language = info.getValue();
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            language === 'Japanese' ? 'bg-red-900 text-white' : 
            language === 'English' ? 'bg-blue-900 text-white' : 
            'bg-green-900 text-white'
          }`}>
            {language}
          </span>
        );
      }
    }),
    bestPriceColumnHelper.accessor('supplierName', {
      header: 'Mejor Proveedor',
      cell: info => <span className="text-gray-300">{info.getValue()}</span>
    }),
    bestPriceColumnHelper.accessor(row => ({ price: row.bestPrice, currency: row.bestPriceCurrency }), {
      id: 'bestPrice',
      header: 'Mejor Precio',
      cell: info => {
        const { price, currency } = info.getValue();
        return (
          <span className="text-green-400 font-medium">
            {formatCurrency(price, currency)}
          </span>
        );
      }
    }),
    bestPriceColumnHelper.accessor('bestPriceInEUR', {
      header: 'Precio (EUR)',
      cell: info => (
        <span className="text-green-400 font-medium">
          {formatCurrency(info.getValue(), 'EUR')}
        </span>
      )
    }),
    bestPriceColumnHelper.accessor('supplierCountry', {
      header: 'País',
      cell: info => <span className="text-gray-300">{info.getValue()}</span>
    })
  ], []);

  return (
    <MainLayout>
      {notification?.show && (
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
          setEditingPrice(null);
        }}
        title={editingPrice ? "Editar precio" : "Añadir nuevo precio"}
      >
        <PriceForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false);
            setEditingPrice(null);
          }}
          initialData={editingPrice}
          products={products}
          suppliers={suppliers}
        />
      </Modal>
      
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-semibold leading-tight text-white">
                Precios
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Gestiona los precios de tus productos Pokémon y compara entre proveedores.
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Añadir Precio
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
          
          {/* Sección de mejores precios */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-white mb-4">Mejores precios por producto</h3>
            
            {loading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : bestPrices.length === 0 ? (
              <div className="bg-gray-900 shadow rounded-lg p-6 text-center">
                <p className="text-gray-300">No hay datos de precios disponibles todavía.</p>
              </div>
            ) : (
              <div className="bg-gray-900 shadow rounded-lg p-4">
                <DataTable
                  data={bestPrices}
                  columns={bestPriceColumns}
                  searchPlaceholder="Buscar por producto o proveedor..."
                />
              </div>
            )}
          </div>
          
          {/* Tabla principal de precios */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-white mb-4">Todos los precios</h3>
            
            {loading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : prices.length === 0 ? (
              <div className="bg-gray-900 shadow rounded-lg p-6 text-center">
                <p className="text-gray-300">No hay precios registrados aún.</p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Añadir tu primer precio
                </button>
              </div>
            ) : (
              <div className="bg-gray-900 shadow rounded-lg p-4">
                <DataTable
                  data={prices}
                  columns={columns}
                  searchPlaceholder="Buscar por producto o proveedor..."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 