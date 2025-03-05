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
 * Intenta obtener un precio con reintentos en caso de fallo
 */
async function fetchWithRetries(url: string, maxRetries = 3): Promise<{price: number, success: boolean, error?: string}> {
  let lastError: any = null;
  let attempt = 0;

  // Usar el proxy CORS para acceder a Cardmarket
  while (attempt < maxRetries) {
    attempt++;
    console.log(`Intento #${attempt} para obtener precio de ${url}`);

    try {
      // Primero intentar con el endpoint de proxy específico para evitar CORS
      const proxyUrl = `/api/cardmarket-proxy?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error en proxy: ${response.status} - ${errorData.error || 'Sin detalles'}`);
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
      lastError = error;
      console.error(`❌ Error en intento #${attempt}: ${error}`);
      
      // Esperar antes del siguiente intento (espera exponencial)
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 500; // 1s, 2s, 4s...
        console.log(`Esperando ${waitTime}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // Si todos los intentos fallaron, devolver error
  return {
    success: false,
    price: 0,
    error: lastError instanceof Error ? lastError.message : String(lastError)
  };
}

/**
 * Implementación de scraping directo como respaldo
 */
async function fetchDirectFromCardmarket(url: string): Promise<{price: number, success: boolean, error?: string}> {
  if (!isValidCardmarketUrl(url)) {
    console.error(`Error: URL no válida para Cardmarket: ${url}`);
    return { 
      success: false, 
      price: 0, 
      error: 'URL no válida para Cardmarket' 
    };
  }

  try {
    console.log(`🔍 Último recurso: obteniendo precio directamente de: ${url}`);
    
    // Timeout para evitar bloqueos en Vercel (que tiene límite de 10-15 segundos)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos es seguro para Vercel
    
    try {
      // Scraping directo de la URL de Cardmarket - usando la estructura exacta que necesitamos
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PokebimApp/1.0; +https://pokebimapp.vercel.app)',
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      // Siempre limpiar el timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Error al acceder a Cardmarket: ${response.status} ${response.statusText}`);
      }
      
      const html = await response.text();
      console.log(`✅ HTML obtenido de Cardmarket, longitud: ${html.length} caracteres`);
      
      // Usar cheerio para analizar el HTML
      const cheerio = require('cheerio');
      const $ = cheerio.load(html);
      
      // Buscar precios usando múltiples métodos
      const prices: number[] = [];
      
      // Método 1: Buscar por ID parcial
      $('[id^="articleRow"]').each((_, element) => {
        $(element).find('.color-primary').each((_, priceEl) => {
          const text = $(priceEl).text().trim();
          const cleanText = text.replace(/[^0-9,]/g, '');
          if (cleanText) {
            const price = parseFloat(cleanText.replace(',', '.'));
            if (price > 0) {
              prices.push(price);
            }
          }
        });
      });
      
      // Método 2: Buscar por clase article-row
      if (prices.length === 0) {
        $('.article-row').each((_, element) => {
          $(element).find('.color-primary').each((_, priceEl) => {
            const text = $(priceEl).text().trim();
            const cleanText = text.replace(/[^0-9,]/g, '');
            if (cleanText) {
              const price = parseFloat(cleanText.replace(',', '.'));
              if (price > 0) {
                prices.push(price);
              }
            }
          });
        });
      }
      
      // Método 3: Buscar cualquier precio
      if (prices.length === 0) {
        $('.color-primary').each((_, element) => {
          const text = $(element).text().trim();
          if (text.includes('€')) {
            const cleanText = text.replace(/[^0-9,]/g, '');
            if (cleanText) {
              const price = parseFloat(cleanText.replace(',', '.'));
              if (price > 0) {
                prices.push(price);
              }
            }
          }
        });
      }
      
      if (prices.length === 0) {
        throw new Error('No se pudieron extraer precios de la página');
      }
      
      // Ordenar los precios y obtener el más bajo
      prices.sort((a, b) => a - b);
      const lowestPrice = prices[0];
      
      console.log(`✅ Precio más bajo encontrado: ${lowestPrice}€`);
      
      return {
        success: true,
        price: lowestPrice
      };
    } finally {
      // Asegurarse de limpiar el timeout
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error obteniendo precio de Cardmarket: ${errorMessage}`);
    
    return { 
      success: false, 
      price: 0, 
      error: errorMessage 
    };
  }
}

/**
 * Función principal para obtener precios, con reintentos y cache
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
  
  // Usar la función con reintentos para mayor robustez
  return await fetchWithRetries(url, 3);
}

/**
 * Guarda o actualiza un precio de Cardmarket en la base de datos
 */
export async function saveCardmarketPrice(data: Omit<CardmarketPrice, 'id' | 'updatedAt'>): Promise<string> {
  try {
    // Validar los datos antes de guardar
    if (!data.productId || !data.price || data.price <= 0) {
      const errorMsg = `Datos de precio inválidos: productId=${data.productId}, price=${data.price}`;
      console.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    console.log(`💾 Guardando precio para ${data.productName}: ${data.price}€`);
    
    // Eliminar cualquier precio existente para este producto
    await deleteCardmarketPrice(data.productId);
    
    // Guardar el nuevo precio
    const docRef = await addDoc(pricesCollection, {
      ...data,
      updatedAt: serverTimestamp()
    });
    
    console.log(`✅ Precio guardado correctamente para ${data.productName}: ${data.price}€ (ID: ${docRef.id})`);
    return docRef.id;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`💔 Error al guardar precio para ${data.productName}: ${errorMsg}`);
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
    console.error(`💔 Error al eliminar precio para producto ${productId}: ${error}`);
    return false;
  }
}

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

    // SCRAPING DIRECTO - Obtener el precio actualizado directamente de Cardmarket
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