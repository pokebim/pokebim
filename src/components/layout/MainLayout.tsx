'use client';

import { useState, ReactNode, useEffect } from 'react';
import Sidebar from './Sidebar';
import { cleanupLocalStorage } from '@/lib/localStorageCleanup';
import { Toaster } from 'react-hot-toast';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  // Inicializar como colapsado para móviles en el primer render
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  // Detectar tamaño de pantalla y actualizar estado
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Verificar al cargar
    checkIsMobile();

    // Actualizar en resize
    window.addEventListener('resize', checkIsMobile);
    
    // Colapsar automáticamente en móvil
    setSidebarCollapsed(window.innerWidth < 768);

    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Ejecutar limpieza de localStorage al cargar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      cleanupLocalStorage();
    }
  }, []);

  // Gestionar overlay para móviles
  useEffect(() => {
    if (isMobile) {
      setShowOverlay(!sidebarCollapsed);
    } else {
      setShowOverlay(false);
    }
  }, [sidebarCollapsed, isMobile]);

  // Función para gestionar el cierre del sidebar en móvil al hacer click en el overlay
  const handleOverlayClick = () => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };

  return (
    <div className="bg-black min-h-screen text-white">
      {/* Toaster para notificaciones */}
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed}
        isMobile={isMobile}
      />

      {/* Overlay para móviles - solo visible cuando el sidebar está abierto en móvil */}
      {showOverlay && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={handleOverlayClick}
        />
      )}

      <div 
        className={`transition-all duration-300 ease-in-out ${
          sidebarCollapsed 
            ? 'ml-0 md:ml-16' 
            : 'ml-0 md:ml-64'
        }`}
      >
        <header className="bg-gray-900 shadow-sm h-16 flex items-center px-6 border-b border-gray-800">
          {/* Botón de menú solo visible en móvil */}
          {isMobile && (
            <button 
              className="mr-4 p-1 rounded-md hover:bg-gray-800 focus:outline-none"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <h1 className="text-xl font-semibold text-white">PokeBim</h1>
        </header>

        <main className="p-4 md:p-6 pb-24">
          {children}
        </main>
      </div>
    </div>
  );
} 