import { useState } from 'react';
import { LinkGroup, Link } from '@/lib/linkService';
import LinkItem from './LinkItem';
import { ChevronDownIcon, ChevronUpIcon, PencilIcon, TrashIcon } from '@heroicons/react/solid';

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
  const [isExpanded, setIsExpanded] = useState(true);
  
  const handleDeleteGroup = () => {
    if (window.confirm(`¿Estás seguro de eliminar el grupo "${group.name}" y todos sus enlaces?`)) {
      onDeleteGroup(group.id!);
    }
  };
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
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
          ) : (
            <ul className="divide-y divide-gray-800">
              {links.map(link => (
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
          )}
        </div>
      )}
    </div>
  );
} 