import { NextRequest, NextResponse } from 'next/server';
// Hemos eliminado completamente las referencias a Puppeteer

// Configuración para entorno Vercel Serverless con memoria limitada
const SAFE_TIMEOUT = 12000; // 12 segundos (menos del límite de Vercel)

// Array de User-Agents para rotación
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPad; CPU OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1'
];

// Lista de servicios proxy gratuitos que se pueden usar (variar según disponibilidad)
const PROXY_SERVICES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://cors-anywhere.herokuapp.com/'
];

// Obtener un User-Agent aleatorio
function getRandomUserAgent() {
  const index = Math.floor(Math.random() * USER_AGENTS.length);
  return USER_AGENTS[index];
}

// Obtener un servicio proxy aleatorio
function getRandomProxy() {
  const index = Math.floor(Math.random() * PROXY_SERVICES.length);
  return PROXY_SERVICES[index];
}

/**
 * API optimizada para uso mínimo de memoria que utiliza fetch con rotación de headers
 * y servicios proxy para obtener precios de Cardmarket evitando la detección de bots
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
  
  // Intentaremos con diferentes métodos secuencialmente
  let lastError = null;
  
  // 1. Primero intentamos con fetch directo
  try {
    const result = await fetchWithDirectRequest(cardmarketUrl);
    if (result.success) {
      return result.response;
    }
    lastError = result.error;
  } catch (error: any) {
    console.error(`API: Error con fetch directo: ${error.message}`);
    lastError = error;
  }
  
  // 2. Si falla, intentamos con un proxy
  try {
    console.log('API: El fetch directo falló, intentando con proxy...');
    const proxyUrl = getRandomProxy() + encodeURIComponent(cardmarketUrl);
    const result = await fetchWithDirectRequest(proxyUrl, true);
    if (result.success) {
      return result.response;
    }
    lastError = result.error;
  } catch (error: any) {
    console.error(`API: Error con fetch a través de proxy: ${error.message}`);
    lastError = error;
  }

  // 3. Si todo falla, devolvemos el último error
  return NextResponse.json(
    { 
      success: false, 
      error: `Todos los métodos de fetch fallaron. Último error: ${lastError?.message || 'Desconocido'}`,
      url: cardmarketUrl
    },
    { status: 500 }
  );
}

/**
 * Realiza un fetch con headers optimizados para evitar detección de bot
 */
async function fetchWithDirectRequest(url: string, isProxy = false): Promise<{success: boolean, response?: NextResponse, error?: Error}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SAFE_TIMEOUT);
  
  try {
    console.log(`API: Realizando fetch a ${url}${isProxy ? ' (a través de proxy)' : ''}`);
    
    // Usando fetch con headers mejorados para simular un navegador real
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.google.com/',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'cross-site',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
    
    // Limpiar el timeout
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`API: Error de respuesta HTTP: ${response.status} ${response.statusText}`);
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
      console.log(`API: No se encontraron precios con método principal. Intentando método alternativo...`);
      
      // Intentar con un método alternativo
      const altPrices = extractPricesAlternative(html);
      
      if (!altPrices || altPrices.length === 0) {
        console.error(`API: No se encontraron precios con ningún método.`);
        if (html.includes('too many requests') || html.includes('rate limit')) {
          throw new Error('Cardmarket ha limitado las solicitudes, intenta más tarde');
        }
        throw new Error('No se encontraron precios en la página');
      }
      
      prices.push(...altPrices);
    }
    
    // Ordenar precios y obtener el más bajo
    prices.sort((a, b) => a - b);
    const lowestPrice = prices[0];
    
    console.log(`API: Precio más bajo encontrado: ${lowestPrice}€`);
    
    // Devolver respuesta con cache para reducir carga en Vercel
    return {
      success: true,
      response: new NextResponse(
        JSON.stringify({
          success: true,
          price: lowestPrice,
          url: url,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 's-maxage=3600, stale-while-revalidate=1800'
          }
        }
      )
    };
  } catch (fetchError: any) {
    console.error(`API: Error en fetch: ${fetchError.message}`);
    clearTimeout(timeoutId);
    return {
      success: false,
      error: fetchError
    };
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
    /color-primary[^>]*>([^<]*\d+,\d+[^<]*)</g,
    // Patrones adicionales para capturar más formatos
    /priceGuide[^>]*>([^<]*\d+,\d+[^<]*)</g,
    /price[^>]*>([^<]*\d+,\d+[^<]*)</g,
    /value[^>]*>([^<]*\d+,\d+[^<]*)</g,
    /<span[^>]*>(\d+,\d+)\s*€<\/span>/g,
    // Patrones más específicos para diferentes secciones de CardMarket
    /averagePrice[^>]*>([^<]*\d+,\d+[^<]*)</g,
    /sellPrice[^>]*>([^<]*\d+,\d+[^<]*)</g,
    /"price">\s*(\d+,\d+)\s*</g,
    /<div[^>]*class="price"[^>]*>\s*(\d+,\d+)\s*</g,
    /\bPrice:?\s*(\d+,\d+)/g
  ];
  
  for (const pattern of patterns) {
    const matches = Array.from(html.matchAll(pattern));
    for (const match of matches) {
      let priceText = match[1] || match[0];
      
      // Extraer solo números y comas del texto
      const priceMatches = priceText.match(/(\d+,\d+)/);
      if (priceMatches && priceMatches[1]) {
        const price = parseFloat(priceMatches[1].replace(',', '.'));
        if (!isNaN(price) && price > 0 && price < 5000) { // Filtrar precios no realistas
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
  
  // Buscar patrones de precio cerca del símbolo €
  const euroRegex = /(\d+[.,]\d+)\s*€/g;
  const euroMatches = Array.from(html.matchAll(euroRegex));
  
  for (const match of euroMatches) {
    if (match[1]) {
      const price = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(price) && price > 0 && price < 5000) {
        prices.push(price);
      }
    }
  }
  
  // Si no encontramos nada con el símbolo €, buscamos decimales generales
  if (prices.length === 0) {
    const regex = /(\d+[.,]\d+)/g;
    const matches = html.match(regex);
    
    if (matches) {
      for (const match of matches) {
        const price = parseFloat(match.replace(',', '.'));
        if (!isNaN(price) && price > 0 && price < 1000) { // Filtrar precios no realistas
          prices.push(price);
        }
      }
    }
  }
  
  return prices;
} 