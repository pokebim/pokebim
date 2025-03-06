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

// Interfaz para el precio
export interface Price {
  id?: string;
  price?: number;
  currency?: string;
  productId?: string;
  supplierId?: string;
  date?: string;
}

// Obtener todos los precios
export const getAllPrices = async (): Promise<Price[]> => {
  try {
    const pricesCol = collection(db, "prices");
    const snapshot = await getDocs(pricesCol);
    
    return snapshot.docs.map(doc => {
      return { 
        id: doc.id, 
        ...doc.data() as Omit<Price, 'id'> 
      };
    });
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
    const pricesCol = collection(db, "prices");
    const q = query(pricesCol, where("supplierId", "==", supplierId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      return { 
        id: doc.id, 
        ...doc.data() as Omit<Price, 'id'> 
      };
    });
  } catch (error) {
    console.error(`Error getting prices for supplier ${supplierId}:`, error);
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