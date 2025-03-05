'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import SupplierForm from '@/components/forms/SupplierForm';
import { 
  Supplier, 
  getAllSuppliers, 
  addSupplier, 
  updateSupplier, 
  deleteSupplier,
  toggleFavorite,
  togglePendingOrder
} from '@/lib/supplierService';

interface SuppliersContentProps {
  selectedRegion: 'all' | 'asia' | 'europe' | 'pending' | 'favorites';
}

export default function SuppliersContent({ selectedRegion }: SuppliersContentProps) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await getAllSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      setError('No se pudieron cargar los proveedores');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  const handleDelete = async (supplierId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
      try {
        await deleteSupplier(supplierId);
        setSuppliers(prev => prev.filter(supplier => supplier.id !== supplierId));
        showNotification('Proveedor eliminado correctamente');
      } catch (err) {
        console.error('Error eliminando proveedor:', err);
        showNotification('Error al eliminar el proveedor', 'error');
      }
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (data.id) {
        await updateSupplier(data.id, data);
        setSuppliers(prev => prev.map(supplier => 
          supplier.id === data.id ? { ...supplier, ...data } : supplier
        ));
        showNotification('Proveedor actualizado correctamente');
      } else {
        const newId = await addSupplier(data);
        setSuppliers(prev => [...prev, { ...data, id: newId }]);
        showNotification('Proveedor añadido correctamente');
      }
      setShowModal(false);
      setEditingSupplier(null);
    } catch (err) {
      console.error('Error procesando proveedor:', err);
      showNotification('Error al procesar el proveedor', 'error');
    }
  };

  const handleToggleFavorite = async (supplier: Supplier) => {
    try {
      const newValue = !supplier.isFavorite;
      await toggleFavorite(supplier.id, newValue);
      setSuppliers(prev => prev.map(s => 
        s.id === supplier.id ? { ...s, isFavorite: newValue } : s
      ));
    } catch (error) {
      console.error('Error al cambiar favorito:', error);
      showNotification('Error al actualizar favorito', 'error');
    }
  };

  const handleTogglePendingOrder = async (supplier: Supplier) => {
    try {
      const newValue = !supplier.hasPendingOrder;
      await togglePendingOrder(supplier.id, newValue);
      setSuppliers(prev => prev.map(s => 
        s.id === supplier.id ? { ...s, hasPendingOrder: newValue } : s
      ));
    } catch (error) {
      console.error('Error al cambiar estado de pedido:', error);
      showNotification('Error al actualizar estado de pedido', 'error');
    }
  };

  const showNotification = (message: string, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchLower) ||
      supplier.email?.toLowerCase().includes(searchLower) ||
      supplier.phone?.toLowerCase().includes(searchLower) ||
      supplier.country?.toLowerCase().includes(searchLower) ||
      supplier.origin?.toLowerCase().includes(searchLower) ||
      (supplier.notes && supplier.notes.toLowerCase().includes(searchLower));

    // Filtrar por región seleccionada
    if (selectedRegion === 'all') return matchesSearch;
    if (selectedRegion === 'favorites') return matchesSearch && supplier.isFavorite;
    if (selectedRegion === 'pending') {
      // Un proveedor está pendiente si no tiene email o teléfono
      return matchesSearch && (!supplier.email || supplier.email.trim() === '' || !supplier.phone || supplier.phone.trim() === '');
    }
    // Para asia y europe, comprobar que la región coincida
    const regionMap = {
      'asia': 'asian',
      'europe': 'european'
    };
    return matchesSearch && supplier.region === regionMap[selectedRegion as keyof typeof regionMap];
  });

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSuppliers = filteredSuppliers.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      {/* Barra de herramientas */}
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar proveedores por nombre, email, teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        <div className="flex space-x-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-200'
              }`}
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
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => {
              setEditingSupplier(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Añadir Proveedor
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
            onClick={fetchSuppliers}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Contenido principal */}
      {!loading && !error && (
        viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <div className="align-middle inline-block min-w-full">
              <div className="overflow-hidden border border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Origen
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        País
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Contacto
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Teléfono
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Sitio Web
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900 divide-y divide-gray-700">
                    {currentSuppliers.map((supplier) => (
                      <tr key={supplier.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleToggleFavorite(supplier)}
                              className={`p-1 rounded-full hover:bg-gray-700 transition-colors ${
                                supplier.isFavorite ? 'text-yellow-400' : 'text-gray-400'
                              }`}
                            >
                              <svg className="w-5 h-5" fill={supplier.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            </button>
                            <span>{supplier.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{supplier.origin}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{supplier.country}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{supplier.contactName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{supplier.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{supplier.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {supplier.website && (
                            <a 
                              href={supplier.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300"
                            >
                              Visitar
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => router.push(`/prices?supplier=${supplier.id}`)}
                              className="inline-flex items-center px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Ver Precios
                            </button>
                            <button
                              onClick={() => handleEdit(supplier)}
                              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(supplier.id)}
                              className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-700"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-white">{supplier.name}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleFavorite(supplier)}
                        className={`p-1 rounded-full hover:bg-gray-700 transition-colors ${
                          supplier.isFavorite ? 'text-yellow-400' : 'text-gray-400'
                        }`}
                      >
                        <svg className="w-6 h-6" fill={supplier.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleTogglePendingOrder(supplier)}
                        className={`p-1 rounded-full hover:bg-gray-700 transition-colors ${
                          supplier.hasPendingOrder ? 'text-blue-400' : 'text-gray-400'
                        }`}
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">País:</span>
                      <span className="text-white">{supplier.country}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">Origen:</span>
                      <span className="text-white">{supplier.origin}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">Contacto:</span>
                      <span className="text-white">{supplier.contactName}</span>
                    </div>
                    {supplier.email && (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">Email:</span>
                        <span className="text-white">{supplier.email}</span>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">Teléfono:</span>
                        <span className="text-white">{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.website && (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">Web:</span>
                        <a 
                          href={supplier.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300"
                        >
                          Visitar
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={() => router.push(`/prices?supplier=${supplier.id}`)}
                      className="inline-flex items-center px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Ver Precios
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Paginación */}
      {!loading && !error && filteredSuppliers.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-400">
            Mostrando {startIndex + 1} - {Math.min(endIndex, filteredSuppliers.length)} de {filteredSuppliers.length}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-2 py-1 rounded bg-gray-800 text-gray-300 disabled:opacity-50"
            >
              {'<<'}
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 rounded bg-gray-800 text-gray-300 disabled:opacity-50"
            >
              {'<'}
            </button>
            <span className="text-gray-300">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2 py-1 rounded bg-gray-800 text-gray-300 disabled:opacity-50"
            >
              {'>'}
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-2 py-1 rounded bg-gray-800 text-gray-300 disabled:opacity-50"
            >
              {'>>'}
            </button>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="ml-4 px-2 py-1 rounded bg-gray-800 text-gray-300"
            >
              <option value={10}>Mostrar 10</option>
              <option value={25}>Mostrar 25</option>
              <option value={50}>Mostrar 50</option>
            </select>
          </div>
        </div>
      )}

      {/* Modal de formulario */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingSupplier(null);
        }}
      >
        <SupplierForm
          supplier={editingSupplier}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowModal(false);
            setEditingSupplier(null);
          }}
        />
      </Modal>
    </div>
  );
} 