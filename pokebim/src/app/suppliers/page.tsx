'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Modal from '@/components/ui/Modal';
import SupplierForm from '@/components/forms/SupplierForm';
import MissingSupplierForm from '@/components/forms/MissingSupplierForm';
import Link from 'next/link';
import DataTable from '@/components/ui/DataTable';
import { createColumnHelper } from '@tanstack/react-table';
import { 
  Supplier, 
  MissingSupplier,
  getAllSuppliers, 
  getSuppliersByRegion, 
  addSupplier, 
  updateSupplier, 
  deleteSupplier,
  getAllMissingSuppliers,
  addMissingSupplier,
  updateMissingSupplier,
  deleteMissingSupplier
} from '@/lib/supplierService';

// Define the tabs for the page
type TabType = 'asian' | 'european' | 'missing';
const tabs: { id: TabType; label: string }[] = [
  { id: 'asian', label: 'Proveedores Asiáticos' },
  { id: 'european', label: 'Proveedores Europeos' },
  { id: 'missing', label: 'Proveedores Pendientes' }
];

// Sample missing suppliers data - solo se usará si no hay datos en Firestore
const initialMissingSuppliers: MissingSupplier[] = [
  {
    id: '1',
    name: 'Asmodee Belgica',
    email: 'info_be@asmodee.com',
    emailSent: true,
    emailDate: '2024-02-24',
    responded: false,
    info: ''
  },
  // ... other sample missing suppliers can stay the same
];

export default function SuppliersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('asian');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [missingSuppliers, setMissingSuppliers] = useState<MissingSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingMissingSupplier, setEditingMissingSupplier] = useState<MissingSupplier | null>(null);
  const [updateCounter, setUpdateCounter] = useState(0);

  // Cargar datos iniciales
  useEffect(() => {
    fetchSuppliers();
    fetchMissingSuppliers();
  }, []);

  // Re-filtrar proveedores cuando cambia la pestaña
  useEffect(() => {
    if (activeTab !== 'missing') {
      fetchSuppliersByRegion(activeTab);
    }
  }, [activeTab, updateCounter]);

  // Función para forzar actualización de UI
  const forceUpdate = () => {
    setUpdateCounter(prev => prev + 1);
  };

  // Fetch all suppliers from Firestore
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await getAllSuppliers();
      console.log('FIREBASE: Loaded all suppliers:', data);
      setSuppliers(data);
      
      // Si estamos en una pestaña específica, filtramos por región
      if (activeTab !== 'missing') {
        const filtered = data.filter(supplier => (supplier.region || 'asian') === activeTab);
        setFilteredSuppliers(filtered);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('No se pudieron cargar los proveedores. Por favor, inténtalo de nuevo más tarde.');
      setLoading(false);
    }
  };

  // Fetch suppliers by region from Firestore
  const fetchSuppliersByRegion = async (region: TabType) => {
    if (region === 'missing') return;
    
    setLoading(true);
    try {
      const data = await getSuppliersByRegion(region);
      console.log(`FIREBASE: Loaded suppliers for region ${region}:`, data);
      setFilteredSuppliers(data);
      setLoading(false);
    } catch (err) {
      console.error(`Error fetching suppliers for region ${region}:`, err);
      setError(`No se pudieron cargar los proveedores para la región ${region}. Por favor, inténtalo de nuevo más tarde.`);
      setLoading(false);
    }
  };

  // Fetch missing suppliers from Firestore
  const fetchMissingSuppliers = async () => {
    try {
      const data = await getAllMissingSuppliers();
      console.log('FIREBASE: Loaded missing suppliers:', data);
      
      // Si no hay datos, inicializamos con datos de muestra
      if (data.length === 0) {
        // Eliminar IDs de los proveedores iniciales para que Firestore genere nuevos
        const samplesWithoutIds = initialMissingSuppliers.map(({ id, ...rest }) => rest);
        
        // Añadir los proveedores iniciales a Firestore
        for (const supplier of samplesWithoutIds) {
          await addMissingSupplier(supplier);
        }
        
        // Volver a cargar los datos
        const newData = await getAllMissingSuppliers();
        setMissingSuppliers(newData);
      } else {
        setMissingSuppliers(data);
      }
    } catch (err) {
      console.error('Error fetching missing suppliers:', err);
      setError('No se pudieron cargar los proveedores pendientes. Por favor, inténtalo de nuevo más tarde.');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  const handleEditMissing = (missingSupplier: MissingSupplier) => {
    setEditingMissingSupplier(missingSupplier);
    setShowMissingModal(true);
  };

  const handleDelete = async (supplierId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
      try {
        await deleteSupplier(supplierId);
        console.log(`FIREBASE: Deleted supplier ${supplierId}`);
        
        // Actualizar estado local
        setSuppliers(prev => prev.filter(supplier => supplier.id !== supplierId));
        setFilteredSuppliers(prev => prev.filter(supplier => supplier.id !== supplierId));
        
        showNotification('Proveedor eliminado correctamente');
        
        // Comprobar si hay precios que usan este proveedor
        // TODO: Actualizar esto para usar Firestore cuando implementes precios
        const prices = JSON.parse(localStorage.getItem('prices') || '[]');
        const affectedPrices = prices.filter((price: any) => price.supplierId === supplierId);
        
        if (affectedPrices.length > 0) {
          showNotification('Aviso: Hay precios asociados a este proveedor que pueden haber quedado sin referencia', 'error');
        }
      } catch (err) {
        console.error('Error eliminando proveedor:', err);
        showNotification('Error al eliminar el proveedor', 'error');
      }
    }
  };

  const handleDeleteMissing = async (missingId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este proveedor pendiente?')) {
      try {
        await deleteMissingSupplier(missingId);
        console.log(`FIREBASE: Deleted missing supplier ${missingId}`);
        
        // Actualizar estado local
        setMissingSuppliers(prev => prev.filter(supplier => supplier.id !== missingId));
        
        showNotification('Proveedor pendiente eliminado correctamente');
      } catch (err) {
        console.error('Error eliminando proveedor pendiente:', err);
        showNotification('Error al eliminar el proveedor pendiente', 'error');
      }
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      console.log('FIREBASE: Submit handler called with data:', data);
      
      // Ensure the data has a valid region
      const cleanData = {
        ...data,
        region: data.region || 'asian'
      };
      
      let shouldSwitchTab = false;
      
      if (editingSupplier && editingSupplier.id) {
        // Update existing supplier
        await updateSupplier(editingSupplier.id, cleanData);
        console.log(`FIREBASE: Updated supplier ${editingSupplier.id}`);
        
        // Actualizar estado local
        setSuppliers(prev => prev.map(supplier => 
          supplier.id === editingSupplier.id 
            ? { ...supplier, ...cleanData } 
            : supplier
        ));
        
        if (cleanData.region === activeTab) {
          setFilteredSuppliers(prev => prev.map(supplier => 
            supplier.id === editingSupplier.id 
              ? { ...supplier, ...cleanData } 
              : supplier
          ));
        } else {
          // Si el proveedor actualizado ya no pertenece a esta pestaña, lo eliminamos de la vista filtrada
          setFilteredSuppliers(prev => prev.filter(supplier => supplier.id !== editingSupplier.id));
        }
        
        showNotification('Proveedor actualizado correctamente');
      } else {
        // Create new supplier
        const newId = await addSupplier(cleanData);
        console.log(`FIREBASE: Added new supplier with ID ${newId}`);
        
        const newSupplier = {
          id: newId,
          ...cleanData
        };
        
        // Actualizar estado local
        setSuppliers(prev => [...prev, newSupplier]);
        
        // Switch tabs if needed
        if (activeTab !== cleanData.region) {
          shouldSwitchTab = true;
        } else {
          // Si estamos en la misma pestaña, actualizamos los proveedores filtrados
          setFilteredSuppliers(prev => [...prev, newSupplier]);
        }
        
        showNotification('Proveedor añadido correctamente');
      }
      
      // Close modal
      setShowModal(false);
      setEditingSupplier(null);
      
      // Switch tab if needed
      if (shouldSwitchTab) {
        console.log(`FIREBASE: Switching to tab ${cleanData.region}`);
        setActiveTab(cleanData.region as TabType);
      }
      
      // Force update after a short delay to ensure Firestore has updated
      setTimeout(() => {
        forceUpdate();
      }, 500);
      
    } catch (err) {
      console.error('Error saving supplier:', err);
      showNotification('Error al guardar el proveedor', 'error');
    }
  };

  const handleSubmitMissing = async (data: MissingSupplier) => {
    try {
      if (editingMissingSupplier && editingMissingSupplier.id) {
        // Update existing missing supplier
        await updateMissingSupplier(editingMissingSupplier.id, data);
        console.log(`FIREBASE: Updated missing supplier ${editingMissingSupplier.id}`);
        
        // Actualizar estado local
        setMissingSuppliers(prev => prev.map(supplier => 
          supplier.id === editingMissingSupplier.id 
            ? { ...supplier, ...data, id: editingMissingSupplier.id } 
            : supplier
        ));
        
        showNotification('Proveedor pendiente actualizado correctamente');
      } else {
        // Create new missing supplier
        const newId = await addMissingSupplier(data);
        console.log(`FIREBASE: Added new missing supplier with ID ${newId}`);
        
        // Actualizar estado local
        setMissingSuppliers(prev => [...prev, { ...data, id: newId }]);
        
        showNotification('Proveedor pendiente añadido correctamente');
      }
      
      // Close modal
      setShowMissingModal(false);
      setEditingMissingSupplier(null);
      
    } catch (err) {
      console.error('Error creating/updating missing supplier:', err);
      showNotification('Error al procesar el proveedor pendiente', 'error');
    }
  };

  const handleConvertToSupplier = async (missingSupplier: MissingSupplier) => {
    try {
      // Create a new supplier from missing supplier
      const newSupplier = {
        name: missingSupplier.name,
        email: missingSupplier.email,
        notes: missingSupplier.info,
        region: 'european', // Default to European since most missing suppliers are European
        country: ''
      };
      
      // Add to Firestore
      const newId = await addSupplier(newSupplier);
      console.log(`FIREBASE: Converted missing supplier to supplier with ID ${newId}`);
      
      // Actualizar estado local
      const supplierWithId = { ...newSupplier, id: newId };
      setSuppliers(prev => [...prev, supplierWithId]);
      
      if (activeTab === 'european') {
        setFilteredSuppliers(prev => [...prev, supplierWithId]);
      }
      
      // Delete from missing suppliers
      if (missingSupplier.id) {
        await deleteMissingSupplier(missingSupplier.id);
        
        // Actualizar estado local
        setMissingSuppliers(prev => prev.filter(supplier => supplier.id !== missingSupplier.id));
      }
      
      showNotification('Proveedor pendiente convertido a proveedor correctamente');
    } catch (err) {
      console.error('Error converting missing supplier:', err);
      showNotification('Error al convertir el proveedor pendiente', 'error');
    }
  };

  const showNotification = (message: string, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Define columns for DataTable
  const columnHelper = createColumnHelper<Supplier>();
  const supplierColumns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Nombre',
      cell: info => <span className="font-medium text-white">{info.getValue() || '-'}</span>
    }),
    columnHelper.accessor('origin', {
      header: 'Origen',
      cell: info => <span className="text-gray-300">{info.getValue() || '-'}</span>
    }),
    columnHelper.accessor('country', {
      header: 'País',
      cell: info => <span className="text-gray-300">{info.getValue() || '-'}</span>
    }),
    columnHelper.accessor('contactName', {
      header: 'Contacto',
      cell: info => <span className="text-gray-300">{info.getValue() || '-'}</span>
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: info => <span className="text-gray-300">{info.getValue() || '-'}</span>
    }),
    columnHelper.accessor('phone', {
      header: 'Teléfono',
      cell: info => <span className="text-gray-300">{info.getValue() || '-'}</span>
    }),
    columnHelper.accessor('website', {
      header: 'Sitio Web',
      cell: info => {
        const website = info.getValue();
        return website ? (
          <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
            {website.replace(/^https?:\/\/(www\.)?/, '')}
          </a>
        ) : (
          <span className="text-gray-300">-</span>
        );
      }
    }),
    columnHelper.accessor('id', {
      header: 'Acciones',
      cell: info => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(info.row.original)}
            className="px-3 py-1 bg-green-700 text-white rounded hover:bg-green-600 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => handleDelete(info.getValue() || '')}
            className="px-3 py-1 bg-red-700 text-white rounded hover:bg-red-600 transition-colors"
          >
            Eliminar
          </button>
        </div>
      )
    })
  ], []);

  // Define columns for Missing Suppliers
  const missingColumnHelper = createColumnHelper<MissingSupplier>();
  const missingColumns = useMemo(() => [
    missingColumnHelper.accessor('name', {
      header: 'Nombre',
      cell: info => <span className="font-medium text-white">{info.getValue()}</span>
    }),
    missingColumnHelper.accessor('email', {
      header: 'Email',
      cell: info => <span className="text-gray-300">{info.getValue()}</span>
    }),
    missingColumnHelper.accessor('emailSent', {
      header: 'Email Enviado',
      cell: info => (
        <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full ${
          info.getValue() ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-300'
        }`}>
          {info.getValue() ? 'Sí' : 'No'}
        </span>
      )
    }),
    missingColumnHelper.accessor('emailDate', {
      header: 'Fecha Email',
      cell: info => {
        const date = info.getValue();
        return date ? (
          <span className="text-gray-300">{new Date(date).toLocaleDateString('es-ES')}</span>
        ) : (
          <span className="text-gray-300">-</span>
        );
      }
    }),
    missingColumnHelper.accessor('responded', {
      header: 'Respuesta',
      cell: info => (
        <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full ${
          info.getValue() ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-300'
        }`}>
          {info.getValue() ? 'Sí' : 'No'}
        </span>
      )
    }),
    missingColumnHelper.accessor('info', {
      header: 'Información',
      cell: info => {
        const infoText = info.getValue();
        return (
          <span className="text-gray-300 whitespace-pre-line">{infoText || '-'}</span>
        );
      }
    }),
    missingColumnHelper.accessor('id', {
      header: 'Acciones',
      cell: info => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEditMissing(info.row.original)}
            className="px-2 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => handleConvertToSupplier(info.row.original)}
            className="px-2 py-1 text-xs bg-blue-700 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Convertir
          </button>
          <button
            onClick={() => handleDeleteMissing(info.getValue() || '')}
            className="px-2 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-600 transition-colors"
          >
            Eliminar
          </button>
        </div>
      )
    })
  ], []);

  return (
    <MainLayout>
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-5 right-5 p-4 rounded-md shadow-xl z-50 ${
          notification.type === 'success' ? 'bg-green-900 text-white border-l-4 border-green-500' : 'bg-red-900 text-white border-l-4 border-red-500'
        } transition-opacity duration-300 ease-in-out font-medium`}>
          {notification.message}
        </div>
      )}
      
      {/* Supplier Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingSupplier(null);
        }}
        title={editingSupplier ? "Editar proveedor" : "Añadir nuevo proveedor"}
      >
        <SupplierForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowModal(false);
            setEditingSupplier(null);
          }}
          initialData={editingSupplier}
        />
      </Modal>

      {/* Missing Supplier Modal */}
      <Modal
        isOpen={showMissingModal}
        onClose={() => {
          setShowMissingModal(false);
          setEditingMissingSupplier(null);
        }}
        title={editingMissingSupplier ? "Editar proveedor pendiente" : "Añadir nuevo proveedor pendiente"}
      >
        <MissingSupplierForm
          onSubmit={handleSubmitMissing}
          onCancel={() => {
            setShowMissingModal(false);
            setEditingMissingSupplier(null);
          }}
          initialData={editingMissingSupplier}
        />
      </Modal>
      
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-semibold leading-tight text-white">Proveedores</h2>
              <p className="mt-1 text-sm text-gray-300">
                Gestiona tus proveedores de cartas Pokémon.
              </p>
              <div className="mt-1 flex space-x-4 text-xs">
                <button 
                  onClick={() => {
                    console.log('FIREBASE: Refreshing data');
                    if (activeTab === 'missing') {
                      fetchMissingSuppliers();
                    } else {
                      fetchSuppliersByRegion(activeTab);
                    }
                    showNotification('Datos actualizados');
                  }}
                  className="text-gray-400 underline hover:text-gray-300"
                >
                  Actualizar datos
                </button>
              </div>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'missing') {
                    setShowMissingModal(true);
                  } else {
                    // Pre-select the right region based on active tab
                    const initialData = { region: activeTab };
                    console.log('FIREBASE: Creating new supplier with initial data:', initialData);
                    setEditingSupplier(initialData);
                    setShowModal(true);
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                {activeTab === 'missing' ? 'Añadir Pendiente' : 'Añadir Proveedor'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                // Calculate count for each tab
                let count = 0;
                if (tab.id === 'missing') {
                  count = missingSuppliers.length;
                } else {
                  // Count suppliers with this region
                  count = suppliers.filter(supplier => (supplier.region || 'asian') === tab.id).length;
                }
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                      ${activeTab === tab.id
                        ? 'border-green-500 text-green-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'}
                    `}
                  >
                    {tab.label}
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300">
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
          
          {error && (
            <div className="mb-6 bg-red-900 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-white">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {loading && activeTab !== 'missing' ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : activeTab !== 'missing' && filteredSuppliers.length === 0 ? (
            <div className="bg-gray-900 shadow overflow-hidden sm:rounded-md p-6 text-center">
              <p className="text-gray-300">No hay proveedores registrados en esta categoría aún.</p>
              <button
                onClick={() => {
                  // Pre-select the right region based on active tab
                  const initialData = { region: activeTab };
                  console.log('FIREBASE: Creating new supplier with initial data:', initialData);
                  setEditingSupplier(initialData);
                  setShowModal(true);
                }}
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Añade tu primer proveedor
              </button>
            </div>
          ) : activeTab === 'missing' ? (
            // Missing Suppliers Table
            <div className="bg-gray-900 shadow overflow-hidden sm:rounded-md">
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">Proveedores Pendientes</h3>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-900 text-blue-200">
                    {missingSuppliers.length} proveedores
                  </span>
                </div>
                
                <DataTable 
                  data={missingSuppliers} 
                  columns={missingColumns} 
                  searchPlaceholder="Buscar proveedores pendientes..."
                  itemsPerPage={20}
                />
              </div>
            </div>
          ) : (
            // Regular Suppliers Table
            <div className="bg-gray-900 shadow overflow-hidden sm:rounded-md">
              <div className="p-4">
                <DataTable 
                  data={filteredSuppliers} 
                  columns={supplierColumns} 
                  searchPlaceholder="Buscar proveedores..."
                  itemsPerPage={10}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
} 