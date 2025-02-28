import { useState, useEffect } from 'react';
import { convertCurrency, formatCurrency, type Currency } from '@/lib/currencyConverter';

interface Price {
  id?: string;
  price?: number;
  currency?: Currency;
  priceUnit?: string;
  bulkPrice?: number | null;
  shipping?: number | null;
  notes?: string;
  productId?: string;
  supplierId?: string;
}

interface Product {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface PriceFormProps {
  onSubmit: (data: Price) => void;
  onCancel: () => void;
  initialData?: Price;
  products?: Product[];
  suppliers?: Supplier[];
}

export default function PriceForm({ 
  onSubmit, 
  onCancel, 
  initialData,
  products = [],
  suppliers = []
}: PriceFormProps) {
  const [formData, setFormData] = useState<Price>({
    price: 0,
    currency: 'JPY',
    priceUnit: 'Per Box',
    bulkPrice: null,
    shipping: null,
    notes: '',
    productId: '',
    supplierId: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [productsList, setProductsList] = useState<Product[]>(products);
  const [suppliersList, setSuppliersList] = useState<Supplier[]>(suppliers);
  const [priceInEUR, setPriceInEUR] = useState<string>('€0.00');

  useEffect(() => {
    if (initialData) {
      // Asegurarse de que todas las propiedades tengan valores válidos
      const safeInitialData = {
        price: parseFloat(initialData.price?.toString() || '0'),
        currency: initialData.currency || 'JPY',
        priceUnit: initialData.priceUnit || 'Per Box',
        bulkPrice: initialData.bulkPrice != null ? parseFloat(initialData.bulkPrice.toString()) : null,
        shipping: initialData.shipping != null ? parseFloat(initialData.shipping.toString()) : null,
        notes: initialData.notes || '',
        productId: initialData.productId || '',
        supplierId: initialData.supplierId || ''
      };
      setFormData(safeInitialData);
    }
  }, [initialData]);
  
  useEffect(() => {
    // Cargar productos solo una vez al inicio
    if (products.length === 0 && productsList.length === 0) {
      setLoadingProducts(true);
      try {
        const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
        const formattedProducts = storedProducts.map((product: any) => ({
          id: product.id,
          name: product.name
        }));
        setProductsList(formattedProducts);
      } catch (err) {
        console.error('Error al cargar productos:', err);
        setError('Error al cargar productos: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoadingProducts(false);
      }
    } else if (products.length > 0 && productsList.length === 0) {
      setProductsList(products);
    }
    
    // Cargar proveedores solo una vez al inicio
    if (suppliers.length === 0 && suppliersList.length === 0) {
      setLoadingSuppliers(true);
      try {
        const storedSuppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
        const formattedSuppliers = storedSuppliers.map((supplier: any) => ({
          id: supplier.id,
          name: supplier.name
        }));
        setSuppliersList(formattedSuppliers);
      } catch (err) {
        console.error('Error al cargar proveedores:', err);
        setError('Error al cargar proveedores: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoadingSuppliers(false);
      }
    } else if (suppliers.length > 0 && suppliersList.length === 0) {
      setSuppliersList(suppliers);
    }
  }, []); // Solo se ejecuta una vez al montar el componente
  
  // Manejar la selección de producto/proveedor por defecto solo después de cargar datos
  useEffect(() => {
    if (productsList.length > 0 && !formData.productId && !initialData) {
      setFormData(prev => ({ ...prev, productId: productsList[0].id }));
    }
  }, [productsList, formData.productId, initialData]);
  
  useEffect(() => {
    if (suppliersList.length > 0 && !formData.supplierId && !initialData) {
      setFormData(prev => ({ ...prev, supplierId: suppliersList[0].id }));
    }
  }, [suppliersList, formData.supplierId, initialData]);
  
  // Actualizar el precio en EUR cuando cambia el precio o la moneda
  useEffect(() => {
    if (formData.price > 0) {
      const convertedPrice = convertCurrency(formData.price, formData.currency, 'EUR');
      setPriceInEUR(formatCurrency(convertedPrice, 'EUR'));
    } else {
      setPriceInEUR('€0.00');
    }
  }, [formData.price, formData.currency]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // No validation required - all fields are optional
    
    try {
      // Convertir valores numéricos
      const dataToSubmit = {
        ...formData,
        price: formData.price !== undefined ? parseFloat(formData.price.toString()) : 0,
        bulkPrice: formData.bulkPrice ? parseFloat(formData.bulkPrice.toString()) : null,
        shipping: formData.shipping ? parseFloat(formData.shipping.toString()) : null,
      };
      
      onSubmit(dataToSubmit);
    } catch (err) {
      setError('Ocurrió un error al guardar el precio. Por favor, inténtalo de nuevo.');
      console.error('Error al enviar formulario:', err);
    } finally {
      setIsSubmitting(false);
    }
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
          <label htmlFor="productId" className="block text-sm font-bold text-white">
            Producto
          </label>
          <select
            id="productId"
            name="productId"
            value={formData.productId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
            disabled={loadingProducts}
          >
            <option value="" className="text-gray-400">Selecciona un producto (opcional)</option>
            {loadingProducts ? (
              <option value="" className="text-gray-400">Cargando productos...</option>
            ) : productsList.length === 0 ? (
              <option value="" className="text-gray-400">No hay productos disponibles</option>
            ) : (
              productsList.map(product => (
                <option key={product.id} value={product.id} className="text-white">
                  {product.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label htmlFor="supplierId" className="block text-sm font-bold text-white">
            Proveedor
          </label>
          <select
            id="supplierId"
            name="supplierId"
            value={formData.supplierId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
            disabled={loadingSuppliers}
          >
            <option value="" className="text-gray-400">Selecciona un proveedor (opcional)</option>
            {loadingSuppliers ? (
              <option value="" className="text-gray-400">Cargando proveedores...</option>
            ) : suppliersList.length === 0 ? (
              <option value="" className="text-gray-400">No hay proveedores disponibles</option>
            ) : (
              suppliersList.map(supplier => (
                <option key={supplier.id} value={supplier.id} className="text-white">
                  {supplier.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-bold text-white">
            Precio
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price || ''}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
            />
          </div>
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-bold text-white">
            Moneda
          </label>
          <select
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
          >
            <option value="JPY" className="text-white">JPY (¥)</option>
            <option value="USD" className="text-white">USD ($)</option>
            <option value="EUR" className="text-white">EUR (€)</option>
            <option value="GBP" className="text-white">GBP (£)</option>
            <option value="CNY" className="text-white">CNY (¥)</option>
            <option value="KRW" className="text-white">KRW (₩)</option>
          </select>
        </div>

        <div>
          <label htmlFor="priceUnit" className="block text-sm font-bold text-white">
            Unidad de Precio
          </label>
          <select
            id="priceUnit"
            name="priceUnit"
            value={formData.priceUnit}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
          >
            <option value="Per Box" className="text-white">Por Caja</option>
            <option value="Per Pack" className="text-white">Por Pack</option>
            <option value="Per Card" className="text-white">Por Carta</option>
            <option value="Per Collection" className="text-white">Por Colección</option>
            <option value="Per Tin" className="text-white">Por Lata</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="bulkPrice" className="block text-sm font-bold text-white">
            Precio por Volumen (opcional)
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="number"
              id="bulkPrice"
              name="bulkPrice"
              value={formData.bulkPrice || ''}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Precio aplicable al comprar en cantidades grandes.
          </p>
        </div>

        <div>
          <label htmlFor="shipping" className="block text-sm font-bold text-white">
            Costo de Envío (opcional)
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="number"
              id="shipping"
              name="shipping"
              value={formData.shipping || ''}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Dejar en blanco si el envío es gratuito.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-bold text-white">
          Notas (opcional)
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white placeholder-gray-400"
          placeholder="Información adicional sobre el precio, disponibilidad, etc."
        ></textarea>
      </div>

      <div className="bg-gray-800 p-3 rounded-md text-sm mt-2">
        <p className="text-gray-300">Precio equivalente en EUR: <span className="font-medium text-white">{priceInEUR}</span></p>
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
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
} 