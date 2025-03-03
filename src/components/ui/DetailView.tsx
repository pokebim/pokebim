import React, { ReactNode } from 'react';
import Modal from './Modal';
import DefaultProductImage from './DefaultProductImage';

interface DetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

/**
 * Componente para mostrar una vista detallada de cualquier elemento en un modal
 */
export default function DetailView({ isOpen, onClose, title, children, actions }: DetailViewProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        {/* Contenido principal */}
        <div className="space-y-4">
          {children}
        </div>
        
        {/* Acciones opcionales (botones, etc.) */}
        {actions && (
          <div className="mt-6 flex justify-end space-x-3 border-t border-gray-700 pt-4">
            {actions}
          </div>
        )}
      </div>
    </Modal>
  );
}

/**
 * Componente para mostrar un campo de información con etiqueta y valor
 */
export function DetailField({ label, value, className = '' }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={`${className}`}>
      <dt className="text-sm font-medium text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-white">{value}</dd>
    </div>
  );
}

/**
 * Componente para mostrar una lista de campos en formato de grid
 */
export function DetailGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
      {children}
    </div>
  );
}

/**
 * Componente para mostrar una sección con título dentro de la vista detallada
 */
export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-white border-b border-gray-700 pb-2">{title}</h3>
      <div className="space-y-4 ml-1">
        {children}
      </div>
    </div>
  );
}

/**
 * Componente para mostrar un badge/etiqueta con estilo personalizable
 */
export function DetailBadge({ children, color = 'blue' }: { children: ReactNode; color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray' }) {
  const colorClasses = {
    blue: 'bg-blue-900 text-blue-200',
    green: 'bg-green-900 text-green-200',
    red: 'bg-red-900 text-red-200',
    yellow: 'bg-yellow-900 text-yellow-200',
    purple: 'bg-purple-900 text-purple-200',
    gray: 'bg-gray-700 text-gray-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  );
}

/**
 * Componente para mostrar un enlace en la vista detallada
 */
export function DetailLink({ href, label, className = '' }: { href: string; label: string; className?: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={`text-blue-400 hover:text-blue-300 hover:underline ${className}`}
    >
      {label}
    </a>
  );
}

/**
 * Componente para mostrar una imagen con leyenda
 */
export function DetailImage({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="relative">
      <div className="overflow-hidden rounded-lg bg-gray-800 shadow-md">
        {src ? (
          <div className="relative w-full h-80">
            <img 
              src={src} 
              alt={alt}
              className="w-full h-full object-contain"
              onError={() => {
                // El error se maneja con el fallback visual
              }}
            />
          </div>
        ) : (
          <div className="w-full h-80">
            <DefaultProductImage productName={alt} />
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-gray-400">{caption}</figcaption>
      )}
    </figure>
  );
} 