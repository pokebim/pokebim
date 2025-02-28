import { Link } from '@/lib/linkService';
import { ArrowTopRightOnSquareIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface LinkItemProps {
  link: Link;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

export default function LinkItem({ link, onEdit, onDelete, onClick }: LinkItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Solo procesar el clic si no fue en los botones de edición/eliminación
    if (!(e.target as HTMLElement).closest('button')) {
      onClick();
      
      // Abrir el enlace en una nueva pestaña
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  };
  
  return (
    <li 
      className={`py-3 flex items-center justify-between ${link.active ? 'opacity-100' : 'opacity-50'} cursor-pointer hover:bg-gray-850 rounded px-2 -mx-2`} 
      onClick={handleClick}
    >
      <div className="flex items-center">
        {link.icon && (
          <span className="text-lg mr-3">{link.icon}</span>
        )}
        
        <div>
          <div className="flex items-center">
            <h4 className="font-medium text-white">
              {link.title}
            </h4>
            {!link.active && (
              <span className="ml-2 text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">
                Inactivo
              </span>
            )}
          </div>
          
          {link.description && (
            <p className="text-gray-400 text-sm mt-0.5">{link.description}</p>
          )}
          
          <div className="text-gray-500 text-xs mt-1 flex items-center">
            <span className="truncate max-w-[200px]">{link.url}</span>
            {typeof link.clicks === 'number' && (
              <span className="ml-3 bg-gray-800 px-1.5 py-0.5 rounded">
                {link.clicks} {link.clicks === 1 ? 'clic' : 'clics'}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center ml-2 space-x-1">
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
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1 rounded hover:bg-gray-800 text-gray-400"
          aria-label="Editar enlace"
        >
          <PencilIcon className="h-5 w-5" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded hover:bg-gray-800 text-gray-400"
          aria-label="Eliminar enlace"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </li>
  );
} 