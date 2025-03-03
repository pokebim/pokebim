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

// Interfaz para materiales del inventario
export interface Material {
  id?: string;
  name: string;
  description?: string;
  quantity?: number;
  location?: string; // Ubicación dentro del almacén/oficina
  purchasedAt?: any; // Fecha de compra
  purchasePrice?: number; // Precio de compra
  supplier?: string; // Proveedor o tienda
  minStock?: number; // Nivel mínimo de stock recomendado
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Obtiene todos los materiales del inventario
 */
export async function getAllMaterials(): Promise<Material[]> {
  try {
    const materialsCollection = collection(db, "materials");
    const q = query(materialsCollection, orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      return { 
        id: doc.id, 
        ...doc.data() as Omit<Material, 'id'> 
      };
    });
  } catch (error) {
    console.error("Error getting materials:", error);
    throw error;
  }
}

/**
 * Obtiene un material por su ID
 */
export async function getMaterialById(id: string): Promise<Material | null> {
  try {
    const docRef = doc(db, "materials", id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return { 
      id: snapshot.id, 
      ...snapshot.data() as Omit<Material, 'id'> 
    };
  } catch (error) {
    console.error(`Error getting material ${id}:`, error);
    throw error;
  }
}

/**
 * Crea un nuevo material en el inventario
 */
export async function createMaterial(material: Omit<Material, 'id'>): Promise<string> {
  try {
    const materialData = {
      ...material,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "materials"), materialData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating material:", error);
    throw error;
  }
}

/**
 * Actualiza un material existente
 */
export async function updateMaterial(id: string, material: Partial<Material>): Promise<void> {
  try {
    const materialRef = doc(db, "materials", id);
    const updateData = {
      ...material,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(materialRef, updateData);
  } catch (error) {
    console.error(`Error updating material ${id}:`, error);
    throw error;
  }
}

/**
 * Elimina un material del inventario
 */
export async function deleteMaterial(id: string): Promise<void> {
  try {
    const materialRef = doc(db, "materials", id);
    await deleteDoc(materialRef);
  } catch (error) {
    console.error(`Error deleting material ${id}:`, error);
    throw error;
  }
}

/**
 * Actualiza la cantidad de un material en el inventario
 */
export async function updateMaterialQuantity(id: string, newQuantity: number): Promise<void> {
  try {
    const materialRef = doc(db, "materials", id);
    await updateDoc(materialRef, { 
      quantity: newQuantity,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error updating material quantity ${id}:`, error);
    throw error;
  }
} 