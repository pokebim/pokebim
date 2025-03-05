'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Modal from '@/components/ui/Modal';
import { formatCurrency, type Currency } from '@/lib/currencyConverter';
import DataTable from '@/components/ui/DataTable';
import { createColumnHelper } from '@tanstack/react-table';
import Select2 from '@/components/ui/Select2';
import { InventoryItem } from '@/types';
import { 
  getAllInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
} from '@/lib/inventoryService';
import { 
  Product, 
  getAllProducts 
} from '@/lib/productService';

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

interface EnrichedInventoryItem extends InventoryItem {
  product?: {
    name: string;
    language: string;
    type?: string;
  };
}

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState<EnrichedInventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'success'
  });
  const [editingItem, setEditingItem] = useState<EnrichedInventoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      const inventoryData = await getAllInventoryItems();
      
      // Enriquecer los datos con información del producto
      const enrichedInventory: EnrichedInventoryItem[] = inventoryData.map(item => {
        const product = products.find(p => p.id === item.productId);
        
        return {
          ...item,
          product: product ? {
            name: product.name,
            language: product.language,
            type: product.type
          } : undefined
        };
      });
      
      setInventoryItems(enrichedInventory);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      setError('Error al cargar los datos de inventario');
    } finally {
      setLoading(false);
    }
  }, [products]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar productos primero
      const firebaseProducts = await getAllProducts();
      console.log('FIREBASE: Loaded products for inventory:', firebaseProducts);
      setProducts(firebaseProducts);
      
      // Luego cargar inventario
      await fetchInventory();
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos. Por favor, inténtalo de nuevo más tarde.');
      setLoading(false);
    }
  }, [fetchInventory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (item: EnrichedInventoryItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este ítem del inventario?')) {
      try {
        // Eliminar de Firebase
        await deleteInventoryItem(id);
        console.log(`FIREBASE: Deleted inventory item ${id}`);
        
        // Actualizar estado local
        setInventoryItems(prev => prev.filter(item => item.id !== id));
        
        showNotification('Ítem eliminado correctamente');
      } catch (err) {
        console.error('Error eliminando ítem:', err);
        showNotification('Error al eliminar el ítem', 'error');
      }
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (editingItem) {
        // Actualizar elemento existente
        await updateInventoryItem(editingItem.id, {
          productId: formData.productId,
          quantity: formData.quantity,
          location: formData.location,
          condition: formData.condition,
          purchaseDate: formData.purchaseDate,
          purchasePrice: formData.purchasePrice,
          purchaseCurrency: formData.purchaseCurrency,
          notes: formData.notes
        });
        
        setInventoryItems(prev => 
          prev.map(item => 
            item.id === editingItem.id 
              ? {
                  ...item,
                  productId: formData.productId,
                  quantity: formData.quantity,
                  location: formData.location,
                  condition: formData.condition,
                  purchaseDate: formData.purchaseDate,
                  purchasePrice: formData.purchasePrice,
                  purchaseCurrency: formData.purchaseCurrency,
                  notes: formData.notes,
                  product: products.find(p => p.id === formData.productId) 
                    ? {
                        name: products.find(p => p.id === formData.productId)!.name,
                        language: products.find(p => p.id === formData.productId)!.language,
                        type: products.find(p => p.id === formData.productId)!.type
                      } 
                    : item.product
                }
              : item
          )
        );
        
        showNotification('Elemento de inventario actualizado con éxito');
      } else {
        // Añadir nuevo elemento
        const newItem = await addInventoryItem({
          productId: formData.productId,
          quantity: formData.quantity,
          location: formData.location,
          condition: formData.condition,
          purchaseDate: formData.purchaseDate,
          purchasePrice: formData.purchasePrice,
          purchaseCurrency: formData.purchaseCurrency,
          notes: formData.notes
        });
        
        const product = products.find(p => p.id === formData.productId);
        
        setInventoryItems(prev => [...prev, {
          ...newItem,
          product: product ? {
            name: product.name,
            language: product.language,
            type: product.type
          } : undefined
        }]);
        
        showNotification('Elemento de inventario añadido con éxito');
      }
      
      setModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error al guardar elemento de inventario:', error);
      showNotification('Error al guardar elemento de inventario', 'error');
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

  // Calcular las estadísticas del inventario
  const inventoryStats = useMemo(() => {
    const totalItems = inventoryItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const uniqueProducts = new Set(inventoryItems.map(item => item.productId)).size;
    
    return {
      totalItems,
      uniqueProducts
    };
  }, [inventoryItems]);

  // Preparar columnas para la tabla
  const columnHelper = createColumnHelper<EnrichedInventoryItem>();
  
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
    columnHelper.accessor('quantity', {
      header: 'Cantidad',
      cell: info => <span className="text-white font-bold">{info.getValue()}</span>
    }),
    columnHelper.accessor('location', {
      header: 'Ubicación',
      cell: info => <span className="text-gray-300">{info.getValue() || '-'}</span>
    }),
    columnHelper.accessor('condition', {
      header: 'Condición',
      cell: info => <span className="text-gray-300">{info.getValue() || '-'}</span>
    }),
    columnHelper.accessor(row => ({
      price: row.purchasePrice,
      currency: row.purchaseCurrency
    }), {
      id: 'purchasePrice',
      header: 'Precio de Compra',
      cell: info => {
        const { price, currency } = info.getValue();
        if (!price || !currency) return <span className="text-gray-300">-</span>;
        return (
          <span className="text-gray-300">
            {formatCurrency(price, currency as Currency)}
          </span>
        );
      }
    }),
    columnHelper.accessor('purchaseDate', {
      header: 'Fecha de Compra',
      cell: info => {
        const date = info.getValue();
        if (!date) return <span className="text-gray-300">-</span>;
        return (
          <span className="text-gray-300">
            {new Date(date).toLocaleDateString()}
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

  // Formulario para inventario
  const InventoryForm = ({ onSubmit, onCancel, initialData }) => {
    const [formData, setFormData] = useState({
      productId: initialData?.productId || '',
      quantity: initialData?.quantity || 1,
      location: initialData?.location || '',
      condition: initialData?.condition || '',
      purchaseDate: initialData?.purchaseDate || '',
      purchasePrice: initialData?.purchasePrice || '',
      purchaseCurrency: initialData?.purchaseCurrency || 'EUR',
      notes: initialData?.notes || '',
    });

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: name === 'quantity' || name === 'purchasePrice' 
          ? value === '' ? '' : Number(value) 
          : value
      }));
    };

    const handleSelectChange = (name, value) => {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    // Convertir productos a formato de opciones para Select2
    const productOptions = products.map(product => ({
      value: product.id,
      label: product.name,
      details: product.language,
      imageUrl: product.imageUrl
    }));

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="productId" className="block text-sm font-bold text-white mb-2">
            Producto
          </label>
          <Select2
            id="productId"
            name="productId"
            options={productOptions}
            value={formData.productId}
            onChange={(value) => handleSelectChange('productId', value)}
            placeholder="Selecciona un producto"
            required
            className="w-full"
          />
        </div>
        
        <div>
          <label htmlFor="quantity" className="block text-sm font-bold text-white mb-2">
            Cantidad
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            min="1"
            value={formData.quantity}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
            required
          />
        </div>
        
        <div>
          <label htmlFor="location" className="block text-sm font-bold text-white mb-2">
            Ubicación
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
          />
        </div>
        
        <div>
          <label htmlFor="condition" className="block text-sm font-bold text-white mb-2">
            Condición
          </label>
          <select
            id="condition"
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
          >
            <option value="">Selecciona una condición</option>
            <option value="mint">Mint</option>
            <option value="near-mint">Near Mint</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="played">Played</option>
            <option value="poor">Poor</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="purchasePrice" className="block text-sm font-bold text-white mb-2">
              Precio de Compra
            </label>
            <input
              type="number"
              id="purchasePrice"
              name="purchasePrice"
              step="0.01"
              min="0"
              value={formData.purchasePrice}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
            />
          </div>
          
          <div>
            <label htmlFor="purchaseCurrency" className="block text-sm font-bold text-white mb-2">
              Moneda
            </label>
            <select
              id="purchaseCurrency"
              name="purchaseCurrency"
              value={formData.purchaseCurrency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="JPY">JPY</option>
              <option value="GBP">GBP</option>
              <option value="CNY">CNY</option>
              <option value="KRW">KRW</option>
            </select>
          </div>
        </div>
        
        <div>
          <label htmlFor="purchaseDate" className="block text-sm font-bold text-white mb-2">
            Fecha de Compra
          </label>
          <input
            type="date"
            id="purchaseDate"
            name="purchaseDate"
            value={formData.purchaseDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
          />
        </div>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-bold text-white mb-2">
            Notas
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-700 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-white"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500"
          >
            {initialData ? 'Actualizar' : 'Añadir'}
          </button>
        </div>
      </form>
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
      
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        title={editingItem ? "Editar ítem de inventario" : "Añadir nuevo ítem"}
      >
        <InventoryForm 
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false);
            setEditingItem(null);
          }}
          initialData={editingItem}
        />
      </Modal>
      
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-semibold leading-tight text-white">
                Inventario
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Gestiona tu inventario de productos Pokémon.
              </p>
              <div className="mt-2 flex space-x-4">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-200">
                  <span className="mr-1 text-green-400">{inventoryStats.totalItems}</span> unidades totales
                </div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-200">
                  <span className="mr-1 text-blue-400">{inventoryStats.uniqueProducts}</span> productos únicos
                </div>
              </div>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Añadir Ítem
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
          
          {/* Tabla de Inventario */}
          <div className="mt-8">
            {loading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : inventoryItems.length === 0 ? (
              <div className="bg-gray-900 shadow rounded-lg p-6 text-center">
                <p className="text-gray-300">No hay ítems en el inventario.</p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Añadir tu primer ítem
                </button>
              </div>
            ) : (
              <div className="bg-gray-900 shadow rounded-lg p-4">
                <DataTable
                  data={inventoryItems}
                  columns={columns}
                  searchPlaceholder="Buscar por producto o ubicación..."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 