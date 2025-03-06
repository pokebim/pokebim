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
import axios from 'axios';
import { logToConsole } from './serverLogging';
import { PrismaClient } from '@prisma/client';

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

// Inicializa el cliente Prisma fuera de la función
const prisma = new PrismaClient();

interface CardmarketPriceResult {
  success: boolean;
  price?: number;
  currency?: string;
  method?: string;
  error?: string;
}

// Clave para la caché de precios de Cardmarket
const CARDMARKET_PRICES_CACHE_KEY = 'pokebim_cardmarket_prices_cache';
const CARDMARKET_PRICES_TIMESTAMP_KEY = 'pokebim_cardmarket_prices_cache_timestamp';
const CARDMARKET_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 horas, los precios de Cardmarket no cambian tan a menudo

/**
 * Valida si la URL de CardMarket proporcionada es válida
 */
function isValidCardmarketUrl(url: string): boolean {
  return url?.includes('cardmarket.com');
}

/**
 * Obtiene el precio de un producto de CardMarket a través de la API de Puppeteer
 */
export async function fetchCardmarketPrice(url: string): Promise<CardmarketPriceResult> {
  try {
    if (!isValidCardmarketUrl(url)) {
      return { 
        success: false, 
        error: 'La URL proporcionada no es de CardMarket' 
      };
    }

    console.log(`Obteniendo precio para: ${url}`);
    
    // Llamar a nuestro endpoint de puppeteer
    const puppeteerPath = `/api/cardmarket-puppeteer?url=${encodeURIComponent(url)}`;
    
    // Construir URL absoluta (funciona tanto en desarrollo como en producción)
    let baseUrl = '';
    
    // En servidor
    if (typeof window === 'undefined') {
      baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
    } 
    // En cliente
    else {
      baseUrl = window.location.origin;
    }
    
    const puppeteerUrl = `${baseUrl}${puppeteerPath}`;
    console.log(`Llamando a: ${puppeteerUrl}`);
    
    // Añadir un timeout mayor y configuración de reintentos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
    
    try {
      // Usamos fetch con URL absoluta
      const response = await fetch(puppeteerUrl, {
        signal: controller.signal,
        // Se asegura de que las cookies y credenciales se envíen si es necesario
        credentials: 'same-origin'
      });
      
      clearTimeout(timeoutId); // Limpiar el timeout si la solicitud termina antes
      
      // Verificar la respuesta del API
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.success) {
          // Extraer el precio más bajo
          let lowestPrice = null;
          
          if (data.data) {
            // Primero intentamos usar priceFrom si está disponible
            if (data.data.priceFrom && data.data.priceFrom > 0) {
              lowestPrice = data.data.priceFrom;
            } 
            // Si no hay priceFrom, buscamos el precio más bajo en el array de precios
            else if (data.data.prices && data.data.prices.length > 0) {
              // Los precios ya vienen ordenados de menor a mayor
              lowestPrice = data.data.prices[0].price;
            }
          }
          
          if (lowestPrice && lowestPrice > 0) {
            console.log(`Precio obtenido correctamente: ${lowestPrice}€`);
            return {
              success: true,
              price: lowestPrice,
              currency: '€',
              method: 'puppeteer'
            };
          } else {
            console.error('No se encontró un precio válido en los datos');
            return {
              success: false,
              error: 'No se encontró un precio válido en los datos'
            };
          }
        } else {
          console.error('Error en la respuesta del API:', data.error);
          return {
            success: false,
            error: data.error || 'Error en la respuesta del API'
          };
        }
      } else {
        const errorText = `Error HTTP: ${response.status} ${response.statusText}`;
        console.error('Error en la respuesta del API:', errorText);
        return {
          success: false,
          error: errorText
        };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId); // Asegurarse de limpiar el timeout en caso de error
      
      if (fetchError.name === 'AbortError') {
        console.error('La solicitud superó el tiempo máximo de espera (30 segundos)');
        return {
          success: false,
          error: 'Tiempo de espera agotado'
        };
      }
      
      throw fetchError; // Re-lanzar para que lo capture el catch externo
    }
  } catch (error) {
    console.error('Error al obtener precio:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
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
    // Primero verificar si existe en caché
    const cachedPrice = getCardmarketPriceFromCache(productId);
    if (cachedPrice) {
      return cachedPrice;
    }
    
    // Si no está en caché, consultar a Firebase
    const querySnapshot = await getDocs(
      query(pricesCollection, where("productId", "==", productId))
    );
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const data = querySnapshot.docs[0].data() as Omit<CardmarketPrice, 'id'>;
    const price = {
      ...data,
      id: querySnapshot.docs[0].id,
      updatedAt: data.updatedAt ? data.updatedAt : null
    } as CardmarketPrice;
    
    // Guardar en caché
    addCardmarketPriceToCache(price);
    
    return price;
  } catch (error) {
    console.error("Error al obtener precio de Cardmarket:", error);
    return null;
  }
}

/**
 * Obtiene todos los precios de Cardmarket en una sola consulta para reducir operaciones de lectura
 */
export async function getAllCardmarketPrices(): Promise<CardmarketPrice[]> {
  try {
    // Verificar si tenemos caché completa
    const allCachedPrices = getAllCardmarketPricesFromCache();
    if (allCachedPrices && allCachedPrices.length > 0) {
      console.log(`Usando ${allCachedPrices.length} precios de Cardmarket desde caché local`);
      return allCachedPrices;
    }
    
    console.log('Cargando todos los precios de Cardmarket desde Firebase...');
    
    // Obtener todos los precios en una sola consulta
    const querySnapshot = await getDocs(pricesCollection);
    
    if (querySnapshot.empty) {
      console.log('No hay precios de Cardmarket en Firebase');
      return [];
    }
    
    const prices: CardmarketPrice[] = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data() as Omit<CardmarketPrice, 'id'>;
      prices.push({
        ...data,
        id: doc.id,
        updatedAt: data.updatedAt ? data.updatedAt : null
      } as CardmarketPrice);
    });
    
    // Guardar en caché
    cacheAllCardmarketPrices(prices);
    
    console.log(`Cargados ${prices.length} precios de Cardmarket desde Firebase`);
    return prices;
  } catch (error) {
    console.error("Error al obtener todos los precios de Cardmarket:", error);
    return [];
  }
}

// Funciones para gestionar la caché de precios de Cardmarket

/**
 * Obtiene un precio de Cardmarket específico desde la caché
 */
function getCardmarketPriceFromCache(productId: string): CardmarketPrice | null {
  try {
    // Verificar si la caché existe y es válida
    const timestamp = localStorage.getItem(CARDMARKET_PRICES_TIMESTAMP_KEY);
    const cachedData = localStorage.getItem(CARDMARKET_PRICES_CACHE_KEY);
    
    if (!timestamp || !cachedData) return null;
    
    // Verificar si la caché ha expirado
    const cacheTime = parseInt(timestamp, 10);
    const now = Date.now();
    if (now - cacheTime > CARDMARKET_CACHE_TTL) {
      console.log('La caché de precios de Cardmarket ha expirado');
      return null;
    }
    
    // Buscar el precio en la caché
    const prices = JSON.parse(cachedData) as CardmarketPrice[];
    const cachedPrice = prices.find(p => p.productId === productId);
    
    return cachedPrice || null;
  } catch (error) {
    console.error('Error al leer precio de Cardmarket de caché:', error);
    return null;
  }
}

/**
 * Obtiene todos los precios de Cardmarket desde la caché
 */
function getAllCardmarketPricesFromCache(): CardmarketPrice[] | null {
  try {
    const timestamp = localStorage.getItem(CARDMARKET_PRICES_TIMESTAMP_KEY);
    const cachedData = localStorage.getItem(CARDMARKET_PRICES_CACHE_KEY);
    
    if (!timestamp || !cachedData) return null;
    
    // Verificar si la caché ha expirado
    const cacheTime = parseInt(timestamp, 10);
    const now = Date.now();
    if (now - cacheTime > CARDMARKET_CACHE_TTL) {
      console.log('La caché de precios de Cardmarket ha expirado');
      return null;
    }
    
    return JSON.parse(cachedData) as CardmarketPrice[];
  } catch (error) {
    console.error('Error al leer precios de Cardmarket de caché:', error);
    return null;
  }
}

/**
 * Añade un precio de Cardmarket a la caché
 */
function addCardmarketPriceToCache(price: CardmarketPrice): void {
  try {
    // Obtener la caché actual o crear una nueva
    let prices: CardmarketPrice[] = [];
    const cachedData = localStorage.getItem(CARDMARKET_PRICES_CACHE_KEY);
    
    if (cachedData) {
      prices = JSON.parse(cachedData) as CardmarketPrice[];
      // Eliminar el precio antiguo si existe
      prices = prices.filter(p => p.productId !== price.productId);
    }
    
    // Añadir el nuevo precio
    prices.push(price);
    
    // Guardar en caché
    localStorage.setItem(CARDMARKET_PRICES_CACHE_KEY, JSON.stringify(prices));
    localStorage.setItem(CARDMARKET_PRICES_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error al guardar precio de Cardmarket en caché:', error);
  }
}

/**
 * Guarda todos los precios de Cardmarket en la caché
 */
function cacheAllCardmarketPrices(prices: CardmarketPrice[]): void {
  try {
    localStorage.setItem(CARDMARKET_PRICES_CACHE_KEY, JSON.stringify(prices));
    localStorage.setItem(CARDMARKET_PRICES_TIMESTAMP_KEY, Date.now().toString());
    console.log(`${prices.length} precios de Cardmarket guardados en caché local`);
  } catch (error) {
    console.error('Error al guardar precios de Cardmarket en caché:', error);
  }
}

/**
 * Invalida la caché de precios de Cardmarket
 */
export function invalidateCardmarketPricesCache(): void {
  try {
    localStorage.removeItem(CARDMARKET_PRICES_CACHE_KEY);
    localStorage.removeItem(CARDMARKET_PRICES_TIMESTAMP_KEY);
    console.log('Caché de precios de Cardmarket invalidada');
  } catch (error) {
    console.error('Error al invalidar caché de precios de Cardmarket:', error);
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