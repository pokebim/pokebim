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

  // INCLUIR AQUÍ EL RESTO DEL CÓDIGO DEL COMPONENTE ORIGINAL
  // (todas las funciones y la lógica de renderizado)
} 