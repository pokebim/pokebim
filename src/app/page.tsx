'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { Task, getAllTasks } from '@/lib/taskService';
import { getAllSuppliers } from '@/lib/supplierService';
import { getAllProducts } from '@/lib/productService';
import { getAllPrices } from '@/lib/priceService';
import { getAllStockItems } from '@/lib/stockService';

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    products: 0,
    suppliers: 0,
    prices: 0,
    stock: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Cargar tareas pendientes
        const tasksData = await getAllTasks();
        const pendingTasks = tasksData.filter(task => 
          task.status === 'pending' || task.status === 'in-progress'
        ).slice(0, 5); // Mostrar solo las 5 más recientes
        setTasks(pendingTasks);

        // Cargar estadísticas
        const [products, suppliers, prices, stockItems] = await Promise.all([
          getAllProducts(),
          getAllSuppliers(),
          getAllPrices(),
          getAllStockItems()
        ]);

        setStats({
          products: products.length,
          suppliers: suppliers.length,
          prices: prices.length,
          stock: stockItems.length
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <MainLayout>
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="mt-2 text-lg text-gray-400">
              Bienvenido al sistema de gestión PokeBim
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link href="/tasks">
              <button className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600 transition-colors">
                Ver todas las tareas
              </button>
            </Link>
          </div>
        </div>

        {/* Resumen de estadísticas */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gray-900 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Total Productos
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-white">
                        {loading ? '...' : stats.products}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 px-5 py-3">
              <div className="text-sm">
                <Link href="/products" className="font-medium text-blue-400 hover:text-blue-300">
                  Ver todos los productos
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Total Proveedores
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-white">
                        {loading ? '...' : stats.suppliers}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 px-5 py-3">
              <div className="text-sm">
                <Link href="/suppliers" className="font-medium text-green-400 hover:text-green-300">
                  Ver todos los proveedores
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Total Precios
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-white">
                        {loading ? '...' : stats.prices}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 px-5 py-3">
              <div className="text-sm">
                <Link href="/prices" className="font-medium text-purple-400 hover:text-purple-300">
                  Ver todos los precios
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Items en Stock
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-white">
                        {loading ? '...' : stats.stock}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 px-5 py-3">
              <div className="text-sm">
                <Link href="/stock" className="font-medium text-yellow-400 hover:text-yellow-300">
                  Ver todo el stock
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal: Tareas y Enlaces */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Tareas pendientes */}
          <div className="bg-gray-900 rounded-lg shadow">
            <div className="px-6 py-5 border-b border-gray-800">
              <h3 className="text-lg font-medium text-white">Tareas pendientes</h3>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
                </div>
              ) : tasks.length === 0 ? (
                <p className="text-gray-400">No hay tareas pendientes.</p>
              ) : (
                <ul className="divide-y divide-gray-800">
                  {tasks.map((task) => (
                    <li key={task.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`
                            h-2.5 w-2.5 rounded-full mr-3
                            ${task.status === 'pending' ? 'bg-yellow-400' : 'bg-blue-400'}
                          `}></div>
                          <p className="text-white font-medium">{task.title}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`
                            px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${task.priority === 'high' ? 'bg-red-900 text-red-200' : 
                              task.priority === 'medium' ? 'bg-yellow-900 text-yellow-200' : 
                              'bg-blue-900 text-blue-200'}
                          `}>
                            {task.priority === 'high' ? 'Alta' : 
                              task.priority === 'medium' ? 'Media' : 'Baja'}
                          </span>
                        </div>
                      </div>
                      {task.description && (
                        <p className="mt-1 text-sm text-gray-400 truncate">{task.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-6">
                <Link href="/tasks" className="text-sm font-medium text-green-400 hover:text-green-300">
                  Ver todas las tareas →
                </Link>
              </div>
            </div>
          </div>

          {/* Enlaces importantes */}
          <div className="bg-gray-900 rounded-lg shadow">
            <div className="px-6 py-5 border-b border-gray-800">
              <h3 className="text-lg font-medium text-white">Enlaces importantes</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <a 
                  href="https://pokebim.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-all duration-200 hover:bg-gray-800"
                >
                  <div className="flex justify-center items-center h-10 w-10 rounded-lg bg-blue-800 text-white mb-3">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <h4 className="text-base font-medium text-white">Web</h4>
                  <p className="mt-1 text-sm text-gray-400 truncate">pokebim.com</p>
                </a>

                <a 
                  href="https://pokebim.com/wp-admin/about.php" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-all duration-200 hover:bg-gray-800"
                >
                  <div className="flex justify-center items-center h-10 w-10 rounded-lg bg-blue-700 text-white mb-3">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <h4 className="text-base font-medium text-white">WordPress</h4>
                  <p className="mt-1 text-sm text-gray-400 truncate">Panel de administración</p>
                </a>

                <a 
                  href="https://app.brevo.com/contact/list" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-all duration-200 hover:bg-gray-800"
                >
                  <div className="flex justify-center items-center h-10 w-10 rounded-lg bg-green-700 text-white mb-3">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <h4 className="text-base font-medium text-white">Contactos</h4>
                  <p className="mt-1 text-sm text-gray-400 truncate">app.brevo.com</p>
                </a>

                <a 
                  href="https://drive.google.com/drive/folders/1uxoghxlbhNfjIqsZGMbOedq-Up9kCT04?dmr=1&ec=wgc-drive-globalnav-goto" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-all duration-200 hover:bg-gray-800"
                >
                  <div className="flex justify-center items-center h-10 w-10 rounded-lg bg-yellow-600 text-white mb-3">
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-medium text-white">Drive</h4>
                  <p className="mt-1 text-sm text-gray-400 truncate">Google Drive</p>
                </a>
              </div>

              <div className="mt-6">
                <Link href="/links" className="text-sm font-medium text-blue-400 hover:text-blue-300">
                  Ver todos los enlaces →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Accesos directos a secciones principales */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-white mb-5">Accesos rápidos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link href="/products" className="flex flex-col items-center justify-center p-4 bg-gray-900 rounded-lg border border-gray-800 hover:bg-gray-800 transition-colors">
              <div className="bg-blue-600 p-3 rounded-full mb-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-white">Productos</span>
            </Link>

            <Link href="/suppliers" className="flex flex-col items-center justify-center p-4 bg-gray-900 rounded-lg border border-gray-800 hover:bg-gray-800 transition-colors">
              <div className="bg-green-600 p-3 rounded-full mb-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-white">Proveedores</span>
            </Link>

            <Link href="/prices" className="flex flex-col items-center justify-center p-4 bg-gray-900 rounded-lg border border-gray-800 hover:bg-gray-800 transition-colors">
              <div className="bg-purple-600 p-3 rounded-full mb-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-white">Precios</span>
            </Link>

            <Link href="/stock" className="flex flex-col items-center justify-center p-4 bg-gray-900 rounded-lg border border-gray-800 hover:bg-gray-800 transition-colors">
              <div className="bg-yellow-600 p-3 rounded-full mb-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-white">Stock</span>
            </Link>

            <Link href="/expenses" className="flex flex-col items-center justify-center p-4 bg-gray-900 rounded-lg border border-gray-800 hover:bg-gray-800 transition-colors">
              <div className="bg-red-600 p-3 rounded-full mb-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-white">Gastos</span>
            </Link>

            <Link href="/wiki" className="flex flex-col items-center justify-center p-4 bg-gray-900 rounded-lg border border-gray-800 hover:bg-gray-800 transition-colors">
              <div className="bg-indigo-600 p-3 rounded-full mb-3">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-sm font-medium text-white">Wiki</span>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
