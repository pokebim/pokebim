'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Modal from '@/components/ui/Modal';
import { 
  Material, 
  getAllMaterials, 
  createMaterial, 
  updateMaterial, 
  deleteMaterial,
  updateMaterialQuantity
} from '@/lib/materialService';
import MaterialForm from '@/components/forms/MaterialForm';
import DataTable from '@/components/ui/DataTable';
import { createColumnHelper } from '@tanstack/react-table';
import { PencilIcon, TrashIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [notification, setNotification] = useState<Notification>({
    show: false,
    message: '',
    type: 'success'
  });
  const [error, setError] = useState<string | null>(null);

  // Cargar materiales al montar el componente
  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const data = await getAllMaterials();
      setMaterials(data);
      setError(null);
    } catch (err) {
      console.error('Error al cargar los materiales:', err);
      setError('Error al cargar los materiales. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para gestionar materiales
  const handleCreateMaterial = async (materialData: Omit<Material, 'id'>) => {
    try {
      const materialId = await createMaterial(materialData);
      
      // Actualizar la interfaz de usuario
      const newMaterial: Material = {
        id: materialId,
        ...materialData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setMaterials(prev => [newMaterial, ...prev]);
      
      // Cerrar modal y mostrar notificación
      setModalOpen(false);
      showNotification('Material añadido correctamente');
    } catch (err) {
      console.error('Error creating material:', err);
      throw err;
    }
  };
  
  const handleUpdateMaterial = async (materialData: Omit<Material, 'id'>) => {
    if (!editingMaterial?.id) return;
    
    try {
      await updateMaterial(editingMaterial.id, materialData);
      
      // Actualizar la interfaz de usuario
      setMaterials(prev => prev.map(material => {
        if (material.id === editingMaterial.id) {
          return {
            ...material,
            ...materialData,
            updatedAt: new Date()
          };
        }
        return material;
      }));
      
      // Cerrar modal y mostrar notificación
      setModalOpen(false);
      setEditingMaterial(null);
      showNotification('Material actualizado correctamente');
    } catch (err) {
      console.error('Error updating material:', err);
      throw err;
    }
  };
  
  const handleDeleteMaterial = async (materialId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este material?')) {
      try {
        await deleteMaterial(materialId);
        setMaterials(prev => prev.filter(material => material.id !== materialId));
        showNotification('Material eliminado correctamente');
      } catch (err) {
        console.error('Error deleting material:', err);
        showNotification('Error al eliminar el material', 'error');
      }
    }
  };
  
  // Función para editar un material
  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setModalOpen(true);
  };
  
  // Función para ajustar cantidad
  const handleQuantityChange = async (material: Material, amount: number) => {
    if (!material.id) return;
    
    const newQuantity = (material.quantity || 0) + amount;
    if (newQuantity < 0) return; // No permitir cantidades negativas
    
    try {
      await updateMaterialQuantity(material.id, newQuantity);
      
      // Actualizar la interfaz de usuario
      setMaterials(prev => prev.map(m => {
        if (m.id === material.id) {
          return {
            ...m,
            quantity: newQuantity,
            updatedAt: new Date()
          };
        }
        return m;
      }));
      
      showNotification(`Cantidad actualizada a ${newQuantity}`);
    } catch (err) {
      console.error('Error updating quantity:', err);
      showNotification('Error al actualizar la cantidad', 'error');
    }
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
  const columnHelper = createColumnHelper<Material>();
  
  const columns = [
    columnHelper.accessor('name', {
      header: 'Material',
      cell: info => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor('description', {
      header: 'Descripción',
      cell: info => info.getValue() || '-'
    }),
    columnHelper.accessor('quantity', {
      header: 'Cantidad',
      cell: info => {
        const material = info.row.original;
        const quantity = info.getValue() || 0;
        const minStock = material.minStock;
        
        return (
          <div className="flex items-center">
            <span className={`mr-2 ${minStock !== undefined && quantity < minStock ? 'text-red-500 font-bold' : ''}`}>
              {quantity}
            </span>
            <div className="flex space-x-1">
              <button
                onClick={() => handleQuantityChange(material, -1)}
                className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                aria-label="Disminuir"
              >
                <MinusIcon className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleQuantityChange(material, 1)}
                className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                aria-label="Aumentar"
              >
                <PlusIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      }
    }),
    columnHelper.accessor('location', {
      header: 'Ubicación',
      cell: info => info.getValue() || '-'
    }),
    columnHelper.accessor('supplier', {
      header: 'Proveedor',
      cell: info => info.getValue() || '-'
    }),
    columnHelper.accessor('purchasePrice', {
      header: 'Precio (€)',
      cell: info => info.getValue() ? `${info.getValue()} €` : '-'
    }),
    columnHelper.accessor('purchasedAt', {
      header: 'Fecha compra',
      cell: info => {
        const date = info.getValue();
        if (!date) return '-';
        
        if (typeof date === 'string') {
          return date;
        }
        
        // Si es un timestamp de Firestore o un Date
        const dateObj = date.toDate ? date.toDate() : new Date(date);
        return dateObj.toLocaleDateString();
      }
    }),
    columnHelper.display({
      id: 'stock-status',
      header: 'Estado',
      cell: info => {
        const material = info.row.original;
        const quantity = material.quantity || 0;
        const minStock = material.minStock;
        
        if (minStock === undefined) return '-';
        
        if (quantity < minStock) {
          return (
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
              Bajo Stock
            </span>
          );
        } else if (quantity === minStock) {
          return (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
              Stock Mínimo
            </span>
          );
        }
        
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
            Stock OK
          </span>
        );
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
            onClick={() => handleDeleteMaterial(info.row.original.id!)}
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
        <h1 className="text-2xl font-bold mb-4">Inventario de Material</h1>
        
        {notification.show && (
          <div className={`p-4 mb-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {notification.message}
          </div>
        )}
        
        <div className="mb-6">
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              setEditingMaterial(null);
              setModalOpen(true);
            }}
          >
            Añadir Material
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
            data={materials}
            columns={columns}
            searchPlaceholder="Buscar materiales..."
          />
        )}
        
        {/* Modal para añadir/editar un material */}
        <Modal isOpen={modalOpen} onClose={() => {
          setModalOpen(false);
          setEditingMaterial(null);
        }}>
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">
              {editingMaterial ? 'Editar Material' : 'Añadir Material'}
            </h2>
            <MaterialForm
              initialData={editingMaterial || undefined}
              onSubmit={editingMaterial ? handleUpdateMaterial : handleCreateMaterial}
              onCancel={() => {
                setModalOpen(false);
                setEditingMaterial(null);
              }}
            />
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
} 