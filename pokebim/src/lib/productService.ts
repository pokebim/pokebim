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

// Interfaz para el producto
export interface Product {
  id?: string;
  name?: string;
  language?: string;
  supplierId?: string;
  notes?: string;
}

// Obtener todos los productos
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const productsCol = collection(db, "products");
    const snapshot = await getDocs(productsCol);
    
    return snapshot.docs.map(doc => {
      return { 
        id: doc.id, 
        ...doc.data() as Omit<Product, 'id'> 
      };
    });
  } catch (error) {
    console.error("Error getting products:", error);
    throw error;
  }
};

// Obtener productos por proveedor
export const getProductsBySupplier = async (supplierId: string): Promise<Product[]> => {
  try {
    const productsCol = collection(db, "products");
    const q = query(productsCol, where("supplierId", "==", supplierId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      return { 
        id: doc.id, 
        ...doc.data() as Omit<Product, 'id'> 
      };
    });
  } catch (error) {
    console.error(`Error getting products for supplier ${supplierId}:`, error);
    throw error;
  }
};

// Añadir un nuevo producto
export const addProduct = async (product: Omit<Product, 'id'>): Promise<string> => {
  try {
    const productsCol = collection(db, "products");
    const docRef = await addDoc(productsCol, product);
    return docRef.id;
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

// Actualizar un producto existente
export const updateProduct = async (id: string, product: Partial<Product>): Promise<void> => {
  try {
    const productRef = doc(db, "products", id);
    await updateDoc(productRef, product);
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }
};

// Eliminar un producto
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const productRef = doc(db, "products", id);
    await deleteDoc(productRef);
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
}; 