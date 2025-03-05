// Servicio para interactuar con Cardmarket
import { db } from './firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore/lite';
import { updateProduct } from './productService';

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
    return false;
  }
}

/**
 * Esta función simula la obtención de datos de precios de Cardmarket.
 * En un entorno real, debería implementarse usando la API oficial de Cardmarket
 * o un servicio de web scraping.
 * 
 * @param url URL del producto en Cardmarket
 * @returns Objeto con el precio más bajo encontrado
 */
export async function fetchCardmarketPrice(url: string): Promise<{price: number, success: boolean, error?: string}> {
  // Validar que la URL es de Cardmarket
  if (!isValidCardmarketUrl(url)) {
    return {
      price: 0,
      success: false,
      error: 'URL no válida. Debe ser un enlace a cardmarket.com'
    };
  }
  
  try {
    // NOTA: En un entorno real, aquí haríamos una llamada a un servicio de backend
    // que se encargue de hacer scraping o usar la API de Cardmarket.
    // Por motivos de demostración, generamos un precio aleatorio entre 1 y 300€
    
    // Simulación: esperar un tiempo aleatorio para simular la latencia de red
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Simulación: generar un precio aleatorio entre 1 y 300€
    const randomPrice = parseFloat((1 + Math.random() * 299).toFixed(2));
    
    return {
      price: randomPrice,
      success: true
    };
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
 * Actualiza el precio de un producto con datos de Cardmarket
 * 
 * @param productId ID del producto a actualizar
 * @param cardmarketUrl URL del producto en Cardmarket
 * @returns Objeto con el resultado de la operación
 */
export async function updateCardmarketPriceForProduct(
  productId: string, 
  cardmarketUrl: string
): Promise<{success: boolean, price?: number, error?: string}> {
  if (!productId) {
    return {
      success: false,
      error: 'ID de producto no válido'
    };
  }
  
  if (!isValidCardmarketUrl(cardmarketUrl)) {
    return {
      success: false,
      error: 'URL de Cardmarket no válida. Asegúrate de que es una URL de cardmarket.com'
    };
  }
  
  try {
    // Obtener el precio actual de Cardmarket
    const priceData = await fetchCardmarketPrice(cardmarketUrl);
    
    if (!priceData.success || priceData.price <= 0) {
      return {
        success: false,
        error: priceData.error || 'No se pudo obtener el precio'
      };
    }
    
    // Actualizar el producto en Firebase
    await updateProduct(productId, {
      cardmarketPrice: priceData.price,
      lastPriceUpdate: serverTimestamp()
    });
    
    return {
      success: true,
      price: priceData.price
    };
  } catch (error) {
    console.error('Error al actualizar precio de Cardmarket:', error);
    return {
      success: false,
      error: 'Error al actualizar precio: ' + (error instanceof Error ? error.message : String(error))
    };
  }
}

/**
 * Actualiza los precios de todos los productos que tienen URL de Cardmarket
 * 
 * @returns Objeto con el resultado de la operación
 */
export async function updateAllCardmarketPrices(): Promise<{
  success: boolean, 
  updated: number, 
  failed: number,
  errors: string[]
}> {
  // Esta función debería implementarse en un entorno real
  // para actualizar periódicamente los precios de todos los productos
  
  // Como es una implementación de ejemplo, devolvemos un resultado simulado
  return {
    success: true,
    updated: 5,
    failed: 0,
    errors: []
  };
} 