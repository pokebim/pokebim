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
  
  // Estado para las pestañas
  const [activeTab, setActiveTab] = useState<'allPrices' | 'bestPrices'>('allPrices');

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
      if (filters.productLanguage && price.product?.language !== filters.productLanguage) {
        return false;
      }
      
      // Filtro por tipo
      if (filters.productType && price.product?.type !== filters.productType) {
        return false;
      }
      
      // Filtro por nombre de proveedor
      if (filters.supplierName && 
          !price.supplier?.name.toLowerCase().includes(filters.supplierName.toLowerCase())) {
        return false;
      }
      
      // Filtro por país del proveedor
      if (filters.supplierCountry && price.supplier?.country !== filters.supplierCountry) {
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
      if (filters.productLanguage && price.product?.language !== filters.productLanguage) {
        return false;
      }
      
      // Filtro por tipo
      if (filters.productType && price.product?.type !== filters.productType) {
        return false;
      }
      
      // Filtro por nombre de proveedor
      if (filters.supplierName && 
          !price.supplier?.name.toLowerCase().includes(filters.supplierName.toLowerCase())) {
        return false;
      }
      
      // Filtro por país del proveedor
      if (filters.supplierCountry && price.supplier?.country !== filters.supplierCountry) {
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
    setSelectedImage(imageUrl);
  };
  
  // Definir columnas de la tabla
  const columnHelper = createColumnHelper<EnrichedPrice>();
  
  const columns = [
    columnHelper.display({
      id: 'image',
      header: 'Imagen',
      cell: info => {
        const imageUrl = info.row.original.product?.imageUrl;
        return (
          <div className="w-10 h-10 flex items-center justify-center cursor-pointer" 
               onClick={() => imageUrl && handleImageClick(imageUrl)}>
            {imageUrl ? (
              <ProductImage 
                src={imageUrl} 
                alt={info.row.original.product?.name || 'Producto'} 
                className="rounded-md object-contain max-h-10 max-w-10" 
              />
            ) : (
              <DefaultProductImage 
                productName={info.row.original.product?.name || 'Producto'}
                className="w-10 h-10"
              />
            )}
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
      header: 'Precio (EUR)',
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
    columnHelper.accessor('currency', {
      header: 'Moneda',
      cell: info => info.getValue()
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
    columnHelper.accessor('inStock', {
      header: 'Stock',
      cell: info => (
        <span className={`px-2 py-1 rounded-full text-xs ${info.getValue() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {info.getValue() ? 'Disponible' : 'No disponible'}
        </span>
      )
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
        const imageUrl = (info.row.original as unknown as BestPriceProduct).productImageUrl;
        return (
          <div className="w-10 h-10 flex items-center justify-center cursor-pointer" 
               onClick={() => imageUrl && handleImageClick(imageUrl)}>
            {imageUrl ? (
              <ProductImage 
                src={imageUrl} 
                alt={(info.row.original as unknown as BestPriceProduct).productName} 
                className="rounded-md object-contain max-h-10 max-w-10" 
              />
            ) : (
              <DefaultProductImage 
                productName={(info.row.original as unknown as BestPriceProduct).productName}
                className="w-10 h-10"
              />
            )}
          </div>
        );
      }
    }),
    {
      header: 'Producto',
      accessorKey: 'productName',
    },
    {
      header: 'Tipo',
      accessorKey: 'productType',
    },
    {
      header: 'Idioma',
      accessorKey: 'productLanguage',
    },
    {
      header: 'Mejor Precio',
      accessorFn: (row: BestPriceProduct) => 
        `${formatCurrency(row.bestPrice, row.bestPriceCurrency)} (${formatCurrency(row.bestPriceInEUR, 'EUR')})`,
    },
    {
      header: 'Proveedor',
      accessorKey: 'supplierName',
    },
    {
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
      return (
        <div className="w-10 h-10 flex items-center justify-center cursor-pointer" 
             onClick={() => imageUrl && handleImageClick(imageUrl)}>
          {imageUrl ? (
            <ProductImage 
              src={imageUrl} 
              alt={info.row.original.product?.name || 'Producto'} 
              className="rounded-md object-contain max-h-10 max-w-10" 
            />
          ) : (
            <DefaultProductImage 
              productName={info.row.original.product?.name || 'Producto'}
              className="w-10 h-10"
            />
          )}
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
              name="productLanguage"
              value={filters.productLanguage}
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
              name="productType"
              value={filters.productType}
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
              name="supplierCountry"
              value={filters.supplierCountry}
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
              activeTab === 'allPrices' 
                ? 'bg-gray-700 text-white border-t border-r border-l border-gray-600' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('allPrices')}
          >
            Todos los Precios
          </button>
          <button
            className={`py-2 px-4 font-medium rounded-t-lg ${
              activeTab === 'bestPrices' 
                ? 'bg-gray-700 text-white border-t border-r border-l border-gray-600' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            onClick={() => setActiveTab('bestPrices')}
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
            {activeTab === 'allPrices' && (
              <div>
                <DataTable
                  data={filteredPrices}
                  columns={columnsWithDefaultImage}
                />
              </div>
            )}
            
            {/* Tabla de mejores precios por producto */}
            {activeTab === 'bestPrices' && (
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
          {selectedPrice.product.imageUrl ? (
            <div className="mb-6 flex justify-center">
              <div className="w-48 h-48 relative cursor-pointer"
                   onClick={() => handleImageClick(selectedPrice.product.imageUrl!)}>
                <ProductImage
                  src={selectedPrice.product.imageUrl}
                  alt={selectedPrice.product.name}
                  size="large"
                  className="rounded-lg"
                />
              </div>
            </div>
          ) : (
            <div className="mb-6 flex justify-center">
              <div className="w-48 h-48 relative">
                <DefaultProductImage
                  productName={selectedPrice.product.name}
                  className="rounded-lg"
                />
              </div>
            </div>
          )}
          
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
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage || ''}
      />
    </div>
  );
} 