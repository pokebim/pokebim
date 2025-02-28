import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            PokeBim
          </Link>
        </div>
        <nav className="mt-6">
          <ul>
            <li className="px-6 py-3 hover:bg-blue-50">
              <Link href="/" className="block text-gray-700 hover:text-blue-600">
                Dashboard
              </Link>
            </li>
            <li className="px-6 py-3 hover:bg-blue-50">
              <Link href="/suppliers" className="block text-gray-700 hover:text-blue-600">
                Suppliers
              </Link>
            </li>
            <li className="px-6 py-3 hover:bg-blue-50">
              <Link href="/products" className="block text-gray-700 hover:text-blue-600">
                Products
              </Link>
            </li>
            <li className="px-6 py-3 hover:bg-blue-50">
              <Link href="/prices" className="block text-gray-700 hover:text-blue-600">
                Pricing
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-md">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-800">
              Pokémon Card Supplier Management
            </h1>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
} 