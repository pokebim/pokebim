'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Importar NotesWidget dinámicamente sin SSR
const NotesWidget = dynamic(() => import('./NotesWidget'), {
  ssr: false,
});

export default function ClientNotes() {
  // Estado para controlar si estamos en el cliente
  const [isMounted, setIsMounted] = useState(false);

  // Solo montar el componente cuando estemos en el cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // No renderizar nada hasta que estemos en el cliente
  if (!isMounted) {
    return null;
  }

  // Renderizar el componente de notas
  return <NotesWidget />;
} 