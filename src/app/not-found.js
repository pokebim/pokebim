export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-900 text-white">
      <h2 className="text-3xl font-bold mb-4">Página no encontrada</h2>
      <p className="text-gray-400 mb-6">Lo sentimos, la página que estás buscando no existe.</p>
      <a href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-150 ease-in-out">
        Volver al inicio
      </a>
    </div>
  );
} 