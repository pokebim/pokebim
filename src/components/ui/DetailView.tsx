import React, { ReactNode } from 'react';
import Modal from './Modal';

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
 * Componente para mostrar un elemento en la vista detallada
 */
export function DetailItem({ label, children, fullWidth = false }: { label: string; children: ReactNode; fullWidth?: boolean }) {
  return (
    <div className={`${fullWidth ? 'col-span-2' : ''}`}>
      <dt className="text-sm font-medium text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-white">{children}</dd>
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
export function DetailImage({ 
  src, 
  alt, 
  caption,
  onClick 
}: { 
  src: string; 
  alt: string; 
  caption?: string;
  onClick?: () => void 
}) {
  return (
    <figure className="relative">
      <div className="overflow-hidden rounded-lg bg-gray-800 shadow-md">
        {src ? (
          <img 
            src={src} 
            alt={alt}
            className={`w-full h-auto object-contain max-h-80 ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-image.png';
              (e.target as HTMLImageElement).alt = 'Imagen no disponible';
            }}
          />
        ) : (
          <div className="w-full h-48 flex items-center justify-center bg-gray-800 text-gray-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-gray-400">{caption}</figcaption>
      )}
    </figure>
  );
} 