import { useState, useEffect } from 'react';
import { Sale, PLATFORMS } from '@/lib/salesService';
import { InventoryItem, getAllInventoryItems, updateInventoryItem } from '@/lib/inventoryService';
import { Product, getAllProducts } from '@/lib/productService';
import { MovementType, addMovement } from '@/lib/movementsService';
import Select2 from '@/components/ui/Select2';

interface SaleFormProps {
  onSubmit: (data: Partial<Sale>) => void;
  onCancel: () => void;
  initialData?: Sale | null;
}

// Opciones para vendedores
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
    netProfit: 0,
    productId: '',  // Nuevo campo para ID del producto
    inventoryItemId: ''  // Nuevo campo para ID del ítem de inventario
  });

  // Estados para productos e inventario
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [availableInventoryItems, setAvailableInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar productos e inventario
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar productos
        const productsData = await getAllProducts();
        setProducts(productsData);
        
        // Cargar inventario
        const inventoryData = await getAllInventoryItems();
        // Solo mostrar ítems con cantidad > 0
        const availableItems = inventoryData.filter(item => item.quantity > 0);
        setInventoryItems(inventoryData);
        setAvailableInventoryItems(availableItems);
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar productos e inventario');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Calcular IVA y totales
  useEffect(() => {
    if (formData.hasVAT) {
      const price = formData.price || 0;
      const vatAmount = price * 0.21; // Fijamos el IVA al 21%
      const totalWithVAT = price + vatAmount;
      
      // Calculamos el beneficio neto
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
      
      // Calculamos el beneficio neto
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

  // Cuando se selecciona un producto, buscar sus ítems de inventario disponibles
  useEffect(() => {
    if (selectedProduct) {
      const productInventoryItems = availableInventoryItems.filter(
        item => item.productId === selectedProduct.id
      );
      
      // Si hay ítems, seleccionar el primero por defecto
      if (productInventoryItems.length > 0) {
        const firstItem = productInventoryItems[0];
        setSelectedInventoryItem(firstItem);
        
        // Actualizar el formulario con los datos del ítem
        setFormData(prev => ({
          ...prev,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          inventoryItemId: firstItem.id,
          // Puedes también establecer un precio sugerido si está en los datos
        }));
      } else {
        setSelectedInventoryItem(null);
        setFormData(prev => ({
          ...prev,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          inventoryItemId: ''
        }));
      }
    }
  }, [selectedProduct, availableInventoryItems]);

  // Cargar datos iniciales si estamos editando
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        saleDate: initialData.saleDate ? new Date(initialData.saleDate) : new Date(),
        hasVAT: initialData.hasVAT !== undefined ? initialData.hasVAT : false,
        vatRate: 21
      });
      
      // Si tiene productId, buscar el producto y el ítem de inventario
      if (initialData.productId) {
        const product = products.find(p => p.id === initialData.productId);
        if (product) {
          setSelectedProduct(product);
        }
        
        if (initialData.inventoryItemId) {
          const inventoryItem = inventoryItems.find(item => item.id === initialData.inventoryItemId);
          if (inventoryItem) {
            setSelectedInventoryItem(inventoryItem);
          }
        }
      }
    }
  }, [initialData, products, inventoryItems]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleProductSelect = (selectedValue: string) => {
    const product = products.find(p => p.id === selectedValue);
    if (product) {
      setSelectedProduct(product);
    }
  };

  const handleInventoryItemSelect = (selectedValue: string) => {
    const item = inventoryItems.find(item => item.id === selectedValue);
    if (item) {
      setSelectedInventoryItem(item);
      setFormData(prev => ({
        ...prev,
        inventoryItemId: item.id
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      alert('Por favor, selecciona un producto');
      return;
    }
    
    if (!selectedInventoryItem) {
      alert('Por favor, selecciona un ítem de inventario');
      return;
    }
    
    // Verificar cantidad disponible
    if ((formData.quantity || 0) > (selectedInventoryItem.quantity || 0)) {
      alert(`No hay suficiente stock. Disponible: ${selectedInventoryItem.quantity}`);
      return;
    }
    
    // Asegurarse que no hay campos undefined antes de enviar
    const cleanedFormData = { ...formData };
    
    // Convertir todos los campos de texto que puedan ser undefined a string vacío
    ['description', 'buyer', 'productName'].forEach(field => {
      if (cleanedFormData[field as keyof typeof cleanedFormData] === undefined) {
        cleanedFormData[field as keyof typeof cleanedFormData] = '';
      }
    });
    
    // La función onSubmit del componente padre se encargará de guardar la venta
    onSubmit(cleanedFormData);
  };

  // Función para formatear opciones de producto para el Select2
  const formatProductOptions = () => {
    // Filtrar productos que tienen al menos un ítem de inventario con stock > 0
    const productsWithStock = products.filter(product => 
      availableInventoryItems.some(item => item.productId === product.id)
    );
    
    return productsWithStock.map(product => ({
      value: product.id || '',
      label: product.name || 'Producto sin nombre',
      details: product.language || ''
    }));
  };

  // Función para formatear opciones de inventario para el Select2
  const formatInventoryOptions = () => {
    if (!selectedProduct) return [];
    
    return availableInventoryItems
      .filter(item => item.productId === selectedProduct.id)
      .map(item => ({
        value: item.id || '',
        label: `${item.location || 'Sin ubicación'} - ${item.quantity} disponibles`,
        details: `Condición: ${item.condition || 'No especificada'}`
      }));
  };

  if (loading) {
    return <div className="text-center py-4 text-white">Cargando...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="productSelect" className="block text-sm font-medium text-white">
          Producto
        </label>
        <Select2
          id="productSelect"
          placeholder="Selecciona un producto"
          options={formatProductOptions()}
          value={selectedProduct?.id || ''}
          onChange={handleProductSelect}
          className="mt-1 w-full"
        />
      </div>
      
      {selectedProduct && (
        <div>
          <label htmlFor="inventoryItemSelect" className="block text-sm font-medium text-white">
            Ítem de inventario
          </label>
          <Select2
            id="inventoryItemSelect"
            placeholder="Selecciona un ítem de inventario"
            options={formatInventoryOptions()}
            value={selectedInventoryItem?.id || ''}
            onChange={handleInventoryItemSelect}
            className="mt-1 w-full"
          />
          {formatInventoryOptions().length === 0 && (
            <p className="mt-1 text-sm text-red-500">No hay stock disponible para este producto</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-white">
            Precio unitario (€)
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
            max={selectedInventoryItem?.quantity || 1}
            value={formData.quantity}
            onChange={handleChange}
            className="mt-1 block w-full p-2 bg-gray-800 border border-gray-700 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-white"
          />
          {selectedInventoryItem && (
            <p className="text-xs text-gray-400 mt-1">
              Disponible: {selectedInventoryItem.quantity}
            </p>
          )}
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