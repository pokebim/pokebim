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
  where,
  Timestamp
} from "firebase/firestore/lite";
import { db } from "./firebase";

// Tipos de movimientos
export enum MovementType {
  PURCHASE = 'Compra',         // Entrada de inventario por compra
  SALE = 'Venta',              // Salida de inventario por venta
  ADJUSTMENT = 'Ajuste',       // Ajuste manual de inventario
  TRANSFER = 'Transferencia',  // Transferencia entre ubicaciones
  RETURN = 'Devolución',       // Devolución de cliente o a proveedor
}

// Interfaz para el movimiento de inventario
export interface Movement {
  id?: string;
  productId: string;
  productName?: string;  // Para facilitar la visualización
  movementType: MovementType;
  quantity: number;      // Positivo para entradas, negativo para salidas
  previousQuantity?: number; // Cantidad anterior a este movimiento
  newQuantity?: number;  // Nueva cantidad después del movimiento
  price?: number;        // Precio unitario del movimiento (compra o venta)
  totalPrice?: number;   // Precio total del movimiento
  relatedId?: string;    // ID de la venta, compra, etc. relacionada
  createdBy?: string;    // Usuario que realizó el movimiento (edmon, albert, biel)
  notes?: string;        // Notas adicionales
  timestamp?: any;       // Momento del movimiento
}

// Colección de Firebase
const movementsCollection = collection(db, "movements");

// Obtener todos los movimientos
export const getAllMovements = async (): Promise<Movement[]> => {
  try {
    const q = query(movementsCollection, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    
    const movements: Movement[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      movements.push({
        id: doc.id,
        productId: data.productId,
        productName: data.productName || '',
        movementType: data.movementType,
        quantity: data.quantity,
        previousQuantity: data.previousQuantity || 0,
        newQuantity: data.newQuantity || 0,
        price: data.price || 0,
        totalPrice: data.totalPrice || 0,
        relatedId: data.relatedId || '',
        createdBy: data.createdBy || '',
        notes: data.notes || '',
        timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
      });
    });
    
    return movements;
  } catch (error) {
    console.error("Error al obtener movimientos:", error);
    throw error;
  }
};

// Registrar un nuevo movimiento
export const addMovement = async (movement: Omit<Movement, 'id' | 'timestamp'>): Promise<string> => {
  try {
    const docData = {
      ...movement,
      timestamp: Timestamp.now()
    };
    
    const docRef = await addDoc(movementsCollection, docData);
    console.log(`Movimiento registrado con ID: ${docRef.id}`);
    
    return docRef.id;
  } catch (error) {
    console.error("Error al registrar movimiento:", error);
    throw error;
  }
};

// Obtener movimientos por producto
export const getMovementsByProduct = async (productId: string): Promise<Movement[]> => {
  try {
    const q = query(
      movementsCollection, 
      where("productId", "==", productId),
      orderBy("timestamp", "desc")
    );
    
    const snapshot = await getDocs(q);
    
    const movements: Movement[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      movements.push({
        id: doc.id,
        productId: data.productId,
        productName: data.productName || '',
        movementType: data.movementType,
        quantity: data.quantity,
        previousQuantity: data.previousQuantity || 0,
        newQuantity: data.newQuantity || 0,
        price: data.price || 0,
        totalPrice: data.totalPrice || 0,
        relatedId: data.relatedId || '',
        createdBy: data.createdBy || '',
        notes: data.notes || '',
        timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
      });
    });
    
    return movements;
  } catch (error) {
    console.error(`Error al obtener movimientos para el producto ${productId}:`, error);
    throw error;
  }
};

// Obtener movimientos por tipo
export const getMovementsByType = async (movementType: MovementType): Promise<Movement[]> => {
  try {
    const q = query(
      movementsCollection, 
      where("movementType", "==", movementType),
      orderBy("timestamp", "desc")
    );
    
    const snapshot = await getDocs(q);
    
    const movements: Movement[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      movements.push({
        id: doc.id,
        productId: data.productId,
        productName: data.productName || '',
        movementType: data.movementType,
        quantity: data.quantity,
        previousQuantity: data.previousQuantity || 0,
        newQuantity: data.newQuantity || 0,
        price: data.price || 0,
        totalPrice: data.totalPrice || 0,
        relatedId: data.relatedId || '',
        createdBy: data.createdBy || '',
        notes: data.notes || '',
        timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
      });
    });
    
    return movements;
  } catch (error) {
    console.error(`Error al obtener movimientos del tipo ${movementType}:`, error);
    throw error;
  }
}; 