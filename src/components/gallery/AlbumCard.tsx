import Image from 'next/image';
import Link from 'next/link';
import DefaultProductImage from '@/components/ui/DefaultProductImage';

interface AlbumCardProps {
  album: {
    id: string;
    name: string;
    coverPhotoUrl?: string;
    photoCount: number;
  };
}

export default function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link href={`/photos/albums/${album.id}`}>
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
        <div className="relative h-48">
          {album.coverPhotoUrl ? (
            <Image
              src={album.coverPhotoUrl}
              alt={album.name}
              fill
              className="object-cover"
            />
          ) : (
            <DefaultProductImage productName={album.name} />
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-white truncate">{album.name}</h3>
          <p className="text-sm text-gray-400">{album.photoCount} fotos</p>
        </div>
      </div>
    </Link>
  );
} 