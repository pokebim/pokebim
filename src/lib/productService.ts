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

// Obtener todos los productos
export const getAllProducts = async (): Promise<Product[]> => {
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount <= maxRetries) {
    try {
      console.log(`FIREBASE: Intentando cargar productos (intento ${retryCount + 1}/${maxRetries + 1})`);
      
      // Intentar un enfoque alternativo para cargar productos
      const productsCol = collection(db, "products");
      const productsSnapshot = await getDocs(productsCol);
      
      if (productsSnapshot.empty) {
        console.warn('FIREBASE: No se encontraron documentos en la colección "products"');
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount)));
        continue;
      }
      
      const result: Product[] = [];
      
      // Procesar cada documento manualmente
      productsSnapshot.forEach((doc) => {
        try {
          const data = doc.data();
          const product: Product = {
            id: doc.id,
            name: data.name || 'Sin nombre',
            description: data.description || '',
            language: data.language || 'es',
            type: data.type || 'regular', // Asegurar que siempre tenga un tipo
            imageUrl: data.imageUrl || `https://via.placeholder.com/400x400?text=${encodeURIComponent(data.name || 'Producto')}`,
            notes: data.notes || '',
            cardmarketUrl: data.cardmarketUrl || '',
            cardmarketPrice: data.cardmarketPrice || 0,
            lastPriceUpdate: data.lastPriceUpdate || null
          };
          result.push(product);
        } catch (itemError) {
          console.error(`FIREBASE: Error al procesar producto ${doc.id}:`, itemError);
        }
      });
      
      console.log(`FIREBASE: Carga de productos exitosa. ${result.length} productos cargados.`);
      
      // Verificar si hay productos sin campo type
      const productsWithoutType = result.filter(p => !p.type);
      if (productsWithoutType.length > 0) {
        console.warn(`FIREBASE: Se encontraron ${productsWithoutType.length} productos sin campo 'type'`);
      }
      
      return result;
    } catch (error) {
      console.error(`FIREBASE: Error al cargar productos (intento ${retryCount + 1}):`, error);
      
      if (retryCount >= maxRetries) {
        console.error('FIREBASE: Se agotaron los intentos de carga de productos.');
        return [];
      }
      
      retryCount++;
      // Esperar un tiempo incremental antes de reintentar
      const delayMs = 1000 * retryCount;
      console.log(`FIREBASE: Reintentando en ${delayMs / 1000} segundos...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // Este punto no debería alcanzarse debido al manejo de errores anterior
  console.error('FIREBASE: Fallo al cargar productos después de múltiples intentos');
  return [];
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