'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { formatCurrency } from '@/lib/currencyConverter';
import Modal from '@/components/ui/Modal';
import ProductForm from '@/components/forms/ProductForm';
import { 
  Product, 
  getAllProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct 
} from '@/lib/productService';
import DetailView, { DetailField, DetailGrid, DetailSection, DetailBadge, DetailImage } from '@/components/ui/DetailView';
import ProductImage from '@/components/ui/ProductImage';

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

// Extraer el contenido actual a un archivo separado
const DynamicProductsContent = dynamic(() => 
  // Importar desde el mismo directorio pero en un módulo separado
  import('./productsContent').then(mod => mod.default),
  { 
    ssr: false,  // Desactivar SSR completamente
    loading: () => <LoadingSpinner />
  }
);

// Componente principal extremadamente simple
export default function ProductsPage() {
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
    <Suspense fallback={<LoadingSpinner />}>
      <DynamicProductsContent />
    </Suspense>
  );
} 