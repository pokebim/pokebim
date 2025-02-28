import { useState, useEffect } from 'react';
import { getAllSuppliers } from '@/lib/supplierService';
import { getAllProducts } from '@/lib/productService';

interface Stock {
  id?: string;
  product?: string;
  language?: string;
  supplier?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  vatIncluded?: boolean;
  arrivalDate?: string;
  storeQuantity?: number;
  investmentQuantity?: number;
  storeHold?: number;
  paid?: boolean;
  totalStorePrice?: number;
  costPerPerson?: number;
  wallapopPrice?: number;
  amazonPrice?: number;
  cardmarketPrice?: number;
  approxSalePrice?: number;
  profitPerUnit?: number;
  profitPercentage?: number;
  totalProfit?: number;
  tiktokPrice?: number;
  storePrice?: number;
}

interface StockFormProps {
  onSubmit: (data: Stock) => void;
  onCancel: () => void;
  initialData?: Stock | null;
}

export default function StockForm({ onSubmit, onCancel, initialData }: StockFormProps) {
  const [formData, setFormData] = useState<Stock>({
    product: '',
    language: 'English',
    supplier: '',
    quantity: 0,
    unitPrice: 0,
    vatIncluded: false,
    arrivalDate: '',
    storeQuantity: 0,
    investmentQuantity: 0,
    storeHold: 0,
    paid: false,
    totalStorePrice: 0,
    costPerPerson: 0,
    wallapopPrice: 0,
    amazonPrice: 0,
    cardmarketPrice: 0,
    approxSalePrice: 0,
    tiktokPrice: 0,
    storePrice: 0
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState<{id: string, name: string}[]>([]);
  const [products, setProducts] = useState<{id: string, name: string}[]>([]);
  
  // Calculate derived values
  const totalPrice = (formData.quantity || 0) * (formData.unitPrice || 0);
  const profitPerUnit = (formData.approxSalePrice || 0) - (formData.unitPrice || 0);
  const profitPercentage = formData.unitPrice && formData.unitPrice > 0 
    ? ((profitPerUnit / formData.unitPrice) * 100) 
    : 0;
  const totalProfit = profitPerUnit * (formData.quantity || 0);

  // Cargar datos iniciales
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
    
    // Cargar proveedores y productos desde Firebase
    const loadData = async () => {
      try {
        // Cargar proveedores desde Firebase
        const firebaseSuppliers = await getAllSuppliers();
        console.log('FIREBASE: Loaded suppliers for stock form:', firebaseSuppliers);
        setSuppliers(firebaseSuppliers.map(supplier => ({
          id: supplier.id || '',
          name: supplier.name || 'Sin nombre'
        })));
        
        // Cargar productos desde Firebase
        const firebaseProducts = await getAllProducts();
        console.log('FIREBASE: Loaded products for stock form:', firebaseProducts);
        setProducts(firebaseProducts.map(product => ({
          id: product.id || '',
          name: product.name || 'Sin nombre'
        })));
      } catch (err) {
        console.error('Error loading data from Firebase:', err);
        setError('Error al cargar los datos de referencia desde Firebase');
      }
    };
    
    loadData();
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Include calculated values
      const dataToSubmit = {
        ...formData,
        totalPrice,
        profitPerUnit,
        profitPercentage,
        totalProfit
      };
      
      onSubmit(dataToSubmit);
    } catch (err) {
      setError('Ocurrió un error al guardar el inventario. Por favor, inténtalo de nuevo.');
      console.error('Error al enviar formulario:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-900 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-white">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="product" className="block text-sm font-bold text-white">
            Producto
          </label>
          <input
            type="text"
            id="product"
            name="product"
            value={formData.product || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
            list="product-options"
          />
          <datalist id="product-options">
            {products.map(product => (
              <option key={product.id} value={product.name} />
            ))}
          </datalist>
        </div>
        
        <div>
          <label htmlFor="language" className="block text-sm font-bold text-white">
            Idioma
          </label>
          <select
            id="language"
            name="language"
            value={formData.language || 'English'}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
          >
            <option value="English" className="text-white">English</option>
            <option value="Japanese" className="text-white">Japanese</option>
            <option value="Spanish" className="text-white">Spanish</option>
            <option value="Chinese" className="text-white">Chinese</option>
            <option value="Korean" className="text-white">Korean</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="supplier" className="block text-sm font-bold text-white">
            Proveedor
          </label>
          <input
            type="text"
            id="supplier"
            name="supplier"
            value={formData.supplier || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
            list="supplier-options"
          />
          <datalist id="supplier-options">
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.name} />
            ))}
          </datalist>
        </div>
        
        <div>
          <label htmlFor="quantity" className="block text-sm font-bold text-white">
            Cantidad
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity || 0}
            onChange={handleChange}
            min="0"
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="unitPrice" className="block text-sm font-bold text-white">
            Precio Unitario
          </label>
          <input
            type="number"
            id="unitPrice"
            name="unitPrice"
            value={formData.unitPrice || 0}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-white">
            Precio Total (Calculado)
          </label>
          <div className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-900 py-2 px-3 text-white">
            {formatCurrency(totalPrice)}
          </div>
        </div>
        
        <div className="flex items-center pt-6">
          <input
            type="checkbox"
            id="vatIncluded"
            name="vatIncluded"
            checked={formData.vatIncluded || false}
            onChange={handleChange}
            className="h-4 w-4 text-green-600 focus:ring-green-500 bg-gray-800 border-gray-700 rounded"
          />
          <label htmlFor="vatIncluded" className="ml-2 block text-sm text-white">
            IVA Incluido
          </label>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="arrivalDate" className="block text-sm font-bold text-white">
            Fecha de Llegada
          </label>
          <input
            type="date"
            id="arrivalDate"
            name="arrivalDate"
            value={formData.arrivalDate || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
          />
        </div>
        
        <div className="flex items-center pt-6">
          <input
            type="checkbox"
            id="paid"
            name="paid"
            checked={formData.paid || false}
            onChange={handleChange}
            className="h-4 w-4 text-green-600 focus:ring-green-500 bg-gray-800 border-gray-700 rounded"
          />
          <label htmlFor="paid" className="ml-2 block text-sm text-white">
            Pagado
          </label>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="storeQuantity" className="block text-sm font-bold text-white">
            Cantidad Tienda
          </label>
          <input
            type="number"
            id="storeQuantity"
            name="storeQuantity"
            value={formData.storeQuantity || 0}
            onChange={handleChange}
            min="0"
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
          />
        </div>
        
        <div>
          <label htmlFor="investmentQuantity" className="block text-sm font-bold text-white">
            Cantidad Inversión
          </label>
          <input
            type="number"
            id="investmentQuantity"
            name="investmentQuantity"
            value={formData.investmentQuantity || 0}
            onChange={handleChange}
            min="0"
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
          />
        </div>
        
        <div>
          <label htmlFor="storeHold" className="block text-sm font-bold text-white">
            Hold Tienda
          </label>
          <input
            type="number"
            id="storeHold"
            name="storeHold"
            value={formData.storeHold || 0}
            onChange={handleChange}
            min="0"
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="totalStorePrice" className="block text-sm font-bold text-white">
            Precio Total Tienda
          </label>
          <input
            type="number"
            id="totalStorePrice"
            name="totalStorePrice"
            value={formData.totalStorePrice || 0}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
          />
        </div>
        
        <div>
          <label htmlFor="costPerPerson" className="block text-sm font-bold text-white">
            Coste por Persona
          </label>
          <input
            type="number"
            id="costPerPerson"
            name="costPerPerson"
            value={formData.costPerPerson || 0}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
          />
        </div>
      </div>
      
      <hr className="border-gray-700" />
      <h3 className="text-lg font-medium text-white">Precios de Venta</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="wallapopPrice" className="block text-sm font-bold text-white">
            Precio Wallapop
          </label>
          <input
            type="number"
            id="wallapopPrice"
            name="wallapopPrice"
            value={formData.wallapopPrice || 0}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
          />
        </div>
        
        <div>
          <label htmlFor="amazonPrice" className="block text-sm font-bold text-white">
            Precio Amazon
          </label>
          <input
            type="number"
            id="amazonPrice"
            name="amazonPrice"
            value={formData.amazonPrice || 0}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
          />
        </div>
        
        <div>
          <label htmlFor="cardmarketPrice" className="block text-sm font-bold text-white">
            Precio Cardmarket
          </label>
          <input
            type="number"
            id="cardmarketPrice"
            name="cardmarketPrice"
            value={formData.cardmarketPrice || 0}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
          />
        </div>
        
        <div>
          <label htmlFor="tiktokPrice" className="block text-sm font-bold text-white">
            Precio TikTok Shop
          </label>
          <input
            type="number"
            id="tiktokPrice"
            name="tiktokPrice"
            value={formData.tiktokPrice || 0}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="storePrice" className="block text-sm font-bold text-white">
            Precio Tienda
          </label>
          <input
            type="number"
            id="storePrice"
            name="storePrice"
            value={formData.storePrice || 0}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
          />
        </div>
        
        <div>
          <label htmlFor="approxSalePrice" className="block text-sm font-bold text-white">
            Precio Venta Aproximado
          </label>
          <input
            type="number"
            id="approxSalePrice"
            name="approxSalePrice"
            value={formData.approxSalePrice || 0}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
          />
        </div>
      </div>
      
      <div className="bg-gray-800 p-4 rounded-md">
        <h3 className="text-md font-medium text-white mb-2">Cálculos de Rentabilidad</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-300">Beneficio por Unidad:</p>
            <p className={`text-lg font-semibold ${profitPerUnit > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(profitPerUnit)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-300">Porcentaje de Beneficio:</p>
            <p className={`text-lg font-semibold ${profitPercentage > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {profitPercentage.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-300">Beneficio Total:</p>
            <p className={`text-lg font-semibold ${totalProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(totalProfit)}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-600 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : initialData ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </form>
  );
} 