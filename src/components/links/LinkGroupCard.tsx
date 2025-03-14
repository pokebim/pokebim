import { useState } from 'react';
import { LinkGroup, Link } from '@/lib/linkService';
import LinkItem from './LinkItem';
import { ChevronUpIcon, ChevronDownIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface LinkGroupCardProps {
  group: LinkGroup;
  links: Link[];
  onEditGroup: (group: LinkGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddLink: (groupId: string) => void;
  onEditLink: (link: Link) => void;
  onDeleteLink: (linkId: string) => void;
  onLinkClick: (linkId: string) => void;
}

export default function LinkGroupCard({
  group,
  links,
  onEditGroup,
  onDeleteGroup,
  onAddLink,
  onEditLink,
  onDeleteLink,
  onLinkClick
}: LinkGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  const handleDeleteGroup = () => {
    if (window.confirm(`¿Estás seguro de eliminar el grupo "${group.name}" y todos sus enlaces?`)) {
      onDeleteGroup(group.id!);
    }
  };
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handleOpenAllLinks = () => {
    if (filteredLinks.length === 0) return;
    
    // Confirmar si hay más de 10 enlaces
    if (filteredLinks.length > 10 && !window.confirm(`¿Estás seguro de abrir ${filteredLinks.length} enlaces a la vez? Esto podría ralentizar tu navegador.`)) {
      return;
    }
    
    // Abrir todos los enlaces filtrados en nuevas pestañas
    filteredLinks.forEach(link => {
      window.open(link.url, '_blank', 'noopener,noreferrer');
      // Incrementar el contador de clics
      if (link.id) {
        onLinkClick(link.id);
      }
    });
  };
  
  // Filtrar enlaces según el término de búsqueda
  const filteredLinks = links.filter(link => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      link.title.toLowerCase().includes(term) ||
      link.description?.toLowerCase().includes(term) ||
      link.url.toLowerCase().includes(term)
    );
  });
  
  // Clasificar los enlaces (por ejemplo, por título)
  const sortedLinks = [...filteredLinks].sort((a, b) => a.title.localeCompare(b.title));
  
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-md mb-6">
      {/* Cabecera del grupo */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={toggleExpand}
            className="p-1 rounded-full hover:bg-gray-800 mr-2 text-gray-400"
            aria-label={isExpanded ? 'Contraer grupo' : 'Expandir grupo'}
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
          
          <div className="flex items-center">
            {group.icon && (
              <span className="text-xl mr-2">{group.icon}</span>
            )}
            <h3 className="text-lg font-semibold text-white">
              {group.name}
            </h3>
            <span className="ml-2 bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full">
              {links.length}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onAddLink(group.id!)}
            className="px-3 py-1 text-sm bg-green-700 text-white rounded hover:bg-green-600 focus:outline-none"
          >
            Añadir link
          </button>
          
          <button
            onClick={() => onEditGroup(group)}
            className="p-1 rounded hover:bg-gray-800 text-gray-400"
            aria-label="Editar grupo"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleDeleteGroup}
            className="p-1 rounded hover:bg-gray-800 text-gray-400"
            aria-label="Eliminar grupo"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Descripción del grupo (opcional) */}
      {group.description && isExpanded && (
        <div className="px-4 py-2 bg-gray-850 text-gray-400 text-sm border-b border-gray-800">
          {group.description}
        </div>
      )}
      
      {/* Opciones de visualización y búsqueda */}
      {isExpanded && links.length > 0 && (
        <div className="p-4 border-b border-gray-800 bg-gray-850">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar enlaces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div className="flex space-x-2 w-full sm:w-auto justify-end">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm font-medium rounded-l-md focus:z-10 focus:outline-none ${
                    viewMode === 'list' 
                      ? 'bg-green-700 text-white' 
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  }`}
                >
                  Lista
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm font-medium rounded-r-md focus:z-10 focus:outline-none ${
                    viewMode === 'grid' 
                      ? 'bg-green-700 text-white' 
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  }`}
                >
                  Cuadrícula
                </button>
              </div>
              
              <button
                onClick={handleOpenAllLinks}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-700 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Abrir todos los enlaces"
              >
                <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-1" />
                Abrir todos
              </button>
            </div>
          </div>
          
          {/* Contador de resultados */}
          <div className="mt-2 text-xs text-gray-400">
            {searchTerm ? (
              <span>
                Mostrando {filteredLinks.length} de {links.length} enlaces
                {searchTerm && ` para "${searchTerm}"`}
              </span>
            ) : (
              <span>Total: {links.length} enlaces</span>
            )}
          </div>
        </div>
      )}
      
      {/* Lista de enlaces */}
      {isExpanded && (
        <div className={`p-4 ${links.length === 0 ? 'text-center text-gray-500 py-8' : ''}`}>
          {links.length === 0 ? (
            <div>
              <p>No hay enlaces en este grupo</p>
              <button
                onClick={() => onAddLink(group.id!)}
                className="mt-2 text-green-500 hover:text-green-400 text-sm"
              >
                Añadir el primer enlace
              </button>
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No se encontraron enlaces que coincidan con "{searchTerm}"</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-blue-500 hover:text-blue-400 text-sm"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : viewMode === 'list' ? (
            <ul className="divide-y divide-gray-800">
              {sortedLinks.map(link => (
                <LinkItem
                  key={link.id}
                  link={link}
                  onEdit={() => onEditLink(link)}
                  onDelete={() => {
                    if (window.confirm(`¿Estás seguro de eliminar el enlace "${link.title}"?`)) {
                      onDeleteLink(link.id!);
                    }
                  }}
                  onClick={() => onLinkClick(link.id!)}
                />
              ))}
            </ul>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {sortedLinks.map(link => (
                <div 
                  key={link.id} 
                  className={`p-4 border rounded-lg cursor-pointer ${link.active ? 'border-gray-800 hover:border-gray-700' : 'border-gray-800 opacity-60'} hover:bg-gray-850`}
                  onClick={() => {
                    if (link.id) {
                      onLinkClick(link.id);
                      window.open(link.url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-white">
                      {link.title}
                    </h4>
                    <div className="flex space-x-1">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-gray-800 text-gray-400"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Abrir enlace en nueva pestaña"
                      >
                        <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                      </a>
                    </div>
                  </div>
                  
                  {link.description && (
                    <p className="text-gray-400 text-sm mt-2 line-clamp-2">{link.description}</p>
                  )}
                  
                  <div className="text-gray-500 text-xs mt-2 truncate">
                    {link.url}
                  </div>
                  
                  {typeof link.clicks === 'number' && (
                    <div className="mt-2">
                      <span className="text-xs bg-gray-800 px-1.5 py-0.5 rounded">
                        {link.clicks} {link.clicks === 1 ? 'clic' : 'clics'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 