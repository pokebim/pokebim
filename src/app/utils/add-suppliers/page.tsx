'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { addSupplier, addMissingSupplier } from '@/lib/supplierService';

export default function AddSuppliersPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Proveedores europeos que ya tienes pero quieres añadir a Firebase
  const europeanSuppliers = [
    {
      name: "Rebel",
      region: "european",
      notes: "Preu Mig, Sol tenir Stock?",
      email: "", 
      phone: "", 
      country: "" 
    },
    {
      name: "Creative Toys",
      region: "european",
      notes: "Ya no envien a españa",
      email: "",
      phone: "",
      country: ""
    },
    {
      name: "Games Island",
      region: "european",
      notes: "",
      email: "",
      phone: "",
      country: ""
    },
    {
      name: "TCG Factory",
      region: "european",
      notes: "",
      email: "",
      phone: "",
      country: ""
    },
    {
      name: "Dispersa",
      region: "european",
      notes: "",
      email: "",
      phone: "",
      country: ""
    },
    {
      name: "Bandai",
      region: "european",
      notes: "",
      email: "",
      phone: "",
      country: ""
    },
    {
      name: "HEO",
      region: "european",
      notes: "",
      email: "",
      phone: "",
      country: ""
    },
    {
      name: "Intrafin",
      region: "european",
      notes: "Son de Magic",
      email: "",
      phone: "",
      country: ""
    }
  ];

  // Proveedores pendientes para añadir a la lista de missing suppliers
  const missingSuppliers = [
    {
      name: "Asmodee Belgica",
      email: "info_be@asmodee.com",
      emailSent: true,
      emailDate: "2024-02-24",
      responded: false,
      info: ""
    },
    {
      name: "Asmodee Nordics",
      email: "salesnordics@asmodee.com",
      emailSent: true,
      emailDate: "2024-02-24",
      responded: false,
      info: ""
    },
    {
      name: "Asmodee Netherlands",
      email: "info.nl@asmodee.com",
      emailSent: true,
      emailDate: "2024-02-24",
      responded: false,
      info: ""
    },
    {
      name: "Asmodee Czech",
      email: "export-cz@asmodee.com",
      emailSent: true,
      emailDate: "2024-02-24",
      responded: false,
      info: ""
    },
    {
      name: "Asmodee UK",
      email: "info@asmodee.co.uk",
      emailSent: true,
      emailDate: "2024-02-24",
      responded: false,
      info: "De moment no obren noves reques"
    },
    {
      name: "Kaissa",
      email: "info@kaissa.gr",
      emailSent: true,
      emailDate: "2024-02-24",
      responded: false,
      info: "De moment no obren noves reques\nDemanaven Una web"
    },
    {
      name: "International Collectibles",
      email: "ori@intlcollectibles.com",
      emailSent: true,
      emailDate: "2024-02-24",
      responded: false,
      info: ""
    },
    {
      name: "Active Gulf",
      email: "support@active-gulf.com",
      emailSent: true,
      emailDate: "2024-02-24",
      responded: false,
      info: ""
    },
    {
      name: "HEO",
      email: "Ruben.Castro@heo.com",
      emailSent: false,
      emailDate: "",
      responded: false,
      info: "Respondre al que va enviar. Demanaven una web"
    },
    {
      name: "BlackFire",
      email: "info@blackfire.eu",
      emailSent: true,
      emailDate: "2024-02-24",
      responded: false,
      info: "+49 2102 30592 0\nContact\nhttps://www.blackfire.eu/en-gb/contact-us"
    },
    {
      name: "Cees Cards",
      email: "https://ceescards.eu/contact/",
      emailSent: true,
      emailDate: "2024-02-24",
      responded: false,
      info: ""
    },
    {
      name: "4x Trading",
      email: "info@4xtrading.eu",
      emailSent: true,
      emailDate: "2024-02-24",
      responded: false,
      info: ""
    },
    {
      name: "UK pero son cheap",
      email: "support@totalcards.net",
      emailSent: true,
      emailDate: "2024-02-24",
      responded: false,
      info: ""
    }
  ];

  // Función para añadir proveedores europeos 
  const handleAddEuropeanSuppliers = async () => {
    setLoading(true);
    setResults([]);
    setError('');

    try {
      const newResults: string[] = [];

      for (const supplier of europeanSuppliers) {
        try {
          const id = await addSupplier(supplier);
          newResults.push(`✅ Proveedor europeo añadido: ${supplier.name} (ID: ${id})`);
        } catch (err) {
          console.error(`Error al añadir proveedor ${supplier.name}:`, err);
          newResults.push(`❌ Error al añadir proveedor: ${supplier.name}`);
        }
      }

      setResults(newResults);
    } catch (err) {
      console.error('Error general:', err);
      setError('Ocurrió un error al añadir proveedores europeos');
    } finally {
      setLoading(false);
    }
  };

  // Función para añadir proveedores pendientes
  const handleAddMissingSuppliers = async () => {
    setLoading(true);
    setResults([]);
    setError('');

    try {
      const newResults: string[] = [];

      for (const supplier of missingSuppliers) {
        try {
          const id = await addMissingSupplier(supplier);
          newResults.push(`✅ Proveedor pendiente añadido: ${supplier.name} (ID: ${id})`);
        } catch (err) {
          console.error(`Error al añadir proveedor pendiente ${supplier.name}:`, err);
          newResults.push(`❌ Error al añadir proveedor pendiente: ${supplier.name}`);
        }
      }

      setResults(newResults);
    } catch (err) {
      console.error('Error general:', err);
      setError('Ocurrió un error al añadir proveedores pendientes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-white mb-6">Utilidad para añadir proveedores</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* European Suppliers */}
            <div className="bg-gray-900 rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-medium text-white mb-4">Proveedores Europeos</h2>
              <p className="text-gray-300 mb-4">Se añadirán {europeanSuppliers.length} proveedores europeos (Rebel, Creative Toys, etc).</p>
              <button
                onClick={handleAddEuropeanSuppliers}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Añadiendo...' : 'Añadir Proveedores Europeos'}
              </button>
            </div>

            {/* Missing Suppliers */}
            <div className="bg-gray-900 rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-medium text-white mb-4">Proveedores Pendientes</h2>
              <p className="text-gray-300 mb-4">Se añadirán {missingSuppliers.length} proveedores pendientes (Asmodee, etc).</p>
              <button
                onClick={handleAddMissingSuppliers}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Añadiendo...' : 'Añadir Proveedores Pendientes'}
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