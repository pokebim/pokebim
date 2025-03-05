/**
 * Tabla de precios de referencia para productos destacados
 * Estos precios sirven como referencia y son actualizados automáticamente
 * 
 * Última actualización: 05/03/2024, 12:00
 */
export const REFERENCE_PRICES: {[key: string]: number} = {
  // Los precios se actualizarán automáticamente
};

/**
 * Obtiene el precio de referencia para un producto
 * @param productName Nombre del producto
 * @returns Precio de referencia o undefined si no existe
 */
export function getReferencePrice(productName: string): number | undefined {
  return REFERENCE_PRICES[productName];
}

/**
 * Verifica si un producto tiene precio de referencia
 * @param productName Nombre del producto
 * @returns true si el producto tiene precio de referencia
 */
export function hasReferencePrice(productName: string): boolean {
  return productName in REFERENCE_PRICES;
}

/**
 * Obtiene todos los productos con precio de referencia
 * @returns Array de nombres de productos
 */
export function getProductsWithReferencePrice(): string[] {
  return Object.keys(REFERENCE_PRICES);
}

/**
 * Obtiene el precio de referencia más bajo
 * @returns El precio más bajo o undefined si no hay precios
 */
export function getLowestReferencePrice(): number | undefined {
  const prices = Object.values(REFERENCE_PRICES);
  return prices.length > 0 ? Math.min(...prices) : undefined;
}

/**
 * Obtiene el precio de referencia más alto
 * @returns El precio más alto o undefined si no hay precios
 */
export function getHighestReferencePrice(): number | undefined {
  const prices = Object.values(REFERENCE_PRICES);
  return prices.length > 0 ? Math.max(...prices) : undefined;
}

/**
 * Calcula el precio promedio de referencia
 * @returns El precio promedio o undefined si no hay precios
 */
export function getAverageReferencePrice(): number | undefined {
  const prices = Object.values(REFERENCE_PRICES);
  if (prices.length === 0) return undefined;
  const sum = prices.reduce((acc, price) => acc + price, 0);
  return sum / prices.length;
}

/**
 * Obtiene los productos ordenados por precio (de menor a mayor)
 * @returns Array de objetos con nombre y precio
 */
export function getProductsSortedByPrice(): Array<{name: string; price: number}> {
  return Object.entries(REFERENCE_PRICES)
    .map(([name, price]) => ({ name, price }))
    .sort((a, b) => a.price - b.price);
}

/**
 * Obtiene los productos con precios dentro de un rango
 * @param minPrice Precio mínimo
 * @param maxPrice Precio máximo
 * @returns Array de objetos con nombre y precio
 */
export function getProductsInPriceRange(minPrice: number, maxPrice: number): Array<{name: string; price: number}> {
  return Object.entries(REFERENCE_PRICES)
    .map(([name, price]) => ({ name, price }))
    .filter(({ price }) => price >= minPrice && price <= maxPrice);
}

/**
 * Obtiene los productos que coinciden con un patrón de búsqueda
 * @param searchPattern Patrón de búsqueda (case insensitive)
 * @returns Array de objetos con nombre y precio
 */
export function searchProductsByName(searchPattern: string): Array<{name: string; price: number}> {
  const pattern = new RegExp(searchPattern, 'i');
  return Object.entries(REFERENCE_PRICES)
    .filter(([name]) => pattern.test(name))
    .map(([name, price]) => ({ name, price }));
} 