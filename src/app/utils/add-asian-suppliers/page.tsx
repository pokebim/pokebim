'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { addSupplier } from '@/lib/supplierService';

export default function AddAsianSuppliersPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Proveedores japoneses
  const japaneseSuppliers = [
    {
      name: "Samurai Ken",
      region: "asian",
      country: "Japan",
      notes: "Vende en Instagram. Productos japoneses.",
      email: "",
      phone: ""
    },
    {
      name: "Junta Nakatsuka",
      region: "asian",
      country: "Japan",
      notes: "Productos japoneses, no especifica envío.",
      email: "",
      phone: ""
    },
    {
      name: "Japan Pokemon Card Expert",
      region: "asian",
      country: "Japan",
      notes: "Productos japoneses, no especifica envío.",
      email: "",
      phone: ""
    },
    {
      name: "HIRO JAPAN",
      region: "asian",
      country: "Japan",
      notes: "Productos japoneses, no especifica envío.",
      email: "",
      phone: ""
    },
    {
      name: "poke_mon_japan",
      region: "asian",
      country: "Japan",
      notes: "Productos japoneses, no especifica envío.",
      email: "",
      phone: ""
    },
    {
      name: "Yoshi",
      region: "asian",
      country: "Japan",
      notes: "Productos japoneses, no especifica envío.",
      email: "",
      phone: ""
    },
    {
      name: "Emma",
      region: "asian",
      country: "Japan",
      notes: "Productos japoneses, no especifica envío.",
      email: "",
      phone: ""
    },
    {
      name: "Pokemon.com.jp",
      region: "asian",
      country: "Japan",
      notes: "Productos japoneses y chinos, no especifica envío.",
      email: "",
      phone: ""
    },
    {
      name: "Mizuki",
      region: "asian",
      country: "Japan",
      notes: "Productos japoneses, no especifica envío.",
      email: "",
      phone: ""
    },
    {
      name: "Japanese TCG Sell and buy",
      region: "asian",
      country: "Japan",
      notes: "Productos japoneses, no especifica envío.",
      email: "",
      phone: ""
    },
    {
      name: "kyosho japanese pokemon card",
      region: "asian",
      country: "Japan",
      notes: "Productos japoneses, no especifica envío.",
      email: "",
      phone: ""
    },
    {
      name: "japanese tcg rikiya",
      region: "asian",
      country: "Japan",
      notes: "Productos japoneses, no especifica envío.",
      email: "",
      phone: ""
    },
    {
      name: "mintman",
      region: "asian",
      country: "Japan",
      notes: "Productos japoneses, no especifica envío.",
      email: "",
      phone: ""
    },
    {
      name: "tcgex",
      region: "asian",
      country: "Japan",
      notes: "Productos japoneses, no especifica envío.",
      email: "",
      phone: ""
    },
    {
      name: "takahiro",
      region: "asian",
      country: "Japan",
      notes: "Productos japoneses, no especifica envío.",
      email: "",
      phone: ""
    }
  ];

  // Proveedores coreanos
  const koreanSuppliers = [
    {
      name: "korean pokemon cards wholesaler",
      region: "asian",
      country: "Korea",
      notes: "Productos coreanos. 10% descuento 3 cajas. Precios en dólares. Es dios: Si",
      email: "",
      phone: ""
    },
    {
      name: "John Jung",
      region: "asian",
      country: "Korea",
      notes: "Productos coreanos.",
      email: "",
      phone: ""
    },
    {
      name: "Collectors Coast",
      region: "asian",
      country: "Korea",
      notes: "Productos coreanos.",
      email: "",
      phone: ""
    }
  ];

  // Proveedores chinos
  const chineseSuppliers = [
    {
      name: "Pokemon Chinese Ver",
      region: "asian",
      country: "China",
      notes: "Productos chinos.",
      email: "",
      phone: ""
    },
    {
      name: "Tina Cai",
      region: "asian",
      country: "China",
      notes: "Productos chinos. Gem Pack box 440 case / 22 unidad. Envío gratis.",
      email: "",
      phone: ""
    },
    {
      name: "Hui Zhang",
      region: "asian",
      country: "China",
      notes: "Productos chinos. Variedad china, oficiales, cajas Rayquaza. 62 por 6 cajas 1 case.",
      email: "",
      phone: ""
    },
    {
      name: "SISI Zhang (Yiwu Riheng E-Commerce Co., Ltd.)",
      region: "asian",
      country: "China",
      notes: "Productos chinos. 151 slim: 43. Gem pack: 19. 2 cases 120.",
      email: "",
      phone: ""
    },
    {
      name: "Carol Chen Zhengzhou",
      region: "asian",
      country: "China",
      notes: "Alibaba, productos chinos. Sin envío especificado.",
      email: "",
      phone: ""
    },
    {
      name: "Jiake Yiwu",
      region: "asian",
      country: "China",
      notes: "Productos chinos y japoneses.",
      email: "",
      phone: ""
    },
    {
      name: "Camin Pokemon",
      region: "asian",
      country: "China",
      notes: "Productos chinos. Precios por case.",
      email: "",
      phone: ""
    }
  ];

  // Otros proveedores asiáticos
  const otherAsianSuppliers = [
    {
      name: "Buyee",
      region: "asian",
      country: "Unknown",
      notes: "Terastal Festival: 312 + 35 envío (4 cajas, aprox 86 por caja).",
      email: "",
      phone: ""
    }
  ];

  // Función para añadir proveedores japoneses
  const handleAddJapaneseSuppliers = async () => {
    setLoading(true);
    setResults([]);
    setError('');

    try {
      const newResults: string[] = [];

      for (const supplier of japaneseSuppliers) {
        try {
          const id = await addSupplier(supplier);
          newResults.push(`✅ Proveedor japonés añadido: ${supplier.name} (ID: ${id})`);
        } catch (err) {
          console.error(`Error al añadir proveedor ${supplier.name}:`, err);
          newResults.push(`❌ Error al añadir proveedor: ${supplier.name}`);
        }
      }

      setResults(newResults);
    } catch (err) {
      console.error('Error general:', err);
      setError('Ocurrió un error al añadir proveedores japoneses');
    } finally {
      setLoading(false);
    }
  };

  // Función para añadir proveedores coreanos
  const handleAddKoreanSuppliers = async () => {
    setLoading(true);
    setResults([]);
    setError('');

    try {
      const newResults: string[] = [];

      for (const supplier of koreanSuppliers) {
        try {
          const id = await addSupplier(supplier);
          newResults.push(`✅ Proveedor coreano añadido: ${supplier.name} (ID: ${id})`);
        } catch (err) {
          console.error(`Error al añadir proveedor ${supplier.name}:`, err);
          newResults.push(`❌ Error al añadir proveedor: ${supplier.name}`);
        }
      }

      setResults(newResults);
    } catch (err) {
      console.error('Error general:', err);
      setError('Ocurrió un error al añadir proveedores coreanos');
    } finally {
      setLoading(false);
    }
  };

  // Función para añadir proveedores chinos
  const handleAddChineseSuppliers = async () => {
    setLoading(true);
    setResults([]);
    setError('');

    try {
      const newResults: string[] = [];

      for (const supplier of chineseSuppliers) {
        try {
          const id = await addSupplier(supplier);
          newResults.push(`✅ Proveedor chino añadido: ${supplier.name} (ID: ${id})`);
        } catch (err) {
          console.error(`Error al añadir proveedor ${supplier.name}:`, err);
          newResults.push(`❌ Error al añadir proveedor: ${supplier.name}`);
        }
      }

      setResults(newResults);
    } catch (err) {
      console.error('Error general:', err);
      setError('Ocurrió un error al añadir proveedores chinos');
    } finally {
      setLoading(false);
    }
  };

  // Función para añadir otros proveedores asiáticos
  const handleAddOtherAsianSuppliers = async () => {
    setLoading(true);
    setResults([]);
    setError('');

    try {
      const newResults: string[] = [];

      for (const supplier of otherAsianSuppliers) {
        try {
          const id = await addSupplier(supplier);
          newResults.push(`✅ Otro proveedor asiático añadido: ${supplier.name} (ID: ${id})`);
        } catch (err) {
          console.error(`Error al añadir proveedor ${supplier.name}:`, err);
          newResults.push(`❌ Error al añadir proveedor: ${supplier.name}`);
        }
      }

      setResults(newResults);
    } catch (err) {
      console.error('Error general:', err);
      setError('Ocurrió un error al añadir otros proveedores asiáticos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-white mb-6">Utilidad para añadir proveedores asiáticos</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Japanese Suppliers */}
            <div className="bg-gray-900 rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-medium text-white mb-4">Proveedores Japoneses</h2>
              <p className="text-gray-300 mb-4">Se añadirán {japaneseSuppliers.length} proveedores japoneses.</p>
              <button
                onClick={handleAddJapaneseSuppliers}
                disabled={loading}
                className="w-full px-4 py-2 bg-red-700 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Añadiendo...' : 'Añadir Proveedores Japoneses'}
              </button>
            </div>

            {/* Korean Suppliers */}
            <div className="bg-gray-900 rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-medium text-white mb-4">Proveedores Coreanos</h2>
              <p className="text-gray-300 mb-4">Se añadirán {koreanSuppliers.length} proveedores coreanos.</p>
              <button
                onClick={handleAddKoreanSuppliers}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Añadiendo...' : 'Añadir Proveedores Coreanos'}
              </button>
            </div>

            {/* Chinese Suppliers */}
            <div className="bg-gray-900 rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-medium text-white mb-4">Proveedores Chinos</h2>
              <p className="text-gray-300 mb-4">Se añadirán {chineseSuppliers.length} proveedores chinos.</p>
              <button
                onClick={handleAddChineseSuppliers}
                disabled={loading}
                className="w-full px-4 py-2 bg-yellow-700 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Añadiendo...' : 'Añadir Proveedores Chinos'}
              </button>
            </div>

            {/* Other Asian Suppliers */}
            <div className="bg-gray-900 rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-medium text-white mb-4">Otros Proveedores</h2>
              <p className="text-gray-300 mb-4">Se añadirán {otherAsianSuppliers.length} otros proveedores asiáticos.</p>
              <button
                onClick={handleAddOtherAsianSuppliers}
                disabled={loading}
                className="w-full px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Añadiendo...' : 'Añadir Otros Proveedores'}
              </button>
            </div>
          </div>

          {/* Results */}
          {error && (
            <div className="mt-6 p-4 bg-red-900 text-white rounded">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-6 p-4 bg-gray-800 rounded">
              <h3 className="text-lg font-medium text-white mb-2">Resultados:</h3>
              <div className="bg-gray-900 p-4 rounded overflow-auto max-h-[400px]">
                {results.map((result, i) => (
                  <div key={i} className="text-sm text-gray-300 mb-1">{result}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
} 