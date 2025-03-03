export default function DefaultProductImage({ 
  productName, 
  className = '' 
}: { 
  productName: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center w-full h-full bg-gray-800 rounded-lg ${className}`}>
      <div className="text-center p-4">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-400 truncate max-w-[200px] mx-auto">
          {productName || 'Sin imagen'}
        </p>
      </div>
    </div>
  );
} 