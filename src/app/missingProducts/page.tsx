'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Modal from '@/components/ui/Modal';
import { 
  MissingProduct, 
  getAllMissingProducts, 
  createMissingProduct, 
  updateMissingProduct, 
  deleteMissingProduct 
} from '@/lib/missingProductService';
import MissingProductForm from '@/components/forms/MissingProductForm';
import DataTable from '@/components/ui/DataTable';
import { createColumnHelper } from '@tanstack/react-table';
import { ExternalLinkIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function MissingProductsPage() {
  const [products, setProducts] = useState<MissingProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<MissingProduct | null>(null);
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'success'
  });
  const [error, setError] = useState<string | null>(null);

  // Cargar productos al montar el componente
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getAllMissingProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error('Error al cargar los productos:', err);
      setError('Error al cargar los productos. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para gestionar productos que faltan
  const handleCreateProduct = async (productData: Omit<MissingProduct, 'id'>) => {
    try {
      const productId = await createMissingProduct(productData);
      
      // Actualizar la interfaz de usuario
      const newProduct: MissingProduct = {
        id: productId,
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setProducts(prev => [newProduct, ...prev]);
      
      // Cerrar modal y mostrar notificación
      setModalOpen(false);
      showNotification('Producto añadido correctamente');
    } catch (err) {
      console.error('Error creating product:', err);
      throw err;
    }
  };
  
  const handleUpdateProduct = async (productData: Omit<MissingProduct, 'id'>) => {
    if (!editingProduct?.id) return;
    
    try {
      await updateMissingProduct(editingProduct.id, productData);
      
      // Actualizar la interfaz de usuario
      setProducts(prev => prev.map(product => {
        if (product.id === editingProduct.id) {
          return {
            ...product,
            ...productData,
            updatedAt: new Date()
          };
        }
        return product;
      }));
      
      // Cerrar modal y mostrar notificación
      setModalOpen(false);
      setEditingProduct(null);
      showNotification('Producto actualizado correctamente');
    } catch (err) {
      console.error('Error updating product:', err);
      throw err;
    }
  };
  
  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await deleteMissingProduct(productId);
        setProducts(prev => prev.filter(product => product.id !== productId));
        showNotification('Producto eliminado correctamente');
      } catch (err) {
        console.error('Error deleting product:', err);
        showNotification('Error al eliminar el producto', 'error');
      }
    }
  };
  
  // Función para editar un producto
  const handleEdit = (product: MissingProduct) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  // Mostrar notificación
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });
    
    setTimeout(() => {
      setNotification(prev => ({...prev, show: false}));
    }, 3000);
  };
  
  // Definir columnas de la tabla
  const columnHelper = createColumnHelper<MissingProduct>();
  
  const columns = [
    columnHelper.accessor('name', {
      header: 'Producto',
      cell: info => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor('price', {
      header: 'Precio aprox.',
      cell: info => info.getValue() ? `${info.getValue()} €` : '-'
    }),
    columnHelper.accessor('quantity', {
      header: 'Cantidad',
      cell: info => info.getValue() || '-'
    }),
    columnHelper.accessor('purpose', {
      header: 'Para qué',
      cell: info => info.getValue() || '-'
    }),
    columnHelper.accessor('priority', {
      header: 'Prioridad',
      cell: info => {
        const priority = info.getValue();
        if (!priority) return '-';
        
        const styles = {
          high: 'bg-red-100 text-red-800',
          medium: 'bg-yellow-100 text-yellow-800',
          low: 'bg-green-100 text-green-800'
        };
        
        const labels = {
          high: 'Alta',
          medium: 'Media',
          low: 'Baja'
        };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${styles[priority]}`}>
            {labels[priority]}
          </span>
        );
      }
    }),
    columnHelper.display({
      id: 'link',
      header: 'Enlace',
      cell: info => {
        const link = info.row.original.link;
        return link ? (
          <a 
            href={link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 flex items-center"
          >
            <ExternalLinkIcon className="h-5 w-5 mr-1" />
            Ver enlace
          </a>
        ) : '-';
      }
    }),
    columnHelper.accessor('notes', {
      header: 'Notas',
      cell: info => {
        const notes = info.getValue();
        if (!notes) return '-';
        
        // Truncar notas largas
        return notes.length > 50 ? `${notes.substring(0, 50)}...` : notes;
      }
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Acciones',
      cell: info => (
        <div className="flex space-x-2">
          <button
            className="text-yellow-500 hover:text-yellow-400 p-1"
            onClick={() => handleEdit(info.row.original)}
            aria-label="Editar"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            className="text-red-500 hover:text-red-400 p-1"
            onClick={() => handleDeleteProduct(info.row.original.id!)}
            aria-label="Eliminar"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      )
    })
  ];

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Productos que nos faltan</h1>
        
        {notification.show && (
          <div className={`p-4 mb-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {notification.message}
          </div>
        )}
        
        <div className="mb-6">
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              setEditingProduct(null);
              setModalOpen(true);
            }}
          >
            Añadir Producto
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-800 p-4 rounded-md">
            {error}
          </div>
        ) : (
          <DataTable
            data={products}
            columns={columns}
            searchPlaceholder="Buscar productos..."
          />
        )}
        
        {/* Modal para añadir/editar un producto */}
        <Modal isOpen={modalOpen} onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}>
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">
              {editingProduct ? 'Editar Producto' : 'Añadir Producto'}
            </h2>
            <MissingProductForm
              initialData={editingProduct || undefined}
              onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
              onCancel={() => {
                setModalOpen(false);
                setEditingProduct(null);
              }}
            />
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
} 