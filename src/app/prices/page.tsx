'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Modal from '@/components/ui/Modal';
import PriceForm from '@/components/forms/PriceForm';
import { formatCurrency, convertCurrency, type Currency } from '@/lib/currencyConverter';
import DataTable from '@/components/ui/DataTable';
import { createColumnHelper } from '@tanstack/react-table';
import { 
  Price, 
  getAllPrices, 
  addPrice, 
  updatePrice, 
  deletePrice 
} from '@/lib/priceService';
import { 
  Product, 
  getAllProducts, 
  updateProduct, 
  checkProductsExist 
} from '@/lib/productService';
import { 
  Supplier, 
  getAllSuppliers, 
  checkSuppliersExist 
} from '@/lib/supplierService';
import { toast } from 'react-hot-toast';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import DetailView, { DetailField, DetailGrid, DetailSection, DetailBadge, DetailLink } from '@/components/ui/DetailView';

interface EnrichedPrice extends Price {
  product: {
    name: string;
    language: string;
    type: string;
  };
  supplier: {
    name: string;
    country: string;
  };
}

interface Notification {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

// Tipo para el resumen de precios más bajos
interface BestPriceProduct {
  productId: string;
  productName: string;
  productType: string;
  productLanguage: string;
  bestPrice: number;
  bestPriceCurrency: Currency;
  bestPriceInEUR: number;
  supplierName: string;
  supplierCountry: string;
}

export default function PricesPage() {
  const [prices, setPrices] = useState<EnrichedPrice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<Notification | null>({
    show: false,
    message: '',
    type: 'success'
  });
  const [editingPrice, setEditingPrice] = useState<EnrichedPrice | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Nuevos estados para la vista detallada
  const [detailViewOpen, setDetailViewOpen] = useState<boolean>(false);
  const [selectedPrice, setSelectedPrice] = useState<EnrichedPrice | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(''); // Clear any previous errors
    try {
      console.log('FIREBASE: Iniciando carga secuencial de datos COMPLETA');
      
      // 1. Primero cargar productos y proveedores y actualizar los que faltan tipo
      let loadedData = await loadProductsAndSuppliers();
      
      // Verificar si se cargaron productos
      if (loadedData.products.length === 0) {
        console.warn('FIREBASE: No se cargaron productos en fetchData. Reintentando...');
        
        // Esperar un momento y reintentar (para dar tiempo a que se actualice el estado)
        await new Promise(resolve => setTimeout(resolve, 1000));
        loadedData = await loadProductsAndSuppliers();
        
        // Si aún no tenemos productos, mostrar error pero continuar
        if (loadedData.products.length === 0) {
          console.error('FIREBASE: Fallo al cargar productos después de múltiples intentos');
          setError('No se han podido cargar todos los productos. Algunos precios pueden mostrarse incorrectamente.');
        }
      }
      
      // 2. Obtenemos todos los precios directamente de Firebase
      const firebasePrices = await getAllPrices();
      console.log('FIREBASE: Loaded prices:', firebasePrices.length, 'precios');
      
      // 3. Enriquecer precios con datos de productos y proveedores
      await fetchPrices(loadedData.products, loadedData.suppliers);
      
      console.log('FIREBASE: Completada la carga de datos');
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos. Por favor, inténtalo de nuevo más tarde.');
      setLoading(false);
    }
  };

  const fetchPrices = async (productData: Product[] = [], supplierData: Supplier[] = []) => {
    try {
      // Obtener precios desde Firebase
      const firebasePrices = await getAllPrices();
      console.log('FIREBASE: Loaded prices:', firebasePrices.length, 'precios');
      
      // Use passed data or fall back to state
      const productsToUse = productData.length > 0 ? productData : products;
      const suppliersToUse = supplierData.length > 0 ? supplierData : suppliers;
      
      // Si no tenemos productos o proveedores, intentar cargarlos de nuevo
      if (productsToUse.length === 0 || suppliersToUse.length === 0) {
        console.warn('FIREBASE: Products or suppliers missing in fetchPrices, trying to reload them...');
        
        // Intentar cargar productos y proveedores de nuevo
        const loadedData = await loadProductsAndSuppliers();
        
        // Verificar si se cargaron correctamente
        if (loadedData.products.length === 0) {
          console.error('FIREBASE: ¡No hay productos cargados después del reintento!');
          setError('Error: No se han podido cargar los productos. Por favor, recarga la página.');
          return;
        }
        
        if (loadedData.suppliers.length === 0) {
          console.error('FIREBASE: ¡No hay proveedores cargados después del reintento!');
          setError('Error: No se han podido cargar los proveedores. Por favor, recarga la página.');
          return;
        }
        
        // Use newly loaded data
        return await fetchPrices(loadedData.products, loadedData.suppliers);
      }
      
      // Log actual data contents for debugging
      console.log('FIREBASE: Products in fetchPrices:', productsToUse.map(p => p.id));
      console.log('FIREBASE: Suppliers in fetchPrices:', suppliersToUse.map(s => s.id));
      
      // Crear mapa de productos para búsqueda rápida
      const productsMap = new Map(productsToUse.map(product => [product.id, product]));
      // Crear mapa de proveedores para búsqueda rápida
      const suppliersMap = new Map(suppliersToUse.map(supplier => [supplier.id, supplier]));
      
      // Procesar y enriquecer precios con información de productos y proveedores
      // Hacer un registro detallado de los IDs de productos y proveedores
      const productIds = firebasePrices.map(p => p.productId);
      const supplierIds = firebasePrices.map(p => p.supplierId);
      
      console.log('FIREBASE: Product IDs in prices:', productIds);
      console.log('FIREBASE: Supplier IDs in prices:', supplierIds);
      
      // Detectar y registrar discrepancias
      const missingProductIds = productIds.filter(id => id && !productsMap.has(id));
      const missingSupplierIds = supplierIds.filter(id => id && !suppliersMap.has(id));
      
      if (missingProductIds.length > 0) {
        console.warn('FIREBASE: Missing products:', missingProductIds);
      }
      
      if (missingSupplierIds.length > 0) {
        console.warn('FIREBASE: Missing suppliers:', missingSupplierIds);
      }
      
      // Enriquecer los datos de precios con información de productos y proveedores
      const enrichedPrices = firebasePrices.map((price: Price) => {
        // Usar el mapa para búsquedas más eficientes
        const product = productsMap.get(price.productId);
        const supplier = suppliersMap.get(price.supplierId);
        
        // Si no encontramos el producto/proveedor, registrarlo
        if (!product && price.productId) {
          console.log(`Producto con ID ${price.productId} no encontrado en el listado de productos disponibles`);
        }
        
        if (!supplier && price.supplierId) {
          console.log(`Proveedor con ID ${price.supplierId} no encontrado en el listado de proveedores disponibles`);
        }
        
        return {
          ...price,
          product: {
            name: product?.name || 'Producto desconocido',
            language: product?.language || 'N/A',
            type: product?.type || 'N/A'
          },
          supplier: {
            name: supplier?.name || 'Proveedor desconocido',
            country: supplier?.country || 'N/A'
          }
        };
      });
      
      // Registrar los productos/proveedores que faltan
      const unknownProducts = enrichedPrices.filter(p => p.product.name === 'Producto desconocido');
      const unknownSuppliers = enrichedPrices.filter(p => p.supplier.name === 'Proveedor desconocido');
      
      if (unknownProducts.length > 0) {
        console.warn('FIREBASE: Hay precios con productos desconocidos:', unknownProducts.length);
        console.log('IDs de productos desconocidos:', unknownProducts.map(p => p.productId));
      }
      
      if (unknownSuppliers.length > 0) {
        console.warn('FIREBASE: Hay precios con proveedores desconocidos:', unknownSuppliers.length);
        console.log('IDs de proveedores desconocidos:', unknownSuppliers.map(p => p.supplierId));
      }
      
      // Ordenar precios por fecha (más recientes primero)
      enrichedPrices.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
      
      setPrices(enrichedPrices);
      
      // Si hay productos o proveedores faltantes, mostrar un mensaje de advertencia
      if (missingProductIds.length > 0 || missingSupplierIds.length > 0) {
        setError(`Hay ${missingProductIds.length} productos y ${missingSupplierIds.length} proveedores que faltan en la base de datos. Los precios asociados se muestran como "desconocidos".`);
      }
    } catch (err) {
      console.error('Error fetching prices:', err);
      setError('No se pudieron cargar los precios. Por favor, inténtalo de nuevo más tarde.');
    }
  };

  const loadProductsAndSuppliers = async () => {
    try {
      console.log('FIREBASE: Iniciando carga de productos y proveedores');
      
      // Diagnóstico: verificar si los productos existen en Firebase
      const productsCheck = await checkProductsExist();
      if (!productsCheck.exists || productsCheck.count === 0) {
        console.error("FIREBASE DIAGNÓSTICO: No se encontraron productos en la base de datos");
        toast.error("No se encontraron productos en la base de datos");
      } else {
        console.log(`FIREBASE DIAGNÓSTICO: Se encontraron ${productsCheck.count} productos en la base de datos`);
      }
      
      // Diagnóstico: verificar si los proveedores existen en Firebase
      const suppliersCheck = await checkSuppliersExist();
      if (!suppliersCheck.exists || suppliersCheck.count === 0) {
        console.error("FIREBASE DIAGNÓSTICO: No se encontraron proveedores en la base de datos");
        toast.error("No se encontraron proveedores en la base de datos");
      } else {
        console.log(`FIREBASE DIAGNÓSTICO: Se encontraron ${suppliersCheck.count} proveedores en la base de datos`);
      }
      
      // Continuar con la carga normal
      let firebaseProducts = await getAllProducts();
      console.log('FIREBASE: Productos cargados:', firebaseProducts);
      
      // Si no hay productos después de intentar cargarlos, registrar un error detallado
      if (!Array.isArray(firebaseProducts) || firebaseProducts.length === 0) {
        console.error("FIREBASE: No se pudieron cargar productos después de los reintentos", 
          { diagnosticCheck: productsCheck, loadAttemptResult: firebaseProducts });
        setError('No se pudieron cargar los productos');
        setProducts([]);
        firebaseProducts = [];
      } else {
        setProducts(firebaseProducts);
        
        // Asegurarnos de que todos los productos tienen un campo type
        const productsWithoutType = firebaseProducts.filter(p => !p.type);
        if (productsWithoutType.length > 0) {
          console.warn(`Hay ${productsWithoutType.length} productos sin campo 'type'. Actualizando productos...`);
          await updateProductsMissingType(productsWithoutType);
          
          // Volver a cargar productos después de actualizar para asegurar datos frescos
          try {
            const updatedProducts = await getAllProducts();
            console.log('FIREBASE: Productos recargados después de actualizar:', updatedProducts.length, 'productos');
            setProducts(updatedProducts);
            firebaseProducts = updatedProducts; // Actualizar la variable local también
          } catch (updateError) {
            console.error('FIREBASE: Error al recargar productos después de actualizar:', updateError);
          }
        }
        
        // Logging detallado para depuración
        console.log('FIREBASE: Detalles de productos:', firebaseProducts.map(p => ({
          id: p.id, 
          name: p.name, 
          language: p.language,
          type: p.type
        })));
      }

      let firebaseSuppliers = await getAllSuppliers();
      console.log('FIREBASE: Proveedores cargados:', firebaseSuppliers);
      
      // Si no hay proveedores después de intentar cargarlos, registrar un error detallado
      if (!Array.isArray(firebaseSuppliers) || firebaseSuppliers.length === 0) {
        console.error("FIREBASE: No se pudieron cargar proveedores después de los reintentos", 
          { diagnosticCheck: suppliersCheck, loadAttemptResult: firebaseSuppliers });
        setError('No se pudieron cargar los proveedores');
        setSuppliers([]);
        firebaseSuppliers = [];
      } else {
        setSuppliers(firebaseSuppliers);
        
        // Logging detallado para depuración
        console.log('FIREBASE: Detalles de proveedores:', firebaseSuppliers.map(s => ({
          id: s.id, 
          name: s.name
        })));
      }

      return { products: firebaseProducts || [], suppliers: firebaseSuppliers || [] };
    } catch (error) {
      console.error('Error al cargar productos y proveedores:', error);
      setError(`Error al cargar datos: ${error.message}`);
      setProducts([]);
      setSuppliers([]);
      return { products: [], suppliers: [] };
    }
  };

  // Función para determinar el tipo de producto basado en el idioma
  const getProductType = (language: string): string => {
    switch (language) {
      case "Japanese":
        return "JPN";
      case "Korean":
        return "KOR";
      case "Chinese":
        return "CHN";
      case "English":
        return "ENG";
      default:
        return "OTHER";
    }
  };
  
  // Función para actualizar productos sin tipo
  const updateProductsMissingType = async (productsToUpdate: Product[]) => {
    let updatedCount = 0;
    let totalToUpdate = productsToUpdate.length;
    
    // Mostrar un mensaje temporal mientras se actualizan los productos
    setError(`Actualizando ${totalToUpdate} productos sin el campo 'type'. Por favor, espere...`);
    
    console.log(`Iniciando actualización de ${totalToUpdate} productos sin tipo`);
    
    try {
      // Usar un método más eficiente para actualizar múltiples productos
      const updatePromises = productsToUpdate.map(async (product) => {
        if (!product.id) return null;
        
        try {
          const type = getProductType(product.language || "Unknown");
          console.log(`Actualizando producto ${product.name} (${product.id}) con tipo: ${type}`);
          
          await updateProduct(product.id, { type });
          
          // Actualizar también el producto en memoria
          product.type = type;
          return product.id;
        } catch (error) {
          console.error(`Error actualizando producto ${product.id}:`, error);
          return null;
        }
      });
      
      // Esperar a que se completen todas las actualizaciones
      const results = await Promise.allSettled(updatePromises);
      
      // Contar cuántos se actualizaron correctamente
      updatedCount = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
      
      console.log(`Actualizados ${updatedCount} de ${totalToUpdate} productos con el campo type`);
      
      if (updatedCount === totalToUpdate) {
        setError(null); // Limpiar el mensaje de error si todo se actualizó
        return true;
      } else {
        setError(`Se actualizaron ${updatedCount} de ${totalToUpdate} productos. Algunos productos no pudieron ser actualizados.`);
        return false;
      }
    } catch (error) {
      console.error('Error masivo durante la actualización de productos:', error);
      setError(`Error durante la actualización de productos: ${error.message}`);
      return false;
    }
  };

  const handleEdit = (price: EnrichedPrice) => {
    setEditingPrice(price);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // Eliminar precio de Firebase
      await deletePrice(id);
      console.log(`FIREBASE: Deleted price ${id}`);
      
      // Actualizar el estado local
      setPrices(prev => prev.filter(price => price.id !== id));
      
      // Mostrar notificación
      showNotification('Precio eliminado con éxito');
    } catch (error) {
      console.error('Error deleting price:', error);
      showNotification('Error al eliminar el precio', 'error');
    }
  };

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    try {
      // Encontrar el producto y proveedor seleccionados
      const selectedProduct = products.find(p => p.id === formData.productId) || { 
        name: 'Producto desconocido', 
        language: 'N/A', 
        type: 'N/A' 
      };
      
      const selectedSupplier = suppliers.find(s => s.id === formData.supplierId) || { 
        name: 'Proveedor desconocido', 
        country: 'N/A' 
      };
      
      if (editingPrice && editingPrice.id) {
        // Actualizar precio existente en Firebase
        await updatePrice(editingPrice.id, formData);
        console.log(`FIREBASE: Updated price ${editingPrice.id}`);
        
        // Actualizar estado local
        setPrices(prev => prev.map(price => {
          if (price.id === editingPrice.id) {
            return {
              ...price,
              ...formData,
              product: {
                name: selectedProduct.name || 'Producto desconocido',
                language: selectedProduct.language || 'N/A',
                type: selectedProduct.type || 'N/A'
              },
              supplier: {
                name: selectedSupplier.name || 'Proveedor desconocido',
                country: selectedSupplier.country || 'N/A'
              }
            };
          }
          return price;
        }));
        
        showNotification('Precio actualizado con éxito');
      } else {
        // Crear nuevo precio en Firebase
        const newId = await addPrice(formData);
        console.log(`FIREBASE: Added new price with ID ${newId}`);
        
        // Actualizar estado local
        const newPrice = {
          ...formData,
          id: newId,
          product: {
            name: selectedProduct.name || 'Producto desconocido',
            language: selectedProduct.language || 'N/A',
            type: selectedProduct.type || 'N/A'
          },
          supplier: {
            name: selectedSupplier.name || 'Proveedor desconocido',
            country: selectedSupplier.country || 'N/A'
          }
        };
        
        setPrices(prev => [...prev, newPrice]);
        
        showNotification('Precio añadido con éxito');
      }
      
      // Cerrar modal y limpiar estado de edición
      setModalOpen(false);
      setEditingPrice(null);
      setLoading(false);
    } catch (error) {
      console.error('Error submitting price:', error);
      showNotification('Error al guardar el precio', 'error');
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });
    
    setTimeout(() => {
      setNotification({
        show: false,
        message: '',
        type
      });
    }, 3000);
  };

  // Calcular los productos con los precios más bajos
  const bestPrices = useMemo(() => {
    // Agrupar precios por producto
    const productGroups: {[key: string]: EnrichedPrice[]} = {};
    
    prices.forEach(price => {
      if (!productGroups[price.productId]) {
        productGroups[price.productId] = [];
      }
      productGroups[price.productId].push(price);
    });
    
    // Encontrar el mejor precio para cada producto
    const bestPriceProducts: BestPriceProduct[] = [];
    
    Object.entries(productGroups).forEach(([productId, productPrices]) => {
      // Convertir todos los precios a EUR para comparar
      const pricesInEUR = productPrices.map(price => {
        const priceInEUR = convertCurrency(price.price || 0, price.currency as Currency, 'EUR');
        return {
          price,
          priceInEUR
        };
      });
      
      // Ordenar por precio en EUR (de menor a mayor)
      pricesInEUR.sort((a, b) => a.priceInEUR - b.priceInEUR);
      
      // Tomar el precio más bajo
      if (pricesInEUR.length > 0) {
        const bestOption = pricesInEUR[0];
        
        bestPriceProducts.push({
          productId,
          productName: bestOption.price.product.name,
          productType: bestOption.price.product.type,
          productLanguage: bestOption.price.product.language,
          bestPrice: bestOption.price.price || 0,
          bestPriceCurrency: bestOption.price.currency as Currency,
          bestPriceInEUR: bestOption.priceInEUR,
          supplierName: bestOption.price.supplier.name,
          supplierCountry: bestOption.price.supplier.country
        });
      }
    });
    
    return bestPriceProducts;
  }, [prices]);

  // Función para abrir la vista detallada
  const handleViewDetail = (price: EnrichedPrice) => {
    setSelectedPrice(price);
    setDetailViewOpen(true);
  };

  // Preparar columnas para la tabla de precios
  const columnHelper = createColumnHelper<EnrichedPrice>();
  
  const columns = useMemo(() => [
    columnHelper.accessor('product.name', {
      header: 'Producto',
      cell: info => <span className="font-medium text-white">{info.getValue()}</span>
    }),
    columnHelper.accessor('product.language', {
      header: 'Idioma',
      cell: info => {
        const language = info.getValue();
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            language === 'Japanese' ? 'bg-red-900 text-white' : 
            language === 'English' ? 'bg-blue-900 text-white' : 
            'bg-green-900 text-white'
          }`}>
            {language}
          </span>
        );
      }
    }),
    columnHelper.accessor('supplier.name', {
      header: 'Proveedor',
      cell: info => <span className="text-gray-300">{info.getValue()}</span>
    }),
    columnHelper.accessor('supplier.country', {
      header: 'País',
      cell: info => <span className="text-gray-300">{info.getValue()}</span>
    }),
    columnHelper.accessor(row => ({ price: row.price, currency: row.currency }), {
      id: 'priceFormatted',
      header: 'Precio',
      cell: info => {
        const { price, currency } = info.getValue();
        return (
          <span className="text-gray-300">
            {formatCurrency(price || 0, currency as Currency)}
          </span>
        );
      }
    }),
    columnHelper.accessor(row => ({ price: row.price, currency: row.currency }), {
      id: 'priceEUR',
      header: 'Precio (EUR)',
      cell: info => {
        const { price, currency } = info.getValue();
        return (
          <span className="text-gray-300">
            {formatCurrency(convertCurrency(price || 0, currency as Currency, 'EUR'), 'EUR')}
          </span>
        );
      }
    }),
    columnHelper.accessor('notes', {
      header: 'Notas',
      cell: info => <span className="text-gray-300 max-w-xs truncate">{info.getValue() || '-'}</span>
    }),
    columnHelper.accessor('id', {
      header: 'Acciones',
      cell: info => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewDetail(info.row.original)}
            className="px-3 py-1 bg-indigo-700 text-white text-sm rounded hover:bg-indigo-600 transition-colors"
          >
            Ver
          </button>
          <button
            onClick={() => handleEdit(info.row.original)}
            className="px-3 py-1 bg-green-700 text-white text-sm rounded hover:bg-green-600 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => handleDelete(info.getValue())}
            className="px-3 py-1 bg-red-700 text-white text-sm rounded hover:bg-red-600 transition-colors"
          >
            Eliminar
          </button>
        </div>
      )
    })
  ], []);

  // Preparar columnas para la tabla de mejores precios
  const bestPriceColumnHelper = createColumnHelper<BestPriceProduct>();
  
  const bestPriceColumns = useMemo(() => [
    bestPriceColumnHelper.accessor('productName', {
      header: 'Producto',
      cell: info => <span className="font-medium text-white">{info.getValue()}</span>
    }),
    bestPriceColumnHelper.accessor('productLanguage', {
      header: 'Idioma',
      cell: info => {
        const language = info.getValue();
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            language === 'Japanese' ? 'bg-red-900 text-white' : 
            language === 'English' ? 'bg-blue-900 text-white' : 
            'bg-green-900 text-white'
          }`}>
            {language}
          </span>
        );
      }
    }),
    bestPriceColumnHelper.accessor('supplierName', {
      header: 'Mejor Proveedor',
      cell: info => <span className="text-gray-300">{info.getValue()}</span>
    }),
    bestPriceColumnHelper.accessor(row => ({ price: row.bestPrice, currency: row.bestPriceCurrency }), {
      id: 'bestPrice',
      header: 'Mejor Precio',
      cell: info => {
        const { price, currency } = info.getValue();
        return (
          <span className="text-green-400 font-medium">
            {formatCurrency(price, currency)}
          </span>
        );
      }
    }),
    bestPriceColumnHelper.accessor('bestPriceInEUR', {
      header: 'Precio (EUR)',
      cell: info => (
        <span className="text-green-400 font-medium">
          {formatCurrency(info.getValue(), 'EUR')}
        </span>
      )
    }),
    bestPriceColumnHelper.accessor('supplierCountry', {
      header: 'País',
      cell: info => <span className="text-gray-300">{info.getValue()}</span>
    })
  ], []);

  // Modificar la función repairMissingRelations para un mejor manejo
  const repairMissingRelations = async () => {
    if (!confirm('¿Estás seguro de que quieres intentar reparar las relaciones perdidas? Esto puede modificar la base de datos.')) {
      return;
    }
    
    setLoading(true);
    const fixedItems = [];
    const errorItems = [];
    
    try {
      // 1. Forzar la recarga completa de datos
      await fetchData();
      
      // 2. Cargar explícitamente los productos una vez más para garantizar datos frescos
      const loadedData = await loadProductsAndSuppliers();
      
      // 3. Verificar si hay productos sin tipo después de la recarga
      const productsWithoutType = loadedData.products.filter(p => !p.type);
      if (productsWithoutType.length > 0) {
        console.warn(`Aún hay ${productsWithoutType.length} productos sin campo 'type'. Actualizando...`);
        await updateProductsMissingType(productsWithoutType);
        // Recargar productos una vez más
        const updatedData = await loadProductsAndSuppliers();
        
        // Use the updated data to re-fetch prices
        await fetchPrices(updatedData.products, updatedData.suppliers);
      }
      
      // 3. Mostrar resultados
      const unknownProducts = prices.filter(p => p.product.name === 'Producto desconocido');
      const unknownSuppliers = prices.filter(p => p.supplier.name === 'Proveedor desconocido');
      
      if (unknownProducts.length === 0 && unknownSuppliers.length === 0) {
        showNotification('Todas las relaciones están correctas. No se encontraron problemas.');
      } else {
        setError(`Aún hay ${unknownProducts.length} productos y ${unknownSuppliers.length} proveedores desconocidos. Es posible que estos IDs ya no existan en la base de datos.`);
      }
    } catch (error) {
      console.error('Error repairing prices:', error);
      showNotification('Error al intentar reparar los precios: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para ejecutar diagnóstico completo
  const runDiagnostics = async () => {
    try {
      setLoading(true);
      setError("");
      
      console.log("🔍 DIAGNÓSTICO: Iniciando diagnóstico completo de Firebase");
      
      // Verificar productos
      const productsCheck = await checkProductsExist();
      const suppliersCheck = await checkSuppliersExist();
      
      let mensaje = "📊 Resultados del diagnóstico:\n";
      
      if (productsCheck.exists) {
        mensaje += `✅ Colección 'products' existe con ${productsCheck.count} documentos\n`;
      } else {
        mensaje += `❌ Colección 'products' no existe o está vacía\n`;
      }
      
      if (suppliersCheck.exists) {
        mensaje += `✅ Colección 'suppliers' existe con ${suppliersCheck.count} documentos\n`;
      } else {
        mensaje += `❌ Colección 'suppliers' no existe o está vacía\n`;
      }
      
      // Intentar cargar directamente los productos y proveedores
      try {
        const productsCol = collection(db, "products");
        const productsSnapshot = await getDocs(productsCol);
        
        mensaje += `\n📋 Primeros 3 productos encontrados:\n`;
        let count = 0;
        productsSnapshot.forEach(doc => {
          if (count < 3) {
            const data = doc.data();
            mensaje += `- ID: ${doc.id}, Nombre: ${data.name}, Tipo: ${data.type || 'sin tipo'}\n`;
            count++;
          }
        });
      } catch (error) {
        mensaje += `❌ Error al consultar productos directamente: ${error.message}\n`;
      }
      
      console.log(mensaje);
      toast.success("Diagnóstico completado. Revisa la consola para más detalles.");
      
      // Mostrar toast con resultado básico
      if (productsCheck.count > 0 && suppliersCheck.count > 0) {
        toast.success(`Se encontraron ${productsCheck.count} productos y ${suppliersCheck.count} proveedores`);
      } else {
        toast.error("No se encontraron datos suficientes en la base de datos");
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error en diagnóstico:", error);
      setError(`Error en diagnóstico: ${error.message}`);
      setLoading(false);
      toast.error("Error al ejecutar diagnóstico");
    }
  };

  return (
    <MainLayout>
      {notification?.show && (
        <div className={`fixed top-5 right-5 p-4 rounded-md shadow-xl z-50 ${
          notification.type === 'success' ? 'bg-green-700 text-white border-l-4 border-green-400' : 'bg-red-700 text-white border-l-4 border-red-400'
        } transition-opacity duration-300 ease-in-out`}>
          {notification.message}
        </div>
      )}
      
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPrice(null);
        }}
        title={editingPrice ? "Editar precio" : "Añadir nuevo precio"}
      >
        <PriceForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false);
            setEditingPrice(null);
          }}
          initialData={editingPrice}
          products={products}
          suppliers={suppliers}
        />
      </Modal>
      
      {/* Vista detallada del precio */}
      {selectedPrice && (
        <DetailView
          isOpen={detailViewOpen}
          onClose={() => setDetailViewOpen(false)}
          title={`Detalle de Precio: ${selectedPrice.product.name}`}
          actions={
            <>
              <button
                type="button"
                onClick={() => {
                  setDetailViewOpen(false);
                  setEditingPrice(selectedPrice);
                  setModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setDetailViewOpen(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cerrar
              </button>
            </>
          }
        >
          <DetailSection title="Información del Producto">
            <DetailGrid>
              <DetailField 
                label="Producto" 
                value={<span className="font-semibold">{selectedPrice.product.name}</span>} 
              />
              <DetailField 
                label="Idioma" 
                value={
                  <DetailBadge 
                    color={
                      selectedPrice.product.language === 'Japanese' ? 'red' : 
                      selectedPrice.product.language === 'English' ? 'blue' : 
                      'green'
                    }
                  >
                    {selectedPrice.product.language}
                  </DetailBadge>
                } 
              />
              <DetailField 
                label="Tipo" 
                value={selectedPrice.product.type || 'No especificado'} 
              />
            </DetailGrid>
          </DetailSection>

          <DetailSection title="Información del Proveedor">
            <DetailGrid>
              <DetailField 
                label="Proveedor" 
                value={selectedPrice.supplier.name} 
              />
              <DetailField 
                label="País" 
                value={selectedPrice.supplier.country || 'No especificado'} 
              />
            </DetailGrid>
          </DetailSection>

          <DetailSection title="Información del Precio">
            <DetailGrid>
              <DetailField 
                label="Precio" 
                value={
                  <span className="font-semibold text-lg text-green-400">
                    {formatCurrency(selectedPrice.price || 0, selectedPrice.currency as Currency)}
                  </span>
                } 
              />
              <DetailField 
                label="Precio (EUR)" 
                value={
                  <span className="font-semibold text-lg text-green-400">
                    {formatCurrency(
                      convertCurrency(selectedPrice.price || 0, selectedPrice.currency as Currency, 'EUR'), 
                      'EUR'
                    )}
                  </span>
                } 
              />
              {selectedPrice.priceUnit && (
                <DetailField 
                  label="Unidad de precio" 
                  value={selectedPrice.priceUnit} 
                />
              )}
              {selectedPrice.bulkPrice !== undefined && selectedPrice.bulkPrice !== null && (
                <DetailField 
                  label="Precio por cantidad" 
                  value={`${selectedPrice.bulkPrice} ${selectedPrice.currency}`} 
                />
              )}
              {selectedPrice.shipping !== undefined && selectedPrice.shipping !== null && (
                <DetailField 
                  label="Coste de envío" 
                  value={`${selectedPrice.shipping} ${selectedPrice.currency}`} 
                />
              )}
            </DetailGrid>
          </DetailSection>

          {selectedPrice.notes && (
            <DetailSection title="Notas">
              <p className="text-gray-300 whitespace-pre-line">{selectedPrice.notes}</p>
            </DetailSection>
          )}
        </DetailView>
      )}
      
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-semibold leading-tight text-white">
                Precios
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Gestiona los precios de tus productos Pokémon y compara entre proveedores.
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={fetchData}
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {loading ? 'Cargando...' : 'Recargar datos'}
                </button>
                
                <button
                  type="button"
                  onClick={runDiagnostics}
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-700 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Ejecutar Diagnóstico
                </button>
                
                <button
                  type="button"
                  onClick={repairMissingRelations}
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-700 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Reparar relaciones
                </button>
                
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Añadir Precio
                </button>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-900 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {loading && (
            <div className="mt-4 bg-blue-900 border-l-4 border-blue-500 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-200">Cargando datos. Por favor, espere...</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Sección de mejores precios */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-white mb-4">Mejores precios por producto</h3>
            
            {loading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : bestPrices.length === 0 ? (
              <div className="bg-gray-900 shadow rounded-lg p-6 text-center">
                <p className="text-gray-300">No hay datos de precios disponibles todavía.</p>
              </div>
            ) : (
              <div className="bg-gray-900 shadow rounded-lg p-4">
                <DataTable
                  data={bestPrices}
                  columns={bestPriceColumns}
                  searchPlaceholder="Buscar por producto o proveedor..."
                />
              </div>
            )}
          </div>
          
          {/* Tabla principal de precios */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-white mb-4">Todos los precios</h3>
            
            {loading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : prices.length === 0 ? (
              <div className="bg-gray-900 shadow rounded-lg p-6 text-center">
                <p className="text-gray-300">No hay precios registrados aún.</p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Añadir tu primer precio
                </button>
              </div>
            ) : (
              <div className="bg-gray-900 shadow rounded-lg p-2 sm:p-4 overflow-x-auto">
                <DataTable
                  data={prices}
                  columns={columns}
                  searchPlaceholder="Buscar por producto o proveedor..."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 