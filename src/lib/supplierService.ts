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

// Interfaz para el proveedor
export interface Supplier {
  id: string;
  name: string;
  origin: string;
  country: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  notes?: string;
  isFavorite?: boolean;
  hasPendingOrder?: boolean;
  region: 'asia' | 'europe' | 'other';
}

// Obtener todos los proveedores
export const getAllSuppliers = async (): Promise<Supplier[]> => {
  try {
    const suppliersCol = collection(db, "suppliers");
    const suppliersSnapshot = await getDocs(suppliersCol);
    return suppliersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Supplier, 'id'>,
      // Asegurar valores por defecto
      origin: doc.data().origin || '-',
      country: doc.data().country || '-',
      contactName: doc.data().contactName || '-',
      email: doc.data().email || '-',
      phone: doc.data().phone || '-',
      website: doc.data().website || '-',
      region: doc.data().region || 'other'
    }));
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

// Función para verificar si hay proveedores en la base de datos (diagnóstico)
export const checkSuppliersExist = async (): Promise<{ exists: boolean, count: number }> => {
  try {
    console.log('FIREBASE: Checking if suppliers collection exists and has documents');
    const suppliersCol = collection(db, "suppliers");
    const snapshot = await getDocs(suppliersCol);
    
    const count = snapshot.size;
    const exists = !snapshot.empty;
    
    console.log(`FIREBASE: Suppliers collection exists: ${exists}, Count: ${count}`);
    
    return { exists, count };
  } catch (error) {
    console.error("Error checking suppliers collection:", error);
    return { exists: false, count: 0 };
  }
};

export const toggleFavorite = async (id: string, isFavorite: boolean): Promise<void> => {
  await updateSupplier(id, { isFavorite });
};

export const togglePendingOrder = async (id: string, hasPendingOrder: boolean): Promise<void> => {
  await updateSupplier(id, { hasPendingOrder });
};

// Obtener conteo de proveedores por región
export const getSupplierCountsByRegion = async (): Promise<{
  asia: number;
  europe: number;
  pending: number;
}> => {
  try {
    const suppliersCol = collection(db, "suppliers");
    const suppliersSnapshot = await getDocs(suppliersCol);
    
    const counts = {
      asia: 0,
      europe: 0,
      pending: 0
    };

    suppliersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      // Contar por región
      if (data.region === 'asian') counts.asia++;
      if (data.region === 'european') counts.europe++;
      // Contar pendientes (sin email o teléfono)
      if (!data.email || data.email.trim() === '' || !data.phone || data.phone.trim() === '') {
        counts.pending++;
      }
    });

    return counts;
  } catch (error) {
    console.error("Error getting supplier counts:", error);
    return { asia: 0, europe: 0, pending: 0 };
  }
};

// Obtener un proveedor por su ID
export const getSupplierById = async (id: string): Promise<Supplier | null> => {
  try {
    const supplierRef = doc(db, "suppliers", id);
    const supplierDoc = await getDoc(supplierRef);
    
    if (supplierDoc.exists()) {
      return {
        id: supplierDoc.id,
        ...supplierDoc.data() as Omit<Supplier, 'id'>,
        // Asegurar valores por defecto
        origin: supplierDoc.data().origin || '-',
        country: supplierDoc.data().country || '-',
        contactName: supplierDoc.data().contactName || '-',
        email: supplierDoc.data().email || '-',
        phone: supplierDoc.data().phone || '-',
        website: supplierDoc.data().website || '-',
        region: supplierDoc.data().region || 'other'
      };
    }
    return null;
  } catch (error) {
    console.error(`Error getting supplier ${id}:`, error);
    throw error;
  }
}; 