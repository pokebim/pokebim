import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc,
  query, 
  where 
} from "firebase/firestore/lite";
import { db } from "./firebase";

// Interfaz para el producto
export interface Product {
  id?: string;
  name?: string;
  language?: string;
  imageUrl?: string;
  description?: string;
  notes?: string;
  type?: string;  // Tipo de producto para facilitar clasificación
  cardmarketUrl?: string; // Enlace a Cardmarket
  cardmarketPrice?: number; // Precio más barato de Cardmarket
  lastPriceUpdate?: any; // Fecha de la última actualización del precio
}

// Clave para la caché de productos
const PRODUCTS_CACHE_KEY = 'pokebim_products_cache';
const PRODUCTS_CACHE_TIMESTAMP_KEY = 'pokebim_products_cache_timestamp';
const CACHE_TTL = 1000 * 60 * 30; // 30 minutos

// Obtener todos los productos
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    // Verificar si tenemos una caché válida
    const cachedData = getCachedProducts();
    if (cachedData) {
      console.log('Usando productos en caché local');
      return cachedData;
    }
    
    console.log('Cargando productos desde Firebase...');
    const productsCol = collection(db, "products");
    const productsSnapshot = await getDocs(productsCol);
    
    if (productsSnapshot.empty) {
      console.warn('No se encontraron documentos en la colección "products"');
      return [];
    }
    
    const result: Product[] = [];
    
    // Procesar cada documento
    productsSnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        const product: Product = {
          id: doc.id,
          name: data.name || 'Sin nombre',
          description: data.description || '',
          language: data.language || 'es',
          type: data.type || 'regular',
          imageUrl: data.imageUrl || '',
          notes: data.notes || '',
          cardmarketUrl: data.cardmarketUrl || '',
          cardmarketPrice: data.cardmarketPrice || 0,
          lastPriceUpdate: data.lastPriceUpdate || null
        };
        result.push(product);
      } catch (itemError) {
        console.error(`Error al procesar producto ${doc.id}:`, itemError);
      }
    });
    
    // Guardar en caché
    cacheProducts(result);
    
    console.log(`Cargados ${result.length} productos desde Firebase`);
    return result;
    
  } catch (err) {
    console.error('Error al cargar productos:', err);
    
    // Si hay un error, intentar usar la caché aunque esté expirada
    const cachedData = getCachedProducts(true);
    if (cachedData) {
      console.log('Usando caché expirada debido a error');
      return cachedData;
    }
    
    return [];
  }
};

// Obtener productos de la caché
const getCachedProducts = (ignoreExpiry = false): Product[] | null => {
  try {
    const cachedProducts = localStorage.getItem(PRODUCTS_CACHE_KEY);
    const timestamp = localStorage.getItem(PRODUCTS_CACHE_TIMESTAMP_KEY);
    
    if (!cachedProducts || !timestamp) return null;
    
    // Verificar si la caché ha expirado
    if (!ignoreExpiry) {
      const cacheTime = parseInt(timestamp, 10);
      const now = Date.now();
      if (now - cacheTime > CACHE_TTL) {
        console.log('La caché de productos ha expirado');
        return null;
      }
    }
    
    return JSON.parse(cachedProducts);
  } catch (error) {
    console.error('Error al leer la caché de productos:', error);
    return null;
  }
};

// Guardar productos en caché
const cacheProducts = (products: Product[]): void => {
  try {
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
    localStorage.setItem(PRODUCTS_CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log(`${products.length} productos guardados en caché local`);
  } catch (error) {
    console.error('Error al guardar productos en caché:', error);
  }
};

// Invalidar la caché de productos
export const invalidateProductsCache = (): void => {
  try {
    localStorage.removeItem(PRODUCTS_CACHE_KEY);
    localStorage.removeItem(PRODUCTS_CACHE_TIMESTAMP_KEY);
    console.log('Caché de productos invalidada');
  } catch (error) {
    console.error('Error al invalidar caché de productos:', error);
  }
};

// Obtener productos por proveedor
export const getProductsBySupplier = async (supplierId: string): Promise<Product[]> => {
  try {
    const productsCol = collection(db, "products");
    const q = query(productsCol, where("supplierId", "==", supplierId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      return { 
        id: doc.id, 
        ...doc.data() as Omit<Product, 'id'> 
      };
    });
  } catch (error) {
    console.error(`Error getting products for supplier ${supplierId}:`, error);
    throw error;
  }
};

// Añadir un nuevo producto
export const addProduct = async (product: Omit<Product, 'id'>): Promise<string> => {
  try {
    const productsCol = collection(db, "products");
    const docRef = await addDoc(productsCol, product);
    return docRef.id;
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

// Actualizar un producto existente
export const updateProduct = async (id: string, product: Partial<Product>): Promise<void> => {
  try {
    const productRef = doc(db, "products", id);
    await updateDoc(productRef, product);
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }
};

// Eliminar un producto
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const productRef = doc(db, "products", id);
    await deleteDoc(productRef);
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
};

// Función para verificar si hay productos en la base de datos (diagnóstico)
export const checkProductsExist = async (): Promise<{ exists: boolean, count: number }> => {
  try {
    console.log('FIREBASE: Checking if products collection exists and has documents');
    const productsCol = collection(db, "products");
    const snapshot = await getDocs(productsCol);
    
    const count = snapshot.size;
    const exists = !snapshot.empty;
    
    console.log(`FIREBASE: Products collection exists: ${exists}, Count: ${count}`);
    
    return { exists, count };
  } catch (error) {
    console.error("Error checking products collection:", error);
    return { exists: false, count: 0 };
  }
};

// Actualizar el precio de Cardmarket para un producto
export const updateCardmarketPrice = async (id: string, cardmarketPrice: number): Promise<void> => {
  try {
    const productRef = doc(db, "products", id);
    await updateDoc(productRef, { 
      cardmarketPrice, 
      lastPriceUpdate: new Date() 
    });
    console.log(`FIREBASE: Precio de Cardmarket actualizado para el producto ${id}: ${cardmarketPrice}€`);
  } catch (error) {
    console.error(`Error updating Cardmarket price for product ${id}:`, error);
    throw error;
  }
};

// Actualizar el precio de Cardmarket para múltiples productos
export const updateBulkCardmarketPrices = async (productPrices: {id: string, price: number}[]): Promise<void> => {
  try {
    // Crear un array de promesas para actualizar cada producto
    const updatePromises = productPrices.map(item => 
      updateCardmarketPrice(item.id, item.price)
    );
    
    // Ejecutar todas las actualizaciones en paralelo
    await Promise.all(updatePromises);
    
    console.log(`FIREBASE: Precios de Cardmarket actualizados para ${productPrices.length} productos`);
  } catch (error) {
    console.error(`Error updating bulk Cardmarket prices:`, error);
    throw error;
  }
}; 