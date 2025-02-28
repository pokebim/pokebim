'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Modal from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/currencyConverter';
import DataTable from '@/components/ui/DataTable';
import { createColumnHelper } from '@tanstack/react-table';
import StockForm from '@/components/forms/StockForm';
import { 
  StockItem,
  getAllStockItems,
  addStockItem,
  updateStockItem,
  deleteStockItem
} from '@/lib/stockService';

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function StockPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'success'
  });
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      // Cargar inventario desde Firebase
      const firebaseStock = await getAllStockItems();
      console.log('FIREBASE: Loaded stock items:', firebaseStock);
      setStockItems(firebaseStock);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError('Error al cargar los datos de stock. Por favor, inténtalo de nuevo más tarde.');
      setLoading(false);
    }
  };

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este ítem de stock?')) {
      try {
        // Eliminar de Firebase
        await deleteStockItem(id);
        console.log(`FIREBASE: Deleted stock item ${id}`);
        
        // Actualizar estado local
        setStockItems(prev => prev.filter(item => item.id !== id));
        
        showNotification('Ítem eliminado correctamente');
      } catch (err) {
        console.error('Error eliminando ítem:', err);
        showNotification('Error al eliminar el ítem', 'error');
      }
    }
  };

  const handleSubmit = async (formData: StockItem) => {
    setLoading(true);
    try {
      if (editingItem && editingItem.id) {
        // Actualizar ítem existente en Firebase
        await updateStockItem(editingItem.id, formData);
        console.log(`FIREBASE: Updated stock item ${editingItem.id}`);
        
        // Actualizar estado local
        setStockItems(prev => prev.map(item => {
          if (item.id === editingItem.id) {
            return { ...item, ...formData };
          }
          return item;
        }));
        
        showNotification('Ítem actualizado correctamente');
      } else {
        // Crear nuevo ítem en Firebase
        const newId = await addStockItem(formData);
        console.log(`FIREBASE: Added new stock item with ID ${newId}`);
        
        // Actualizar estado local
        const newItem = {
          ...formData,
          id: newId
        };
        
        setStockItems(prev => [...prev, newItem]);
        
        showNotification('Ítem añadido correctamente');
      }
      
      // Cerrar modal y limpiar estado de edición
      setModalOpen(false);
      setEditingItem(null);
      setLoading(false);
    } catch (err) {
      console.error('Error guardando ítem:', err);
      showNotification('Error al guardar el ítem', 'error');
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

  // Calcular las estadísticas del stock
  const stockStats = useMemo(() => {
    const totalItems = stockItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalValue = stockItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const totalProfit = stockItems.reduce((sum, item) => sum + (item.totalProfit || 0), 0);
    
    return {
      totalItems,
      totalValue,
      totalProfit,
      profitPercentage: totalValue > 0 ? (totalProfit / totalValue) * 100 : 0
    };
  }, [stockItems]);

  // Preparar columnas para la tabla
  const columnHelper = createColumnHelper<StockItem>();
  
  const columns = useMemo(() => [
    columnHelper.accessor('product', {
      header: 'Producto',
      cell: info => <span className="font-medium text-white">{info.getValue() || '-'}</span>
    }),
    columnHelper.accessor('language', {
      header: 'Idioma',
      cell: info => {
        const language = info.getValue();
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            language === 'Japanese' ? 'bg-red-900 text-white' : 
            language === 'English' ? 'bg-blue-900 text-white' : 
            'bg-green-900 text-white'
          }`}>
            {language || 'N/A'}
          </span>
        );
      }
    }),
    columnHelper.accessor('supplier', {
      header: 'Proveedor',
      cell: info => <span className="text-gray-300">{info.getValue() || '-'}</span>
    }),
    columnHelper.accessor('quantity', {
      header: 'Cantidad',
      cell: info => <span className="text-white font-bold">{info.getValue() || 0}</span>
    }),
    columnHelper.accessor('unitPrice', {
      header: 'Precio Unitario',
      cell: info => {
        const price = info.getValue();
        if (!price) return <span className="text-gray-300">-</span>;
        return (
          <span className="text-gray-300">
            {formatCurrency(price, 'EUR')}
          </span>
        );
      }
    }),
    columnHelper.accessor('totalPrice', {
      header: 'Precio Total',
      cell: info => {
        const price = info.getValue();
        if (!price) return <span className="text-gray-300">-</span>;
        return (
          <span className="text-gray-300">
            {formatCurrency(price, 'EUR')}
          </span>
        );
      }
    }),
    columnHelper.accessor('profitPerUnit', {
      header: 'Beneficio/Unidad',
      cell: info => {
        const profit = info.getValue();
        if (profit === undefined) return <span className="text-gray-300">-</span>;
        return (
          <span className={profit > 0 ? 'text-green-400' : 'text-red-400'}>
            {formatCurrency(profit, 'EUR')}
          </span>
        );
      }
    }),
    columnHelper.accessor('profitPercentage', {
      header: '% Beneficio',
      cell: info => {
        const percentage = info.getValue();
        if (percentage === undefined) return <span className="text-gray-300">-</span>;
        return (
          <span className={percentage > 0 ? 'text-green-400' : 'text-red-400'}>
            {percentage.toFixed(2)}%
          </span>
        );
      }
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
            onClick={() => handleDelete(info.getValue() || '')}
            className="px-3 py-1 bg-red-700 text-white text-sm rounded hover:bg-red-600 transition-colors"
          >
            Eliminar
          </button>
        </div>
      )
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
          setEditingItem(null);
        }}
        title={editingItem ? "Editar ítem de stock" : "Añadir nuevo ítem"}
      >
        <StockForm 
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
                Stock
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Gestiona el stock de tus productos Pokémon.
              </p>
              <div className="mt-2 flex space-x-4">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-200">
                  <span className="mr-1 text-green-400">{stockStats.totalItems}</span> unidades totales
                </div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-200">
                  <span className="mr-1 text-blue-400">{formatCurrency(stockStats.totalValue, 'EUR')}</span> valor total
                </div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-200">
                  <span className={`mr-1 ${stockStats.totalProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(stockStats.totalProfit, 'EUR')}
                  </span> beneficio estimado
                </div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-200">
                  <span className={`mr-1 ${stockStats.profitPercentage > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stockStats.profitPercentage.toFixed(2)}%
                  </span> rentabilidad
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
          
          {/* Tabla de Stock */}
          <div className="mt-8">
            {loading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : stockItems.length === 0 ? (
              <div className="bg-gray-900 shadow rounded-lg p-6 text-center">
                <p className="text-gray-300">No hay ítems en el stock.</p>
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
                  data={stockItems}
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