// Servicio para interactuar con Cardmarket
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
  setDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore/lite";
import { db } from "./firebase";
import { updateProduct } from "./productService";

// Referencia a la colección de precios de Cardmarket
const pricesCollection = collection(db, "cardmarketPrices");

// Interfaz para los precios de Cardmarket
export interface CardmarketPrice {
  id?: string;
  productId: string;
  productName: string;
  url: string;
  price: number;
  updatedAt: any;
}

/**
 * Valida si una URL es de Cardmarket
 * @param url URL a validar
 * @returns true si es una URL válida de Cardmarket
 */
function isValidCardmarketUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('cardmarket.com');
  } catch (error) {
    console.error("URL inválida:", url);
    return false;
  }
}

/**
 * Función simplificada para obtener precios 
 * Usa la API optimizada que implementa fetch en lugar de Puppeteer
 */
export async function fetchCardmarketPrice(url: string): Promise<{price: number, success: boolean, error?: string}> {
  if (!isValidCardmarketUrl(url)) {
    console.error(`Error: URL no válida para Cardmarket: ${url}`);
    return { 
      success: false, 
      price: 0, 
      error: 'URL no válida para Cardmarket' 
    };
  }

  console.log(`🔍 Obteniendo precio para URL: ${url}`);
  
  // Implementar reintentos (máximo 3 intentos)
  const MAX_RETRIES = 2;
  let retryCount = 0;
  let lastError = null;
  
  while (retryCount <= MAX_RETRIES) {
    try {
      if (retryCount > 0) {
        console.log(`🔄 Reintento ${retryCount}/${MAX_RETRIES} para obtener precio...`);
        // Esperar entre reintentos (1s, 2s)
        await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
      }
      
      // Usar la API optimizada
      const response = await fetch(`/api/cardmarket-puppeteer?url=${encodeURIComponent(url)}&retry=${retryCount}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = `Error en API: ${response.status}${errorData.error ? ` - ${errorData.error}` : ''}`;
        console.error(`❌ ${errorMsg}`);
        
        // Si es un error 429 (demasiadas solicitudes) o 403 (prohibido), podemos reintentar
        if ((response.status === 429 || response.status === 403) && retryCount < MAX_RETRIES) {
          lastError = new Error(errorMsg);
          retryCount++;
          continue;
        }
        
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.price || data.price <= 0) {
        throw new Error(data.error || 'No se obtuvo un precio válido');
      }
      
      console.log(`✅ Precio obtenido correctamente: ${data.price}€`);
      return {
        success: true,
        price: data.price
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error obteniendo precio: ${errorMessage}`);
      
      // Guardar el error para reportarlo si agotamos los reintentos
      lastError = error;
      
      // Si incluye ciertos mensajes específicos, no reintentar
      const noRetryMessages = [
        'URL no válida', 
        'No se encontraron precios',
        'HTML incompleta'
      ];
      
      const shouldRetry = !noRetryMessages.some(msg => errorMessage.includes(msg));
      
      if (shouldRetry && retryCount < MAX_RETRIES) {
        retryCount++;
        continue;
      }
      
      // Si fallan todos los reintentos o no debemos reintentar, devolver el error
      return {
        success: false,
        price: 0,
        error: errorMessage
      };
    }
  }
  
  // Este punto solo se alcanza si se agotaron los reintentos
  return {
    success: false,
    price: 0,
    error: lastError instanceof Error ? lastError.message : 'Error desconocido después de varios intentos'
  };
}

/**
 * Guarda o actualiza un precio de Cardmarket en la base de datos
 */
export async function saveCardmarketPrice(data: Omit<CardmarketPrice, 'id' | 'updatedAt'>): Promise<string> {
  try {
    // Comprobar si ya existe un precio para este producto
    const querySnapshot = await getDocs(
      query(pricesCollection, where("productId", "==", data.productId))
    );
    
    // Si existe, eliminar el anterior
    if (!querySnapshot.empty) {
      await deleteCardmarketPrice(data.productId);
    }
    
    // Añadir el nuevo precio
    const docRef = await addDoc(pricesCollection, {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error al guardar precio:", error);
    throw error;
  }
}

/**
 * Obtiene el precio de Cardmarket para un producto
 */
export async function getCardmarketPriceForProduct(productId: string): Promise<CardmarketPrice | null> {
  try {
    const querySnapshot = await getDocs(
      query(pricesCollection, where("productId", "==", productId))
    );
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const data = querySnapshot.docs[0].data() as Omit<CardmarketPrice, 'id'>;
    return {
      ...data,
      id: querySnapshot.docs[0].id,
      updatedAt: data.updatedAt ? data.updatedAt : null
    } as CardmarketPrice;
  } catch (error) {
    console.error("Error al obtener precio de Cardmarket:", error);
    return null;
  }
}

/**
 * Elimina un precio de Cardmarket de la base de datos
 */
export async function deleteCardmarketPrice(productId: string): Promise<boolean> {
  try {
    // Buscar el documento por productId
    const querySnapshot = await getDocs(
      query(pricesCollection, where("productId", "==", productId))
    );
    
    if (querySnapshot.empty) {
      console.log(`No se encontró precio para producto ${productId}`);
      return true; // No hay nada que eliminar
    }
    
    // Eliminar todos los documentos encontrados (debería ser solo uno)
    for (const docSnapshot of querySnapshot.docs) {
      const docId = docSnapshot.id;
      await deleteDoc(doc(db, "cardmarketPrices", docId));
      console.log(`Precio eliminado para producto ${productId}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error al eliminar precio para producto ${productId}: ${error}`);
    return false;
  }
}

/**
 * Actualiza el precio de un producto desde Cardmarket
 */
export async function updateCardmarketPriceForProduct(
  productId: string, 
  productName: string,
  cardmarketUrl: string,
  forceUpdate: boolean = true
): Promise<{success: boolean, price?: number, error?: string}> {
  console.log(`🔄 Actualizando precio de Cardmarket para: ${productName}`);

  try {
    // Verificar si ya existe un precio y si necesitamos actualizarlo
    const existingPrice = await getCardmarketPriceForProduct(productId);
    
    // Si existe un precio y no se fuerza la actualización, devolver el precio existente
    if (existingPrice && !forceUpdate) {
      console.log(`ℹ️ Usando precio existente para ${productName}: ${existingPrice.price}€`);
      return {
        success: true,
        price: existingPrice.price
      };
    }

    // Si estamos actualizando, primero limpiamos cualquier precio existente
    if (existingPrice) {
      console.log(`🧹 Limpiando precio existente para ${productName}`);
      await deleteCardmarketPrice(productId);
    }

    // Obtener el precio actualizado
    console.log(`🔍 Obteniendo precio actualizado para ${productName} desde ${cardmarketUrl}`);
    const cardmarketData = await fetchCardmarketPrice(cardmarketUrl);

    if (!cardmarketData.success || cardmarketData.price <= 0) {
      const errorMsg = cardmarketData.error || 'Precio no disponible en este momento';
      console.error(`❌ Error al obtener precio para ${productName}: ${errorMsg}`);
      
      // Si hay un error pero teníamos un precio anterior, podemos seguir usando ese
      if (existingPrice) {
        console.log(`⚠️ Manteniendo precio anterior para ${productName}: ${existingPrice.price}€`);
        // Re-guardar el precio anterior pero actualizar la fecha
        await saveCardmarketPrice({
          productId,
          productName,
          url: cardmarketUrl,
          price: existingPrice.price
        });
        
        return {
          success: true,
          price: existingPrice.price,
          error: `Usando precio anterior. ${errorMsg}`
        };
      }
      
      return {
        success: false,
        error: errorMsg
      };
    }

    // Guardar el nuevo precio
    console.log(`💾 Guardando nuevo precio para ${productName}: ${cardmarketData.price}€`);
    await saveCardmarketPrice({
      productId,
      productName,
      url: cardmarketUrl,
      price: cardmarketData.price
    });

    console.log(`✅ Precio actualizado para ${productName}: ${cardmarketData.price}€`);
    return {
      success: true,
      price: cardmarketData.price
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error en actualización de precio para ${productName}: ${errorMessage}`);
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Actualiza los precios de todos los productos que tienen URL de Cardmarket
 */
export async function updateAllCardmarketPrices(
  products: any[], 
  forceUpdate: boolean = true
): Promise<{
  success: boolean, 
  updated: number, 
  failed: number,
  errors: string[]
}> {
  console.log("Actualizando todos los precios de Cardmarket...");
  console.log(`Forzar actualización: ${forceUpdate}`);
  
  const result = {
    success: true,
    updated: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  // Filtra productos que tienen URL de Cardmarket
  const productsWithUrl = products.filter(p => p.cardmarketUrl && p.cardmarketUrl.trim() !== '');
  
  console.log(`Se encontraron ${productsWithUrl.length} productos con URL de Cardmarket`);
  
  // Si no hay productos con URL, terminamos
  if (productsWithUrl.length === 0) {
    return {
      ...result,
      success: false,
      errors: ['No hay productos con URL de Cardmarket']
    };
  }
  
  // Actualizar cada producto secuencialmente
  for (const product of productsWithUrl) {
    try {
      console.log(`Actualizando precio para ${product.name}...`);
      const updateResult = await updateCardmarketPriceForProduct(
        product.id, 
        product.name || 'Producto sin nombre',
        product.cardmarketUrl,
        forceUpdate
      );
      
      if (updateResult.success) {
        result.updated++;
        console.log(`✅ Precio actualizado para ${product.name}: ${updateResult.price}€`);
      } else {
        result.failed++;
        result.errors.push(`Error al actualizar ${product.name}: ${updateResult.error}`);
        console.error(`❌ Error al actualizar ${product.name}: ${updateResult.error}`);
      }
      
      // Pequeña pausa para no sobrecargar el servidor
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      result.failed++;
      const errorMsg = `Error inesperado al actualizar ${product.name}: ${error}`;
      result.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }
  
  console.log(`Actualización completada: ${result.updated} actualizados, ${result.failed} fallidos`);
  return result;
}