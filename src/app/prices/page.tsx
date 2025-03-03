'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import MainLayout from '@/components/layout/MainLayout';

// Definir un componente de carga simple
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center">
        <div className="inline-block h-16 w-16 animate-spin rounded-full border-t-4 border-indigo-500 border-solid"></div>
        <p className="mt-4 text-xl text-white">Cargando...</p>
      </div>
    </div>
  );
}

// Esta es la clave: usar dynamic import con una función anónima separada
// que se evalúa después del resto del código
const DynamicPricesContent = dynamic(() => 
  // Importar desde el mismo directorio pero en un módulo separado
  import('./pricesContent').then(mod => mod.default),
  { 
    ssr: false,  // Desactivar SSR completamente
    loading: () => <LoadingSpinner />
  }
);

// Componente principal extremadamente simple
export default function PricesPage() {
  // Detección de entorno cliente usando useState para evitar problemas de hidratación
  const [isClient, setIsClient] = useState(false);
  
  // Comprobar cliente solo una vez al montar
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Renderizar el spinner hasta confirmar que estamos en el cliente
  if (!isClient) {
    return <LoadingSpinner />;
  }
  
  return (
    <MainLayout>
      <Suspense fallback={<LoadingSpinner />}>
        <DynamicPricesContent />
      </Suspense>
    </MainLayout>
  );
} 