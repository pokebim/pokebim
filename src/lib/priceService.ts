import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc,
  query, 
  where,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { Currency } from "./currencyConverter";

// Interfaz para el precio
export interface Price {
  id: string;
  productId: string;
  supplierId: string;
  price: number;
  currency: Currency;
  shippingCost?: number;
  createdAt?: any;
  updatedAt?: any;
}

// Obtener todos los precios
export const getAllPrices = async (): Promise<Price[]> => {
  try {
    console.log('Obteniendo todos los precios...');
    const pricesCol = collection(db, "prices");
    const snapshot = await getDocs(pricesCol);
    
    const prices = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        productId: data.productId || '',
        supplierId: data.supplierId || '',
        price: Number(data.price) || 0,
        currency: data.currency || 'EUR',
        shippingCost: Number(data.shippingCost) || 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      } as Price;
    });

    console.log(`Total de precios obtenidos: ${prices.length}`);
    return prices;
  } catch (error) {
    console.error("Error getting prices:", error);
    throw error;
  }
};

// Obtener precios por producto
export const getPricesByProduct = async (productId: string): Promise<Price[]> => {
  try {
    const pricesCol = collection(db, "prices");
    const q = query(pricesCol, where("productId", "==", productId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      return { 
        id: doc.id, 
        ...doc.data() as Omit<Price, 'id'> 
      };
    });
  } catch (error) {
    console.error(`Error getting prices for product ${productId}:`, error);
    throw error;
  }
};

// Obtener precios por proveedor
export const getPricesBySupplier = async (supplierId: string): Promise<Price[]> => {
  try {
    console.log('Iniciando búsqueda de precios para el proveedor:', supplierId);
    
    if (!supplierId) {
      console.error('ID de proveedor no proporcionado');
      return [];
    }

    const pricesCol = collection(db, "prices");
    const q = query(pricesCol, where("supplierId", "==", supplierId));
    
    // Log the query details
    console.log('Query details:', {
      collection: 'prices',
      field: 'supplierId',
      operator: '==',
      value: supplierId
    });
    
    const snapshot = await getDocs(q);
    console.log(`Encontrados ${snapshot.size} documentos para el proveedor ${supplierId}`);
    
    if (snapshot.empty) {
      console.log('No se encontraron precios para el proveedor');
      // Log a sample of all prices to debug
      const allPrices = await getAllPrices();
      const uniqueSupplierIds = new Set(allPrices.map(p => p.supplierId));
      console.log('Supplier IDs in database:', Array.from(uniqueSupplierIds));
      return [];
    }

    const prices = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`Procesando documento ${doc.id}:`, data);
      
      return {
        id: doc.id,
        productId: data.productId,
        supplierId: data.supplierId,
        price: Number(data.price) || 0,
        currency: data.currency || 'EUR',
        shippingCost: Number(data.shippingCost) || 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      } as Price;
    });

    console.log(`Total de precios procesados: ${prices.length}`);
    return prices;
  } catch (error) {
    console.error("Error obteniendo precios del proveedor:", error);
    throw error;
  }
};

// Añadir un nuevo precio
export const addPrice = async (price: Omit<Price, 'id'>): Promise<string> => {
  try {
    // Asegurarse de que la fecha se guarda como string
    const priceToSave = {
      ...price,
      date: price.date || new Date().toISOString().split('T')[0]
    };
    
    const pricesCol = collection(db, "prices");
    const docRef = await addDoc(pricesCol, priceToSave);
    return docRef.id;
  } catch (error) {
    console.error("Error adding price:", error);
    throw error;
  }
};

// Actualizar un precio existente
export const updatePrice = async (id: string, price: Partial<Price>): Promise<void> => {
  try {
    const priceRef = doc(db, "prices", id);
    await updateDoc(priceRef, price);
  } catch (error) {
    console.error(`Error updating price ${id}:`, error);
    throw error;
  }
};

// Eliminar un precio
export const deletePrice = async (id: string): Promise<void> => {
  try {
    const priceRef = doc(db, "prices", id);
    await deleteDoc(priceRef);
  } catch (error) {
    console.error(`Error deleting price ${id}:`, error);
    throw error;
  }
}; 