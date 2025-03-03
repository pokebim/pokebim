'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import MainLayout from '@/components/layout/MainLayout';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Product, InventoryOut } from '@/types';

export default function InventoryOutPage() {
  const [inventoryOuts, setInventoryOuts] = useState<InventoryOut[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    salePrice: 0,
    outDate: new Date().toISOString().split('T')[0],
    reason: 'sale',
    notes: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    Promise.all([
      fetchInventoryOuts(),
      fetchProducts(),
    ]).then(() => {
      setLoading(false);
    }).catch(error => {
      setError('Error al cargar los datos: ' + error.message);
      setLoading(false);
    });
  }, []);

  const fetchInventoryOuts = async () => {
    try {
      const outsSnapshot = await getDocs(collection(db, 'inventory_outs'));
      const productsSnapshot = await getDocs(collection(db, 'products'));
      
      const productsMap = {};
      
      productsSnapshot.forEach(doc => {
        const product = { id: doc.id, ...doc.data() } as Product;
        productsMap[product.id] = product;
      });
      
      const outsData = outsSnapshot.docs.map(doc => {
        const data = doc.data();
        const product = productsMap[data.productId] || { name: 'Producto desconocido' };
        
        const outDate = data.outDate instanceof Timestamp 
          ? format(data.outDate.toDate(), 'dd/MM/yyyy', { locale: es })
          : 'Fecha desconocida';
            
        return {
          id: doc.id,
          productId: data.productId,
          productName: product.name,
          quantity: data.quantity,
          salePrice: data.salePrice,
          outDate: outDate,
          reason: data.reason || 'sale',
          notes: data.notes || '',
        } as InventoryOut;
      });
      
      setInventoryOuts(outsData);
    } catch (error) {
      console.error('Error fetching inventory outs:', error);
      setError('Error al cargar las salidas de inventario');
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' || name === 'salePrice' ? parseFloat(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'inventory_outs'), {
        productId: formData.productId,
        quantity: formData.quantity,
        salePrice: formData.salePrice,
        outDate: Timestamp.fromDate(new Date(formData.outDate)),
        reason: formData.reason,
        notes: formData.notes
      });
      
      setNotification({
        show: true,
        message: 'Salida de inventario registrada con éxito',
        type: 'success'
      });
      
      setShowModal(false);
      fetchInventoryOuts();
      
      // Limpiar el formulario
      setFormData({
        productId: '',
        quantity: 1,
        salePrice: 0,
        outDate: new Date().toISOString().split('T')[0],
        reason: 'sale',
        notes: ''
      });
      
      setTimeout(() => {
        setNotification({ show: false, message: '', type: 'success' });
      }, 3000);
    } catch (error) {
      console.error('Error registering inventory out:', error);
      setNotification({
        show: true,
        message: 'Error al registrar la salida de inventario',
        type: 'error'
      });
    }
  };
  
  // Filtrar salidas de inventario basado en el término de búsqueda
  const filteredInventoryOuts = inventoryOuts.filter(out => {
    return (
      out.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      out.outDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      out.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (out.notes && out.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });
  
  const getReasonText = (reason) => {
    const reasons = {
      'sale': 'Venta',
      'damaged': 'Dañado',
      'expired': 'Expirado',
      'lost': 'Perdido',
      'return': 'Devolución',
      'other': 'Otro'
    };
    return reasons[reason] || 'Otro';
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Salidas de Inventario</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Registrar Salida
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
            className="block w-full p-2 pl-10 text-sm border rounded-lg bg-gray-800 border-gray-700 placeholder-gray-400 text-white focus:ring-red-500 focus:border-red-500"
            placeholder="Buscar por producto, razón, fecha..."
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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <>
            {filteredInventoryOuts.length > 0 ? (
              <div className="bg-gray-800 shadow overflow-x-auto rounded-lg">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Producto
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Precio de Venta
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Razón
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Notas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {filteredInventoryOuts.map((out) => (
                      <tr key={out.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {out.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {out.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          ${out.salePrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {out.outDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {getReasonText(out.reason)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {out.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                {searchTerm ? 'No se encontraron salidas que coincidan con la búsqueda.' : 'No hay salidas de inventario disponibles.'}
              </div>
            )}
          </>
        )}
        
        {/* Modal para añadir salida */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-white mb-4">Registrar Salida de Inventario</h2>
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
                  <label className="block text-gray-300 mb-2">Precio de Venta ($)</label>
                  <input
                    type="number"
                    name="salePrice"
                    value={formData.salePrice}
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
                    name="outDate"
                    value={formData.outDate}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Razón</label>
                  <select
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    required
                  >
                    <option value="sale">Venta</option>
                    <option value="damaged">Dañado</option>
                    <option value="expired">Expirado</option>
                    <option value="lost">Perdido</option>
                    <option value="return">Devolución</option>
                    <option value="other">Otro</option>
                  </select>
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
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
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