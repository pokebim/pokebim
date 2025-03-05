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
  if (!isValidCardmarketUrl(url)) {
    console.error(`Error: URL no válida para Cardmarket: ${url}`);
    return { 
      success: false, 
      price: 0, 
      error: 'URL no válida para Cardmarket' 
    };
  }

  try {
    console.log(`🔍 Obteniendo precio directamente de: ${url}`);
    
    // Scraping directo de la URL de Cardmarket - NO usamos nuestra API
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://www.google.com/'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error al acceder a Cardmarket: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`✅ HTML obtenido de Cardmarket, longitud: ${html.length} caracteres`);
    
    // Usar cheerio para analizar el HTML
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    
    // Buscar elementos article-row como en el ejemplo proporcionado
    const articleRows = $('.article-row');
    console.log(`Encontradas ${articleRows.length} filas con clase article-row`);
    
    if (articleRows.length === 0) {
      throw new Error('No se encontraron ofertas en la página');
    }
    
    // Extraer todos los precios de las ofertas
    const prices: number[] = [];
    
    articleRows.each((_, row) => {
      // Buscar específicamente elementos color-primary que contienen precios
      const priceElements = $(row).find('.color-primary');
      
      priceElements.each((_, element) => {
        const text = $(element).text().trim();
        console.log(`Texto encontrado: "${text}"`);
        
        // Regex para extraer precios en formato 100,00 €
        const priceMatch = text.match(/(\d+,\d+)\s*€/);
        if (priceMatch && priceMatch[1]) {
          // Convertir de formato europeo (coma como separador decimal) a número
          const price = parseFloat(priceMatch[1].replace(',', '.'));
          if (price > 0) {
            prices.push(price);
            console.log(`Precio extraído: ${price}€`);
          }
        }
      });
    });
    
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