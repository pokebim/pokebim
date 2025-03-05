import { NextRequest, NextResponse } from 'next/server';

/**
 * API proxy para Cardmarket
 * 
 * Esta API utiliza servicios proxy para evitar problemas de CORS y bloqueos
 * al acceder a Cardmarket directamente.
 */
export async function GET(request: NextRequest) {
  // Obtener la URL de Cardmarket de los parámetros
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
    console.log(`Proxy: Procesando URL: ${cardmarketUrl}`);
    
    // Usar un servicio proxy público para evitar CORS
    // Opciones (sustituir con servicios de pago en producción):
    // 1. https://api.allorigins.win/raw?url=
    // 2. https://corsproxy.io/?
    // 3. https://proxy.cors.sh/
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(cardmarketUrl)}`;
    
    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Cache-Control': 'no-cache'
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error al acceder a través del proxy: ${response.status} ${response.statusText}`);
    }
    
    // Obtener el contenido HTML
    const html = await response.text();
    
    // Verificar si el HTML es válido y tiene suficiente contenido
    if (!html || html.length < 1000) {
      throw new Error('Respuesta HTML incompleta o proxy bloqueado');
    }
    
    // Extraer los precios del HTML usando expresiones regulares 
    // para evitar depender de cheerio que puede causar problemas en Vercel
    const prices = extractPricesWithRegex(html);
    
    if (!prices || prices.length === 0) {
      throw new Error('No se encontraron precios en la página');
    }
    
    // Encontrar el precio más bajo
    const lowestPrice = Math.min(...prices);
    
    console.log(`Proxy: Precio más bajo encontrado: ${lowestPrice}€`);
    
    // Devolver respuesta con cache para reducir carga
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
  } catch (error) {
    console.error('Error en proxy:', error);
    
    // Mensajes específicos según el tipo de error
    let errorMessage = 'Error al obtener datos mediante proxy';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
}

/**
 * Extrae precios de un HTML usando expresiones regulares
 * Más liviano y seguro para entornos serverless que cheerio
 */
function extractPricesWithRegex(html: string): number[] {
  const prices: number[] = [];
  
  // Patrones para encontrar precios en el HTML
  const patterns = [
    // Patrón 1: Buscar en elementos color-primary
    /<span[^>]*class="[^"]*color-primary[^"]*"[^>]*>(.*?)<\/span>/gi,
    // Patrón 2: Buscar cualquier contenido con formato de precio
    /(\d+,\d+)\s*€/g
  ];
  
  for (const pattern of patterns) {
    const matches = html.matchAll(new RegExp(pattern, 'gi'));
    for (const match of matches) {
      const text = match[0];
      // Extraer números y comas
      const priceMatches = text.match(/(\d+,\d+)/);
      if (priceMatches && priceMatches[1]) {
        const price = parseFloat(priceMatches[1].replace(',', '.'));
        if (price > 0) {
          prices.push(price);
        }
      }
    }
    
    // Si encontramos precios con este patrón, no necesitamos continuar
    if (prices.length > 0) {
      break;
    }
  }
  
  return prices;
} 