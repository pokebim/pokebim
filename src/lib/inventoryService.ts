import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where
} from "firebase/firestore/lite";
import { db } from "./firebase";

// Interfaz para el ítem de inventario
export interface InventoryItem {
  id?: string;
  productId: string;
  quantity: number;
  location?: string;
  condition?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  purchaseCurrency?: string;
  notes?: string;
}

// Obtener todos los ítems de inventario
export const getAllInventoryItems = async (): Promise<InventoryItem[]> => {
  try {
    const inventoryCol = collection(db, "inventory");
    const snapshot = await getDocs(inventoryCol);
    
    return snapshot.docs.map(doc => {
      return { 
        id: doc.id, 
        ...doc.data() as Omit<InventoryItem, 'id'> 
      };
    });
  } catch (error) {
    console.error("Error getting inventory items:", error);
    throw error;
  }
};

// Obtener ítems de inventario por producto
export const getInventoryItemsByProduct = async (productId: string): Promise<InventoryItem[]> => {
  try {
    const inventoryCol = collection(db, "inventory");
    const q = query(inventoryCol, where("productId", "==", productId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      return { 
        id: doc.id, 
        ...doc.data() as Omit<InventoryItem, 'id'> 
      };
    });
  } catch (error) {
    console.error(`Error getting inventory items for product ${productId}:`, error);
    throw error;
  }
};

// Añadir un nuevo ítem de inventario
export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<string> => {
  try {
    const inventoryCol = collection(db, "inventory");
    const docRef = await addDoc(inventoryCol, item);
    return docRef.id;
  } catch (error) {
    console.error("Error adding inventory item:", error);
    throw error;
  }
};

// Actualizar un ítem de inventario existente
export const updateInventoryItem = async (id: string, item: Partial<InventoryItem>): Promise<void> => {
  try {
    const itemRef = doc(db, "inventory", id);
    await updateDoc(itemRef, item);
  } catch (error) {
    console.error(`Error updating inventory item ${id}:`, error);
    throw error;
  }
};

// Eliminar un ítem de inventario
export const deleteInventoryItem = async (id: string): Promise<void> => {
  try {
    const itemRef = doc(db, "inventory", id);
    await deleteDoc(itemRef);
  } catch (error) {
    console.error(`Error deleting inventory item ${id}:`, error);
    throw error;
  }
}; 