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
} from "firebase/firestore/lite";
import { db } from "./firebase";

// Interfaz para el proveedor
export interface Supplier {
  id?: string;
  name: string;
  country: string;
  url?: string;
  city?: string;
  notes?: string;
  verified?: boolean;
  createdAt?: any;
  updatedAt?: any;
  isFavorite?: boolean;
  region?: string;
  email?: string;
  phone?: string;
  website?: string;
}

// Clave para la caché de proveedores
const SUPPLIERS_CACHE_KEY = 'pokebim_suppliers_cache';
const SUPPLIERS_CACHE_TIMESTAMP_KEY = 'pokebim_suppliers_cache_timestamp';
const CACHE_TTL = 1000 * 60 * 60; // 1 hora

// Obtener todos los proveedores
export const getAllSuppliers = async (): Promise<Supplier[]> => {
  try {
    // Verificar si tenemos una caché válida
    const cachedData = getCachedSuppliers();
    if (cachedData) {
      console.log('Usando proveedores en caché local');
      return cachedData;
    }
    
    console.log('Cargando proveedores desde Firebase...');
    const suppliersCol = collection(db, "suppliers");
    const supplierSnapshot = await getDocs(suppliersCol);
    
    if (supplierSnapshot.empty) {
      console.warn('No se encontraron proveedores');
      return [];
    }
    
    const result: Supplier[] = [];
    
    supplierSnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        const supplier: Supplier = {
          id: doc.id,
          name: data.name || 'Sin nombre',
          country: data.country || 'Desconocido',
          url: data.url || '',
          city: data.city || '',
          notes: data.notes || '',
          verified: data.verified || false,
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
          isFavorite: data.isFavorite === true,
          region: data.region || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || ''
        };
        result.push(supplier);
      } catch (itemError) {
        console.error(`Error al procesar proveedor ${doc.id}:`, itemError);
      }
    });
    
    // Guardar en caché
    cacheSuppliers(result);
    
    console.log(`Cargados ${result.length} proveedores desde Firebase`);
    return result;
  } catch (err) {
    console.error('Error al cargar proveedores:', err);
    
    // Si hay un error, intentar usar la caché aunque esté expirada
    const cachedData = getCachedSuppliers(true);
    if (cachedData) {
      console.log('Usando caché expirada de proveedores debido a error');
      return cachedData;
    }
    
    return [];
  }
};

// Obtener proveedores de la caché
const getCachedSuppliers = (ignoreExpiry = false): Supplier[] | null => {
  try {
    const cachedSuppliers = localStorage.getItem(SUPPLIERS_CACHE_KEY);
    const timestamp = localStorage.getItem(SUPPLIERS_CACHE_TIMESTAMP_KEY);
    
    if (!cachedSuppliers || !timestamp) return null;
    
    // Verificar si la caché ha expirado
    if (!ignoreExpiry) {
      const cacheTime = parseInt(timestamp, 10);
      const now = Date.now();
      if (now - cacheTime > CACHE_TTL) {
        console.log('La caché de proveedores ha expirado');
        return null;
      }
    }
    
    return JSON.parse(cachedSuppliers);
  } catch (error) {
    console.error('Error al leer la caché de proveedores:', error);
    return null;
  }
};

// Guardar proveedores en caché
const cacheSuppliers = (suppliers: Supplier[]): void => {
  try {
    localStorage.setItem(SUPPLIERS_CACHE_KEY, JSON.stringify(suppliers));
    localStorage.setItem(SUPPLIERS_CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log(`${suppliers.length} proveedores guardados en caché local`);
  } catch (error) {
    console.error('Error al guardar proveedores en caché:', error);
  }
};

// Invalidar la caché de proveedores
export const invalidateSuppliersCache = (): void => {
  try {
    localStorage.removeItem(SUPPLIERS_CACHE_KEY);
    localStorage.removeItem(SUPPLIERS_CACHE_TIMESTAMP_KEY);
    console.log('Caché de proveedores invalidada');
  } catch (error) {
    console.error('Error al invalidar caché de proveedores:', error);
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
export const addSupplier = async (supplierData: Omit<Supplier, 'id'>): Promise<string> => {
  const dataToSave = {
    ...supplierData,
    isFavorite: supplierData.isFavorite || false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  
  const docRef = await addDoc(collection(db, "suppliers"), dataToSave);
  
  // Invalidar caché
  invalidateSuppliersCache();
  
  return docRef.id;
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

// Marcar/desmarcar proveedor como favorito
export const toggleFavorite = async (id: string, isFavorite: boolean): Promise<void> => {
  try {
    console.log(`Actualizando favorito para proveedor ${id} a ${isFavorite}`);
    const supplierRef = doc(db, "suppliers", id);
    
    await updateDoc(supplierRef, { 
      isFavorite: isFavorite,
      updatedAt: Timestamp.now()
    });
    
    // Invalidar caché
    invalidateSuppliersCache();
    
    console.log(`Favorito actualizado correctamente para proveedor ${id}`);
  } catch (error) {
    console.error(`Error toggling favorite for supplier ${id}:`, error);
    throw error;
  }
};

// Interfaz para proveedores pendientes
export interface MissingSupplier {
  id?: string;
  name: string;
  country: string;
  email: string;
  phone: string;
  notes: string;
  website: string;
  createdAt?: any;
  updatedAt?: any;
}

// Obtener todos los proveedores pendientes
export const getAllMissingSuppliers = async (): Promise<MissingSupplier[]> => {
  try {
    console.log('Cargando proveedores pendientes desde Firebase...');
    const missingCol = collection(db, "suppliers");
    const q = query(missingCol, where("region", "==", "missing"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('No se encontraron proveedores pendientes');
      return [];
    }

    const result: MissingSupplier[] = [];
    
    snapshot.forEach((doc) => {
      try {
        const data = doc.data();
        const supplier: MissingSupplier = {
          id: doc.id,
          name: data.name || 'Sin nombre',
          country: data.country || '',
          email: data.email || '',
          phone: data.phone || '',
          notes: data.notes || '',
          website: data.website || '',
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null
        };
        result.push(supplier);
      } catch (itemError) {
        console.error(`Error al procesar proveedor pendiente ${doc.id}:`, itemError);
      }
    });
    
    console.log(`Cargados ${result.length} proveedores pendientes desde Firebase`);
    return result;
  } catch (error) {
    console.error("Error getting missing suppliers:", error);
    throw error;
  }
};

// Añadir un nuevo proveedor pendiente
export const addMissingSupplier = async (supplier: Omit<MissingSupplier, 'id'>): Promise<string> => {
  try {
    const dataToSave = {
      ...supplier,
      region: 'missing',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, "suppliers"), dataToSave);
    return docRef.id;
  } catch (error) {
    console.error("Error adding missing supplier:", error);
    throw error;
  }
};

// Actualizar un proveedor pendiente
export const updateMissingSupplier = async (id: string, supplier: Partial<MissingSupplier>): Promise<void> => {
  try {
    const dataToUpdate = {
      ...supplier,
      updatedAt: Timestamp.now()
    };
    
    const supplierRef = doc(db, "suppliers", id);
    await updateDoc(supplierRef, dataToUpdate);
  } catch (error) {
    console.error(`Error updating missing supplier ${id}:`, error);
    throw error;
  }
};

// Eliminar un proveedor pendiente
export const deleteMissingSupplier = async (id: string): Promise<void> => {
  try {
    const supplierRef = doc(db, "suppliers", id);
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