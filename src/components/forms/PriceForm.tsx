'use client';

import { useState, useEffect } from 'react';
import { convertCurrency, formatCurrency, type Currency } from '@/lib/currencyConverter';
import Select2 from '@/components/ui/Select2';
import { getAllProducts } from '@/lib/productService';
import { getAllSuppliers } from '@/lib/supplierService';

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
  boxesPerPack?: number | null;
  inStock?: boolean;
  url?: string;
  shippingCost?: number;
}

interface Product {
  id: string;
  name: string;
  language?: string;
  imageUrl?: string;
  type?: string;
}

interface Supplier {
  id: string;
  name: string;
  shippingCost?: number;
  country?: string;
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
    currency: 'EUR',
    priceUnit: 'Per Box',
    bulkPrice: null,
    shipping: null,
    notes: '',
    productId: '',
    supplierId: '',
    boxesPerPack: null,
    inStock: true,
    url: '',
    shippingCost: 0
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [productsList, setProductsList] = useState<Product[]>(products);
  const [suppliersList, setSuppliersList] = useState<Supplier[]>(suppliers);
  const [priceInEUR, setPriceInEUR] = useState<string>('€0.00');
  const [unitPrice, setUnitPrice] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      // Asegurarse de que todas las propiedades tengan valores válidos
      setFormData({
        ...initialData,
        price: initialData.price ?? 0,
        currency: initialData.currency || 'EUR',
        priceUnit: initialData.priceUnit || 'Per Box',
        bulkPrice: initialData.bulkPrice != null ? initialData.bulkPrice : null,
        shipping: initialData.shipping != null ? initialData.shipping : null,
        notes: initialData.notes || '',
        productId: initialData.productId || '',
        supplierId: initialData.supplierId || '',
        boxesPerPack: initialData.boxesPerPack != null ? initialData.boxesPerPack : null,
        inStock: initialData.inStock ?? true,
        url: initialData.url || '',
        shippingCost: initialData.shippingCost ?? 0
      });
    }
  }, [initialData]);
  
  useEffect(() => {
    // Cargar productos si no se proporcionaron como prop
    const loadProducts = async () => {
      if (products.length === 0 && productsList.length === 0) {
        setLoadingProducts(true);
        try {
          const fetchedProducts = await getAllProducts();
          setProductsList(fetchedProducts);
        } catch (err) {
          console.error('Error al cargar productos:', err);
          setError('Error al cargar productos: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
          setLoadingProducts(false);
        }
      } else if (products.length > 0 && productsList.length === 0) {
        setProductsList(products);
      }
    };
    
    // Cargar proveedores si no se proporcionaron como prop
    const loadSuppliers = async () => {
      if (suppliers.length === 0 && suppliersList.length === 0) {
        setLoadingSuppliers(true);
        try {
          const fetchedSuppliers = await getAllSuppliers();
          setSuppliersList(fetchedSuppliers);
        } catch (err) {
          console.error('Error al cargar proveedores:', err);
          setError('Error al cargar proveedores: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
          setLoadingSuppliers(false);
        }
      } else if (suppliers.length > 0 && suppliersList.length === 0) {
        setSuppliersList(suppliers);
      }
    };
    
    loadProducts();
    loadSuppliers();
  }, [products, suppliers, productsList.length, suppliersList.length]);
  
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

  // Calcular precio unitario cuando es Pack y se ingresa la cantidad de cajas
  useEffect(() => {
    if (formData.priceUnit === 'Per Pack' && formData.boxesPerPack && formData.boxesPerPack > 0 && formData.price) {
      const pricePerBox = formData.price / formData.boxesPerPack;
      const formatted = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: formData.currency as string,
        minimumFractionDigits: 2
      }).format(pricePerBox);
      setUnitPrice(formatted);
    } else {
      setUnitPrice('');
    }
  }, [formData.price, formData.boxesPerPack, formData.priceUnit, formData.currency]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      onSubmit(formData);
    } catch (err) {
      setError('Ocurrió un error al guardar el precio. Por favor, inténtalo de nuevo.');
      console.error('Error al enviar formulario:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convertir productos y proveedores al formato requerido por Select2
  const productOptions = productsList.map(product => ({
    value: product.id,
    label: product.name,
    details: product.language || '',
    imageUrl: product.imageUrl
  }));

  const supplierOptions = suppliersList.map(supplier => ({
    value: supplier.id,
    label: supplier.name,
    details: supplier.country || '',
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-900 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-white">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="productId" className="block text-sm font-bold text-white mb-2">
            Producto
          </label>
          <Select2
            id="productId"
            name="productId"
            options={productOptions}
            value={formData.productId || ''}
            onChange={(value) => handleSelectChange('productId', value)}
            placeholder="Selecciona un producto"
            disabled={loadingProducts}
            required
          />
        </div>

        <div>
          <label htmlFor="supplierId" className="block text-sm font-bold text-white mb-2">
            Proveedor
          </label>
          <Select2
            id="supplierId"
            name="supplierId"
            options={supplierOptions}
            value={formData.supplierId || ''}
            onChange={(value) => handleSelectChange('supplierId', value)}
            placeholder="Selecciona un proveedor"
            disabled={loadingSuppliers}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-bold text-white mb-2">
            Precio
          </label>
          <div className="flex rounded-md shadow-sm">
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price || ''}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white px-3 py-2"
              required
            />
          </div>
          {formData.price > 0 && (
            <div className="mt-1">
              <span className="text-sm text-gray-400">
                Equivale a {priceInEUR}
              </span>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-bold text-white mb-2">
            Moneda
          </label>
          <select
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white px-3 py-2"
            required
          >
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
            <option value="JPY">JPY (¥)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CNY">CNY (¥)</option>
            <option value="KRW">KRW (₩)</option>
          </select>
        </div>

        <div>
          <label htmlFor="priceUnit" className="block text-sm font-bold text-white mb-2">
            Unidad de Precio
          </label>
          <select
            id="priceUnit"
            name="priceUnit"
            value={formData.priceUnit}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white px-3 py-2"
          >
            <option value="Per Box">Por Caja</option>
            <option value="Per Pack">Por Pack</option>
            <option value="Per Card">Por Carta</option>
            <option value="Per Collection">Por Colección</option>
            <option value="Per Tin">Por Lata</option>
          </select>
        </div>
      </div>

      {/* Campo para cajas por pack, solo visible cuando la unidad es Pack */}
      {formData.priceUnit === 'Per Pack' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="boxesPerPack" className="block text-sm font-bold text-white mb-2">
              Cantidad de cajas por pack
            </label>
            <div className="flex rounded-md shadow-sm">
              <input
                type="number"
                id="boxesPerPack"
                name="boxesPerPack"
                value={formData.boxesPerPack || ''}
                onChange={handleChange}
                min="1"
                step="1"
                className="block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white px-3 py-2"
              />
            </div>
          </div>
          
          {unitPrice && (
            <div className="flex items-center">
              <span className="text-white font-medium">Precio unitario por caja: {unitPrice}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="url" className="block text-sm font-bold text-white mb-2">
            URL
          </label>
          <input
            type="url"
            id="url"
            name="url"
            value={formData.url || ''}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white px-3 py-2"
            placeholder="https://..."
          />
        </div>
        
        <div>
          <label htmlFor="shippingCost" className="block text-sm font-bold text-white mb-2">
            Coste de envío
          </label>
          <input
            type="number"
            id="shippingCost"
            name="shippingCost"
            value={formData.shippingCost ?? ''}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white px-3 py-2"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="inStock"
            name="inStock"
            checked={formData.inStock}
            onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-700 text-green-600 focus:ring-green-500"
          />
          <label htmlFor="inStock" className="ml-2 block text-sm font-bold text-white">
            Disponible en stock
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-bold text-white mb-2">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          rows={3}
          className="block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white px-3 py-2"
          placeholder="Información adicional..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-700 rounded-md bg-gray-800 text-white hover:bg-gray-700"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : initialData ? 'Actualizar' : 'Añadir'}
        </button>
      </div>
    </form>
  );
} 