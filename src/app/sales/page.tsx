'use client';

import React, { useState, useEffect } from 'react';
import { addSale, getAllSales, deleteSale, updateSale, Sale, PLATFORMS } from '@/lib/salesService';
import { FaTrash, FaEdit, FaPlus, FaMoneyBillWave, FaShoppingCart, FaTag, FaUser } from 'react-icons/fa';
import SaleForm from '@/components/forms/SaleForm';
import { formatDate, formatCurrency } from '@/lib/utils';
import MainLayout from '@/components/layout/MainLayout';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<string | 'all'>('all');
  const [filterSeller, setFilterSeller] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  // Cargar ventas
  useEffect(() => {
    const loadSales = async () => {
      try {
        const data = await getAllSales();
        setSales(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error al cargar las ventas:', error);
        setIsLoading(false);
      }
    };

    loadSales();
  }, []);

  const handleAddSale = async (saleData: Partial<Sale>) => {
    try {
      const saleId = await addSale(saleData);
      // Crear un nuevo objeto venta con los datos proporcionados y el ID generado
      const newSale: Sale = {
        id: saleId,
        ...saleData as any, // Casting temporal para satisfacer la tipificación
      };
      setSales(prev => [...prev, newSale]);
      setIsFormOpen(false);
      setEditingSale(null);
    } catch (error) {
      console.error('Error al añadir la venta:', error);
    }
  };

  const handleUpdateSale = async (saleData: Partial<Sale>) => {
    if (!editingSale || !editingSale.id) return;
    
    try {
      await updateSale(editingSale.id, saleData);
      // Actualizar localmente la lista de ventas
      setSales(prev => prev.map(sale => 
        sale.id === editingSale.id 
          ? { ...sale, ...saleData, id: editingSale.id } 
          : sale
      ));
      setIsFormOpen(false);
      setEditingSale(null);
    } catch (error) {
      console.error('Error al actualizar la venta:', error);
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
      try {
        await deleteSale(id);
        setSales(prev => prev.filter(sale => sale.id !== id));
      } catch (error) {
        console.error('Error al eliminar la venta:', error);
      }
    }
  };

  const toggleSaleDetails = (id: string) => {
    setExpandedSale(expandedSale === id ? null : id);
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setIsFormOpen(true);
  };

  // Filtrar y ordenar ventas
  const filteredSales = sales.filter(sale => {
    const matchesPlatform = filterPlatform === 'all' || sale.platform === filterPlatform;
    const matchesSeller = filterSeller === 'all' || sale.soldBy === filterSeller;
    return matchesPlatform && matchesSeller;
  });

  // Ordenar ventas
  const sortedSales = [...filteredSales].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':
        return new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime();
      case 'date-desc':
        return new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime();
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'product-asc':
        return a.productName.localeCompare(b.productName);
      case 'product-desc':
        return b.productName.localeCompare(a.productName);
      default:
        return new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime();
    }
  });

  // Calcular estadísticas
  const calculateStats = () => {
    if (sales.length === 0) return { total: 0, byPlatform: {}, bySeller: {}, totalProducts: 0 };

    let total = 0;
    let totalProducts = 0;
    const byPlatform: Record<string, number> = {};
    const bySeller: Record<string, number> = {};
    
    sales.forEach(sale => {
      const amount = sale.hasVAT ? sale.totalWithVAT : sale.price;
      total += amount;
      totalProducts += sale.quantity;
      
      // Por plataforma
      byPlatform[sale.platform] = (byPlatform[sale.platform] || 0) + amount;
      
      // Por vendedor
      bySeller[sale.soldBy] = (bySeller[sale.soldBy] || 0) + amount;
    });
    
    return { total, byPlatform, bySeller, totalProducts };
  };

  const stats = calculateStats();

  // Calcular beneficio neto total
  const totalNetProfit = sales.reduce((sum, sale) => sum + (sale.netProfit || 0), 0);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4 text-white">Ventas</h1>
          <p className="text-white">Cargando...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-white">Ventas</h1>
        
        {isFormOpen ? (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-6">
            <h2 className="text-xl font-semibold mb-4 text-white">
              {editingSale ? 'Editar Venta' : 'Añadir Nueva Venta'}
            </h2>
            <SaleForm 
              onSubmit={editingSale ? handleUpdateSale : handleAddSale}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingSale(null);
              }}
              initialData={editingSale}
            />
          </div>
        ) : (
          <>
            {/* Estadísticas de ventas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <div className="flex items-center mb-2">
                  <FaMoneyBillWave className="text-green-500 mr-2" />
                  <h3 className="text-lg font-semibold text-white">Total Ventas</h3>
                </div>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.total)}</p>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <div className="flex items-center mb-2">
                  <FaShoppingCart className="text-blue-500 mr-2" />
                  <h3 className="text-lg font-semibold text-white">Productos Vendidos</h3>
                </div>
                <p className="text-2xl font-bold text-blue-500">{stats.totalProducts}</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <div className="flex items-center mb-2">
                  <FaTag className="text-purple-500 mr-2" />
                  <h3 className="text-lg font-semibold text-white">Plataforma Destacada</h3>
                </div>
                {Object.keys(stats.byPlatform).length > 0 ? (
                  <p className="text-lg font-bold text-purple-500">
                    {Object.entries(stats.byPlatform).sort((a, b) => b[1] - a[1])[0][0]}
                  </p>
                ) : (
                  <p className="text-lg text-gray-400">No hay datos</p>
                )}
              </div>

              <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <div className="flex items-center mb-2">
                  <FaUser className="text-orange-500 mr-2" />
                  <h3 className="text-lg font-semibold text-white">Beneficio Neto</h3>
                </div>
                <p className="text-2xl font-bold text-orange-500">{formatCurrency(totalNetProfit)}</p>
              </div>
            </div>
            
            {/* Filtros y ordenación */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label htmlFor="filterPlatform" className="block text-sm font-medium text-white mb-2">
                  Filtrar por Plataforma
                </label>
                <select
                  id="filterPlatform"
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
                >
                  <option value="all">Todas las plataformas</option>
                  {PLATFORMS.map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="filterSeller" className="block text-sm font-medium text-white mb-2">
                  Filtrar por Vendedor
                </label>
                <select
                  id="filterSeller"
                  value={filterSeller}
                  onChange={(e) => setFilterSeller(e.target.value)}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
                >
                  <option value="all">Todos los vendedores</option>
                  <option value="edmon">Edmon</option>
                  <option value="albert">Albert</option>
                  <option value="biel">Biel</option>
                  <option value="todos">Todos</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="sortBy" className="block text-sm font-medium text-white mb-2">
                  Ordenar por
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
                >
                  <option value="date-desc">Fecha (más reciente)</option>
                  <option value="date-asc">Fecha (más antigua)</option>
                  <option value="price-desc">Precio (mayor)</option>
                  <option value="price-asc">Precio (menor)</option>
                  <option value="product-asc">Producto (A-Z)</option>
                  <option value="product-desc">Producto (Z-A)</option>
                </select>
              </div>
            </div>
            
            {/* Botón para añadir */}
            <div className="mb-6">
              <button 
                onClick={() => {
                  setIsFormOpen(true);
                  setEditingSale(null);
                }}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <FaPlus className="mr-2" /> Añadir Venta
              </button>
            </div>
          </>
        )}
        
        {/* Lista de ventas */}
        {!isFormOpen && (
          <div className="overflow-x-auto">
            {sortedSales.length === 0 ? (
              <p className="text-center text-gray-400 py-4">No hay ventas disponibles</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Precio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cantidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Plataforma</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Vendedor</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {sortedSales.map((sale) => (
                    <React.Fragment key={sale.id}>
                      <tr 
                        className="hover:bg-gray-700 cursor-pointer transition-colors duration-150 ease-in-out"
                        onClick={() => toggleSaleDetails(sale.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {sale.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {formatCurrency(sale.hasVAT ? sale.totalWithVAT : sale.price)}
                          {sale.hasVAT && <span className="ml-1 text-xs text-green-500">(IVA)</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {sale.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {formatDate(sale.saleDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {sale.platform}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {sale.soldBy === 'edmon' ? 'Edmon' : 
                           sale.soldBy === 'albert' ? 'Albert' :
                           sale.soldBy === 'biel' ? 'Biel' : 'Todos'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSale(sale);
                            }}
                            className="text-indigo-400 hover:text-indigo-300 mr-3"
                            aria-label="Editar"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSale(sale.id);
                            }}
                            className="text-red-500 hover:text-red-400"
                            aria-label="Eliminar"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                      {expandedSale === sale.id && (
                        <tr className="bg-gray-900">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h3 className="font-medium text-white mb-2">Detalles de la venta</h3>
                                <p className="text-sm text-gray-300 mb-1">
                                  <span className="font-medium">Beneficio neto:</span> {formatCurrency(sale.netProfit)}
                                </p>
                                <p className="text-sm text-gray-300 mb-1">
                                  <span className="font-medium">Comprador:</span> {sale.buyer || 'No especificado'}
                                </p>
                                {sale.hasVAT && (
                                  <p className="text-sm text-gray-300 mb-1">
                                    <span className="font-medium">IVA ({sale.vatRate}%):</span> {formatCurrency(sale.vatAmount)}
                                  </p>
                                )}
                                <p className="text-sm text-gray-300 mb-1">
                                  <span className="font-medium">Costes adicionales:</span>
                                </p>
                                <ul className="list-disc list-inside text-sm text-gray-300 ml-4">
                                  <li>Envío: {formatCurrency(sale.shippingCost)}</li>
                                  <li>Comisión: {formatCurrency(sale.platformFee)}</li>
                                </ul>
                              </div>
                              
                              <div>
                                <h3 className="font-medium text-white mb-2">Descripción</h3>
                                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                                  {sale.description || 'Sin descripción'}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 