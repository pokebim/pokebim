'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '@/components/ui/DataTable';
import { Movement, MovementType, getAllMovements } from '@/lib/movementsService';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FaBoxOpen, FaShoppingCart, FaArrowCircleDown, FaArrowCircleUp, FaExchangeAlt, FaUndo } from 'react-icons/fa';

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  // Cargar movimientos
  useEffect(() => {
    const loadMovements = async () => {
      try {
        setLoading(true);
        const data = await getAllMovements();
        setMovements(data);
      } catch (error) {
        console.error('Error al cargar los movimientos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMovements();
  }, []);

  // Filtrar movimientos según tipo y búsqueda
  const filteredMovements = movements.filter(movement => {
    const matchesType = filterType === 'all' || movement.movementType === filterType;
    const matchesSearch = searchText === '' || 
      movement.productName?.toLowerCase().includes(searchText.toLowerCase()) ||
      movement.notes?.toLowerCase().includes(searchText.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  // Obtener ícono según tipo de movimiento
  const getMovementIcon = (type: MovementType) => {
    switch (type) {
      case MovementType.PURCHASE:
        return <FaArrowCircleDown className="text-green-500" />;
      case MovementType.SALE:
        return <FaArrowCircleUp className="text-red-500" />;
      case MovementType.ADJUSTMENT:
        return <FaExchangeAlt className="text-blue-500" />;
      case MovementType.TRANSFER:
        return <FaExchangeAlt className="text-purple-500" />;
      case MovementType.RETURN:
        return <FaUndo className="text-orange-500" />;
      default:
        return <FaBoxOpen className="text-gray-500" />;
    }
  };

  // Formatear cantidad según si es entrada o salida
  const formatQuantity = (quantity: number) => {
    if (quantity > 0) {
      return <span className="text-green-500">+{quantity}</span>;
    } else if (quantity < 0) {
      return <span className="text-red-500">{quantity}</span>;
    }
    return <span className="text-gray-500">0</span>;
  };

  // Configurar columnas para la tabla
  const columnHelper = createColumnHelper<Movement>();
  const columns = [
    columnHelper.accessor('movementType', {
      header: 'Tipo',
      cell: info => (
        <div className="flex items-center">
          <span className="mr-2">{getMovementIcon(info.getValue())}</span>
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor('productName', {
      header: 'Producto',
      cell: info => info.getValue() || 'Sin nombre',
    }),
    columnHelper.accessor('quantity', {
      header: 'Cantidad',
      cell: info => formatQuantity(info.getValue()),
    }),
    columnHelper.accessor('price', {
      header: 'Precio',
      cell: info => info.getValue() ? formatCurrency(info.getValue()) : '-',
    }),
    columnHelper.accessor('timestamp', {
      header: 'Fecha',
      cell: info => formatDate(info.getValue()),
    }),
    columnHelper.accessor('createdBy', {
      header: 'Realizado por',
      cell: info => info.getValue() || 'Sistema',
    }),
    columnHelper.accessor('notes', {
      header: 'Notas',
      cell: info => info.getValue() || '-',
    }),
  ];

  // Calcular estadísticas de movimientos
  const getMovementStats = () => {
    if (movements.length === 0) return { entradas: 0, salidas: 0, total: 0 };

    const entradas = movements.filter(m => m.quantity > 0).reduce((sum, m) => sum + m.quantity, 0);
    const salidas = movements.filter(m => m.quantity < 0).reduce((sum, m) => sum + Math.abs(m.quantity), 0);
    
    return { entradas, salidas, total: entradas - salidas };
  };

  const stats = getMovementStats();

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-white">Movimientos de Inventario</h1>
        
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <div className="flex items-center mb-2">
              <FaArrowCircleDown className="text-green-500 mr-2" />
              <h3 className="text-lg font-semibold text-white">Entradas</h3>
            </div>
            <p className="text-2xl font-bold text-green-500">{stats.entradas}</p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <div className="flex items-center mb-2">
              <FaArrowCircleUp className="text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-white">Salidas</h3>
            </div>
            <p className="text-2xl font-bold text-red-500">{stats.salidas}</p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <div className="flex items-center mb-2">
              <FaBoxOpen className="text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold text-white">Balance</h3>
            </div>
            <p className={`text-2xl font-bold ${stats.total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.total}
            </p>
          </div>
        </div>
        
        {/* Filtros */}
        <div className="flex flex-col md:flex-row md:items-center mb-6 gap-4">
          <div className="w-full md:w-1/3">
            <label htmlFor="filterType" className="block text-sm font-medium text-white mb-2">
              Filtrar por Tipo
            </label>
            <select
              id="filterType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
            >
              <option value="all">Todos los tipos</option>
              {Object.values(MovementType).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="w-full md:w-2/3">
            <label htmlFor="searchText" className="block text-sm font-medium text-white mb-2">
              Buscar por Producto o Notas
            </label>
            <input
              type="text"
              id="searchText"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
              placeholder="Escribe para buscar..."
            />
          </div>
        </div>
        
        {/* Tabla de movimientos */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {filteredMovements.length === 0 ? (
              <div className="text-center py-10 bg-gray-800 rounded-lg">
                <FaBoxOpen className="text-gray-500 mx-auto h-12 w-12 mb-4" />
                <p className="text-gray-400 text-lg">No hay movimientos que coincidan con los filtros</p>
                {searchText || filterType !== 'all' ? (
                  <button
                    onClick={() => {
                      setFilterType('all');
                      setSearchText('');
                    }}
                    className="mt-4 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    Borrar filtros
                  </button>
                ) : null}
              </div>
            ) : (
              <DataTable
                data={filteredMovements}
                columns={columns}
                searchPlaceholder="Buscar en movimientos..."
              />
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 