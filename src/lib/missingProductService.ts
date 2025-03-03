import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore/lite";
import { db } from "./firebase";

// Interfaz para productos que faltan
export interface MissingProduct {
  id?: string;
  name: string;
  link?: string; // Enlace a Aliexpress u otra tienda
  price?: number;
  quantity?: number; // Cantidad aproximada necesaria
  purpose?: string;  // Para qué sirve
  notes?: string;
  priority?: 'high' | 'medium' | 'low'; // Prioridad de compra
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Obtiene todos los productos que faltan
 */
export async function getAllMissingProducts(): Promise<MissingProduct[]> {
  try {
    const productsCollection = collection(db, "missingProducts");
    const q = query(productsCollection, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      return { 
        id: doc.id, 
        ...doc.data() as Omit<MissingProduct, 'id'> 
      };
    });
  } catch (error) {
    console.error("Error getting missing products:", error);
    throw error;
  }
}

/**
 * Obtiene un producto que falta por su ID
 */
export async function getMissingProductById(id: string): Promise<MissingProduct | null> {
  try {
    const docRef = doc(db, "missingProducts", id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return { 
      id: snapshot.id, 
      ...snapshot.data() as Omit<MissingProduct, 'id'> 
    };
  } catch (error) {
    console.error(`Error getting missing product ${id}:`, error);
    throw error;
  }
}

/**
 * Crea un nuevo producto que falta
 */
export async function createMissingProduct(product: Omit<MissingProduct, 'id'>): Promise<string> {
  try {
    const productData = {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "missingProducts"), productData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating missing product:", error);
    throw error;
  }
}

/**
 * Actualiza un producto que falta existente
 */
export async function updateMissingProduct(id: string, product: Partial<MissingProduct>): Promise<void> {
  try {
    const productRef = doc(db, "missingProducts", id);
    const updateData = {
      ...product,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(productRef, updateData);
  } catch (error) {
    console.error(`Error updating missing product ${id}:`, error);
    throw error;
  }
}

/**
 * Elimina un producto que falta
 */
export async function deleteMissingProduct(id: string): Promise<void> {
  try {
    const productRef = doc(db, "missingProducts", id);
    await deleteDoc(productRef);
  } catch (error) {
    console.error(`Error deleting missing product ${id}:`, error);
    throw error;
  }
} 