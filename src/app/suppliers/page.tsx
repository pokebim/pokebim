'use client';

import React, { useEffect, useState } from 'react';
import SuppliersContent from './suppliersContent';
import { getSupplierCountsByRegion } from '@/lib/supplierService';
import MainLayout from '@/components/layout/MainLayout';

export default function SuppliersPage() {
  const [counts, setCounts] = useState({ asia: 0, europe: 0, pending: 0 });
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'asia' | 'europe' | 'pending' | 'favorites'>('all');

  useEffect(() => {
    const fetchCounts = async () => {
      const data = await getSupplierCountsByRegion();
      setCounts(data);
    };
    fetchCounts();
  }, []);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header with tabs */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h1 className="text-2xl font-bold text-white mb-4">Proveedores</h1>
          <div className="flex space-x-2 border-b border-gray-700">
            <button
              onClick={() => setSelectedRegion('all')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                selectedRegion === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedRegion('favorites')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                selectedRegion === 'favorites'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              ⭐ Favoritos
            </button>
            <button
              onClick={() => setSelectedRegion('asia')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                selectedRegion === 'asia'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              🌏 Asiáticos ({counts.asia})
            </button>
            <button
              onClick={() => setSelectedRegion('europe')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                selectedRegion === 'europe'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              🌍 Europeos ({counts.europe})
            </button>
            <button
              onClick={() => setSelectedRegion('pending')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                selectedRegion === 'pending'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              ⏳ Pendientes ({counts.pending})
            </button>
          </div>
          <p className="text-gray-300 mt-4">
            {selectedRegion === 'all' && 'Gestiona todos tus proveedores de cartas Pokémon.'}
            {selectedRegion === 'favorites' && 'Tus proveedores favoritos.'}
            {selectedRegion === 'asia' && `${counts.asia} proveedores de la región asiática.`}
            {selectedRegion === 'europe' && `${counts.europe} proveedores de la región europea.`}
            {selectedRegion === 'pending' && `${counts.pending} proveedores pendientes de contactar.`}
          </p>
        </div>

        {/* Lista de proveedores */}
        <SuppliersContent selectedRegion={selectedRegion} />
      </div>
    </MainLayout>
  );
} 