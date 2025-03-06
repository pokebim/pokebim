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

interface PriceEntry extends Price {
  // Campo para renderizado visual
  tempId?: string;
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
  onSubmit: (data: Price | Price[]) => void;
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
  
  // Array para almacenar múltiples precios
  const [priceEntries, setPriceEntries] = useState<PriceEntry[]>([]);
  
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

  // Función para añadir un precio a la lista
  const handleAddPrice = () => {
    // Validar datos mínimos
    if (!formData.productId || !formData.price || !formData.supplierId) {
      setError('Por favor, completa al menos el producto, proveedor y precio.');
      return;
    }

    // Verificar si ya existe este producto en la lista
    const existingIndex = priceEntries.findIndex(entry => entry.productId === formData.productId);
    
    if (existingIndex >= 0) {
      // Actualizar el precio existente
      const updatedEntries = [...priceEntries];
      updatedEntries[existingIndex] = {
        ...formData,
        tempId: Date.now().toString() // Actualizar el ID temporal para forzar re-render
      };
      setPriceEntries(updatedEntries);
    } else {
      // Añadir nuevo precio a la lista
      setPriceEntries([...priceEntries, {
        ...formData,
        tempId: Date.now().toString()
      }]);
    }

    // Resetear el producto seleccionado pero mantener el resto de los datos
    setFormData(prev => ({
      ...prev,
      productId: '',
      price: 0,
      shippingCost: 0,
      notes: ''
    }));

    // Limpiar error si existía
    setError('');
  };

  // Función para eliminar un precio de la lista
  const handleRemovePrice = (index: number) => {
    setPriceEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Si hay entradas de precios múltiples, enviar todas
      if (priceEntries.length > 0) {
        onSubmit(priceEntries);
      } else {
        // Modo tradicional con un solo precio
        onSubmit(formData);
      }
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
      
      {/* Sección de selección de proveedor - Solo se puede cambiar si no hay precios añadidos */}
      <div className="mb-6 pb-4 border-b border-gray-700">
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
          disabled={loadingSuppliers || priceEntries.length > 0}
          required
        />
        {priceEntries.length > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            Para cambiar de proveedor, elimina primero todos los precios añadidos.
          </p>
        )}
      </div>
      
      {/* Formulario para añadir un nuevo precio */}
      <div className="bg-gray-800 p-4 rounded-md border border-gray-700 mb-4">
        <h3 className="text-lg font-medium text-white mb-4">Añadir Precio</h3>
        
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
            <label htmlFor="price" className="block text-sm font-bold text-white mb-2">
              Precio
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
                required
              />
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="block rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
            {formData.price && formData.currency !== 'EUR' && (
              <p className="text-xs text-gray-400 mt-1">
                Equivalente: {priceInEUR}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label htmlFor="priceUnit" className="block text-sm font-bold text-white mb-2">
              Unidad de precio
            </label>
            <select
              id="priceUnit"
              name="priceUnit"
              value={formData.priceUnit}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
            >
              <option value="Per Box">Por Caja</option>
              <option value="Per Pack">Por Pack (múltiples cajas)</option>
              <option value="Per Piece">Por Pieza</option>
            </select>
          </div>

          {formData.priceUnit === 'Per Pack' && (
            <div>
              <label htmlFor="boxesPerPack" className="block text-sm font-bold text-white mb-2">
                Cajas por pack
              </label>
              <input
                type="number"
                id="boxesPerPack"
                name="boxesPerPack"
                value={formData.boxesPerPack || ''}
                onChange={handleChange}
                min="1"
                step="1"
                className="block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
              />
              {unitPrice && (
                <p className="text-xs text-gray-400 mt-1">
                  Precio por caja: {unitPrice}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label htmlFor="shippingCost" className="block text-sm font-bold text-white mb-2">
              Coste de envío
            </label>
            <input
              type="number"
              id="shippingCost"
              name="shippingCost"
              value={formData.shippingCost || ''}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
            />
          </div>

          <div>
            <label htmlFor="inStock" className="flex items-center text-sm font-bold text-white mt-6">
              <input
                type="checkbox"
                id="inStock"
                name="inStock"
                checked={formData.inStock}
                onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.checked }))}
                className="mr-2 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-green-500"
              />
              En stock / Disponible
            </label>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="url" className="block text-sm font-bold text-white mb-2">
            URL del producto
          </label>
          <input
            type="url"
            id="url"
            name="url"
            value={formData.url || ''}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-green-500 focus:ring-green-500 text-white"
            placeholder="https://ejemplo.com/producto"
          />
        </div>

        <div className="mt-4">
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

        <div className="mt-4">
          <button
            type="button"
            onClick={handleAddPrice}
            className="px-4 py-2 bg-indigo-700 text-white rounded hover:bg-indigo-600"
          >
            Añadir a la lista
          </button>
        </div>
      </div>

      {/* Tabla de precios añadidos */}
      {priceEntries.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-md border border-gray-700 mb-4">
          <h3 className="text-lg font-medium text-white mb-4">Precios a Guardar</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Producto</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Precio</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Unidad</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Envío</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Notas</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {priceEntries.map((entry, index) => {
                  const product = productsList.find(p => p.id === entry.productId);
                  return (
                    <tr key={entry.tempId || index}>
                      <td className="px-4 py-2 text-sm text-gray-300">
                        {product?.name} {product?.language ? `(${product.language})` : ''}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-300">
                        {entry.price} {entry.currency}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-300">
                        {entry.priceUnit}
                        {entry.priceUnit === 'Per Pack' && entry.boxesPerPack ? ` (${entry.boxesPerPack} cajas)` : ''}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-300">
                        {entry.shippingCost ? `${entry.shippingCost} ${entry.currency}` : '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-300">
                        {entry.notes && entry.notes.length > 20 
                          ? entry.notes.substring(0, 20) + '...' 
                          : entry.notes || '-'}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <button
                          type="button"
                          onClick={() => handleRemovePrice(index)}
                          className="text-red-500 hover:text-red-400"
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
          disabled={isSubmitting || (priceEntries.length === 0 && (!formData.productId || !formData.price || !formData.supplierId))}
        >
          {isSubmitting ? 'Guardando...' : initialData ? 'Actualizar' : 'Guardar Precios'}
        </button>
      </div>
    </form>
  );
} 