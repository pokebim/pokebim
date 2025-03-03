'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import MainLayout from '@/components/layout/MainLayout';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Product, Supplier, InventoryEntry } from '@/types';

export default function InventoryInPage() {
  const [inventoryEntries, setInventoryEntries] = useState<InventoryEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [formData, setFormData] = useState({
    productId: '',
    supplierId: '',
    quantity: 1,
    cost: 0,
    entryDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    Promise.all([
      fetchInventoryEntries(),
      fetchProducts(),
      fetchSuppliers()
    ]).then(() => {
      setLoading(false);
    }).catch(error => {
      setError('Error al cargar los datos: ' + error.message);
      setLoading(false);
    });
  }, []);

  const fetchInventoryEntries = async () => {
    try {
      const entriesSnapshot = await getDocs(collection(db, 'inventory_entries'));
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const suppliersSnapshot = await getDocs(collection(db, 'suppliers'));
      
      const productsMap = {};
      const suppliersMap = {};
      
      productsSnapshot.forEach(doc => {
        const product = { id: doc.id, ...doc.data() } as Product;
        productsMap[product.id] = product;
      });
      
      suppliersSnapshot.forEach(doc => {
        const supplier = { id: doc.id, ...doc.data() } as Supplier;
        suppliersMap[supplier.id] = supplier;
      });
      
      const entriesData = entriesSnapshot.docs.map(doc => {
        const data = doc.data();
        const product = productsMap[data.productId] || { name: 'Producto desconocido' };
        const supplier = suppliersMap[data.supplierId] || { name: 'Proveedor desconocido' };
        
        const entryDate = data.entryDate instanceof Timestamp 
          ? format(data.entryDate.toDate(), 'dd/MM/yyyy', { locale: es })
          : 'Fecha desconocida';
            
        return {
          id: doc.id,
          productId: data.productId,
          productName: product.name,
          supplierId: data.supplierId,
          supplierName: supplier.name,
          quantity: data.quantity,
          cost: data.cost,
          entryDate: entryDate,
          notes: data.notes || '',
        } as InventoryEntry;
      });
      
      setInventoryEntries(entriesData);
    } catch (error) {
      console.error('Error fetching inventory entries:', error);
      setError('Error al cargar las entradas de inventario');
    }
  };

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => {
        return { id: doc.id, ...doc.data() } as Product;
      });
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Error al cargar los productos');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'suppliers'));
      const suppliersData = querySnapshot.docs.map(doc => {
        return { id: doc.id, ...doc.data() } as Supplier;
      });
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setError('Error al cargar los proveedores');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' || name === 'cost' ? parseFloat(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'inventory_entries'), {
        productId: formData.productId,
        supplierId: formData.supplierId,
        quantity: formData.quantity,
        cost: formData.cost,
        entryDate: Timestamp.fromDate(new Date(formData.entryDate)),
        notes: formData.notes
      });
      
      setNotification({
        show: true,
        message: 'Entrada de inventario registrada con éxito',
        type: 'success'
      });
      
      setShowModal(false);
      fetchInventoryEntries();
      
      // Limpiar el formulario
      setFormData({
        productId: '',
        supplierId: '',
        quantity: 1,
        cost: 0,
        entryDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
      
      setTimeout(() => {
        setNotification({ show: false, message: '', type: 'success' });
      }, 3000);
    } catch (error) {
      console.error('Error registering inventory entry:', error);
      setNotification({
        show: true,
        message: 'Error al registrar la entrada de inventario',
        type: 'error'
      });
    }
  };
  
  // Filtrar entradas de inventario basado en el término de búsqueda
  const filteredInventoryEntries = inventoryEntries.filter(entry => {
    return (
      entry.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.entryDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.notes && entry.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });
  
  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Entradas de Inventario</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Registrar Entrada
          </button>
        </div>
        
        {/* Notificación */}
        {notification.show && (
          <div className={`p-4 mb-6 rounded ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
            {notification.message}
          </div>
        )}
        
        {/* Buscador */}
        <div className="relative w-full max-w-md mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
          </div>
          <input
            type="text"
            className="block w-full p-2 pl-10 text-sm border rounded-lg bg-gray-800 border-gray-700 placeholder-gray-400 text-white focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Buscar por producto, proveedor, fecha..."
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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {filteredInventoryEntries.length > 0 ? (
              <div className="bg-gray-800 shadow overflow-x-auto rounded-lg">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Producto
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Proveedor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Costo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Notas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {filteredInventoryEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {entry.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {entry.supplierName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {entry.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          ${entry.cost.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {entry.entryDate}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {entry.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                {searchTerm ? 'No se encontraron entradas que coincidan con la búsqueda.' : 'No hay entradas de inventario disponibles.'}
              </div>
            )}
          </>
        )}
        
        {/* Modal para añadir entrada */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-white mb-4">Registrar Entrada de Inventario</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Producto</label>
                  <select
                    name="productId"
                    value={formData.productId}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    required
                  >
                    <option value="">Selecciona un producto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Proveedor</label>
                  <select
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    required
                  >
                    <option value="">Selecciona un proveedor</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Cantidad</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="1"
                    step="1"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Costo Unitario ($)</label>
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Fecha</label>
                  <input
                    type="date"
                    name="entryDate"
                    value={formData.entryDate}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Notas</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    rows={3}
                  ></textarea>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 