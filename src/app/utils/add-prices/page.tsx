'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { addPrice } from '@/lib/priceService';
import { getAllProducts, addProduct, updateProduct } from '@/lib/productService';
import { getAllSuppliers, addSupplier } from '@/lib/supplierService';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Interfaces
interface Product {
  id?: string;
  name?: string;
  language?: string;
  supplierId?: string;
  notes?: string;
  type?: string;
}

interface Supplier {
  id?: string;
  name?: string;
  region?: string;
  country?: string;
  notes?: string;
  email?: string;
  phone?: string;
}

interface Price {
  id?: string;
  price?: number;
  currency?: string;
  productId?: string;
  supplierId?: string;
  date?: string;
  notes?: string;
}

// Add this after the imports
const TINA_CAI_PRICES = [
  { productName: "Gem Pack box", price: 22, language: "Chinese", notes: "Chino 440 gem pack, 880 thin case. Shipping Free" }
];

// Add this function before addTinaCaiPrices
async function findSupplierByName(name: string) {
  const suppliersCol = collection(db, "suppliers");
  const q = query(suppliersCol, where("name", "==", name));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  };
}

// Add this function before addTinaCaiPrices
async function findOrCreateProduct(productName: string, language: string) {
  try {
    // Primero buscamos si ya existe el producto por nombre exacto y lenguaje
    console.log(`Looking for product: "${productName}" in language: "${language}"`);
    
    const productsCol = collection(db, "products");
    const q = query(productsCol, 
      where("name", "==", productName.trim()),
      where("language", "==", language)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      console.log(`Found existing product with ID: ${doc.id}`);
      return doc.id;
    }

    // Si no existe, creamos un nuevo producto
    console.log(`Creating new product: "${productName}" in language: "${language}"`);
    const newProduct = {
      name: productName.trim(),
      language: language,
      type: language === "Japanese" ? "JPN" : 
            language === "Korean" ? "KOR" : 
            language === "Chinese" ? "CHN" : "OTHER",
      notes: `${language} product added via price import`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(productsCol, newProduct);
    console.log(`Created new product with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error(`Error finding/creating product ${productName}:`, error);
    throw error;
  }
}

// Add this function before the AddPricesPage component
async function addTinaCaiPrices() {
  try {
    const supplier = await findSupplierByName("Tina Cai");
    if (!supplier) {
      console.error("Supplier Tina Cai not found");
      return;
    }

    for (const priceData of TINA_CAI_PRICES) {
      // Find or create product
      const productId = await findOrCreateProduct(priceData.productName, priceData.language);
      
      // Add price
      await addPrice({
        productId: productId,
        supplierId: supplier.id,
        price: priceData.price,
        currency: 'EUR',
        notes: priceData.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log("Added prices for Tina Cai successfully");
  } catch (error) {
    console.error("Error adding prices for Tina Cai:", error);
  }
}

export default function AddPricesPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [selectedProductName, setSelectedProductName] = useState<string>("");
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Cargar productos y proveedores existentes
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching initial data...");
        const fetchedProducts = await getAllProducts();
        const fetchedSuppliers = await getAllSuppliers();
        console.log(`Loaded ${fetchedProducts.length} products and ${fetchedSuppliers.length} suppliers`);
        
        // Verificar si hay productos sin el campo type
        await checkAndUpdateProducts(fetchedProducts);
        
        setProducts(fetchedProducts);
        setSuppliers(fetchedSuppliers);
      } catch (error) {
        console.error("Error fetching data:", error);
        setErrors(prev => [...prev, `Error loading initial data: ${error}`]);
      }
    };
    fetchData();
  }, []);

  // Función para verificar y actualizar productos que no tengan el campo type
  const checkAndUpdateProducts = async (fetchedProducts: Product[]) => {
    try {
      const productsToUpdate = fetchedProducts.filter(p => !p.type && p.id);
      
      if (productsToUpdate.length > 0) {
        console.log(`Found ${productsToUpdate.length} products without type field. Updating...`);
        setDebugInfo(prev => [...prev, `Updating ${productsToUpdate.length} products that don't have type field`]);
        
        for (const product of productsToUpdate) {
          if (product.id) {
            const type = getProductType(product.language || "Unknown");
            console.log(`Updating product ${product.name} (${product.id}) with type: ${type}`);
            
            try {
              await updateProduct(product.id, { type });
              // Actualizar también el producto en el estado local
              product.type = type;
            } catch (error) {
              console.error(`Error updating product ${product.id}:`, error);
              setDebugInfo(prev => [...prev, `Error updating product ${product.name}: ${error.message}`]);
            }
          }
        }
        
        console.log(`Updated ${productsToUpdate.length} products with type field`);
        setDebugInfo(prev => [...prev, `Completed updating ${productsToUpdate.length} products with type field`]);
      } else {
        console.log('All products have type field');
      }
    } catch (error) {
      console.error("Error checking and updating products:", error);
      setDebugInfo(prev => [...prev, `Error checking products: ${error.message}`]);
    }
  };

  // Función para encontrar o crear un producto
  const findOrCreateProduct = async (productName: string, language: string): Promise<string> => {
    // Primero buscamos si ya existe el producto por nombre exacto y lenguaje
    console.log(`Looking for product: "${productName}" in language: "${language}"`);
    const existingProduct = products.find(
      (p) => p.name?.toLowerCase().trim() === productName.toLowerCase().trim() && p.language === language
    );

    if (existingProduct && existingProduct.id) {
      console.log(`Found existing product with ID: ${existingProduct.id}`);
      return existingProduct.id;
    }

    // Si no existe, creamos un nuevo producto
    try {
      console.log(`Creating new product: "${productName}" in language: "${language}"`);
      const newProduct: Product = {
        name: productName,
        language: language,
        type: getProductType(language),
        notes: `${language} product added via price import`
      };
      
      const productId = await addProduct(newProduct);
      console.log(`Created new product: ${productName} with ID: ${productId}`);
      
      // Añadir el producto a nuestro estado local para futuros lookups
      const updatedProduct = { ...newProduct, id: productId };
      setProducts(prev => [...prev, updatedProduct]);
      
      // Agregar log de depuración
      setDebugInfo(prev => [...prev, `Created product: ${productName} (${language}) with ID: ${productId}`]);
      
      return productId;
    } catch (error) {
      console.error(`Error creating product ${productName}:`, error);
      setDebugInfo(prev => [...prev, `Failed to create product: ${productName} - ${error.message}`]);
      throw new Error(`Failed to create product ${productName}: ${error}`);
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

  // Función para encontrar o crear un proveedor
  const findOrCreateSupplier = async (supplierName: string, language: string): Promise<string> => {
    try {
      // Normalizar el nombre para evitar problemas de búsqueda
      const normalizedName = supplierName.trim();
      
      // Buscar por nombre normalizado
      const existingSupplier = suppliers.find(
        s => s.name?.toLowerCase().trim() === normalizedName.toLowerCase().trim()
      );
      
      if (existingSupplier && existingSupplier.id) {
        console.log(`Found existing supplier with ID: ${existingSupplier.id}`);
        return existingSupplier.id;
      }
      
      // Determinar región y país basado en el idioma
      let region = "Asia";
      let country = "";
      
      switch (language) {
        case "Japanese":
          country = "Japan";
          break;
        case "Korean":
          country = "South Korea";
          break;
        case "Chinese":
          country = "China";
          break;
        default:
          country = "Unknown";
      }
      
      // Crear un nuevo proveedor
      const newSupplier: Supplier = {
        name: normalizedName,
        region: region,
        country: country,
        notes: `Added via price import tool. Supplier for ${language} products.`
      };
      
      const supplierId = await addSupplier(newSupplier);
      console.log(`Created new supplier: ${normalizedName} with ID: ${supplierId}`);
      
      // Añadir el proveedor a nuestro estado local para futuros lookups
      const updatedSupplier = { ...newSupplier, id: supplierId };
      setSuppliers(prev => [...prev, updatedSupplier]);
      
      // Agregar log de depuración
      setDebugInfo(prev => [...prev, `Created supplier: ${normalizedName} from ${country} with ID: ${supplierId}`]);
      
      return supplierId;
    } catch (error) {
      console.error(`Error creating supplier ${supplierName}:`, error);
      setDebugInfo(prev => [...prev, `Failed to create supplier: ${supplierName} - ${error.message}`]);
      throw new Error(`Failed to create supplier ${supplierName}: ${error.message}`);
    }
  };

  // Función para verificar y retornar el ID de un proveedor
  const findSupplierId = async (supplierName: string, language: string): Promise<string> => {
    try {
      if (!supplierName || supplierName.trim() === "") {
        throw new Error("Supplier name is empty");
      }
      
      // Normalizamos el nombre para evitar problemas con espacios o mayúsculas
      const normalizedName = supplierName.trim();
      
      console.log(`Finding supplier ID for: "${normalizedName}"`);
      const supplier = suppliers.find(
        (s) => s.name?.toLowerCase().trim() === normalizedName.toLowerCase().trim()
      );
      
      if (supplier && supplier.id) {
        console.log(`Found supplier ${normalizedName} with ID: ${supplier.id}`);
        return supplier.id;
      }
      
      // Si no existe, lo creamos
      console.log(`Supplier ${normalizedName} not found, creating...`);
      const newSupplierId = await findOrCreateSupplier(normalizedName, language);
      console.log(`Created/found supplier with ID: ${newSupplierId}`);
      return newSupplierId;
    } catch (error) {
      console.error(`Error finding/creating supplier ${supplierName}:`, error);
      throw new Error(`Supplier ${supplierName} not found and could not be created: ${error.message}`);
    }
  };

  // Actualizar la función que maneja la adición de un precio individual
  const handleAddPrice = async (priceItem, supplierName, supplierId) => {
    if (priceItem.price === undefined || priceItem.price === 0) {
      console.log(`Skipping price for ${priceItem.productName} from ${supplierName} as price is ${priceItem.price}`);
      return null;
    }
    
    try {
      const productName = priceItem.productName.trim();
      let productId;
      
      try {
        productId = await findOrCreateProduct(productName, priceItem.language);
        if (!productId) {
          throw new Error(`Could not get valid product ID for ${productName}`);
        }
        
        // Verificar que el producto existe en el estado local
        const productExists = products.find(p => p.id === productId);
        if (!productExists) {
          console.warn(`Product ID ${productId} exists in DB but not in local state. Refreshing products...`);
          const refreshedProducts = await getAllProducts();
          setProducts(refreshedProducts);
          
          // Verificar nuevamente
          const refreshedProduct = refreshedProducts.find(p => p.id === productId);
          if (!refreshedProduct) {
            console.error(`Product ID ${productId} still not found after refresh!`);
            throw new Error(`Product ID ${productId} not found after data refresh`);
          }
          
          // Verificar si el producto tiene el campo type, y agregarlo si no lo tiene
          if (!refreshedProduct.type) {
            console.log(`Product ${productName} (${productId}) doesn't have type field, updating...`);
            const type = getProductType(priceItem.language);
            await updateProduct(productId, { type });
            refreshedProduct.type = type;
            console.log(`Updated product ${productName} with type: ${type}`);
          }
        }
      } catch (error) {
        console.error(`Error finding/creating product ${productName}:`, error);
        throw error;
      }
      
      // Verificar que el proveedor existe en el estado local
      const supplierExists = suppliers.find(s => s.id === supplierId);
      if (!supplierExists) {
        console.warn(`Supplier ID ${supplierId} exists in DB but not in local state. Refreshing suppliers...`);
        const refreshedSuppliers = await getAllSuppliers();
        setSuppliers(refreshedSuppliers);
        
        // Verificar nuevamente
        const refreshedSupplier = refreshedSuppliers.find(s => s.id === supplierId);
        if (!refreshedSupplier) {
          console.error(`Supplier ID ${supplierId} still not found after refresh!`);
          throw new Error(`Supplier ID ${supplierId} not found after data refresh`);
        }
      }
      
      const priceData: Price = {
        price: priceItem.price,
        currency: priceItem.language === "Japanese" ? "JPY" : 
                  priceItem.language === "Korean" ? "KRW" : 
                  priceItem.language === "Chinese" ? "CNY" : "USD",
        productId,
        supplierId,
        date: new Date().toISOString(),
        notes: priceItem.notes || ""
      };
      
      // Verificar que tenemos IDs válidos
      if (!priceData.productId || !priceData.supplierId) {
        throw new Error(`Invalid IDs: productId=${priceData.productId}, supplierId=${priceData.supplierId}`);
      }
      
      console.log(`Adding price with verified IDs: productId=${priceData.productId}, supplierId=${priceData.supplierId}`);
      setDebugInfo(prev => [...prev, `Adding price: ${priceItem.price} ${priceData.currency} for product ID: ${productId} from supplier ID: ${supplierId}`]);
      
      const priceId = await addPrice(priceData);
      console.log(`Successfully added price with ID: ${priceId}`);
      return { priceId, productName, price: priceItem.price, currency: priceData.currency };
    } catch (error) {
      console.error(`Error processing price for ${priceItem.productName}:`, error);
      throw error;
    }
  };

  // Definición de los datos de precios
  const pricingData = [
    // Samurai Ken - Japanese
    {
      supplierName: "Samurai Ken",
      prices: [
        { productName: "Battle Partners Caja 30", price: 70.4, language: "Japanese", notes: "Japones" },
        { productName: "151", price: 134.4, language: "Japanese", notes: "" },
        { productName: "Heat Wave Caja 30", price: 0, language: "Japanese", notes: "38,20 aprox 10" },
        { productName: "Shiny Treasures", price: 48, language: "Japanese", notes: "" },
        { productName: "Eeve Heroes", price: 435.2, language: "Japanese", notes: "" },
        { productName: "Terastal Festival", price: 99.2, language: "Japanese", notes: "" },
        { productName: "Super Electric breaker", price: 86.4, language: "Japanese", notes: "" },
        { productName: "Crimsone Haze", price: 41.6, language: "Japanese", notes: "" },
        { productName: "Lost Abyss", price: 128, language: "Japanese", notes: "" },
        { productName: "VStar Universe", price: 105.6, language: "Japanese", notes: "" },
        { productName: "Fusion ARTS", price: 128, language: "Japanese", notes: "" },
        { productName: "Blue Sky Stream", price: 435.2, language: "Japanese", notes: "" }
      ]
    },
    // Korean pokemon cards wholesaler - Korean
    {
      supplierName: "korean pokemon cards wholesaler",
      prices: [
        { productName: "Battle Partners Caja 30", price: 29, language: "Korean", notes: "Koreano10 desconte 3 cases, en dolares" },
        { productName: "151", price: 55, language: "Korean", notes: "" },
        { productName: "Shiny Treasures", price: 44, language: "Korean", notes: "" },
        { productName: "Eeve Heroes", price: 80, language: "Korean", notes: "" },
        { productName: "Terastal Festival", price: 44, language: "Korean", notes: "" },
        { productName: "Super Electric breaker", price: 40, language: "Korean", notes: "" },
        { productName: "Crimsone Haze", price: 27, language: "Korean", notes: "" },
        { productName: "Lost Abyss", price: 49, language: "Korean", notes: "" },
        { productName: "VStar Universe", price: 52, language: "Korean", notes: "" },
        { productName: "Fusion ARTS", price: 32, language: "Korean", notes: "" },
        { productName: "Blue Sky Stream", price: 43.33, language: "Korean", notes: "" }
      ]
    },
    // John Jung - Korean
    {
      supplierName: "John Jung",
      prices: [
        { productName: "Battle Partners Caja 30", price: 30, language: "Korean", notes: "Koreano" },
        { productName: "151", price: 53, language: "Korean", notes: "" },
        { productName: "Shiny Treasures", price: 33, language: "Korean", notes: "" },
        { productName: "Eeve Heroes", price: 100, language: "Korean", notes: "" },
        { productName: "Terastal Festival", price: 43, language: "Korean", notes: "" },
        { productName: "Super Electric breaker", price: 33, language: "Korean", notes: "" },
        { productName: "Crimsone Haze", price: 27, language: "Korean", notes: "" },
        { productName: "Lost Abyss", price: 40, language: "Korean", notes: "" },
        { productName: "VStar Universe", price: 47, language: "Korean", notes: "" },
        { productName: "Fusion ARTS", price: 33, language: "Korean", notes: "" },
        { productName: "Blue Sky Stream", price: 40, language: "Korean", notes: "" }
      ]
    },
    // Collectors Coast - Korean
    {
      supplierName: "Collectors Coast",
      prices: [
        { productName: "Shiny Treasures", price: 35, language: "Korean", notes: "Koreano" },
        { productName: "Terastal Festival", price: 37, language: "Korean", notes: "" },
        { productName: "Crimsone Haze", price: 24, language: "Korean", notes: "" }
      ]
    },
    // Junta Nakatsuka - Japanese
    {
      supplierName: "Junta Nakatsuka",
      prices: [
        { productName: "Battle Partners Caja 30", price: 67.2, language: "Japanese", notes: "Japanese, no diu shipping" },
        { productName: "151", price: 131.2, language: "Japanese", notes: "" },
        { productName: "Shiny Treasures", price: 49.92, language: "Japanese", notes: "" },
        { productName: "Terastal Festival", price: 96, language: "Japanese", notes: "" },
        { productName: "Super Electric breaker", price: 89.6, language: "Japanese", notes: "" },
        { productName: "Crimsone Haze", price: 48, language: "Japanese", notes: "" },
        { productName: "Lost Abyss", price: 134.4, language: "Japanese", notes: "" },
        { productName: "VStar Universe", price: 96, language: "Japanese", notes: "" }
      ]
    },
    // Japan pokemon Card Expert - Japanese
    {
      supplierName: "Japan Pokemon Card Expert",
      prices: [
        { productName: "Battle Partners Caja 30", price: 65.5, language: "Japanese", notes: "Japanese, no diu shipping" },
        { productName: "151", price: 127, language: "Japanese", notes: "" },
        { productName: "Shiny Treasures", price: 53.5, language: "Japanese", notes: "" },
        { productName: "Terastal Festival", price: 97, language: "Japanese", notes: "" },
        { productName: "Super Electric breaker", price: 85.5, language: "Japanese", notes: "" },
        { productName: "Crimsone Haze", price: 48, language: "Japanese", notes: "" }
      ]
    },
    // HIRO JAPAN - Japanese
    {
      supplierName: "HIRO JAPAN",
      prices: [
        { productName: "Battle Partners Caja 30", price: 62.7136, language: "Japanese", notes: "Japanese, no diu shipping" },
        { productName: "151", price: 125.44, language: "Japanese", notes: "" },
        { productName: "Shiny Treasures", price: 52.48, language: "Japanese", notes: "" },
        { productName: "Terastal Festival", price: 96, language: "Japanese", notes: "" },
        { productName: "Super Electric breaker", price: 89.6, language: "Japanese", notes: "" },
        { productName: "Crimsone Haze", price: 48.64, language: "Japanese", notes: "" },
        { productName: "VStar Universe", price: 97.92, language: "Japanese", notes: "" },
        { productName: "Blue Sky Stream", price: 780.8, language: "Japanese", notes: "" }
      ]
    },
    // poke_mon_japan - Japanese
    {
      supplierName: "poke_mon_japan",
      prices: [
        { productName: "Battle Partners Caja 30", price: 62.72, language: "Japanese", notes: "Japanese, no diu shipping" },
        { productName: "151", price: 128.64, language: "Japanese", notes: "" },
        { productName: "Shiny Treasures", price: 51.2, language: "Japanese", notes: "" },
        { productName: "Terastal Festival", price: 96.64, language: "Japanese", notes: "" },
        { productName: "Super Electric breaker", price: 87.04, language: "Japanese", notes: "" },
        { productName: "Crimsone Haze", price: 48, language: "Japanese", notes: "" },
        { productName: "Lost Abyss", price: 140.8, language: "Japanese", notes: "" },
        { productName: "VStar Universe", price: 92.8, language: "Japanese", notes: "" }
      ]
    },
    // Yoshi - Japanese
    {
      supplierName: "Yoshi",
      prices: [
        { productName: "Battle Partners Caja 30", price: 62.72, language: "Japanese", notes: "Japanese, no diu shipping" },
        { productName: "151", price: 121.6, language: "Japanese", notes: "" },
        { productName: "Shiny Treasures", price: 51.2, language: "Japanese", notes: "" },
        { productName: "Terastal Festival", price: 92.16, language: "Japanese", notes: "" },
        { productName: "Super Electric breaker", price: 81.92, language: "Japanese", notes: "" },
        { productName: "Crimsone Haze", price: 46.08, language: "Japanese", notes: "" },
        { productName: "Lost Abyss", price: 140.8, language: "Japanese", notes: "" },
        { productName: "VStar Universe", price: 92.8, language: "Japanese", notes: "" }
      ]
    },
    // Emma - Japanese
    {
      supplierName: "Emma",
      prices: [
        { productName: "Battle Partners Caja 30", price: 60.8, language: "Japanese", notes: "Japanese, no diu shipping" },
        { productName: "151", price: 124.8, language: "Japanese", notes: "" },
        { productName: "Shiny Treasures", price: 49.92, language: "Japanese", notes: "" },
        { productName: "Eeve Heroes", price: 422.4, language: "Japanese", notes: "" },
        { productName: "Terastal Festival", price: 92.16, language: "Japanese", notes: "" },
        { productName: "Super Electric breaker", price: 81.92, language: "Japanese", notes: "" },
        { productName: "Crimsone Haze", price: 43.52, language: "Japanese", notes: "" },
        { productName: "Lost Abyss", price: 128, language: "Japanese", notes: "" },
        { productName: "VStar Universe", price: 90.88, language: "Japanese", notes: "" },
        { productName: "Blue Sky Stream", price: 428.8, language: "Japanese", notes: "" }
      ]
    },
    // Pokemon.com.jp - Japanese/Chinese
    {
      supplierName: "Pokemon.com.jp",
      prices: [
        { productName: "Battle Partners Caja 30", price: 65.28, language: "Japanese", notes: "Japanese, no diu shipping" },
        { productName: "151", price: 131.2, language: "Japanese", notes: "" },
        { productName: "Heat Wave Caja 30", price: 1459.2, language: "Japanese", notes: "" },
        { productName: "Shiny Treasures", price: 49.92, language: "Japanese", notes: "" },
        { productName: "Eeve Heroes", price: 416, language: "Japanese", notes: "" },
        { productName: "Terastal Festival", price: 97.92, language: "Japanese", notes: "" },
        { productName: "Super Electric breaker", price: 86.4, language: "Japanese", notes: "" },
        { productName: "Crimsone Haze", price: 45.44, language: "Japanese", notes: "" },
        { productName: "Lost Abyss", price: 137.6, language: "Japanese", notes: "" },
        { productName: "VStar Universe", price: 97.92, language: "Japanese", notes: "" },
        { productName: "Fusion ARTS", price: 140.8, language: "Japanese", notes: "" },
        { productName: "151 Slim", price: 47.36, language: "Chinese", notes: "CHino" },
        { productName: "Gem Pack box", price: 25.6, language: "Chinese", notes: "CHino" },
        { productName: "151 Jumbo", price: 102.4, language: "Chinese", notes: "CHino" }
      ]
    },
    // Pokémon Chinese Ver - Chinese
    {
      supplierName: "Pokemon Chinese Ver",
      prices: [
        { productName: "151 Slim", price: 45, language: "Chinese", notes: "Chino" },
        { productName: "Gem Pack box", price: 21, language: "Chinese", notes: "Chino" }
      ]
    },
    // Tina Cai - Chinese
    {
      supplierName: "Tina Cai",
      prices: [
        { productName: "Gem Pack box", price: 22, language: "Chinese", notes: "Chino 440 gem pack, 880 thin case. Shipping Free" }
      ]
    },
    // SISI Zhang - Chinese
    {
      supplierName: "SISI Zhang (Yiwu Riheng E-Commerce Co., Ltd.)",
      prices: [
        { productName: "151 Slim", price: 43, language: "Chinese", notes: "Chinese. 2 cases 120" },
        { productName: "Gem Pack box", price: 19, language: "Chinese", notes: "Chinese" }
      ]
    },
    // Mizuki - Japanese
    {
      supplierName: "Mizuki",
      prices: [
        { productName: "Battle Partners Caja 30", price: 64, language: "Japanese", notes: "Japanese, no diu shipping" },
        { productName: "151", price: 126.72, language: "Japanese", notes: "" },
        { productName: "Shiny Treasures", price: 52.48, language: "Japanese", notes: "" },
        { productName: "Terastal Festival", price: 94.08, language: "Japanese", notes: "" },
        { productName: "Super Electric breaker", price: 83.2, language: "Japanese", notes: "" },
        { productName: "Crimsone Haze", price: 47.36, language: "Japanese", notes: "" },
        { productName: "VStar Universe", price: 94.08, language: "Japanese", notes: "" }
      ]
    },
    // Japanese TCG Sell and buy - Japanese
    {
      supplierName: "Japanese TCG Sell and buy",
      prices: [
        { productName: "Battle Partners Caja 30", price: 63.36, language: "Japanese", notes: "Japanese, no diu shipping" },
        { productName: "151", price: 131.2, language: "Japanese", notes: "" },
        { productName: "Shiny Treasures", price: 54.4, language: "Japanese", notes: "" },
        { productName: "Eeve Heroes", price: 448, language: "Japanese", notes: "" },
        { productName: "Terastal Festival", price: 99.2, language: "Japanese", notes: "" },
        { productName: "Super Electric breaker", price: 85.12, language: "Japanese", notes: "" },
        { productName: "Crimsone Haze", price: 51.2, language: "Japanese", notes: "" },
        { productName: "Lost Abyss", price: 144, language: "Japanese", notes: "" },
        { productName: "VStar Universe", price: 99.2, language: "Japanese", notes: "" },
        { productName: "Fusion ARTS", price: 140.8, language: "Japanese", notes: "" }
      ]
    },
    // Carol Chen Zhengzhou - Chinese
    {
      supplierName: "Carol Chen Zhengzhou",
      prices: [
        { productName: "Gem Pack case (20)", price: 390, language: "Chinese", notes: "Alibaba, chinese no shipping. 755 euros" },
        { productName: "151 slim case (20)", price: 820, language: "Chinese", notes: "" },
        { productName: "151 jumbo case (20)", price: 1800, language: "Chinese", notes: "" },
        { productName: "PTCG Pokemon 8.0 slim pack (30)", price: 790, language: "Chinese", notes: "Pair Cases 15 per case, 15 lugia 15 giratina" },
        { productName: "Necrozma gift box case (6)", price: 180, language: "Chinese", notes: "" },
        { productName: "PTCG Advanced gift box eevolution 3", price: 210, language: "Chinese", notes: "3 caixes" },
        { productName: "Rayquaza gift box case (6)", price: 190, language: "Chinese", notes: "?" },
        { productName: "Mewtwo Vstar Box", price: 50, language: "Chinese", notes: "1 box" },
        { productName: "Charizard Vstar Box", price: 50, language: "Chinese", notes: "" },
        { productName: "Charizard Vmax Box", price: 40, language: "Chinese", notes: "1 Box" },
        { productName: "Charizard Vmax Classic Box", price: 50, language: "Chinese", notes: "1 box" }
      ]
    },
    // Buyee - Other
    {
      supplierName: "Buyee",
      prices: [
        { productName: "Terastal Festival", price: 347, language: "Japanese", notes: "4 boxes 86 aprox per box. 312 + 35 shipping" }
      ]
    },
    // Jiake Yiwu - Japanese
    {
      supplierName: "Jiake Yiwu",
      prices: [
        { productName: "Terastal Festival", price: 78, language: "Japanese", notes: "70 + 8 shipping" },
        { productName: "151", price: 104, language: "Japanese", notes: "96 + 8" },
        { productName: "Surging", price: 56, language: "Japanese", notes: "" },
        { productName: "Shiny Treasures", price: 48, language: "Japanese", notes: "" }
      ]
    },
    // kyosho japanese pokemon card - Japanese
    {
      supplierName: "kyosho japanese pokemon card",
      prices: [
        { productName: "Battle Partners Caja 30", price: 62.72, language: "Japanese", notes: "Japanese, no diu shipping" },
        { productName: "151", price: 123.52, language: "Japanese", notes: "case a 230000" },
        { productName: "Shiny Treasures", price: 51.2, language: "Japanese", notes: "" },
        { productName: "Terastal Festival", price: 90.88, language: "Japanese", notes: "" },
        { productName: "Super Electric breaker", price: 81.92, language: "Japanese", notes: "" },
        { productName: "Crimsone Haze", price: 45.44, language: "Japanese", notes: "" },
        { productName: "VStar Universe", price: 91.52, language: "Japanese", notes: "" }
      ]
    },
    // japanese tcg rikiya - Japanese
    {
      supplierName: "japanese tcg rikiya",
      prices: [
        { productName: "Battle Partners Caja 30", price: 63, language: "Japanese", notes: "Japanese, no diu shipping" },
        { productName: "Heat Wave Caja 30", price: 109, language: "Japanese", notes: "" },
        { productName: "Shiny Treasures", price: 56, language: "Japanese", notes: "" },
        { productName: "Terastal Festival", price: 96, language: "Japanese", notes: "" },
        { productName: "Super Electric breaker", price: 82, language: "Japanese", notes: "" },
        { productName: "Crimsone Haze", price: 47, language: "Japanese", notes: "" },
        { productName: "VStar Universe", price: 96, language: "Japanese", notes: "" }
      ]
    },
    // mintman - Japanese
    {
      supplierName: "mintman",
      prices: [
        { productName: "Battle Partners Caja 30", price: 62.72, language: "Japanese", notes: "Japanese, no diu shipping" },
        { productName: "151", price: 136, language: "Japanese", notes: "case a 230000" },
        { productName: "Heat Wave Caja 30", price: 116.2624, language: "Japanese", notes: "" },
        { productName: "Shiny Treasures", price: 51.2, language: "Japanese", notes: "" },
        { productName: "Terastal Festival", price: 98.56, language: "Japanese", notes: "" },
        { productName: "Super Electric breaker", price: 84.8, language: "Japanese", notes: "" },
        { productName: "Crimsone Haze", price: 46.72, language: "Japanese", notes: "" },
        { productName: "Lost Abyss", price: 153.6, language: "Japanese", notes: "" },
        { productName: "VStar Universe", price: 96, language: "Japanese", notes: "" }
      ]
    },
    // tcgex - Japanese
    {
      supplierName: "tcgex",
      prices: [
        { productName: "Battle Partners Caja 30", price: 62.08, language: "Japanese", notes: "Japanese, no diu shipping" },
        { productName: "151", price: 129.92, language: "Japanese", notes: "" },
        { productName: "Heat Wave Caja 30", price: 122.6624, language: "Japanese", notes: "" },
        { productName: "Shiny Treasures", price: 58.24, language: "Japanese", notes: "" },
        { productName: "Terastal Festival", price: 96, language: "Japanese", notes: "" },
        { productName: "Super Electric breaker", price: 80, language: "Japanese", notes: "" },
        { productName: "Lost Abyss", price: 140.8, language: "Japanese", notes: "" },
        { productName: "VStar Universe", price: 96, language: "Japanese", notes: "" },
        { productName: "Team Rocket", price: 192, language: "Japanese", notes: "" }
      ]
    },
    // takahiro - Japanese
    {
      supplierName: "takahiro",
      prices: [
        { productName: "Battle Partners Caja 30", price: 62.72, language: "Japanese", notes: "Japanese, no diu shipping" },
        { productName: "151", price: 131.2, language: "Japanese", notes: "" },
        { productName: "Heat Wave Caja 30", price: 121.6, language: "Japanese", notes: "" },
        { productName: "Shiny Treasures", price: 51.84, language: "Japanese", notes: "" },
        { productName: "Terastal Festival", price: 95.36, language: "Japanese", notes: "" },
        { productName: "Lost Abyss", price: 131.2, language: "Japanese", notes: "" },
        { productName: "VStar Universe", price: 91.52, language: "Japanese", notes: "" },
        { productName: "Fusion ARTS", price: 160, language: "Japanese", notes: "" }
      ]
    },
    // Camin Pokemon - Chinese
    {
      supplierName: "Camin Pokemon",
      prices: [
        { productName: "151 gem pack case", price: 390, language: "Chinese", notes: "20 per case" },
        { productName: "151 slim pack case", price: 760, language: "Chinese", notes: "20 per case" },
        { productName: "PTCG Pokemon 8.0 slim pack", price: 770, language: "Chinese", notes: "30 - 15 i 15" },
        { productName: "Mewtwo Vstar box", price: 235, language: "Chinese", notes: "4 per case" },
        { productName: "Charizard Vstar box", price: 235, language: "Chinese", notes: "4 per case" }
      ]
    }
  ];

  // Modificar la función handleAddPrices
  const handleAddPrices = async () => {
    setLoading(true);
    setResults([]);
    setErrors([]);
    setComparisonData([]);
    setDebugInfo([]);
    
    const newResults: string[] = [];
    const newErrors: string[] = [];
    const processedPrices: any[] = [];

    // Filtrar datos por idioma si es necesario
    const filteredData = selectedLanguage === "all" 
      ? pricingData 
      : pricingData.map(supplier => ({
          ...supplier,
          prices: supplier.prices.filter(p => p.language === selectedLanguage)
        })).filter(supplier => supplier.prices.length > 0);

    // Filtrar por nombre de producto si se ha seleccionado uno
    const dataToProcess = selectedProductName 
      ? filteredData.map(supplier => ({
          ...supplier,
          prices: supplier.prices.filter(p => p.productName === selectedProductName)
        })).filter(supplier => supplier.prices.length > 0)
      : filteredData;

    console.log(`Processing ${dataToProcess.length} suppliers after filtering`);
    setDebugInfo(prev => [...prev, `Processing ${dataToProcess.length} suppliers after filtering`]);

    try {
      // Primero asegurarnos de tener los datos actualizados
      await loadCurrentData();
      
      for (const supplier of dataToProcess) {
        const supplierName = supplier.supplierName.trim();
        let supplierId;
        
        try {
          // Usamos el idioma del primer producto como referencia
          const language = supplier.prices[0]?.language || "Unknown";
          supplierId = await findSupplierId(supplierName, language);
          
          if (!supplierId) {
            throw new Error(`Could not get valid supplier ID for ${supplierName}`);
          }
          
          // Verificar que el proveedor existe en la base de datos
          const supplierExists = suppliers.find(s => s.id === supplierId);
          if (!supplierExists) {
            console.warn(`Supplier ID ${supplierId} not found in local state, but exists in DB. Refreshing data...`);
            await loadCurrentData();
          }
        } catch (error) {
          newErrors.push(`Error with supplier ${supplierName}: ${error.message}`);
          continue;
        }

        for (const priceItem of supplier.prices) {
          try {
            const result = await handleAddPrice(priceItem, supplierName, supplierId);
            if (result) {
              newResults.push(`Added price for ${result.productName} from ${supplierName}: ${result.price} ${result.currency}`);
              
              // Almacenar los datos procesados para la comparación
              processedPrices.push({
                productName: priceItem.productName.trim(),
                supplierName,
                price: priceItem.price,
                currency: priceItem.language === "Japanese" ? "JPY" : 
                          priceItem.language === "Korean" ? "KRW" : 
                          priceItem.language === "Chinese" ? "CNY" : "USD",
                language: priceItem.language,
                notes: priceItem.notes
              });
            }
          } catch (error) {
            console.error(`Error adding price for ${priceItem.productName}:`, error);
            newErrors.push(`Error adding price for ${priceItem.productName} from ${supplierName}: ${error.message}`);
          }
        }
      }
      
      console.log(`Added ${newResults.length} prices with ${newErrors.length} errors`);
      setResults(newResults);
      
      // Agrupar por nombre de producto para la comparación
      const comparisonByProduct = processedPrices.reduce((acc, curr) => {
        if (!acc[curr.productName]) {
          acc[curr.productName] = [];
        }
        acc[curr.productName].push(curr);
        return acc;
      }, {});
      
      // Ordenar los precios para cada producto
      Object.keys(comparisonByProduct).forEach(product => {
        comparisonByProduct[product] = comparisonByProduct[product].sort((a, b) => a.price - b.price);
      });
      
      setComparisonData(comparisonByProduct);
      setShowComparison(true);
    } catch (error) {
      console.error("General error in handleAddPrices:", error);
      newErrors.push(`General error: ${error.message}`);
    } finally {
      setErrors(newErrors);
      setLoading(false);
    }
  };

  // Función para asegurarse de tener los datos más recientes
  const loadCurrentData = async () => {
    try {
      const fetchedProducts = await getAllProducts();
      const fetchedSuppliers = await getAllSuppliers();
      
      console.log(`Refreshed data: ${fetchedProducts.length} products and ${fetchedSuppliers.length} suppliers`);
      setDebugInfo(prev => [...prev, `Refreshed data: ${fetchedProducts.length} products, ${fetchedSuppliers.length} suppliers`]);
      
      setProducts(fetchedProducts);
      setSuppliers(fetchedSuppliers);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setErrors(prev => [...prev, `Error refreshing data: ${error}`]);
    }
  };

  // Modificar la función handleAddPricesForSupplier
  const handleAddPricesForSupplier = async (supplierIndex: number) => {
    setLoading(true);
    setResults([]);
    setErrors([]);
    setDebugInfo([]);
    
    const supplier = pricingData[supplierIndex];
    const newResults: string[] = [];
    const newErrors: string[] = [];
    
    try {
      // Primero asegurarnos de tener los datos actualizados
      await loadCurrentData();
      
      const supplierName = supplier.supplierName.trim();
      let supplierId;
      
      try {
        // Usamos el idioma del primer producto como referencia
        const language = supplier.prices[0]?.language || "Unknown";
        supplierId = await findSupplierId(supplierName, language);
        
        if (!supplierId) {
          throw new Error(`Could not get valid supplier ID for ${supplierName}`);
        }
        
        setDebugInfo(prev => [...prev, `Using supplier: ${supplierName} with ID: ${supplierId}`]);
        
        // Verificar que el proveedor existe en la base de datos
        const supplierExists = suppliers.find(s => s.id === supplierId);
        if (!supplierExists) {
          console.warn(`Supplier ID ${supplierId} not found in local state, but exists in DB. Refreshing data...`);
          await loadCurrentData();
        }
      } catch (error) {
        newErrors.push(`Error with supplier ${supplierName}: ${error.message}`);
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      for (const priceItem of supplier.prices) {
        try {
          const result = await handleAddPrice(priceItem, supplierName, supplierId);
          if (result) {
            newResults.push(`Added price for ${result.productName} from ${supplierName}: ${result.price} ${result.currency}`);
          }
        } catch (error) {
          console.error(`Error adding price for ${priceItem.productName}:`, error);
          newErrors.push(`Error adding price for ${priceItem.productName} from ${supplierName}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error("General error in handleAddPricesForSupplier:", error);
      newErrors.push(`General error: ${error.message}`);
    } finally {
      setErrors(newErrors);
      setResults(newResults);
      setLoading(false);
    }
  };

  // Función para generar un objeto con los productos únicos
  const getUniqueProducts = () => {
    const uniqueProducts = new Set();
    
    pricingData.forEach(supplier => {
      supplier.prices.forEach(price => {
        uniqueProducts.add(price.productName);
      });
    });
    
    return Array.from(uniqueProducts).sort();
  };

  // Función para contar el número total de precios
  const getTotalPricesCount = () => {
    return pricingData.reduce((total, supplier) => {
      return total + supplier.prices.length;
    }, 0);
  }

  return (
    <MainLayout>
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-200 mb-6">Add Prices from Asian Suppliers</h1>
          
          <div className="bg-gray-800 rounded-lg p-6 shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-3 text-gray-200">Filter Options</h2>
            
            <div className="flex flex-wrap gap-4 mb-4">
              <div>
                <label htmlFor="language" className="block text-sm font-medium mb-1 text-gray-300">Language:</label>
                <select 
                  id="language"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="p-2 border border-gray-600 bg-gray-700 text-gray-200 rounded"
                >
                  <option value="all">All Languages</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Korean">Korean</option>
                  <option value="Chinese">Chinese</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="productName" className="block text-sm font-medium mb-1 text-gray-300">Product:</label>
                <select 
                  id="productName"
                  value={selectedProductName}
                  onChange={(e) => setSelectedProductName(e.target.value)}
                  className="p-2 border border-gray-600 bg-gray-700 text-gray-200 rounded"
                >
                  <option value="">All Products</option>
                  {getUniqueProducts().map((product, index) => (
                    <option key={index} value={product as string}>{product as string}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="text-sm text-gray-400 mb-4">
              Total products: {getUniqueProducts().length}, Total prices: {getTotalPricesCount()}
            </div>
            
            <button
              onClick={handleAddPrices}
              disabled={loading}
              className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-600 transition mr-4 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Add All Filtered Prices"}
            </button>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-gray-200">Add Prices by Supplier</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pricingData.map((supplier, index) => (
                <div key={index} className="border border-gray-700 rounded p-4 bg-gray-800 shadow-sm">
                  <h3 className="font-medium mb-2 text-gray-200">{supplier.supplierName}</h3>
                  <p className="text-sm text-gray-400 mb-2">
                    {supplier.prices.length} products ({supplier.prices[0]?.language})
                  </p>
                  <button
                    onClick={() => handleAddPricesForSupplier(index)}
                    disabled={loading}
                    className="bg-green-700 text-white px-3 py-1 text-sm rounded hover:bg-green-600 transition disabled:opacity-50"
                  >
                    Add Prices
                  </button>
                </div>
              ))}
            </div>
          </div>

          {debugInfo.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3 text-gray-200">Debug Information</h2>
              <div className="bg-gray-900 p-4 rounded border border-gray-700 overflow-auto max-h-60">
                <ul className="list-disc pl-5">
                  {debugInfo.map((info, index) => (
                    <li key={index} className="mb-1 text-gray-400 text-xs">{info}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {showComparison && Object.keys(comparisonData).length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3 text-gray-200">Price Comparison</h2>
              <div className="overflow-x-auto">
                {Object.entries(comparisonData).map(([productName, prices]: [string, any[]]) => (
                  <div key={productName} className="mb-6 border border-gray-700 rounded p-4 bg-gray-800">
                    <h3 className="font-medium mb-2 text-gray-200">{productName} ({prices[0]?.language})</h3>
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-700">
                          <th className="border border-gray-600 p-2 text-left text-gray-200">Supplier</th>
                          <th className="border border-gray-600 p-2 text-left text-gray-200">Price</th>
                          <th className="border border-gray-600 p-2 text-left text-gray-200">Currency</th>
                          <th className="border border-gray-600 p-2 text-left text-gray-200">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prices.map((price, i) => (
                          <tr key={i} className={i === 0 ? "bg-green-900" : i % 2 === 0 ? "bg-gray-700" : "bg-gray-800"}>
                            <td className="border border-gray-600 p-2 text-gray-300">{price.supplierName}</td>
                            <td className="border border-gray-600 p-2 text-gray-300">{price.price}</td>
                            <td className="border border-gray-600 p-2 text-gray-300">{price.currency}</td>
                            <td className="border border-gray-600 p-2 text-gray-300">{price.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {results.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3 text-gray-200">Results</h2>
              <div className="bg-green-900 p-4 rounded border border-green-700">
                <ul className="list-disc pl-5">
                  {results.map((result, index) => (
                    <li key={index} className="mb-1 text-gray-300">{result}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3 text-red-400">Errors</h2>
              <div className="bg-red-900 p-4 rounded border border-red-700">
                <ul className="list-disc pl-5">
                  {errors.map((error, index) => (
                    <li key={index} className="mb-1 text-red-300">{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <button
            onClick={addTinaCaiPrices}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Add Tina Cai Prices
          </button>
        </div>
      </div>
    </MainLayout>
  );
} 