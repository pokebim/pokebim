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
  deleteMissingSupplier,
  toggleFavorite
} from '@/lib/supplierService';
import DetailView, { DetailField, DetailGrid, DetailSection, DetailBadge, DetailLink } from '@/components/ui/DetailView';
import { useRouter } from 'next/navigation';

// Define the tabs for the page
type TabType = 'asian' | 'european' | 'missing' | 'favorites';
const tabs: { id: TabType; label: string }[] = [
  { id: 'asian', label: 'Proveedores Asiáticos' },
  { id: 'european', label: 'Proveedores Europeos' },
  { id: 'missing', label: 'Proveedores Pendientes' },
  { id: 'favorites', label: 'Favoritos' }
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
  const [searchTerm, setSearchTerm] = useState('');
  
  // Nuevo estado para vista detallada
  const [detailViewOpen, setDetailViewOpen] = useState<boolean>(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const router = useRouter();

  // Cargar datos iniciales
  useEffect(() => {
    fetchSuppliers();
    fetchMissingSuppliers();
  }, []);

  // Re-filtrar proveedores cuando cambia la pestaña
  useEffect(() => {
    if (activeTab === 'missing') {
      fetchMissingSuppliers();
    } else if (activeTab === 'favorites') {
      const favorites = suppliers.filter(s => s.isFavorite === true);
      setFilteredSuppliers(favorites);
    } else {
      fetchSuppliersByRegion(activeTab);
    }
  }, [activeTab, updateCounter, suppliers]);

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

  const handleSubmitMissing = async (data: any) => {
    try {
      const supplierData = {
        ...data,
        region: 'missing'
      };

      if (editingSupplier && editingSupplier.id) {
        await updateSupplier(editingSupplier.id, supplierData);
        setSuppliers(prev => prev.map(supplier => 
          supplier.id === editingSupplier.id 
            ? { ...supplier, ...supplierData } 
            : supplier
        ));
        showNotification('Proveedor pendiente actualizado correctamente');
      } else {
        const newId = await addSupplier(supplierData);
        setSuppliers(prev => [...prev, { ...supplierData, id: newId }]);
        showNotification('Proveedor pendiente añadido correctamente');
      }

      setShowMissingModal(false);
      setEditingSupplier(null);
      fetchMissingSuppliers(); // Recargar la lista
    } catch (err) {
      console.error('Error al guardar proveedor pendiente:', err);
      showNotification('Error al guardar el proveedor pendiente', 'error');
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
      cell: ({ row, getValue }) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewDetail(row.original)}
            className="px-3 py-1 text-xs bg-indigo-700 text-white rounded hover:bg-indigo-600 transition-colors"
          >
            Ver
          </button>
          <button
            onClick={() => handleEdit(row.original)}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => handleDelete(getValue() as string)}
            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-500 transition-colors"
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

  // Filtrar proveedores basado en el término de búsqueda
  const filteredSuppliersBySearch = useMemo(() => {
    return suppliers.filter(supplier => {
      return (
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplier.phone && supplier.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (supplier.address && supplier.address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [suppliers, searchTerm]);

  // Usamos los proveedores filtrados por búsqueda cuando hay un término de búsqueda,
  // de lo contrario usamos los proveedores filtrados por región
  const displayedSuppliers = searchTerm ? filteredSuppliersBySearch : filteredSuppliers;

  // Nueva función para mostrar los detalles
  const handleViewDetail = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDetailViewOpen(true);
  };

  // Función para manejar favoritos
  const handleToggleFavorite = async (supplier: Supplier) => {
    try {
      const newValue = !supplier.isFavorite;
      await toggleFavorite(supplier.id!, newValue);
      
      // Actualizar estado local
      const updatedSuppliers = suppliers.map(s => 
        s.id === supplier.id ? { ...s, isFavorite: newValue } : s
      );
      setSuppliers(updatedSuppliers);
      
      // Si estamos en la pestaña de favoritos, actualizar la lista filtrada
      if (activeTab === 'favorites') {
        setFilteredSuppliers(updatedSuppliers.filter(s => s.isFavorite === true));
      } else {
        setFilteredSuppliers(prev => prev.map(s => 
          s.id === supplier.id ? { ...s, isFavorite: newValue } : s
        ));
      }
      
      showNotification(newValue ? 'Añadido a favoritos' : 'Eliminado de favoritos');
      
      // Forzar actualización de UI
      forceUpdate();
    } catch (error) {
      console.error('Error al cambiar favorito:', error);
      showNotification('Error al actualizar favorito', 'error');
    }
  };

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
      
      {/* Vista detallada del proveedor */}
      {selectedSupplier && (
        <DetailView
          isOpen={detailViewOpen}
          onClose={() => setDetailViewOpen(false)}
          title={`Detalle del Proveedor: ${selectedSupplier.name}`}
          actions={
            <>
              <button
                type="button"
                onClick={() => {
                  setDetailViewOpen(false);
                  setEditingSupplier(selectedSupplier);
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
            <DetailGrid>
              <DetailField label="Nombre" value={selectedSupplier.name || 'Sin nombre'} />
              <DetailField label="País" value={selectedSupplier.country || 'No especificado'} />
              <DetailField label="Contacto" value={selectedSupplier.contact || 'No especificado'} />
              {selectedSupplier.website && (
                <DetailField 
                  label="Sitio Web" 
                  value={
                    <DetailLink 
                      href={selectedSupplier.website.startsWith('http') ? selectedSupplier.website : `https://${selectedSupplier.website}`} 
                      label={selectedSupplier.website} 
                    />
                  } 
                />
              )}
              <DetailField 
                label="ID" 
                value={
                  <span className="text-xs font-mono bg-gray-700 px-2 py-1 rounded">
                    {selectedSupplier.id}
                  </span>
                } 
              />
            </DetailGrid>
          </DetailSection>

          {selectedSupplier.notes && (
            <DetailSection title="Notas">
              <p className="text-gray-300 whitespace-pre-line">{selectedSupplier.notes}</p>
            </DetailSection>
          )}
        </DetailView>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Proveedores</h1>
          <p className="text-gray-400">Gestiona tus proveedores de cartas Pokémon.</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Barra de herramientas */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar proveedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex space-x-4">
            {activeTab !== 'missing' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'grid' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-400 hover:text-white'
                  }`}
                  title="Vista en cuadrícula"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'table' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-400 hover:text-white'
                  }`}
                  title="Vista en tabla"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            )}
            <button
              onClick={() => {
                setEditingSupplier(null);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {activeTab === 'missing' ? 'Añadir Proveedor Pendiente' : 'Añadir Proveedor'}
            </button>
          </div>
        </div>

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
              onClick={() => activeTab === 'missing' ? fetchMissingSuppliers() : fetchSuppliersByRegion(activeTab)}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          activeTab === 'missing' ? (
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      País
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Notas
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {missingSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{supplier.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{supplier.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{supplier.country || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{supplier.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300">{supplier.notes || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="text-indigo-400 hover:text-indigo-300 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            viewMode === 'table' ? (
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Favorito
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        País
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Contacto
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {filteredSuppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleFavorite(supplier)}
                            className="text-gray-400 hover:text-yellow-400 transition-colors"
                          >
                            <svg
                              className={`w-6 h-6 ${supplier.isFavorite ? 'text-yellow-400 fill-current' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                              />
                            </svg>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{supplier.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{supplier.country}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            {supplier.email && <div>{supplier.email}</div>}
                            {supplier.phone && <div>{supplier.phone}</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => router.push(`/prices?supplier=${supplier.id}`)}
                            className="text-purple-400 hover:text-purple-300"
                          >
                            Ver Precios
                          </button>
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="text-indigo-400 hover:text-indigo-300"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSuppliers.map((supplier) => (
                  <div key={supplier.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-medium text-white truncate flex-1">{supplier.name}</h3>
                        <button
                          onClick={() => handleToggleFavorite(supplier)}
                          className="text-gray-400 hover:text-yellow-400 transition-colors ml-2"
                        >
                          <svg
                            className={`w-6 h-6 ${supplier.isFavorite ? 'text-yellow-400 fill-current' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-300">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                          </svg>
                          {supplier.country}
                        </div>
                        {supplier.email && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {supplier.email}
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {supplier.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-900 px-4 py-3 flex justify-end space-x-2">
                      <button
                        onClick={() => router.push(`/prices?supplier=${supplier.id}`)}
                        className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                      >
                        Ver Precios
                      </button>
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        className="text-red-400 hover:text-red-300 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )
        )}
      </div>
    </MainLayout>
  );
} 