import { db } from './firebase';
import { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore/lite';

export interface Sale {
  id?: string;
  productName: string;
  price: number;
  soldBy: 'edmon' | 'albert' | 'biel' | 'todos';
  platform: string;
  saleDate: Date | null;
  quantity: number;
  hasVAT: boolean;
  vatRate: number;
  vatAmount: number;
  totalWithVAT: number;
  description?: string;
  buyer?: string;
  shippingCost?: number;
  platformFee?: number;
  netProfit?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Plataformas de venta disponibles
export const PLATFORMS = [
  'Wallapop',
  'Cardmarket',
  'eBay',
  'Segunda Mano',
  'Web Propia',
  'Catawiki',
  'Vinted',
  'Tienda Física',
  'Amazon',
  'Otros'
];

// Obtener todas las ventas
export const getAllSales = async (): Promise<Sale[]> => {
  try {
    console.log('Cargando ventas desde Firebase');
    
    const salesCollection = collection(db, 'sales');
    const salesQuery = query(salesCollection, orderBy('saleDate', 'desc'));
    const snapshot = await getDocs(salesQuery);
    
    if (snapshot.empty) {
      console.log('No hay ventas registradas');
      return [];
    }
    
    const sales: Sale[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      sales.push({
        id: doc.id,
        productName: data.productName,
        price: data.price,
        soldBy: data.soldBy,
        platform: data.platform,
        saleDate: data.saleDate ? data.saleDate.toDate() : null,
        quantity: data.quantity || 1,
        hasVAT: data.hasVAT || false,
        vatRate: data.vatRate || 21,
        vatAmount: data.vatAmount || 0,
        totalWithVAT: data.totalWithVAT || data.price,
        description: data.description || undefined,
        buyer: data.buyer || undefined,
        shippingCost: data.shippingCost || 0,
        platformFee: data.platformFee || 0,
        netProfit: data.netProfit || data.price,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date()
      });
    });
    
    console.log(`Cargadas ${sales.length} ventas`);
    return sales;
  } catch (error) {
    console.error('Error al cargar ventas:', error);
    throw error;
  }
};

// Añadir una nueva venta
export const addSale = async (saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const salesCollection = collection(db, 'sales');
    
    const docData = {
      ...saleData,
      price: Number(saleData.price),
      quantity: Number(saleData.quantity) || 1,
      hasVAT: saleData.hasVAT || false,
      vatRate: Number(saleData.vatRate) || 21,
      vatAmount: Number(saleData.vatAmount) || 0,
      totalWithVAT: Number(saleData.totalWithVAT) || Number(saleData.price),
      shippingCost: Number(saleData.shippingCost) || 0,
      platformFee: Number(saleData.platformFee) || 0,
      netProfit: Number(saleData.netProfit) || Number(saleData.price),
      saleDate: saleData.saleDate ? Timestamp.fromDate(new Date(saleData.saleDate)) : Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(salesCollection, docData);
    console.log(`Venta añadida con ID: ${docRef.id}`);
    
    return docRef.id;
  } catch (error) {
    console.error('Error al añadir venta:', error);
    throw error;
  }
};

// Actualizar una venta existente
export const updateSale = async (id: string, saleData: Partial<Sale>): Promise<void> => {
  try {
    const saleDoc = doc(db, 'sales', id);
    
    // Preparar datos para actualizar
    const updateData: any = {
      ...saleData,
      updatedAt: Timestamp.now()
    };
    
    // Convertir fecha de venta si existe
    if (saleData.saleDate) {
      updateData.saleDate = Timestamp.fromDate(new Date(saleData.saleDate));
    }
    
    // Asegurarse de que los valores numéricos sean números
    if (saleData.price !== undefined) {
      updateData.price = Number(saleData.price);
    }
    if (saleData.quantity !== undefined) {
      updateData.quantity = Number(saleData.quantity);
    }
    if (saleData.vatRate !== undefined) {
      updateData.vatRate = Number(saleData.vatRate);
    }
    if (saleData.vatAmount !== undefined) {
      updateData.vatAmount = Number(saleData.vatAmount);
    }
    if (saleData.totalWithVAT !== undefined) {
      updateData.totalWithVAT = Number(saleData.totalWithVAT);
    }
    if (saleData.shippingCost !== undefined) {
      updateData.shippingCost = Number(saleData.shippingCost);
    }
    if (saleData.platformFee !== undefined) {
      updateData.platformFee = Number(saleData.platformFee);
    }
    if (saleData.netProfit !== undefined) {
      updateData.netProfit = Number(saleData.netProfit);
    }
    
    await updateDoc(saleDoc, updateData);
    console.log(`Venta con ID ${id} actualizada`);
  } catch (error) {
    console.error(`Error al actualizar venta ${id}:`, error);
    throw error;
  }
};

// Eliminar una venta
export const deleteSale = async (id: string): Promise<void> => {
  try {
    const saleDoc = doc(db, 'sales', id);
    await deleteDoc(saleDoc);
    console.log(`Venta con ID ${id} eliminada`);
  } catch (error) {
    console.error(`Error al eliminar venta ${id}:`, error);
    throw error;
  }
};

// Obtener una venta por su ID
export const getSaleById = async (id: string): Promise<Sale | null> => {
  try {
    const saleDoc = doc(db, 'sales', id);
    const snapshot = await getDoc(saleDoc);
    
    if (!snapshot.exists()) {
      console.log(`No se encontró venta con ID ${id}`);
      return null;
    }
    
    const data = snapshot.data();
    
    return {
      id: snapshot.id,
      productName: data.productName,
      price: data.price,
      soldBy: data.soldBy,
      platform: data.platform,
      saleDate: data.saleDate ? data.saleDate.toDate() : null,
      quantity: data.quantity || 1,
      hasVAT: data.hasVAT || false,
      vatRate: data.vatRate || 21,
      vatAmount: data.vatAmount || 0,
      totalWithVAT: data.totalWithVAT || data.price,
      description: data.description || undefined,
      buyer: data.buyer || undefined,
      shippingCost: data.shippingCost || 0,
      platformFee: data.platformFee || 0,
      netProfit: data.netProfit || data.price,
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date()
    };
  } catch (error) {
    console.error(`Error al obtener venta ${id}:`, error);
    throw error;
  }
}; 