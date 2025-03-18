import { useState, useEffect } from 'react';
import { Sale, PLATFORMS } from '@/lib/salesService';

interface SaleFormProps {
  onSubmit: (data: Partial<Sale>) => void;
  onCancel: () => void;
  initialData?: Sale | null;
}

const SELLERS = [
  { value: 'edmon', label: 'Edmon' },
  { value: 'albert', label: 'Albert' },
  { value: 'biel', label: 'Biel' },
  { value: 'todos', label: 'Todos' }
];

export default function SaleForm({ onSubmit, onCancel, initialData }: SaleFormProps) {
  const [formData, setFormData] = useState<Partial<Sale>>({
    productName: '',
    price: 0,
    soldBy: 'edmon',
    platform: 'Wallapop',
    saleDate: new Date(),
    quantity: 1,
    hasVAT: false,
    vatRate: 21,
    vatAmount: 0,
    totalWithVAT: 0,
    description: '',
    buyer: '',
    shippingCost: 0,
    platformFee: 0,
    netProfit: 0
  });

  // Calculamos el IVA y el total con IVA cuando cambia el precio o el tipo de IVA
  useEffect(() => {
    if (formData.hasVAT) {
      const price = formData.price || 0;
      const vatAmount = price * 0.21; // Fijamos el IVA al 21%
      const totalWithVAT = price + vatAmount;
      
      // Calculamos el beneficio neto (precio - comisiones - envío)
      const shippingCost = formData.shippingCost || 0;
      const platformFee = formData.platformFee || 0;
      const netProfit = totalWithVAT - shippingCost - platformFee;

      setFormData(prev => ({
        ...prev,
        vatRate: 21,
        vatAmount,
        totalWithVAT,
        netProfit
      }));
    } else {
      const price = formData.price || 0;
      
      // Calculamos el beneficio neto (precio - comisiones - envío)
      const shippingCost = formData.shippingCost || 0;
      const platformFee = formData.platformFee || 0;
      const netProfit = price - shippingCost - platformFee;

      setFormData(prev => ({
        ...prev,
        vatAmount: 0,
        totalWithVAT: price,
        netProfit
      }));
    }
  }, [formData.price, formData.hasVAT, formData.shippingCost, formData.platformFee]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        productName: initialData.productName || '',
        price: initialData.price || 0,
        soldBy: initialData.soldBy || 'edmon',
        platform: initialData.platform || 'Wallapop',
        saleDate: initialData.saleDate ? new Date(initialData.saleDate) : new Date(),
        quantity: initialData.quantity || 1,
        hasVAT: initialData.hasVAT !== undefined ? initialData.hasVAT : false,
        vatRate: 21,
        vatAmount: initialData.vatAmount || 0,
        totalWithVAT: initialData.totalWithVAT || initialData.price || 0,
        description: initialData.description || '',
        buyer: initialData.buyer || '',
        shippingCost: initialData.shippingCost || 0,
        platformFee: initialData.platformFee || 0,
        netProfit: initialData.netProfit || 0
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="productName" className="block text-sm font-medium text-white">
          Producto
        </label>
        <input
          type="text"
          id="productName"
          name="productName"
          value={formData.productName}
          onChange={handleChange}
          className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
          placeholder="Nombre del producto"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-white">
            Precio (€)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={handleChange}
            className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
          />
        </div>
        
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-white">
            Cantidad
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            min="1"
            value={formData.quantity}
            onChange={handleChange}
            className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="soldBy" className="block text-sm font-medium text-white">
            Vendido por
          </label>
          <select
            id="soldBy"
            name="soldBy"
            value={formData.soldBy}
            onChange={handleChange}
            className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
          >
            {SELLERS.map(seller => (
              <option key={seller.value} value={seller.value}>{seller.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="platform" className="block text-sm font-medium text-white">
            Plataforma
          </label>
          <select
            id="platform"
            name="platform"
            value={formData.platform}
            onChange={handleChange}
            className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
          >
            {PLATFORMS.map(platform => (
              <option key={platform} value={platform}>{platform}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="saleDate" className="block text-sm font-medium text-white">
          Fecha de venta
        </label>
        <input
          type="date"
          id="saleDate"
          name="saleDate"
          value={formData.saleDate ? new Date(formData.saleDate).toISOString().slice(0, 10) : ''}
          onChange={handleChange}
          className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
        />
      </div>

      <div>
        <label htmlFor="buyer" className="block text-sm font-medium text-white">
          Comprador
        </label>
        <input
          type="text"
          id="buyer"
          name="buyer"
          value={formData.buyer || ''}
          onChange={handleChange}
          className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
          placeholder="Nombre del comprador"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="hasVAT"
          name="hasVAT"
          checked={formData.hasVAT}
          onChange={handleChange}
          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-700 rounded"
        />
        <label htmlFor="hasVAT" className="ml-2 block text-sm text-white">
          Vendido con IVA (21%)
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="shippingCost" className="block text-sm font-medium text-white">
            Coste de envío (€)
          </label>
          <input
            type="number"
            id="shippingCost"
            name="shippingCost"
            step="0.01"
            min="0"
            value={formData.shippingCost}
            onChange={handleChange}
            className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
          />
        </div>

        <div>
          <label htmlFor="platformFee" className="block text-sm font-medium text-white">
            Comisión de plataforma (€)
          </label>
          <input
            type="number"
            id="platformFee"
            name="platformFee"
            step="0.01"
            min="0"
            value={formData.platformFee}
            onChange={handleChange}
            className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-white">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
          placeholder="Descripción del producto o detalles adicionales..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          {initialData ? 'Actualizar' : 'Añadir'}
        </button>
      </div>
    </form>
  );
} 