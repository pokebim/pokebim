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
 * Obtiene el precio de un artículo en CardMarket
 * Utiliza Puppeteer para un scraping más robusto
 * 
 * @param url URL de CardMarket
 * @returns Objeto con el precio o error
 */
export async function fetchCardmarketPrice(url: string): Promise<{ success: boolean; price?: number; error?: string }> {
  // Validar URL
  if (!url || !url.includes('cardmarket.com')) {
    console.error('❌ URL inválida para CardMarket:', url);
    return { success: false, error: 'URL inválida. Debe ser de cardmarket.com' };
  }

  console.log(`🔍 Obteniendo precio para URL: ${url}`);
  
  // Implementación de reintentos
  const MAX_RETRIES = 2;
  let lastError = '';
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Si no es el primer intento, mostrar información de reintento
      if (attempt > 0) {
        console.log(`🔄 Reintento ${attempt}/${MAX_RETRIES} para obtener precio...`);
        // Esperar un tiempo incremental entre reintentos
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
      
      // Llamar a la API con el intento actual
      const response = await fetch(`/api/cardmarket-puppeteer?url=${encodeURIComponent(url)}&retry=${attempt}`, {
        // Asegurarnos de no usar caché
        headers: {
          'Cache-Control': 'no-cache', 
          'Pragma': 'no-cache'
        }
      });
      
      // Analizar la respuesta
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Error ${response.status}` }));
        const errorMessage = errorData.error || `Error ${response.status} - ${response.statusText}`;
        
        console.error(`❌ Error en API: ${response.status} - ${errorMessage}`);
        
        // Determinar si debemos reintentar basado en el código de error y si hay intentos restantes
        if ((response.status === 503 || response.status === 429) && attempt < MAX_RETRIES) {
          lastError = errorMessage;
          // El API sugiere reintentar, continuamos al siguiente intento
          if (errorData.retryAfter) {
            await new Promise(resolve => setTimeout(resolve, errorData.retryAfter));
          }
          continue;
        }
        
        lastError = errorMessage;
        throw new Error(`Error en API: ${response.status} - ${errorMessage}`);
      }
      
      // Procesar respuesta exitosa
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error desconocido en la respuesta');
      }
      
      console.log(`✅ Precio obtenido: ${data.price}${data.currency}`);
      return {
        success: true,
        price: data.price
      };
      
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error obteniendo precio:`, lastError);
      
      // Si es el último intento, fallar definitivamente
      if (attempt === MAX_RETRIES) {
        return { 
          success: false, 
          error: lastError
        };
      }
      // De lo contrario, continuamos al siguiente intento
    }
  }
  
  // Este código no debería alcanzarse, pero por seguridad:
  return { 
    success: false, 
    error: lastError || 'Error desconocido obteniendo precio' 
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
    
    // Si existe un precio, verificar la antigüedad y decidir si actualizar
    if (existingPrice && !forceUpdate) {
      const currentTime = new Date().getTime();
      const lastUpdateTime = existingPrice.updatedAt?.toDate?.() 
                            ? existingPrice.updatedAt.toDate().getTime() 
                            : 0;
      
      // Si el precio se actualizó en las últimas 24 horas y no forzamos, usar el existente
      const hoursSinceUpdate = (currentTime - lastUpdateTime) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate < 24) {
        console.log(`ℹ️ Usando precio existente para ${productName}: ${existingPrice.price}€ (actualizado hace ${hoursSinceUpdate.toFixed(1)} horas)`);
        return {
          success: true,
          price: existingPrice.price
        };
      }
      
      console.log(`ℹ️ El precio existente para ${productName} tiene ${hoursSinceUpdate.toFixed(1)} horas de antigüedad. Actualizando...`);
    }

    // Obtener el precio actualizado
    console.log(`🔍 Obteniendo precio actualizado para ${productName} desde ${cardmarketUrl}`);
    const cardmarketData = await fetchCardmarketPrice(cardmarketUrl);

    if (!cardmarketData.success) {
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

    // Verificar si el precio es razonable (mayor que cero)
    if (!cardmarketData.price || cardmarketData.price <= 0) {
      const errorMsg = 'El precio obtenido no es válido (cero o negativo)';
      console.error(`❌ ${errorMsg} para ${productName}`);
      
      // Si teníamos un precio anterior, seguimos usándolo
      if (existingPrice) {
        console.log(`⚠️ Manteniendo precio anterior para ${productName}: ${existingPrice.price}€`);
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
  errors: string[],
  updatedProducts: {id: string, name: string, price: number}[]
}> {
  console.log(`🔄 Actualizando precios de Cardmarket para ${products.length} productos...`);
  console.log(`ℹ️ Forzar actualización: ${forceUpdate ? 'Sí' : 'No'}`);
  
  const result = {
    success: true,
    updated: 0,
    failed: 0,
    errors: [] as string[],
    updatedProducts: [] as {id: string, name: string, price: number}[]
  };
  
  // Filtra productos que tienen URL de Cardmarket
  const productsWithUrl = products.filter(p => p.cardmarketUrl && p.cardmarketUrl.trim() !== '');
  
  console.log(`📊 Se encontraron ${productsWithUrl.length} productos con URL de Cardmarket`);
  
  // Si no hay productos con URL, terminamos
  if (productsWithUrl.length === 0) {
    return {
      ...result,
      success: false,
      errors: ['No hay productos con URL de Cardmarket']
    };
  }
  
  // Actualizar cada producto secuencialmente
  for (let i = 0; i < productsWithUrl.length; i++) {
    const product = productsWithUrl[i];
    
    try {
      // Mostrar progreso
      console.log(`🔄 [${i+1}/${productsWithUrl.length}] Actualizando precio para ${product.name}...`);
      
      // Aplicar pausa escalonada para evitar sobrecarga del servidor
      if (i > 0) {
        const pauseTime = Math.min(1000 + (i * 100), 3000); // Aumenta gradualmente hasta 3s
        console.log(`⏱️ Esperando ${pauseTime}ms antes de la siguiente solicitud...`);
        await new Promise(resolve => setTimeout(resolve, pauseTime));
      }
      
      // Actualizar el precio
      const updateResult = await updateCardmarketPriceForProduct(
        product.id, 
        product.name || 'Producto sin nombre',
        product.cardmarketUrl,
        forceUpdate
      );
      
      if (updateResult.success && updateResult.price) {
        result.updated++;
        result.updatedProducts.push({
          id: product.id,
          name: product.name || 'Producto sin nombre',
          price: updateResult.price
        });
        
        // Si se actualizó con éxito pero había un mensaje de error (por ejemplo, usando precio anterior)
        if (updateResult.error) {
          console.warn(`⚠️ Actualización parcial para ${product.name}: ${updateResult.error}`);
        } else {
          console.log(`✅ Precio actualizado para ${product.name}: ${updateResult.price}€`);
        }
      } else {
        result.failed++;
        const errorMsg = `Error al actualizar ${product.name}: ${updateResult.error || 'Error desconocido'}`;
        result.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    } catch (error) {
      result.failed++;
      const errorMsg = `Error inesperado al actualizar ${product.name}: ${error instanceof Error ? error.message : String(error)}`;
      result.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }
  
  console.log(`📊 Resumen de actualización:`);
  console.log(`   ✅ ${result.updated} productos actualizados con éxito`);
  console.log(`   ❌ ${result.failed} productos fallidos`);
  
  return result;
}