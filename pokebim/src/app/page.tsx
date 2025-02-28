'use client';

import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';

export default function HomePage() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-8">
        <div className="max-w-2xl w-full bg-gray-900 rounded-lg shadow-md p-8 border border-gray-800">
          <h1 className="text-3xl font-bold text-center mb-8 text-white">PokeBim</h1>
          <p className="text-lg text-gray-300 mb-8 text-center">
            Bienvenido al sistema de gestión de productos Pokémon.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/products" className="block p-6 bg-gray-800 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-700 transition-all duration-200">
              <h2 className="text-xl font-semibold text-blue-400 mb-2">Productos</h2>
              <p className="text-gray-300">Gestiona tu catálogo de productos Pokémon.</p>
            </Link>
            
            <Link href="/suppliers" className="block p-6 bg-gray-800 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-700 transition-all duration-200">
              <h2 className="text-xl font-semibold text-green-400 mb-2">Proveedores</h2>
              <p className="text-gray-300">Administra tus proveedores de cartas Pokémon.</p>
            </Link>
            
            <Link href="/prices" className="block p-6 bg-gray-800 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-700 transition-all duration-200">
              <h2 className="text-xl font-semibold text-purple-400 mb-2">Precios</h2>
              <p className="text-gray-300">Configura los precios para tus productos.</p>
            </Link>
            
            <Link href="/orders" className="block p-6 bg-gray-800 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-700 transition-all duration-200">
              <h2 className="text-xl font-semibold text-yellow-400 mb-2">Pedidos</h2>
              <p className="text-gray-300">Gestiona tus pedidos y seguimiento.</p>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
