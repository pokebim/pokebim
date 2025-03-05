import { NextRequest, NextResponse } from 'next/server';
// Usamos import dinámico para evitar problemas de compilación
// import chromium from '@sparticuz/chromium';
// import puppeteer from 'puppeteer-core';

// Configuración para entorno Vercel Serverless con memoria limitada
const SAFE_TIMEOUT = 8000; // 8 segundos (menos del límite de Vercel)

/**
 * API optimizada para uso mínimo de memoria que utiliza fetch simple
 * en lugar de Puppeteer completo para obtener precios de Cardmarket
 * 
 * Optimizado para el plan Hobby de Vercel (1024MB de memoria)
 * 
 * Uso: /api/cardmarket-puppeteer?url=https://www.cardmarket.com/en/Pokemon/Products/...
 */
export async function GET(request: NextRequest) {
  // Obtener URL de Cardmarket de los parámetros
  const searchParams = request.nextUrl.searchParams;
  const cardmarketUrl = searchParams.get('url');
  
  // Validación de seguridad
  if (!cardmarketUrl || !cardmarketUrl.includes('cardmarket.com')) {
    return NextResponse.json(
      { success: false, error: 'URL no válida para Cardmarket' },
      { status: 400 }
    );
  }
  
  console.log(`API: Procesando URL: ${cardmarketUrl}`);
  
  try {
    // Enfoque más ligero - Usar fetch directo para obtener el HTML
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SAFE_TIMEOUT);
    
    try {
      console.log(`API: Realizando fetch a ${cardmarketUrl}`);
      
      // Usando un enfoque más ligero con fetch en lugar de Puppeteer
      const response = await fetch(cardmarketUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache'
        }
      });
      
      // Limpiar el timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
      }
      
      const html = await response.text();
      console.log(`API: HTML obtenido, longitud: ${html.length} caracteres`);
      
      if (html.length < 1000) {
        console.log(`API: HTML demasiado corto, posible bloqueo. Contenido: ${html.substring(0, 200)}...`);
        throw new Error('Respuesta HTML incompleta o bloqueo por parte de CardMarket');
      }
      
      // Extraer precios usando expresiones regulares (más eficiente que HTML parsing)
      const prices = extractPricesWithRegex(html);
      
      if (!prices || prices.length === 0) {
        console.log(`API: No se encontraron precios en el HTML`);
        
        // Intentar con un método alternativo
        const altPrices = extractPricesAlternative(html);
        
        if (!altPrices || altPrices.length === 0) {
          throw new Error('No se encontraron precios en la página');
        }
        
        prices.push(...altPrices);
      }
      
      // Ordenar precios y obtener el más bajo
      prices.sort((a, b) => a - b);
      const lowestPrice = prices[0];
      
      console.log(`API: Precio más bajo encontrado: ${lowestPrice}€`);
      
      // Devolver respuesta con cache para reducir carga en Vercel
      return new NextResponse(
        JSON.stringify({
          success: true,
          price: lowestPrice,
          url: cardmarketUrl,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 's-maxage=3600, stale-while-revalidate=1800'
          }
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Error en API:', error);
    
    // Mensajes específicos según el tipo de error
    let errorMessage = error instanceof Error ? error.message : String(error);
    let statusCode = 500;
    
    // Log detallado para diagnóstico
    console.error(`API ERROR DETALLADO: ${JSON.stringify({
      message: errorMessage,
      url: cardmarketUrl,
      timestamp: new Date().toISOString()
    })}`);
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}

/**
 * Extrae precios usando expresiones regulares
 * Más eficiente para entornos serverless que parser HTML
 */
function extractPricesWithRegex(html: string): number[] {
  const prices: number[] = [];
  
  // Patrones para encontrar precios en el HTML
  const patterns = [
    // Patrón para precios con formato X,XX €
    /(\d+,\d+)\s*€/g,
    // Patrón para precios en elementos price-container
    /price-container[^>]*>([^<]*\d+,\d+[^<]*)</g,
    // Patrón para precios en elementos color-primary
    /color-primary[^>]*>([^<]*\d+,\d+[^<]*)</g
  ];
  
  for (const pattern of patterns) {
    const matches = Array.from(html.matchAll(pattern));
    for (const match of matches) {
      let priceText = match[1] || match[0];
      
      // Extraer solo números y comas del texto
      const priceMatches = priceText.match(/(\d+,\d+)/);
      if (priceMatches && priceMatches[1]) {
        const price = parseFloat(priceMatches[1].replace(',', '.'));
        if (!isNaN(price) && price > 0) {
          prices.push(price);
        }
      }
    }
  }
  
  return prices;
}

/**
 * Método alternativo de extracción de precios con patrones más generales
 */
function extractPricesAlternative(html: string): number[] {
  // Buscar cualquier número con formato decimal en el HTML cerca de símbolo €
  const prices: number[] = [];
  const regex = /(\d+[.,]\d+)/g;
  const matches = html.match(regex);
  
  if (matches) {
    for (const match of matches) {
      // Validar que es un número y convertir a formato con punto decimal
      const price = parseFloat(match.replace(',', '.'));
      if (!isNaN(price) && price > 0 && price < 1000) { // Filtrar precios no realistas
        prices.push(price);
      }
    }
  }
  
  return prices;
} 