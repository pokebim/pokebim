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
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount <= maxRetries) {
    try {
      console.log(`FIREBASE: Intentando cargar proveedores (intento ${retryCount + 1}/${maxRetries + 1})`);
      
      // Intentar un enfoque alternativo para cargar proveedores
      const suppliersCol = collection(db, "suppliers");
      const suppliersSnapshot = await getDocs(suppliersCol);
      
      if (suppliersSnapshot.empty) {
        console.warn('FIREBASE: No se encontraron documentos en la colección "suppliers"');
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount)));
        continue;
      }
      
      const result: Supplier[] = [];
      
      // Procesar cada documento manualmente
      suppliersSnapshot.forEach((doc) => {
        try {
          const data = doc.data();
          const supplier: Supplier = {
            id: doc.id,
            name: data.name || 'Sin nombre',
            email: data.email || '',
            phone: data.phone || '',
            notes: data.notes || '',
          };
          result.push(supplier);
        } catch (itemError) {
          console.error(`FIREBASE: Error al procesar proveedor ${doc.id}:`, itemError);
        }
      });
      
      console.log(`FIREBASE: Carga de proveedores exitosa. ${result.length} proveedores cargados.`);
      return result;
    } catch (error) {
      console.error(`FIREBASE: Error al cargar proveedores (intento ${retryCount + 1}):`, error);
      
      if (retryCount >= maxRetries) {
        console.error('FIREBASE: Se agotaron los intentos de carga de proveedores.');
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
  console.error('FIREBASE: Fallo al cargar proveedores después de múltiples intentos');
  return [];
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