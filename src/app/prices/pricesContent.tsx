'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import DefaultProductImage from '@/components/ui/DefaultProductImage';
import { getCardmarketPriceForProduct } from '@/lib/cardmarketService';

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

// El componente real con toda la lógica
export default function PricesContent() {
  const [prices, setPrices] = useState<EnrichedPrice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<EnrichedPrice | null>(null);
  const [notification, setNotification] = useState<Notification>({ show: false, message: '', type: 'success' });
  const [filters, setFilters] = useState<Filters>({
    productName: '',
    language: '',
    type: '',
    supplierName: '',
    country: '',
    minPrice: '',
    maxPrice: ''
  });
  
  // Estado para la vista detallada
  const [detailViewOpen, setDetailViewOpen] = useState<boolean>(false);
  const [selectedPrice, setSelectedPrice] = useState<EnrichedPrice | null>(null);
  
  // Estado para el modal de imagen ampliada
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  
  // Estado para la tabla de mejores precios
  const [showBestPrices, setShowBestPrices] = useState(false);
  const [bestPrices, setBestPrices] = useState<BestPriceProduct[]>([]);
  
  // Estado para tracking de carga de precios de Cardmarket
  const [loadingCardmarketPrices, setLoadingCardmarketPrices] = useState(false);
  const [cardmarketPricesStatus, setCardmarketPricesStatus] = useState({ loaded: 0, total: 0 });
  
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
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Aplicar filtros a los precios
  const filteredPrices = useMemo(() => {
    return prices.filter(price => {
      // Filtro por nombre de producto
      if (filters.productName && 
          !price.product?.name.toLowerCase().includes(filters.productName.toLowerCase())) {
        return false;
      }
      
      // Filtro por idioma
      if (filters.language && price.product?.language !== filters.language) {
        return false;
      }
      
      // Filtro por tipo
      if (filters.type && price.product?.type !== filters.type) {
        return false;
      }
      
      // Filtro por nombre de proveedor
      if (filters.supplierName && 
          !price.supplier?.name.toLowerCase().includes(filters.supplierName.toLowerCase())) {
        return false;
      }
      
      // Filtro por país del proveedor
      if (filters.country && price.supplier?.country !== filters.country) {
        return false;
      }
      
      // Filtro por precio mínimo
      if (filters.minPrice && price.price < Number(filters.minPrice)) {
        return false;
      }
      
      // Filtro por precio máximo
      if (filters.maxPrice && price.price > Number(filters.maxPrice)) {
        return false;
      }
      
      return true;
    });
  }, [prices, filters]);

  // Filtrar precios para obtener el más bajo por producto, ahora aplicando los mismos filtros
  const filteredBestPricesByProduct = useMemo(() => {
    const productMap = new Map<string, BestPriceProduct>();
    
    // Primero filtramos los precios según los filtros aplicados
    const filteredPricesForBest = prices.filter(price => {
      // Filtro por nombre de producto
      if (filters.productName && 
          !price.product?.name.toLowerCase().includes(filters.productName.toLowerCase())) {
        return false;
      }
      
      // Filtro por idioma
      if (filters.language && price.product?.language !== filters.language) {
        return false;
      }
      
      // Filtro por tipo
      if (filters.type && price.product?.type !== filters.type) {
        return false;
      }
      
      // Filtro por nombre de proveedor
      if (filters.supplierName && 
          !price.supplier?.name.toLowerCase().includes(filters.supplierName.toLowerCase())) {
        return false;
      }
      
      // Filtro por país del proveedor
      if (filters.country && price.supplier?.country !== filters.country) {
        return false;
      }
      
      // Filtro por precio mínimo
      if (filters.minPrice && price.price < Number(filters.minPrice)) {
        return false;
      }
      
      // Filtro por precio máximo
      if (filters.maxPrice && price.price > Number(filters.maxPrice)) {
        return false;
      }
      
      return true;
    });
    
    // Luego obtenemos el mejor precio para cada producto
    filteredPricesForBest.forEach(price => {
      const productId = price.productId;
      const priceInEUR = convertCurrency(price.price, price.currency, 'EUR');
      
      if (!productMap.has(productId) || 
          priceInEUR < productMap.get(productId)!.bestPriceInEUR) {
        productMap.set(productId, {
          productId,
          productName: price.product?.name || 'Desconocido',
          productType: price.product?.type || 'Desconocido',
          productLanguage: price.product?.language || 'Desconocido',
          productImageUrl: price.product?.imageUrl,
          bestPrice: price.price,
          bestPriceCurrency: price.currency,
          bestPriceInEUR: priceInEUR,
          supplierName: price.supplier?.name || 'Desconocido',
          supplierCountry: price.supplier?.country || 'Desconocido',
          supplierShippingCost: price.shippingCost || 0
        });
      }
    });
    
    return Array.from(productMap.values());
  }, [prices, filters]);
  
  // Función para obtener datos
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        
        // Obtener precios, productos y proveedores
        const pricesData = await getAllPrices();
        const productsData = await getAllProducts();
        const suppliersData = await getAllSuppliers();
        
        setProducts(productsData);
        setSuppliers(suppliersData);
        
        // Enriquecer los datos de precios
        const enrichedPrices: EnrichedPrice[] = pricesData.map(price => {
          const product = productsData.find(p => p.id === price.productId);
          const supplier = suppliersData.find(s => s.id === price.supplierId);
          
          return {
            ...price,
            product: product ? {
              name: product.name,
              language: product.language,
              type: product.type,
              imageUrl: product.imageUrl
            } : {
              name: 'Producto desconocido',
              language: 'Desconocido',
              type: 'Desconocido'
            },
            supplier: supplier ? {
              name: supplier.name,
              country: supplier.country
            } : {
              name: 'Proveedor desconocido',
              country: 'Desconocido'
            }
          };
        });
        
        setPrices(enrichedPrices);
      } catch (error) {
        console.error('Error al cargar los datos:', error);
        setError('Error al cargar los datos. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrices();
  }, []);
  
  // Efecto para cargar los precios de Cardmarket para cada producto
  useEffect(() => {
    const loadCardmarketPrices = async () => {
      if (prices.length === 0 || !products.length) return;
      
      setLoadingCardmarketPrices(true);
      const updatedProducts = [...products];
      
      try {
        // Primero creamos un array de promesas para cada precio (máximo 5 a la vez para no sobrecargar)
        const uniqueProductIds = [...new Set(prices.map(price => price.productId).filter(Boolean))];
        
        // Inicializar el estado de carga
        setCardmarketPricesStatus({ loaded: 0, total: uniqueProductIds.length });
        
        // Definimos una función para procesar lotes de promesas
        const processBatch = async (productIds: string[]) => {
          console.log(`Cargando lote de ${productIds.length} precios de Cardmarket`);
          
          // Procesar uno por uno con un retraso entre cada uno para evitar exceder la cuota
          for (const productId of productIds) {
            try {
              const cardmarketPrice = await getCardmarketPriceForProduct(productId);
              
              // Si encontramos un precio, actualizar el producto correspondiente
              if (cardmarketPrice) {
                const productIndex = updatedProducts.findIndex(p => p.id === productId);
                if (productIndex !== -1) {
                  updatedProducts[productIndex] = {
                    ...updatedProducts[productIndex],
                    cardmarketPrice: cardmarketPrice.price,
                    lastPriceUpdate: cardmarketPrice.updatedAt,
                    cardmarketUrl: cardmarketPrice.url
                  };
                }
              }
              
              // Incrementar contador de precios cargados
              setCardmarketPricesStatus(prev => ({ 
                ...prev, 
                loaded: prev.loaded + 1 
              }));
              
              // Actualizar los productos después de cada carga para ver resultados inmediatos
              setProducts([...updatedProducts]);
              
              // Esperar 300ms entre cada solicitud para no sobrecargar Firebase
              await new Promise(resolve => setTimeout(resolve, 300));
              
            } catch (error) {
              console.error(`Error al cargar precio para ${productId}:`, error);
              // Incrementar contador aún en caso de error
              setCardmarketPricesStatus(prev => ({ 
                ...prev, 
                loaded: prev.loaded + 1 
              }));
            }
          }
        };
        
        // Dividir los IDs en lotes más pequeños (5 en lugar de 20) para procesar
        const batchSize = 5;
        for (let i = 0; i < uniqueProductIds.length; i += batchSize) {
          const batch = uniqueProductIds.slice(i, i + batchSize);
          await processBatch(batch);
          
          // Pausa entre lotes para evitar sobrecargar Firebase
          if (i + batchSize < uniqueProductIds.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // Actualizar el estado final
        setProducts(updatedProducts);
      } catch (error) {
        console.error("Error al cargar precios de Cardmarket:", error);
      } finally {
        setLoadingCardmarketPrices(false);
      }
    };
    
    loadCardmarketPrices();
  }, [prices]);
  
  // Efecto para calcular los mejores precios
  useEffect(() => {
    // Solo calcular si tenemos precios
    if (prices.length === 0) return;
    
    // Agrupar precios por producto
    const pricesByProduct = {};
    prices.forEach(price => {
      if (!price.productId) return;
      
      if (!pricesByProduct[price.productId]) {
        pricesByProduct[price.productId] = [];
      }
      pricesByProduct[price.productId].push(price);
    });
    
    // Para cada producto, encontrar el precio más bajo
    const bestPricesArray: BestPriceProduct[] = [];
    
    Object.keys(pricesByProduct).forEach(productId => {
      const productPrices = pricesByProduct[productId];
      if (productPrices.length === 0) return;
      
      // Ordenar por precio en EUR de menor a mayor
      productPrices.sort((a, b) => {
        const aEUR = convertCurrency(a.price, a.currency, 'EUR');
        const bEUR = convertCurrency(b.price, b.currency, 'EUR');
        return aEUR - bEUR;
      });
      
      // Tomar el precio más bajo
      const bestPrice = productPrices[0];
      const product = products.find(p => p.id === productId);
      const supplier = suppliers.find(s => s.id === bestPrice.supplierId);
      
      if (product && supplier) {
        bestPricesArray.push({
          productId: productId,
          productName: product.name || 'Sin nombre',
          productType: product.type || 'Desconocido',
          productLanguage: product.language || 'Desconocido',
          productImageUrl: product.imageUrl,
          bestPrice: bestPrice.price,
          bestPriceCurrency: bestPrice.currency,
          bestPriceInEUR: convertCurrency(bestPrice.price, bestPrice.currency, 'EUR'),
          supplierName: supplier.name || 'Desconocido',
          supplierCountry: supplier.country || 'Desconocido',
          supplierShippingCost: bestPrice.shippingCost || 0
        });
      }
    });
    
    // Ordenar por precio en EUR
    bestPricesArray.sort((a, b) => a.bestPriceInEUR - b.bestPriceInEUR);
    
    // Actualizar el estado
    setBestPrices(bestPricesArray);
  }, [prices, products, suppliers]);
  
  // Función para abrir el modal de edición
  const handleEdit = (price: EnrichedPrice) => {
    setEditingPrice(price);
    setModalOpen(true);
  };
  
  // Función para eliminar un precio
  const handleDelete = async (priceId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este precio?')) {
      try {
        await deletePrice(priceId);
        setPrices(prevPrices => prevPrices.filter(price => price.id !== priceId));
        showNotification('Precio eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar el precio:', error);
        showNotification('Error al eliminar el precio', 'error');
      }
    }
  };
  
  // Función para enviar formulario
  const handleSubmit = async (data: any) => {
    try {
      // Comprobar que el producto y proveedor existen antes de continuar
      const productExists = await checkProductsExist([data.productId]);
      const supplierExists = await checkSuppliersExist([data.supplierId]);
      
      if (!productExists) {
        showNotification('El producto seleccionado no existe', 'error');
        return;
      }
      
      if (!supplierExists) {
        showNotification('El proveedor seleccionado no existe', 'error');
        return;
      }
      
      if (editingPrice) {
        // Actualizar precio existente
        await updatePrice(editingPrice.id, {
          productId: data.productId,
          supplierId: data.supplierId,
          price: data.price,
          currency: data.currency,
          url: data.url,
          shippingCost: data.shippingCost,
          inStock: data.inStock,
          notes: data.notes
        });
        
        setPrices(prev => 
          prev.map(price => 
            price.id === editingPrice.id 
              ? {
                  ...price,
                  productId: data.productId,
                  supplierId: data.supplierId,
                  price: data.price,
                  currency: data.currency,
                  url: data.url,
                  shippingCost: data.shippingCost,
                  inStock: data.inStock,
                  notes: data.notes,
                  product: products.find(p => p.id === data.productId) 
                    ? {
                        name: products.find(p => p.id === data.productId)!.name,
                        language: products.find(p => p.id === data.productId)!.language,
                        type: products.find(p => p.id === data.productId)!.type,
                        imageUrl: products.find(p => p.id === data.productId)!.imageUrl
                      } 
                    : price.product,
                  supplier: suppliers.find(s => s.id === data.supplierId)
                    ? {
                        name: suppliers.find(s => s.id === data.supplierId)!.name,
                        country: suppliers.find(s => s.id === data.supplierId)!.country
                      }
                    : price.supplier
                }
              : price
          )
        );
        
        showNotification('Precio actualizado correctamente');
      } else {
        // Añadir nuevo precio
        const newPrice = await addPrice({
          productId: data.productId,
          supplierId: data.supplierId,
          price: data.price,
          currency: data.currency,
          url: data.url,
          shippingCost: data.shippingCost,
          inStock: data.inStock,
          notes: data.notes
        });
        
        const product = products.find(p => p.id === data.productId);
        const supplier = suppliers.find(s => s.id === data.supplierId);
        
        setPrices(prev => [...prev, {
          ...newPrice,
          product: product 
            ? {
                name: product.name,
                language: product.language,
                type: product.type,
                imageUrl: product.imageUrl
              } 
            : {
                name: 'Producto desconocido',
                language: 'Desconocido',
                type: 'Desconocido'
              },
          supplier: supplier
            ? {
                name: supplier.name,
                country: supplier.country
              }
            : {
                name: 'Proveedor desconocido',
                country: 'Desconocido'
              }
        }]);
        
        showNotification('Precio añadido correctamente');
      }
      
      setModalOpen(false);
      setEditingPrice(null);
    } catch (error) {
      console.error('Error al guardar el precio:', error);
      showNotification('Error al guardar el precio', 'error');
    }
  };
  
  // Mostrar notificación
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });
    
    setTimeout(() => {
      setNotification(prev => prev ? { ...prev, show: false } : null);
    }, 3000);
  };
  
  // Función para ver detalle
  const handleViewDetail = (price: EnrichedPrice) => {
    setSelectedPrice(price);
    setDetailViewOpen(true);
  };
  
  // Función para ver imagen
  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
  };
  
  // Definir columnas de la tabla
  const columnHelper = createColumnHelper<EnrichedPrice>();
  
  const columns = [
    columnHelper.display({
      id: 'image',
      header: 'Imagen',
      cell: info => {
        const imageUrl = info.row.original.product?.imageUrl;
        // Usar un key basado en el ID o URL para mantener el estado entre renderizaciones
        const key = info.row.original.id || (imageUrl ? encodeURIComponent(imageUrl) : 'no-image');
        
        return (
          <div 
            className="relative w-10 h-10 overflow-hidden flex-shrink-0" 
            onClick={() => imageUrl && handleImageClick(imageUrl)}
          >
            <div className={`absolute inset-0 flex items-center justify-center ${imageUrl ? 'cursor-pointer' : ''}`}>
              <ProductImage 
                key={key}
                src={imageUrl} 
                alt={info.row.original.product?.name || 'Producto'} 
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        );
      }
    }),
    columnHelper.accessor('product.name', {
      header: 'Producto',
      cell: info => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor('product.language', {
      header: 'Idioma',
      cell: info => info.getValue()
    }),
    columnHelper.accessor('product.type', {
      header: 'Tipo',
      cell: info => info.getValue()
    }),
    columnHelper.accessor('supplier.name', {
      header: 'Proveedor',
      cell: info => info.getValue()
    }),
    columnHelper.accessor('supplier.country', {
      header: 'País',
      cell: info => info.getValue()
    }),
    columnHelper.accessor('price', {
      header: 'Precio',
      cell: info => {
        const price = info.row.original;
        return (
          <PriceInlineEdit 
            id={price.id}
            price={price.price} 
            currency={price.currency} 
            onUpdate={async (newPrice) => {
              try {
                // Actualizar en Firebase
                await updatePrice(price.id, { price: newPrice });
                
                // Actualizar en el estado local
                setPrices(prev => 
                  prev.map(p => p.id === price.id ? { ...p, price: newPrice } : p)
                );
                
                showNotification('Precio actualizado correctamente');
              } catch (error) {
                console.error('Error al actualizar el precio:', error);
                showNotification('Error al actualizar el precio', 'error');
              }
            }}
          />
        );
      }
    }),
    columnHelper.display({
      id: 'priceInEUR',
      header: () => <div className="cursor-pointer" onClick={() => 
        setPrices(prev => [...prev].sort((a, b) => {
          const aEUR = convertCurrency(a.price, a.currency, 'EUR');
          const bEUR = convertCurrency(b.price, b.currency, 'EUR');
          return aEUR - bEUR;
        }))
      }>Precio (EUR) ↕</div>,
      cell: info => {
        const price = info.row.original;
        const priceInEUR = convertCurrency(price.price, price.currency, 'EUR');
        
        return (
          <PriceInlineEdit 
            id={price.id}
            price={priceInEUR} 
            currency={'EUR'} 
            directUpdate={false}
            onUpdate={async (newPriceEUR) => {
              try {
                // Convertir el nuevo precio en EUR a la moneda original
                const newOriginalPrice = convertCurrency(newPriceEUR, 'EUR', price.currency);
                
                // Actualizar en Firebase
                await updatePrice(price.id, { price: newOriginalPrice });
                
                // Actualizar en el estado local
                setPrices(prev => 
                  prev.map(p => p.id === price.id ? { ...p, price: newOriginalPrice } : p)
                );
                
                showNotification('Precio actualizado correctamente');
              } catch (error) {
                console.error('Error al actualizar el precio:', error);
                showNotification('Error al actualizar el precio', 'error');
              }
            }}
          />
        );
      }
    }),
    // Nueva columna para mostrar el Precio de Cardmarket
    columnHelper.display({
      id: 'cardmarketPrice',
      header: () => <div className="cursor-pointer" onClick={() => 
        setPrices(prev => [...prev].sort((a, b) => {
          // Buscar los productos
          const productA = products.find(p => p.id === a.productId);
          const productB = products.find(p => p.id === b.productId);
          
          // Valores por defecto si no se encuentran
          const priceA = productA?.cardmarketPrice || 0;
          const priceB = productB?.cardmarketPrice || 0;
          
          return priceA - priceB;
        }))
      }>
        <div className="flex items-center">
          Precio Cardmarket ↕
          {loadingCardmarketPrices && (
            <div className="flex items-center ml-2 text-xs text-gray-400">
              <svg className="w-4 h-4 animate-spin text-indigo-500 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {cardmarketPricesStatus.loaded}/{cardmarketPricesStatus.total}
            </div>
          )}
        </div>
      </div>,
      cell: info => {
        const price = info.row.original;
        // Buscar el producto usando el productId de la entrada de precios
        const product = products.find(p => p.id === price.productId);
        
        // Verificar si el producto existe y tiene precio de Cardmarket
        if (product && product.cardmarketPrice) {
          // Si tiene URL, renderizar como enlace
          if (product.cardmarketUrl) {
            return (
              <a 
                href={product.cardmarketUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:text-blue-300 hover:underline"
                title="Ver en Cardmarket"
              >
                {formatCurrency(product.cardmarketPrice, 'EUR')}
              </a>
            );
          }
          
          // Si no tiene URL, solo mostrar el precio
          return formatCurrency(product.cardmarketPrice, 'EUR');
        }
        
        return 'No disponible';
      }
    }),
    // Nueva columna para mostrar el Beneficio (Precio Cardmarket - Precio EUR)
    columnHelper.display({
      id: 'profit',
      header: () => <div className="cursor-pointer" onClick={() => 
        setPrices(prev => [...prev].sort((a, b) => {
          // Buscar los productos
          const productA = products.find(p => p.id === a.productId);
          const productB = products.find(p => p.id === b.productId);
          
          // Calcular precios en EUR
          const priceAInEUR = convertCurrency(a.price, a.currency, 'EUR');
          const priceBInEUR = convertCurrency(b.price, b.currency, 'EUR');
          
          // Calcular beneficios
          const profitA = (productA?.cardmarketPrice || 0) - priceAInEUR;
          const profitB = (productB?.cardmarketPrice || 0) - priceBInEUR;
          
          return profitB - profitA; // Ordenar de mayor a menor beneficio
        }))
      }>Beneficio ↕</div>,
      cell: info => {
        const rowData = info.row.original as unknown as BestPriceProduct;
        const productId = rowData.productId;
        const product = products.find(p => p.id === productId);
        
        // Verificar si el producto existe y tiene precio de Cardmarket
        if (product && product.cardmarketPrice) {
          const profit = product.cardmarketPrice - rowData.bestPriceInEUR;
          
          // Formatear el beneficio con signo positivo o negativo
          const isProfit = profit > 0;
          return `${formatCurrency(profit, 'EUR')} ${isProfit ? '▲' : '▼'}`;
        }
        
        return 'No disponible';
      }
    }),
    columnHelper.display({
      id: 'shippingCostEUR',
      header: 'Envío (EUR)',
      cell: info => {
        const price = info.row.original;
        const shippingInEUR = convertCurrency(price.shippingCost || 0, price.currency, 'EUR');
        return formatCurrency(shippingInEUR, 'EUR');
      }
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Acciones',
      cell: info => (
        <div className="flex space-x-2">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm"
            onClick={() => handleViewDetail(info.row.original)}
          >
            Ver
          </button>
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-sm"
            onClick={() => handleEdit(info.row.original)}
          >
            Editar
          </button>
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
            onClick={() => handleDelete(info.row.original.id)}
          >
            Eliminar
          </button>
        </div>
      )
    })
  ];

  // Renderizar tabla con mejores precios
  const bestPricesColumns = [
    columnHelper.display({
      id: 'image',
      header: 'Imagen',
      cell: info => {
        const product = info.row.original as unknown as BestPriceProduct;
        const imageUrl = product.productImageUrl;
        // Usar un key basado en el ID de producto o URL para mantener el estado entre renderizaciones
        const key = product.productId || (imageUrl ? encodeURIComponent(imageUrl) : 'no-image');
        
        return (
          <div 
            className="relative w-10 h-10 overflow-hidden flex-shrink-0" 
            onClick={() => imageUrl && handleImageClick(imageUrl)}
          >
            <div className={`absolute inset-0 flex items-center justify-center ${imageUrl ? 'cursor-pointer' : ''}`}>
              <ProductImage 
                key={key}
                src={imageUrl} 
                alt={product.productName} 
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        );
      }
    }),
    {
      id: 'productName',
      header: 'Producto',
      accessorKey: 'productName',
    },
    {
      id: 'productType',
      header: 'Tipo',
      accessorKey: 'productType',
    },
    {
      id: 'productLanguage',
      header: 'Idioma',
      accessorKey: 'productLanguage',
    },
    {
      id: 'bestPrice',
      header: () => <div className="cursor-pointer" onClick={() => 
        setBestPrices(prev => [...prev].sort((a, b) => a.bestPriceInEUR - b.bestPriceInEUR))
      }>Mejor Precio ↕</div>,
      accessorFn: (row: BestPriceProduct) => 
        `${formatCurrency(row.bestPrice, row.bestPriceCurrency)} (${formatCurrency(row.bestPriceInEUR, 'EUR')})`,
    },
    // Nueva columna para mostrar el Precio de Cardmarket
    {
      id: 'cardmarketPrice',
      header: () => <div className="cursor-pointer" onClick={() => 
        setBestPrices(prev => [...prev].sort((a, b) => {
          const productA = products.find(p => p.id === a.productId);
          const productB = products.find(p => p.id === b.productId);
          return (productA?.cardmarketPrice || 0) - (productB?.cardmarketPrice || 0);
        }))
      }>Precio Cardmarket ↕</div>,
      accessorFn: (row: BestPriceProduct) => {
        const rowData = row as unknown as BestPriceProduct;
        const productId = rowData.productId;
        const product = products.find(p => p.id === productId);
        
        // Verificar si el producto existe y tiene precio de Cardmarket
        if (product && product.cardmarketPrice) {
          // Si tiene URL, renderizar como enlace
          if (product.cardmarketUrl) {
            return (
              <a 
                href={product.cardmarketUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:text-blue-300 hover:underline"
                title="Ver en Cardmarket"
              >
                {formatCurrency(product.cardmarketPrice, 'EUR')}
              </a>
            );
          }
          
          // Si no tiene URL, solo mostrar el precio
          return formatCurrency(product.cardmarketPrice, 'EUR');
        }
        
        return 'No disponible';
      },
    },
    // Nueva columna para mostrar el Beneficio (Precio Cardmarket - Mejor Precio EUR)
    {
      id: 'profit',
      header: () => <div className="cursor-pointer" onClick={() => 
        setBestPrices(prev => [...prev].sort((a, b) => {
          const productA = products.find(p => p.id === a.productId);
          const productB = products.find(p => p.id === b.productId);
          
          const profitA = (productA?.cardmarketPrice || 0) - a.bestPriceInEUR;
          const profitB = (productB?.cardmarketPrice || 0) - b.bestPriceInEUR;
          
          return profitB - profitA; // Mayor beneficio primero
        }))
      }>Beneficio ↕</div>,
      accessorFn: (row: BestPriceProduct) => {
        const rowData = row as unknown as BestPriceProduct;
        const productId = rowData.productId;
        const product = products.find(p => p.id === productId);
        
        // Verificar si el producto existe y tiene precio de Cardmarket
        if (product && product.cardmarketPrice) {
          const profit = product.cardmarketPrice - rowData.bestPriceInEUR;
          
          // Aplicar estilo según si hay beneficio o pérdida
          const isProfit = profit > 0;
          const displayClass = isProfit ? 'text-green-600 font-medium' : 'text-red-600 font-medium';
          
          return (
            <span className={displayClass}>
              {formatCurrency(profit, 'EUR')}
              {isProfit ? ' ▲' : ' ▼'}
            </span>
          );
        }
        
        return 'No disponible';
      },
    },
    {
      id: 'supplierName',
      header: 'Proveedor',
      accessorKey: 'supplierName',
    },
    {
      id: 'shippingCost',
      header: 'Envío',
      accessorFn: (row: BestPriceProduct) => 
        `${formatCurrency(row.supplierShippingCost, row.bestPriceCurrency)}`,
    },
  ];

  // Modificar las columnas para la tabla de todos los precios para incluir imágenes por defecto
  const columnsWithDefaultImage = [...columns];
  columnsWithDefaultImage[0] = columnHelper.display({
    id: 'image',
    header: 'Imagen',
    cell: info => {
      const imageUrl = info.row.original.product?.imageUrl;
      // Usar un key basado en el ID o URL para mantener el estado entre renderizaciones
      const key = info.row.original.id || (imageUrl ? encodeURIComponent(imageUrl) : 'no-image');
      
      return (
        <div 
          className="relative w-10 h-10 overflow-hidden flex-shrink-0" 
          onClick={() => imageUrl && handleImageClick(imageUrl)}
        >
          <div className={`absolute inset-0 flex items-center justify-center ${imageUrl ? 'cursor-pointer' : ''}`}>
            <ProductImage 
              key={key}
              src={imageUrl} 
              alt={info.row.original.product?.name || 'Producto'} 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      );
    }
  });

  // Renderizar
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Precios</h1>
      
      {/* Mostrar notificación */}
      {notification?.show && (
        <div className={`p-4 mb-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.message}
        </div>
      )}
      
      {/* Filtros */}
      <div className="bg-gray-800 p-4 rounded-md shadow-md mb-6 border border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-white">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="productName" className="block text-sm font-medium text-gray-300 mb-1">
              Nombre del producto
            </label>
            <input
              type="text"
              id="productName"
              name="productName"
              value={filters.productName}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-md text-white"
              placeholder="Buscar por nombre..."
            />
          </div>
          
          <div>
            <label htmlFor="productLanguage" className="block text-sm font-medium text-gray-300 mb-1">
              Idioma
            </label>
            <select
              id="productLanguage"
              name="language"
              value={filters.language}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-md text-white"
            >
              <option value="">Todos</option>
              {uniqueLanguages.map(language => (
                <option key={language} value={language}>{language}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="productType" className="block text-sm font-medium text-gray-300 mb-1">
              Tipo
            </label>
            <select
              id="productType"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-md text-white"
            >
              <option value="">Todos</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="supplierName" className="block text-sm font-medium text-gray-300 mb-1">
              Nombre del proveedor
            </label>
            <input
              type="text"
              id="supplierName"
              name="supplierName"
              value={filters.supplierName}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-md text-white"
              placeholder="Buscar por proveedor..."
            />
          </div>
          
          <div>
            <label htmlFor="supplierCountry" className="block text-sm font-medium text-gray-300 mb-1">
              País
            </label>
            <select
              id="supplierCountry"
              name="country"
              value={filters.country}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-md text-white"
            >
              <option value="">Todos</option>
              {uniqueCountries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          
          <div className="flex space-x-2">
            <div className="flex-1">
              <label htmlFor="minPrice" className="block text-sm font-medium text-gray-300 mb-1">
                Precio mínimo
              </label>
              <input
                type="number"
                id="minPrice"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-md text-white"
                placeholder="Min..."
              />
            </div>
            <div className="flex-1">
              <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-300 mb-1">
                Precio máximo
              </label>
              <input
                type="number"
                id="maxPrice"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-700 bg-gray-900 rounded-md text-white"
                placeholder="Max..."
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Botón para añadir precio */}
      <div className="mb-4">
        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            setEditingPrice(null);
            setModalOpen(true);
          }}
        >
          Añadir Precio
        </button>
      </div>
      
      {/* Pestañas para alternar entre tablas */}
      <div className="mb-6">
        <div className="flex border-b border-gray-700">
          <button
            className={`py-2 px-4 font-medium rounded-t-lg ${
              showBestPrices ? 'bg-gray-700 text-white border-t border-r border-l border-gray-600' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            onClick={() => setShowBestPrices(false)}
          >
            Todos los Precios
          </button>
          <button
            className={`py-2 px-4 font-medium rounded-t-lg ${
              showBestPrices ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                : 'bg-gray-700 text-white border-t border-r border-l border-gray-600'
            }`}
            onClick={() => setShowBestPrices(true)}
          >
            Mejores Precios por Producto
          </button>
        </div>
      </div>
      
      {/* Contenido de las pestañas */}
      <div className="bg-gray-800 border border-gray-700 rounded-md p-4">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-800 p-4 rounded-md">
            {error}
          </div>
        ) : (
          <>
            {/* Tabla de todos los precios */}
            {!showBestPrices && (
              <div>
                <DataTable
                  data={filteredPrices}
                  columns={columnsWithDefaultImage}
                />
              </div>
            )}
            
            {/* Tabla de mejores precios por producto */}
            {showBestPrices && (
              <div>
                <DataTable
                  data={filteredBestPricesByProduct}
                  columns={bestPricesColumns as any}
                />
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Modal para editar/añadir precio */}
      <Modal isOpen={modalOpen} onClose={() => {
        setModalOpen(false);
        setEditingPrice(null);
      }}>
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">
            {editingPrice ? 'Editar Precio' : 'Añadir Precio'}
          </h2>
          <PriceForm
            initialData={editingPrice || undefined}
            onSubmit={handleSubmit}
            products={products}
            suppliers={suppliers}
            onCancel={() => {
              setModalOpen(false);
              setEditingPrice(null);
            }}
          />
        </div>
      </Modal>
      
      {/* Vista detallada */}
      {selectedPrice && (
        <DetailView 
          isOpen={detailViewOpen} 
          onClose={() => setDetailViewOpen(false)}
          title={`Detalles del Precio: ${selectedPrice.product.name}`}
        >
          <div className="mb-6 flex justify-center">
            <div className="relative w-48 h-48 rounded-lg overflow-hidden" 
                 onClick={() => selectedPrice.product.imageUrl && handleImageClick(selectedPrice.product.imageUrl)}>
              <div className={`absolute inset-0 flex items-center justify-center ${selectedPrice.product.imageUrl ? 'cursor-pointer' : ''}`}>
                <ProductImage
                  src={selectedPrice.product.imageUrl}
                  alt={selectedPrice.product.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          </div>
          
          <DetailGrid>
            <DetailSection title="Información del Producto">
              <DetailField label="Nombre" value={selectedPrice.product.name} />
              <DetailField label="Tipo" value={selectedPrice.product.type} />
              <DetailField label="Idioma" value={selectedPrice.product.language} />
            </DetailSection>
            
            <DetailSection title="Información del Precio">
              <DetailField 
                label="Precio" 
                value={formatCurrency(selectedPrice.price, selectedPrice.currency)} 
              />
              <DetailField 
                label="Precio en EUR" 
                value={formatCurrency(convertCurrency(selectedPrice.price, selectedPrice.currency, 'EUR'), 'EUR')} 
              />
              <DetailField 
                label="Coste de envío" 
                value={formatCurrency(selectedPrice.shippingCost || 0, selectedPrice.currency)} 
              />
              <DetailField
                label="Disponibilidad"
                value={
                  <DetailBadge color={selectedPrice.inStock ? 'green' : 'red'}>
                    {selectedPrice.inStock ? 'En stock' : 'Sin stock'}
                  </DetailBadge>
                }
              />
            </DetailSection>
            
            <DetailSection title="Información del Proveedor">
              <DetailField label="Nombre" value={selectedPrice.supplier.name} />
              <DetailField label="País" value={selectedPrice.supplier.country} />
              {selectedPrice.url && (
                <DetailField 
                  label="Enlace" 
                  value={
                    <DetailLink href={selectedPrice.url} target="_blank" rel="noopener noreferrer">
                      Ver en tienda
                    </DetailLink>
                  } 
                />
              )}
            </DetailSection>
            
            {selectedPrice.notes && (
              <DetailSection title="Notas" fullWidth>
                <DetailField value={selectedPrice.notes} noLabel />
              </DetailSection>
            )}
          </DetailGrid>
          
          <div className="mt-6 flex space-x-4 justify-end">
            <button
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
              onClick={() => {
                setDetailViewOpen(false);
                handleEdit(selectedPrice);
              }}
            >
              Editar
            </button>
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              onClick={() => {
                setDetailViewOpen(false);
                handleDelete(selectedPrice.id);
              }}
            >
              Eliminar
            </button>
          </div>
        </DetailView>
      )}
      
      {/* Modal para ver imagen */}
      <ImageModal
        isOpen={!!selectedImageUrl}
        onClose={() => setSelectedImageUrl('')}
        imageUrl={selectedImageUrl}
      />
    </div>
  );
} 