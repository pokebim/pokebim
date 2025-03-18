import { db } from './firebase';
import { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore/lite';
import { updateInventoryItem, getInventoryItemById } from './inventoryService';
import { getAllProducts } from './productService';
import { MovementType, addMovement } from './movementsService';

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
  // Nuevos campos para integración con inventario
  productId?: string;
  inventoryItemId?: string;
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
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
        productId: data.productId || undefined,
        inventoryItemId: data.inventoryItemId || undefined
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
    
    // Preparar los datos para la venta
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
    
    // Primero verificamos que haya stock suficiente
    if (saleData.inventoryItemId) {
      const inventoryItem = await getInventoryItemById(saleData.inventoryItemId);
      if (!inventoryItem) {
        throw new Error('El ítem de inventario no existe');
      }
      
      if (inventoryItem.quantity < saleData.quantity) {
        throw new Error(`No hay suficiente stock. Disponible: ${inventoryItem.quantity}`);
      }
      
      // Actualizamos el inventario restando la cantidad vendida
      const newQuantity = inventoryItem.quantity - saleData.quantity;
      await updateInventoryItem(saleData.inventoryItemId, { quantity: newQuantity });
      
      // Registrar el movimiento de inventario
      if (saleData.productId) {
        // Obtener el producto para el registro de movimiento
        const products = await getAllProducts();
        const product = products.find(p => p.id === saleData.productId);
        
        if (product) {
          // Registrar movimiento
          await addMovement({
            productId: saleData.productId,
            productName: product.name,
            movementType: MovementType.SALE,
            quantity: -saleData.quantity, // Negativo para indicar salida
            previousQuantity: inventoryItem.quantity,
            newQuantity: newQuantity,
            price: saleData.price,
            totalPrice: saleData.price * saleData.quantity,
            relatedId: '', // Se actualizará después
            createdBy: saleData.soldBy,
            notes: `Venta en ${saleData.platform}${saleData.buyer ? ` a ${saleData.buyer}` : ''}`
          });
        }
      }
    }
    
    // Guardar la venta
    const docRef = await addDoc(salesCollection, docData);
    console.log(`Venta añadida con ID: ${docRef.id}`);
    
    // Si registramos un movimiento, actualizar el relatedId
    if (saleData.productId && saleData.inventoryItemId) {
      // El ID del movimiento ya está generado, pero no necesitamos actualizarlo aquí
      // ya que el ID de la venta es suficiente para la trazabilidad
    }
    
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
    const snapshot = await getDoc(saleDoc);
    
    if (!snapshot.exists()) {
      throw new Error(`No se encontró la venta con ID ${id}`);
    }
    
    const oldSaleData = snapshot.data() as Sale;
    
    // Preparar datos para actualizar
    const updateData: any = {
      updatedAt: Timestamp.now()
    };
    
    // Copiar solo los campos definidos (no undefined)
    Object.keys(saleData).forEach(key => {
      const value = saleData[key as keyof Partial<Sale>];
      if (value !== undefined) {
        updateData[key] = value;
      }
    });
    
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
    
    // Si el campo description es undefined, establecerlo como string vacío
    if (saleData.description === undefined && 'description' in saleData) {
      updateData.description = '';
    }
    
    // Si el campo buyer es undefined, establecerlo como string vacío
    if (saleData.buyer === undefined && 'buyer' in saleData) {
      updateData.buyer = '';
    }
    
    // Si cambia la cantidad o el ítem de inventario, actualizar el inventario
    if ((saleData.quantity !== undefined && saleData.quantity !== oldSaleData.quantity) ||
        (saleData.inventoryItemId !== undefined && saleData.inventoryItemId !== oldSaleData.inventoryItemId)) {
      
      // Si cambia el ítem de inventario
      if (saleData.inventoryItemId !== undefined && saleData.inventoryItemId !== oldSaleData.inventoryItemId) {
        // Si había un ítem anterior, devolver la cantidad al inventario
        if (oldSaleData.inventoryItemId) {
          const oldInventoryItem = await getInventoryItemById(oldSaleData.inventoryItemId);
          if (oldInventoryItem) {
            const newQuantity = oldInventoryItem.quantity + oldSaleData.quantity;
            await updateInventoryItem(oldSaleData.inventoryItemId, { quantity: newQuantity });
            
            // Registrar movimiento de devolución
            if (oldSaleData.productId) {
              const products = await getAllProducts();
              const product = products.find(p => p.id === oldSaleData.productId);
              
              if (product) {
                await addMovement({
                  productId: oldSaleData.productId,
                  productName: product.name,
                  movementType: MovementType.RETURN,
                  quantity: oldSaleData.quantity, // Positivo para indicar entrada
                  previousQuantity: oldInventoryItem.quantity,
                  newQuantity: newQuantity,
                  relatedId: id,
                  createdBy: saleData.soldBy || oldSaleData.soldBy,
                  notes: `Devolución por actualización de venta ${id}`
                });
              }
            }
          }
        }
        
        // Actualizar el nuevo ítem de inventario
        if (saleData.inventoryItemId) {
          const newInventoryItem = await getInventoryItemById(saleData.inventoryItemId);
          if (newInventoryItem) {
            const quantity = saleData.quantity !== undefined ? saleData.quantity : oldSaleData.quantity;
            if (newInventoryItem.quantity < quantity) {
              throw new Error(`No hay suficiente stock. Disponible: ${newInventoryItem.quantity}`);
            }
            
            const newQuantity = newInventoryItem.quantity - quantity;
            await updateInventoryItem(saleData.inventoryItemId, { quantity: newQuantity });
            
            // Registrar movimiento de venta
            const productId = saleData.productId || oldSaleData.productId;
            if (productId) {
              const products = await getAllProducts();
              const product = products.find(p => p.id === productId);
              
              if (product) {
                await addMovement({
                  productId: productId,
                  productName: product.name,
                  movementType: MovementType.SALE,
                  quantity: -quantity, // Negativo para indicar salida
                  previousQuantity: newInventoryItem.quantity,
                  newQuantity: newQuantity,
                  price: saleData.price || oldSaleData.price,
                  totalPrice: (saleData.price || oldSaleData.price) * quantity,
                  relatedId: id,
                  createdBy: saleData.soldBy || oldSaleData.soldBy,
                  notes: `Venta actualizada ${id}`
                });
              }
            }
          }
        }
      } else if (saleData.quantity !== undefined && saleData.quantity !== oldSaleData.quantity) {
        // Si solo cambia la cantidad, ajustar el inventario
        if (oldSaleData.inventoryItemId) {
          const inventoryItem = await getInventoryItemById(oldSaleData.inventoryItemId);
          if (inventoryItem) {
            // Calcular diferencia de cantidad
            const quantityDiff = oldSaleData.quantity - saleData.quantity;
            const newQuantity = inventoryItem.quantity + quantityDiff;
            
            if (newQuantity < 0) {
              throw new Error(`No hay suficiente stock. Disponible: ${inventoryItem.quantity}`);
            }
            
            await updateInventoryItem(oldSaleData.inventoryItemId, { quantity: newQuantity });
            
            // Registrar movimiento de ajuste
            if (oldSaleData.productId) {
              const products = await getAllProducts();
              const product = products.find(p => p.id === oldSaleData.productId);
              
              if (product) {
                await addMovement({
                  productId: oldSaleData.productId,
                  productName: product.name,
                  movementType: MovementType.ADJUSTMENT,
                  quantity: quantityDiff, // Puede ser positivo (devuelve) o negativo (más salida)
                  previousQuantity: inventoryItem.quantity,
                  newQuantity: newQuantity,
                  relatedId: id,
                  createdBy: saleData.soldBy || oldSaleData.soldBy,
                  notes: `Ajuste por cambio de cantidad en venta ${id}`
                });
              }
            }
          }
        }
      }
    }
    
    // Actualizar la venta
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
    // Buscar la venta para recuperar datos de inventario
    const saleDoc = doc(db, 'sales', id);
    const snapshot = await getDoc(saleDoc);
    
    if (snapshot.exists()) {
      const saleData = snapshot.data() as Sale;
      
      // Si la venta estaba asociada con un ítem de inventario, devolver la cantidad
      if (saleData.inventoryItemId) {
        const inventoryItem = await getInventoryItemById(saleData.inventoryItemId);
        if (inventoryItem) {
          const newQuantity = inventoryItem.quantity + saleData.quantity;
          await updateInventoryItem(saleData.inventoryItemId, { quantity: newQuantity });
          
          // Registrar movimiento de devolución
          if (saleData.productId) {
            const products = await getAllProducts();
            const product = products.find(p => p.id === saleData.productId);
            
            if (product) {
              await addMovement({
                productId: saleData.productId,
                productName: product.name,
                movementType: MovementType.RETURN,
                quantity: saleData.quantity, // Positivo para indicar entrada
                previousQuantity: inventoryItem.quantity,
                newQuantity: newQuantity,
                relatedId: id,
                createdBy: saleData.soldBy,
                notes: `Devolución por eliminación de venta ${id}`
              });
            }
          }
        }
      }
    }
    
    // Eliminar la venta
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
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      productId: data.productId || undefined,
      inventoryItemId: data.inventoryItemId || undefined
    };
  } catch (error) {
    console.error(`Error al obtener venta ${id}:`, error);
    throw error;
  }
}; 