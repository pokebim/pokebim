'use client';

import { useState, ReactNode, useEffect } from 'react';
import Sidebar from './Sidebar';
import { cleanupLocalStorage } from '@/lib/localStorageCleanup';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Run the cleanup on first render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      cleanupLocalStorage();
    }
  }, []);

  return (
    <div className="bg-black min-h-screen text-white">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <div 
        className={`transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <header className="bg-gray-900 shadow-sm h-16 flex items-center px-6 border-b border-gray-800">
          <h1 className="text-xl font-semibold text-white">PokeBim</h1>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 