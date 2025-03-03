'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
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
import { collection, getDocs } from 'firebase/firestore/lite';
import { db } from '@/lib/firebase';
import DetailView, { DetailField, DetailGrid, DetailSection, DetailBadge, DetailLink } from '@/components/ui/DetailView';
import PriceInlineEdit from '@/components/ui/PriceInlineEdit';
import Image from 'next/image';
import ProductImage from '@/components/ui/ProductImage';
import ImageModal from '@/components/ui/ImageModal';
import { flexRender } from '@tanstack/react-table';

// Resolver el problema de inicialización utilizando un componente intermedio
// Esta técnica evita las referencias circulares y problemas de inicialización
const LazyPricesPage = () => {
  // Este componente es solo un envoltorio para cargar el contenido real
  return (
    <MainLayout>
      <div className="p-8">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="inline-block h-16 w-16 animate-spin rounded-full border-t-4 border-indigo-500 border-solid"></div>
              <p className="mt-4 text-xl text-white">Cargando...</p>
            </div>
          </div>
        }>
          <ActualPricesContent />
        </Suspense>
      </div>
    </MainLayout>
  );
};

// Exportamos el componente envoltorio, no el componente principal
// Esto rompe la dependencia circular que causa el error de 'et'
export default dynamic(() => Promise.resolve(LazyPricesPage), {
  ssr: false
});

// El resto del código permanece igual, pero dentro de un componente separado
// Definimos aquí todas las interfaces y el componente real
interface EnrichedPrice extends Price {
  product: {
    name: string;
    language: string;
    type: string;
    imageUrl?: string;
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
  productImageUrl?: string;
  bestPrice: number;
  bestPriceCurrency: Currency;
  bestPriceInEUR: number;
  supplierName: string;
  supplierCountry: string;
  supplierShippingCost: number;
}

// Verificar si estamos en el cliente
const isClient = typeof window !== 'undefined';

// Este es el componente real con toda la lógica
// Lo definimos después de LazyPricesPage para evitar problemas de inicialización
function ActualPricesContent() {
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

  // Estado para la imagen modal
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Estados para filtros
  const [filters, setFilters] = useState({
    productName: '',
    productLanguage: '',
    productType: '',
    supplierName: '',
    supplierCountry: '',
    minPrice: '',
    maxPrice: ''
  });
  
  // Obtener valores únicos para los filtros
  const uniqueLanguages = useMemo(() => {
    const languages = new Set<string>();
    prices.forEach(price => {
      if (price.product?.language) {
        languages.add(price.product.language);
      }
    });
    return Array.from(languages).sort();
  }, [prices]);
  
  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    prices.forEach(price => {
      if (price.product?.type) {
        types.add(price.product.type);
      }
    });
    return Array.from(types).sort();
  }, [prices]);
  
  const uniqueSuppliers = useMemo(() => {
    const suppliers = new Set<string>();
    prices.forEach(price => {
      if (price.supplier?.name) {
        suppliers.add(price.supplier.name);
      }
    });
    return Array.from(suppliers).sort();
  }, [prices]);
  
  const uniqueCountries = useMemo(() => {
    const countries = new Set<string>();
    prices.forEach(price => {
      if (price.supplier?.country) {
        countries.add(price.supplier.country);
      }
    });
    return Array.from(countries).sort();
  }, [prices]);
  
  // Función para manejar cambios en los filtros
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // Aplicar filtros a los precios
  const filteredPrices = useMemo(() => {
    return prices.filter(price => {
      // Filtro por nombre de producto
      if (filters.productName && !price.product.name.toLowerCase().includes(filters.productName.toLowerCase())) {
        return false;
      }
      
      // Filtro por idioma
      if (filters.productLanguage && price.product.language !== filters.productLanguage) {
        return false;
      }
      
      // Filtro por tipo de producto
      if (filters.productType && price.product.type !== filters.productType) {
        return false;
      }
      
      // Filtro por proveedor
      if (filters.supplierName && price.supplier.name !== filters.supplierName) {
        return false;
      }
      
      // Filtro por país del proveedor
      if (filters.supplierCountry && price.supplier.country !== filters.supplierCountry) {
        return false;
      }
      
      // Filtro por precio mínimo
      if (filters.minPrice && price.price < parseFloat(filters.minPrice)) {
        return false;
      }
      
      // Filtro por precio máximo
      if (filters.maxPrice && price.price > parseFloat(filters.maxPrice)) {
        return false;
      }
      
      return true;
    });
  }, [prices, filters]);
  
  // Filtrar también los mejores precios
  const filteredBestPrices = useMemo(() => {
    return bestPrices.filter(price => {
      // Filtro por nombre de producto
      if (filters.productName && !price.productName.toLowerCase().includes(filters.productName.toLowerCase())) {
        return false;
      }
      
      // Filtro por idioma
      if (filters.productLanguage && price.productLanguage !== filters.productLanguage) {
        return false;
      }
      
      // Filtro por tipo de producto
      if (filters.productType && price.productType !== filters.productType) {
        return false;
      }
      
      // Filtro por proveedor
      if (filters.supplierName && price.supplierName !== filters.supplierName) {
        return false;
      }
      
      // Filtro por país del proveedor
      if (filters.supplierCountry && price.supplierCountry !== filters.supplierCountry) {
        return false;
      }
      
      // Filtro por precio mínimo
      if (filters.minPrice && price.bestPrice < parseFloat(filters.minPrice)) {
        return false;
      }
      
      // Filtro por precio máximo
      if (filters.maxPrice && price.bestPrice > parseFloat(filters.maxPrice)) {
        return false;
      }
      
      return true;
    });
  }, [bestPrices, filters]);

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
            type: product?.type || 'N/A',
            imageUrl: product?.imageUrl || `https://via.placeholder.com/100x100?text=${encodeURIComponent(product?.name || 'Product')}`
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
  
  /**
   * Obtener el color correspondiente al idioma
   */
  const getLanguageColor = (language: string): string => {
    switch(language?.toLowerCase()) {
      case 'japanese':
        return 'red';
      case 'english':
        return 'blue';
      case 'spanish':
        return 'yellow';
      case 'french':
        return 'purple';
      case 'italian':
        return 'green';
      case 'german':
        return 'orange';
      default:
        return 'gray';
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
          productImageUrl: bestOption.price.product.imageUrl,
          bestPrice: bestOption.price.price || 0,
          bestPriceCurrency: bestOption.price.currency as Currency,
          bestPriceInEUR: bestOption.priceInEUR,
          supplierName: bestOption.price.supplier.name,
          supplierCountry: bestOption.price.supplier.country,
          supplierShippingCost: bestOption.price.supplier.shippingCost || 0
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
    columnHelper.accessor('product.imageUrl', {
      header: 'Imagen',
      cell: info => (
        <ProductImage 
          imageUrl={info.getValue()} 
          productName={info.row.original.product.name}
          size="small"
          className="max-w-[80px] max-h-[60px]"
          onClick={() => setSelectedImage(info.getValue() || '')}
        />
      ),
      size: 80,
    }),
    columnHelper.accessor('product.name', {
      header: 'Producto',
      cell: info => <span className="font-medium text-white">{info.getValue()}</span>,
      size: 200,
    }),
    columnHelper.accessor('product.language', {
      header: 'Idioma',
      cell: info => {
        const language = info.getValue();
        return (
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full bg-${getLanguageColor(language)}-500`}></div>
            <span>{language}</span>
          </div>
        );
      },
      size: 120,
    }),
    columnHelper.accessor('product.type', {
      header: 'Tipo',
      cell: info => info.getValue(),
      size: 100,
    }),
    columnHelper.accessor('supplier.name', {
      header: 'Proveedor',
      cell: info => info.getValue(),
      size: 150,
    }),
    columnHelper.accessor('supplier.country', {
      header: 'País',
      cell: info => info.getValue(),
      size: 100,
    }),
    columnHelper.accessor(row => ({ price: row.price, currency: row.currency }), {
      id: 'priceFormatted',
      header: 'Precio',
      cell: info => {
        const { price, currency } = info.getValue();
        const row = info.row.original;
        return (
          <PriceInlineEdit
            id={row.id}
            price={price || 0}
            currency={currency as Currency}
            directUpdate={true}
            onUpdate={(newPrice) => {
              // Actualizar el estado local para evitar recargar toda la tabla
              // Usamos un enfoque de referencia inmutable para minimizar los re-renderizados
              setPrices(prev => {
                // Crear un mapa para búsqueda rápida por ID
                const priceMap = new Map(prev.map(p => [p.id, p]));
                
                // Actualizar solo el precio en el mapa
                if (priceMap.has(row.id)) {
                  const updatedPrice = priceMap.get(row.id);
                  priceMap.set(row.id, { ...updatedPrice, price: newPrice });
                }
                
                // Convertir el mapa de vuelta a un array
                return Array.from(priceMap.values());
              });
            }}
          />
        );
      },
      size: 150,
    }),
    columnHelper.accessor(row => {
      const pricePerUnit = row.priceUnit === 'Per Pack' && row.boxesPerPack ? row.price / row.boxesPerPack : null;
      return { 
        price: pricePerUnit, 
        currency: row.currency,
        unit: row.priceUnit,
        boxesPerPack: row.boxesPerPack
      };
    }, {
      id: 'unitPrice',
      header: 'Precio Unitario',
      cell: info => {
        const { price, currency, unit, boxesPerPack } = info.getValue();
        
        if (unit === 'Per Pack' && boxesPerPack && price) {
        return (
            <span className="text-green-400">
              {formatCurrency(price, currency)} / caja
              <div className="text-xs text-gray-400">({boxesPerPack} cajas por pack)</div>
            </span>
          );
        }
        
        return <span className="text-gray-500">-</span>;
      },
      size: 150,
    }),
    columnHelper.accessor('supplier.shippingCost', {
      header: 'Envío',
      cell: info => {
        const shippingCost = info.getValue();
        if (shippingCost) {
          // Asumimos que el coste de envío está en la moneda del proveedor (EUR en este caso)
          return <span className="text-amber-400">{formatCurrency(shippingCost, 'EUR')}</span>;
        }
        return <span className="text-gray-500">-</span>;
      },
      size: 100,
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
    bestPriceColumnHelper.accessor('productImageUrl', {
      header: 'Imagen',
      cell: info => (
        <ProductImage 
          imageUrl={info.getValue()} 
          productName={info.row.original.productName}
          size="small"
          className="max-w-[80px] max-h-[60px]"
          onClick={() => setSelectedImage(info.getValue() || '')}
        />
      ),
      size: 80,
    }),
    bestPriceColumnHelper.accessor('productName', {
      header: 'Producto',
      cell: info => <span className="font-medium text-white">{info.getValue()}</span>,
      size: 200,
    }),
    bestPriceColumnHelper.accessor('productType', {
      header: 'Tipo',
      cell: info => info.getValue(),
      size: 100,
    }),
    bestPriceColumnHelper.accessor('productLanguage', {
      header: 'Idioma',
      cell: info => {
        const language = info.getValue();
        return (
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full bg-${getLanguageColor(language)}-500`}></div>
            <span>{language}</span>
          </div>
        );
      },
      size: 120,
    }),
    bestPriceColumnHelper.accessor('bestPrice', {
      header: 'Mejor precio',
      cell: info => {
        const price = info.getValue();
        const currency = info.row.original.bestPriceCurrency;
        return (
          <span className="text-green-400 font-medium">
            {formatCurrency(price, currency)}
          </span>
        );
      },
      size: 150,
    }),
    bestPriceColumnHelper.accessor('bestPriceInEUR', {
      header: 'Precio (EUR)',
      cell: info => (
        <span className="text-green-400 font-medium">
          {formatCurrency(info.getValue(), 'EUR')}
        </span>
      ),
      size: 150,
    }),
    bestPriceColumnHelper.accessor('supplierName', {
      header: 'Proveedor',
      cell: info => info.getValue(),
      size: 150,
    }),
    bestPriceColumnHelper.accessor('supplierCountry', {
      header: 'País',
      cell: info => info.getValue(),
      size: 100,
    }),
    // Añadir columna de envío también en tabla de mejores precios
    bestPriceColumnHelper.accessor('supplierShippingCost', {
      header: 'Envío',
      cell: info => {
        const shippingCost = info.getValue();
        if (shippingCost) {
          return <span className="text-amber-400">{formatCurrency(shippingCost, 'EUR')}</span>;
        }
        return <span className="text-gray-500">-</span>;
      },
      size: 100,
    }),
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
      
      // Mostrar resultados
      showNotification(mensaje);
    } catch (error) {
      console.error('Error running diagnostics:', error);
      showNotification('Error al ejecutar el diagnóstico: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      {/* Notificación de éxito o error */}
      {notification && notification.show && (
        <div className={`fixed top-5 right-5 p-4 rounded-md shadow-xl z-50 ${
          notification.type === 'success' ? 'bg-green-700 text-white' : 'bg-red-700 text-white'
        }`}>
          {notification.message}
        </div>
      )}
      
      {/* Modal para editar o agregar precios */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPrice(null);
        }}
        title={editingPrice ? "Editar precio" : "Añadir nuevo precio"}
      >
        <PriceForm
          products={products}
          suppliers={suppliers}
          initialData={editingPrice}
          onSubmit={handleSubmit}
          isLoading={loading}
        />
      </Modal>
      
      {/* Modal para ver detalles */}
      <Modal
        isOpen={detailViewOpen}
        onClose={() => setDetailViewOpen(false)}
        title="Detalles del precio"
      >
        {selectedPrice && (
          <DetailView>
            <DetailSection title="Información del producto">
              <DetailGrid>
                <DetailField label="Nombre" value={selectedPrice.product.name} />
                <DetailField 
                  label="Idioma" 
                  value={
                    <DetailBadge 
                      text={selectedPrice.product.language}
                      color={
                        selectedPrice.product.language === 'Japanese' ? 'red' : 
                        selectedPrice.product.language === 'English' ? 'blue' : 
                        'green'
                      } 
                    />
                  } 
                />
                <DetailField label="Tipo" value={selectedPrice.product.type} />
              </DetailGrid>
              
              {selectedPrice.product.imageUrl && (
                <div className="mt-4">
                  <ProductImage 
                    imageUrl={selectedPrice.product.imageUrl} 
                    productName={selectedPrice.product.name}
                    size="medium"
                  />
                </div>
              )}
            </DetailSection>
            
            <DetailSection title="Información del proveedor">
              <DetailGrid>
                <DetailField label="Nombre" value={selectedPrice.supplier.name} />
                <DetailField label="País" value={selectedPrice.supplier.country} />
              </DetailGrid>
            </DetailSection>
            
            <DetailSection title="Información del precio">
              <DetailGrid>
                <DetailField 
                  label="Precio" 
                  value={formatCurrency(selectedPrice.price || 0, selectedPrice.currency as Currency)} 
                />
                <DetailField 
                  label="Precio (EUR)" 
                  value={formatCurrency(
                    convertCurrency(selectedPrice.price || 0, selectedPrice.currency as Currency, 'EUR'), 
                    'EUR'
                  )} 
                />
                <DetailField 
                  label="Fecha" 
                  value={selectedPrice.date ? new Date(selectedPrice.date).toLocaleDateString() : 'N/A'} 
                />
                <DetailField label="Notas" value={selectedPrice.notes || 'N/A'} />
              </DetailGrid>
            </DetailSection>
          </DetailView>
        )}
      </Modal>
      
      {/* Modal para ampliar la imagen */}
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage}
          altText="Imagen del producto"
        />
      )}
      
      <div className="container mx-auto p-4 max-w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-200">Precios</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setEditingPrice(null);
                setModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-150 ease-in-out"
            >
              Añadir precio
            </button>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-150 ease-in-out"
            >
              Recargar datos
            </button>
            <button
              onClick={repairMissingRelations}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition duration-150 ease-in-out"
              title="Intenta reparar las relaciones entre precios, productos y proveedores"
            >
              Reparar
            </button>
            <button
              onClick={runDiagnostics}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-150 ease-in-out"
              title="Ejecutar diagnóstico de la base de datos"
            >
              Diagnóstico
            </button>
          </div>
        </div>
        
        {/* Panel de filtros */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">Filtros</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <label htmlFor="productName" className="block text-sm font-medium text-gray-300">Nombre de producto</label>
              <input
                type="text"
                id="productName"
                name="productName"
                value={filters.productName}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-900 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                placeholder="Buscar producto..."
              />
            </div>
            
            <div>
              <label htmlFor="productLanguage" className="block text-sm font-medium text-gray-300">Idioma</label>
              <select
                id="productLanguage"
                name="productLanguage"
                value={filters.productLanguage}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-900 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option value="">Todos los idiomas</option>
                {uniqueLanguages.map(language => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="productType" className="block text-sm font-medium text-gray-300">Tipo</label>
              <select
                id="productType"
                name="productType"
                value={filters.productType}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-900 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option value="">Todos los tipos</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="supplierName" className="block text-sm font-medium text-gray-300">Proveedor</label>
              <select
                id="supplierName"
                name="supplierName"
                value={filters.supplierName}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-900 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option value="">Todos los proveedores</option>
                {uniqueSuppliers.map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="supplierCountry" className="block text-sm font-medium text-gray-300">País</label>
              <select
                id="supplierCountry"
                name="supplierCountry"
                value={filters.supplierCountry}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-900 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              >
                <option value="">Todos los países</option>
                {uniqueCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="minPrice" className="block text-sm font-medium text-gray-300">Precio mínimo</label>
              <input
                type="number"
                id="minPrice"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-900 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                placeholder="Mínimo"
                min="0"
                step="any"
              />
            </div>
            
            <div>
              <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-300">Precio máximo</label>
              <input
                type="number"
                id="maxPrice"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-900 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                placeholder="Máximo"
                min="0"
                step="any"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => setFilters({
                  productName: '',
                  productLanguage: '',
                  productType: '',
                  supplierName: '',
                  supplierCountry: '',
                  minPrice: '',
                  maxPrice: ''
                })}
                className="w-full h-9 px-3 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors duration-150"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-900 p-4 rounded-md border border-red-700 text-white">
            <p>{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <p className="text-lg text-gray-400">Cargando datos...</p>
          </div>
        ) : (
          <>
            <div className="mb-12">
              <h2 className="text-xl font-semibold mb-4 text-gray-200">Mejores precios por producto</h2>
              {filteredBestPrices.length > 0 ? (
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <DataTable
                    data={filteredBestPrices}
                    columns={bestPriceColumns}
                  />
                </div>
              ) : (
                <p className="text-gray-400">No hay datos disponibles para mostrar los mejores precios.</p>
              )}
            </div>
            
            <h2 className="text-xl font-semibold mb-4 text-gray-200">Lista completa de precios</h2>
            {filteredPrices.length > 0 ? (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <DataTable
                  data={filteredPrices}
                  columns={columns}
                />
              </div>
            ) : (
              <p className="text-gray-400">No hay precios disponibles. ¡Añade algunos nuevos!</p>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
