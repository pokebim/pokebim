import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Configuración para entorno Vercel Serverless
const SAFE_TIMEOUT = 8000; // 8 segundos (menos del límite de Vercel)

/**
 * API optimizada para scraping de Cardmarket en entorno Vercel
 * 
 * Uso: /api/cardmarket-scraper?url=https://www.cardmarket.com/en/Pokemon/Products/...
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
  
  try {
    console.log(`Scraper: Procesando URL: ${cardmarketUrl}`);
    
    // Configurar timeout para evitar bloqueos en Vercel
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SAFE_TIMEOUT);
    
    try {
      const response = await fetch(cardmarketUrl, {
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
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Error al acceder a Cardmarket: ${response.status} ${response.statusText}`);
      }
      
      const html = await response.text();
      console.log(`Scraper: HTML obtenido, longitud: ${html.length} caracteres`);
      
      if (html.length < 1000) {
        throw new Error('Respuesta HTML incompleta o posible bloqueo');
      }
      
      const $ = cheerio.load(html);
      const prices: number[] = [];
      
      // Método 1: Buscar elementos con ID que comienza con "articleRow"
      $('[id^="articleRow"]').each((_, element) => {
        // Buscar específicamente elementos color-primary
        $(element).find('.color-primary').each((_, priceEl) => {
          const text = $(priceEl).text().trim();
          
          // Extraer solo los dígitos y la coma decimal
          const cleanText = text.replace(/[^0-9,]/g, '');
          if (cleanText) {
            const price = parseFloat(cleanText.replace(',', '.'));
            if (price > 0) {
              prices.push(price);
              console.log(`Scraper: Precio encontrado (articleRow): ${price}€`);
            }
          }
        });
      });
      
      // Método 2: Buscar elementos con clase "article-row"
      if (prices.length === 0) {
        $('.article-row').each((_, element) => {
          // Buscar elementos con clase color-primary
          $(element).find('.color-primary').each((_, priceEl) => {
            const text = $(priceEl).text().trim();
            
            // Extraer solo los dígitos y la coma decimal
            const cleanText = text.replace(/[^0-9,]/g, '');
            if (cleanText) {
              const price = parseFloat(cleanText.replace(',', '.'));
              if (price > 0) {
                prices.push(price);
                console.log(`Scraper: Precio encontrado (article-row): ${price}€`);
              }
            }
          });
        });
      }
      
      // Método 3: Buscar cualquier elemento con clase "color-primary"
      if (prices.length === 0) {
        $('.color-primary').each((_, element) => {
          const text = $(element).text().trim();
          
          if (text.includes('€')) {
            const cleanText = text.replace(/[^0-9,]/g, '');
            if (cleanText) {
              const price = parseFloat(cleanText.replace(',', '.'));
              if (price > 0) {
                prices.push(price);
                console.log(`Scraper: Precio encontrado (color-primary): ${price}€`);
              }
            }
          }
        });
      }
      
      if (prices.length === 0) {
        throw new Error('No se encontró ningún precio en la página');
      }
      
      // Ordenar precios y obtener el más bajo
      prices.sort((a, b) => a - b);
      const lowestPrice = prices[0];
      
      console.log(`Scraper: Precio más bajo encontrado: ${lowestPrice}€`);
      
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
    console.error('Error en scraping:', error);
    
    // Mensajes específicos según el tipo de error
    let errorMessage = 'Error al obtener datos';
    let statusCode = 500;
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      errorMessage = 'Timeout: El sitio tardó demasiado en responder';
    } else if (error instanceof Error) {
      errorMessage = error.message;
      
      // Si es un error 403 o similar, indicar problema de bloqueo
      if (errorMessage.includes('403')) {
        errorMessage = 'Acceso bloqueado por Cardmarket. Puede ser necesario usar un proxy.';
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
} 