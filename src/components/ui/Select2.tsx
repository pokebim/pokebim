'use client';

import { useState, useEffect, useRef } from 'react';

interface Option {
  value: string;
  label: string;
  details?: string;
  imageUrl?: string;
}

interface Select2Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function Select2({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  id,
  name,
  required = false,
  className = '',
  disabled = false
}: Select2Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cerrar el dropdown cuando se hace click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Enfocar el input de búsqueda cuando se abre el dropdown
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Opción seleccionada actualmente
  const selectedOption = options.find(option => option.value === value);

  // Filtrar opciones basadas en el término de búsqueda
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.details && option.details.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Alternar el dropdown
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm('');
    }
  };

  // Seleccionar una opción
  const handleSelectOption = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div 
      ref={selectRef} 
      className={`relative ${className}`}
    >
      {/* Campo visible que muestra la selección actual */}
      <div 
        className={`flex items-center justify-between px-3 py-2 border border-gray-700 bg-gray-800 rounded-md cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-blue-500'}`}
        onClick={toggleDropdown}
      >
        <div className="flex items-center">
          {selectedOption ? (
            <>
              {selectedOption.imageUrl && (
                <div className="mr-2 h-5 w-5 flex-shrink-0">
                  <img 
                    src={selectedOption.imageUrl} 
                    alt={selectedOption.label} 
                    className="h-5 w-5 object-cover rounded-sm"
                  />
                </div>
              )}
              <div>
                <span className="text-white">{selectedOption.label}</span>
                {selectedOption.details && (
                  <span className="ml-2 text-xs text-gray-400">{selectedOption.details}</span>
                )}
              </div>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <svg 
          className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 20 20" 
          fill="currentColor" 
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>

      {/* Input oculto para compatibilidad con formularios */}
      <input 
        type="hidden" 
        id={id} 
        name={name} 
        value={value} 
        required={required} 
      />
      
      {/* Dropdown con opciones */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-gray-800 shadow-lg rounded-md border border-gray-700 max-h-60 overflow-auto">
          {/* Campo de búsqueda */}
          <div className="sticky top-0 p-2 border-b border-gray-700 bg-gray-800">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          {/* Lista de opciones */}
          <ul className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li 
                  key={option.value} 
                  onClick={() => handleSelectOption(option.value)}
                  className={`px-3 py-2 flex items-center hover:bg-gray-700 cursor-pointer ${option.value === value ? 'bg-blue-900' : ''}`}
                >
                  {option.imageUrl && (
                    <div className="mr-2 h-6 w-6 flex-shrink-0">
                      <img 
                        src={option.imageUrl} 
                        alt={option.label} 
                        className="h-6 w-6 object-cover rounded-sm"
                      />
                    </div>
                  )}
                  <div>
                    <span className="text-white">{option.label}</span>
                    {option.details && (
                      <span className="ml-2 text-xs text-gray-400">{option.details}</span>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-gray-400">
                No se encontraron resultados
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
} 