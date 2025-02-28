import { PhotoAlbum } from '@/lib/photoService';
import Link from 'next/link';

interface AlbumCardProps {
  album: PhotoAlbum;
  onEdit?: (album: PhotoAlbum) => void;
  onDelete?: (albumId: string) => void;
}

export default function AlbumCard({ album, onEdit, onDelete }: AlbumCardProps) {
  // Placeholder para álbumes sin imagen de portada
  const placeholderImage = 'https://via.placeholder.com/400x300/333/ddd?text=No+Image';
  
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl group">
      <Link href={`/photos/albums/${album.id}`} className="block">
        <div className="relative h-48">
          <img 
            src={album.coverPhotoUrl || placeholderImage} 
            alt={album.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Overlay con opciones */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-end justify-between p-4 opacity-0 group-hover:opacity-100">
            <div className="text-white font-bold text-lg drop-shadow-lg">
              {album.name}
            </div>
            
            <div className="flex space-x-2">
              {onEdit && (
                <button
                  onClick={(e) => { 
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(album);
                  }}
                  className="p-2 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80"
                  title="Editar álbum"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              
              {onDelete && (
                <button
                  onClick={(e) => { 
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.confirm(`¿Estás seguro de que deseas eliminar el álbum "${album.name}"?`)) {
                      onDelete(album.id!);
                    }
                  }}
                  className="p-2 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80"
                  title="Eliminar álbum"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </Link>
      
      <div className="p-4">
        <Link href={`/photos/albums/${album.id}`} className="block">
          <h3 className="text-lg font-semibold text-white hover:text-green-400 transition-colors">
            {album.name}
          </h3>
        </Link>
        
        {album.description && (
          <p className="mt-1 text-sm text-gray-400 line-clamp-2">
            {album.description}
          </p>
        )}
        
        <div className="mt-3 flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {album.photoCount || 0} {album.photoCount === 1 ? 'foto' : 'fotos'}
          </span>
          
          <span className="text-xs text-gray-500">
            {album.createdAt ? new Date(album.createdAt.seconds * 1000).toLocaleDateString() : ''}
          </span>
        </div>
      </div>
    </div>
  );
} 