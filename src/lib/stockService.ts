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

// Interfaz para el ítem de stock
export interface StockItem {
  id?: string;
  product?: string;
  language?: string;
  supplier?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  vatIncluded?: boolean;
  arrivalDate?: string;
  storeQuantity?: number;
  investmentQuantity?: number;
  storeHold?: number;
  paid?: boolean;
  totalStorePrice?: number;
  costPerPerson?: number;
  wallapopPrice?: number;
  amazonPrice?: number;
  cardmarketPrice?: number;
  approxSalePrice?: number;
  profitPerUnit?: number;
  profitPercentage?: number;
  totalProfit?: number;
  tiktokPrice?: number;
  storePrice?: number;
}

// Referencia a la colección de stock en Firestore
const stockCollection = collection(db, "stock");

/**
 * Obtiene todos los ítems de stock
 */
export async function getAllStockItems(): Promise<StockItem[]> {
  try {
    const snapshot = await getDocs(stockCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as StockItem));
  } catch (error) {
    console.error("Error al obtener ítems de stock:", error);
    throw error;
  }
}

/**
 * Añade un nuevo ítem de stock
 * @param stockItem Datos del ítem a añadir
 * @returns ID del ítem creado
 */
export async function addStockItem(stockItem: StockItem): Promise<string> {
  try {
    const docRef = await addDoc(stockCollection, stockItem);
    return docRef.id;
  } catch (error) {
    console.error("Error al añadir ítem de stock:", error);
    throw error;
  }
}

/**
 * Actualiza un ítem de stock existente
 * @param id ID del ítem a actualizar
 * @param stockItem Datos actualizados
 */
export async function updateStockItem(id: string, stockItem: Partial<StockItem>): Promise<void> {
  try {
    const stockDocRef = doc(db, "stock", id);
    await updateDoc(stockDocRef, stockItem);
  } catch (error) {
    console.error(`Error al actualizar ítem de stock ${id}:`, error);
    throw error;
  }
}

/**
 * Elimina un ítem de stock
 * @param id ID del ítem a eliminar
 */
export async function deleteStockItem(id: string): Promise<void> {
  try {
    const stockDocRef = doc(db, "stock", id);
    await deleteDoc(stockDocRef);
  } catch (error) {
    console.error(`Error al eliminar ítem de stock ${id}:`, error);
    throw error;
  }
}

/**
 * Obtiene ítems de stock filtrados por proveedor
 * @param supplierId ID del proveedor
 */
export async function getStockItemsBySupplier(supplier: string): Promise<StockItem[]> {
  try {
    const q = query(stockCollection, where("supplier", "==", supplier));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as StockItem));
  } catch (error) {
    console.error(`Error al obtener ítems de stock por proveedor ${supplier}:`, error);
    throw error;
  }
}

/**
 * Obtiene ítems de stock filtrados por producto
 * @param product Nombre del producto
 */
export async function getStockItemsByProduct(product: string): Promise<StockItem[]> {
  try {
    const q = query(stockCollection, where("product", "==", product));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as StockItem));
  } catch (error) {
    console.error(`Error al obtener ítems de stock por producto ${product}:`, error);
    throw error;
  }
} 