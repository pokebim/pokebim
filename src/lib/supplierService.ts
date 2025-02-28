import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from "firebase/firestore";
import { db } from "./firebase";

// Interfaz para el proveedor
export interface Supplier {
  id?: string;
  name?: string;
  website?: string;
  country?: string;
  email?: string;
  phone?: string;
  contactName?: string;
  origin?: string;
  region?: string;
  notes?: string;
}

// Obtener todos los proveedores
export const getAllSuppliers = async (): Promise<Supplier[]> => {
  try {
    const suppliersCol = collection(db, "suppliers");
    const snapshot = await getDocs(suppliersCol);
    
    return snapshot.docs.map(doc => {
      return { 
        id: doc.id, 
        ...doc.data() as Omit<Supplier, 'id'> 
      };
    });
  } catch (error) {
    console.error("Error getting suppliers:", error);
    throw error;
  }
};

// Obtener proveedores por región
export const getSuppliersByRegion = async (region: string): Promise<Supplier[]> => {
  try {
    const suppliersCol = collection(db, "suppliers");
    const q = query(suppliersCol, where("region", "==", region));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      return { 
        id: doc.id, 
        ...doc.data() as Omit<Supplier, 'id'> 
      };
    });
  } catch (error) {
    console.error(`Error getting suppliers for region ${region}:`, error);
    throw error;
  }
};

// Añadir un nuevo proveedor
export const addSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<string> => {
  try {
    const suppliersCol = collection(db, "suppliers");
    const docRef = await addDoc(suppliersCol, supplier);
    return docRef.id;
  } catch (error) {
    console.error("Error adding supplier:", error);
    throw error;
  }
};

// Actualizar un proveedor existente
export const updateSupplier = async (id: string, supplier: Partial<Supplier>): Promise<void> => {
  try {
    const supplierRef = doc(db, "suppliers", id);
    await updateDoc(supplierRef, supplier);
  } catch (error) {
    console.error(`Error updating supplier ${id}:`, error);
    throw error;
  }
};

// Eliminar un proveedor
export const deleteSupplier = async (id: string): Promise<void> => {
  try {
    const supplierRef = doc(db, "suppliers", id);
    await deleteDoc(supplierRef);
  } catch (error) {
    console.error(`Error deleting supplier ${id}:`, error);
    throw error;
  }
};

// Interfaz para proveedores pendientes
export interface MissingSupplier {
  id?: string;
  name: string;
  email: string;
  emailSent: boolean;
  emailDate?: string;
  responded: boolean;
  info: string;
}

// Obtener todos los proveedores pendientes
export const getAllMissingSuppliers = async (): Promise<MissingSupplier[]> => {
  try {
    const missingCol = collection(db, "missingSuppliers");
    const snapshot = await getDocs(missingCol);
    
    return snapshot.docs.map(doc => {
      return { 
        id: doc.id, 
        ...doc.data() as Omit<MissingSupplier, 'id'> 
      };
    });
  } catch (error) {
    console.error("Error getting missing suppliers:", error);
    throw error;
  }
};

// Añadir un nuevo proveedor pendiente
export const addMissingSupplier = async (supplier: Omit<MissingSupplier, 'id'>): Promise<string> => {
  try {
    const missingCol = collection(db, "missingSuppliers");
    const docRef = await addDoc(missingCol, supplier);
    return docRef.id;
  } catch (error) {
    console.error("Error adding missing supplier:", error);
    throw error;
  }
};

// Actualizar un proveedor pendiente
export const updateMissingSupplier = async (id: string, supplier: Partial<MissingSupplier>): Promise<void> => {
  try {
    const supplierRef = doc(db, "missingSuppliers", id);
    await updateDoc(supplierRef, supplier);
  } catch (error) {
    console.error(`Error updating missing supplier ${id}:`, error);
    throw error;
  }
};

// Eliminar un proveedor pendiente
export const deleteMissingSupplier = async (id: string): Promise<void> => {
  try {
    const supplierRef = doc(db, "missingSuppliers", id);
    await deleteDoc(supplierRef);
  } catch (error) {
    console.error(`Error deleting missing supplier ${id}:`, error);
    throw error;
  }
}; 