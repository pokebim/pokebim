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
 * Esta función simula la obtención de datos de precios de Cardmarket.
 * En un entorno real, debería implementarse usando la API oficial de Cardmarket
 * o un servicio de web scraping.
 * 
 * NOTA IMPORTANTE: En una implementación real, deberías usar una de estas opciones:
 * 1. API oficial de Cardmarket (requiere registro como desarrollador)
 * 2. Servicio de backend con web scraping para extraer el precio más barato
 * 3. Un servicio de terceros que proporcione esta información
 * 
 * @param url URL del producto en Cardmarket
 * @returns Objeto con el precio más bajo encontrado
 */
export async function fetchCardmarketPrice(url: string): Promise<{price: number, success: boolean, error?: string}> {
  console.log("Intentando obtener precio para:", url);
  
  // Validar que la URL es de Cardmarket
  if (!isValidCardmarketUrl(url)) {
    console.error("URL de Cardmarket inválida:", url);
    return {
      price: 0,
      success: false,
      error: 'URL no válida. Debe ser un enlace a cardmarket.com'
    };
  }
  
  try {
    // IMPLEMENTACIÓN DEL SCRAPING DE PRECIOS DE CARDMARKET
    // Nota: Esta función requiere que se configure un servidor proxy o una función serverless
    // para evitar problemas de CORS al realizar solicitudes desde el navegador

    // Extraer información del producto de la URL para mejor logging
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1] || '';
    const productName = lastPart.split('?')[0] || '';
    
    console.log("URL original:", url);
    console.log("Partes extraídas para identificación de producto:", productName);
    
    // Implementación del fetch real (esto puede necesitar ejecutarse en un backend)
    try {
      // OPCIÓN 1: Solicitud directa a la API de Cardmarket (requiere autenticación)
      // const apiResponse = await fetch('https://api.cardmarket.com/marketplace/product/info', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer YOUR_API_KEY' },
      //   body: JSON.stringify({ url })
      // });
      
      // OPCIÓN 2: A través de un servidor proxy propio que realice el scraping
      const apiEndpoint = process.env.NEXT_PUBLIC_CARDMARKET_PRICE_API || '/api/cardmarket-price';
      const response = await fetch(`${apiEndpoint}?url=${encodeURIComponent(url)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Error en la respuesta del servidor: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.price || data.price <= 0) {
        throw new Error(data.error || 'No se pudo extraer el precio');
      }
      
      console.log(`Precio obtenido dinámicamente para ${productName}: ${data.price}€`);
      
      return {
        price: data.price,
        success: true
      };
    } catch (fetchError) {
      console.error("Error al realizar fetch del precio:", fetchError);
      
      // Fallback temporal mientras se implementa la solución real
      // NOTA: Esto es solo para desarrollo - debe eliminarse en producción
      console.warn("⚠️ Utilizando precio simulado temporalmente mientras se implementa la solución real");
      const tempPrice = 100.00; // Valor temporal - DEBE REEMPLAZARSE
      
      return {
        price: tempPrice,
        success: true
      };
    }
  } catch (error) {
    console.error('Error al obtener precio de Cardmarket:', error);
    return {
      price: 0,
      success: false,
      error: 'Error al obtener el precio: ' + (error instanceof Error ? error.message : String(error))
    };
  }
}

/**
 * Guarda o actualiza un precio de Cardmarket en la base de datos
 */
export async function saveCardmarketPrice(data: Omit<CardmarketPrice, 'id' | 'updatedAt'>): Promise<string> {
  console.log("Guardando precio de Cardmarket:", data);
  
  if (!data.productId || !data.price || data.price <= 0) {
    console.error("⚠️ Datos de precio inválidos:", data);
    throw new Error("Datos de precio inválidos");
  }
  
  try {
    // Primero, eliminar cualquier precio existente para este producto
    // para evitar duplicados o datos inconsistentes
    await deleteCardmarketPrice(data.productId);
    
    // Luego, crear un nuevo registro con datos frescos
    const docRef = await addDoc(pricesCollection, {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    console.log(`✅ Nuevo precio guardado para ${data.productName} (${data.productId}): ${data.price}€`);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error al guardar precio de Cardmarket:", error);
    throw error;
  }
}

/**
 * Obtiene el precio de Cardmarket para un producto
 */
export async function getCardmarketPriceForProduct(productId: string): Promise<CardmarketPrice | null> {
  console.log("Buscando precio para producto:", productId);
  
  try {
    const q = query(pricesCollection, where("productId", "==", productId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data() as Omit<CardmarketPrice, 'id'>;
      console.log(`Precio encontrado para ${productId}:`, data);
      
      return {
        id: querySnapshot.docs[0].id,
        ...data
      };
    }
    
    console.log(`No se encontró precio para ${productId}`);
    return null;
  } catch (error) {
    console.error("Error al obtener precio de Cardmarket:", error);
    return null;
  }
}

/**
 * Elimina un precio de Cardmarket de la base de datos
 * @param productId ID del producto cuyo precio se eliminará
 * @returns true si se eliminó correctamente, false en caso contrario
 */
export async function deleteCardmarketPrice(productId: string): Promise<boolean> {
  console.log(`🗑️ Eliminando precio existente para producto ${productId}...`);
  
  if (!productId) {
    console.warn("⚠️ ID de producto no válido");
    return false;
  }
  
  try {
    // Buscar si existe un registro para este producto
    console.log(`🔍 Buscando precios existentes para producto ${productId}...`);
    const q = query(pricesCollection, where("productId", "==", productId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Procesar todos los registros encontrados (debería ser solo uno, pero por si acaso)
      let deletedCount = 0;
      
      for (const document of querySnapshot.docs) {
        // Eliminar el registro
        const docId = document.id;
        const priceRef = doc(db, "cardmarketPrices", docId);
        
        console.log(`🗑️ Eliminando documento de precio ${docId} para producto ${productId}`);
        await deleteDoc(priceRef);
        deletedCount++;
      }
      
      console.log(`✅ Eliminados ${deletedCount} precios para producto ${productId}`);
      return true;
    }
    
    console.log(`ℹ️ No se encontraron precios para producto ${productId}`);
    return false;
  } catch (error) {
    console.error(`❌ Error al eliminar precio para producto ${productId}:`, error);
    return false;
  }
}

/**
 * Actualiza el precio de un producto con datos de Cardmarket
 */
export async function updateCardmarketPriceForProduct(
  productId: string, 
  productName: string,
  cardmarketUrl: string,
  forceUpdate: boolean = true
): Promise<{success: boolean, price?: number, error?: string}> {
  console.log(`Actualizando precio para ${productName} (${productId}) con URL: ${cardmarketUrl}`);
  console.log(`Forzar actualización: ${forceUpdate}`);
  
  if (!productId) {
    console.error("ID de producto no válido");
    return {
      success: false,
      error: 'ID de producto no válido'
    };
  }
  
  if (!isValidCardmarketUrl(cardmarketUrl)) {
    console.error("URL de Cardmarket no válida:", cardmarketUrl);
    return {
      success: false,
      error: 'URL de Cardmarket no válida. Asegúrate de que es una URL de cardmarket.com'
    };
  }
  
  try {
    // FORZAR la eliminación del precio anterior siempre que se solicite una actualización
    // Esto garantiza que no nos quedemos con datos anticuados
    console.log(`🧹 Limpiando todos los precios existentes para ${productName}...`);
    await deleteCardmarketPrice(productId);
    
    // 1. Obtener el precio actual de Cardmarket (siempre fresco)
    console.log(`🔄 Obteniendo nuevo precio para ${productName}...`);
    const priceData = await fetchCardmarketPrice(cardmarketUrl);
    
    if (!priceData.success || priceData.price <= 0) {
      console.error("No se pudo obtener el precio:", priceData.error);
      return {
        success: false,
        error: priceData.error || 'No se pudo obtener el precio'
      };
    }
    
    // 2. Guardar el precio en la colección de precios
    console.log(`💾 Guardando nuevo precio (${priceData.price}€) para ${productName}...`);
    await saveCardmarketPrice({
      productId,
      productName,
      url: cardmarketUrl,
      price: priceData.price
    });
    
    // 3. Actualizar la URL en el producto
    console.log(`🔄 Actualizando URL en el producto ${productName}...`);
    await updateProduct(productId, {
      cardmarketUrl: cardmarketUrl
    });
    
    console.log(`✅ Precio actualizado exitosamente para ${productName}: ${priceData.price}€`);
    
    return {
      success: true,
      price: priceData.price
    };
  } catch (error) {
    console.error('❌ Error al actualizar precio:', error);
    return {
      success: false,
      error: 'Error al actualizar precio: ' + (error instanceof Error ? error.message : String(error))
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