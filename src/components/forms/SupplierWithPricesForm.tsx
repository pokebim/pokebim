import React, { useState } from 'react';
import { Product } from '@/lib/productService';
import { Currency } from '@/lib/currencyConverter';
import Select2 from '@/components/ui/Select2';

interface PriceEntry {
  productId: string;
  price: number;
  currency: Currency;
  shippingCost?: number;
}

interface SupplierWithPricesFormProps {
  products: Product[];
  onSubmit: (data: {
    supplier: {
      name: string;
      country: string;
      email?: string;
      phone?: string;
      website?: string;
      notes?: string;
      region: string;
      origin?: string;
      contactName?: string;
      shippingCost?: number;
    },
    prices: PriceEntry[]
  }) => void;
  onCancel: () => void;
}

export default function SupplierWithPricesForm({ products, onSubmit, onCancel }: SupplierWithPricesFormProps) {
  const [supplierData, setSupplierData] = useState({
    name: '',
    country: '',
    email: '',
    phone: '',
    website: '',
    notes: '',
    region: 'asian',
    origin: '',
    contactName: '',
    shippingCost: ''
  });

  const [prices, setPrices] = useState<PriceEntry[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [shippingCost, setShippingCost] = useState('');

  const handleSupplierChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSupplierData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddPrice = () => {
    if (!selectedProduct || !price) return;

    setPrices(prev => [...prev, {
      productId: selectedProduct,
      price: Number(price),
      currency,
      shippingCost: shippingCost ? Number(shippingCost) : undefined
    }]);

    // Limpiar campos
    setSelectedProduct('');
    setPrice('');
    setShippingCost('');
  };

  const handleRemovePrice = (index: number) => {
    setPrices(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      supplier: {
        ...supplierData,
        shippingCost: supplierData.shippingCost ? Number(supplierData.shippingCost) : undefined
      },
      prices
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-800 p-4 rounded-md border border-gray-700">
        <h3 className="text-lg font-medium text-white mb-4">Información del Proveedor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Nombre*
            </label>
            <input
              type="text"
              name="name"
              value={supplierData.name}
              onChange={handleSupplierChange}
              required
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Región*
            </label>
            <select
              name="region"
              value={supplierData.region}
              onChange={handleSupplierChange}
              required
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            >
              <option value="asian">Asiático (Japonés/Chino/Coreano)</option>
              <option value="european">Europeo</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Origen
            </label>
            <select
              name="origin"
              value={supplierData.origin}
              onChange={handleSupplierChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            >
              <option value="">Selecciona un origen</option>
              <option value="Alibaba">Alibaba</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="Website">Sitio Web</option>
              <option value="Direct Contact">Contacto Directo</option>
              <option value="Other">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              País*
            </label>
            <input
              type="text"
              name="country"
              value={supplierData.country}
              onChange={handleSupplierChange}
              required
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={supplierData.email}
              onChange={handleSupplierChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Teléfono
            </label>
            <input
              type="tel"
              name="phone"
              value={supplierData.phone}
              onChange={handleSupplierChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Nombre de Contacto
            </label>
            <input
              type="text"
              name="contactName"
              value={supplierData.contactName}
              onChange={handleSupplierChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Sitio web
            </label>
            <input
              type="url"
              name="website"
              value={supplierData.website}
              onChange={handleSupplierChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
              placeholder="https://ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Precio de envío aproximado (EUR)
            </label>
            <input
              type="number"
              name="shippingCost"
              value={supplierData.shippingCost}
              onChange={handleSupplierChange}
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300">
              Notas
            </label>
            <textarea
              name="notes"
              value={supplierData.notes}
              onChange={handleSupplierChange}
              rows={3}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-md border border-gray-700">
        <h3 className="text-lg font-medium text-white mb-4">Añadir Precios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-300">
              Producto
            </label>
            <Select2
              options={products.map(product => ({
                value: product.id,
                label: product.name,
                details: product.language,
                imageUrl: product.imageUrl
              }))}
              value={selectedProduct}
              onChange={setSelectedProduct}
              placeholder="Seleccionar producto..."
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Precio
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Moneda
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Coste de envío
            </label>
            <input
              type="number"
              step="0.01"
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleAddPrice}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500"
        >
          Añadir Precio
        </button>

        {prices.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-medium text-white mb-2">Precios añadidos:</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Producto</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Precio</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Moneda</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Envío</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-300">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {prices.map((price, index) => {
                    const product = products.find(p => p.id === price.productId);
                    return (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-300">
                          {product?.name} ({product?.language})
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-300">{price.price}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">{price.currency}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">{price.shippingCost || '-'}</td>
                        <td className="px-4 py-2 text-sm">
                          <button
                            type="button"
                            onClick={() => handleRemovePrice(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!supplierData.name || !supplierData.country || prices.length === 0}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Guardar Todo
        </button>
      </div>
    </form>
  );
} 