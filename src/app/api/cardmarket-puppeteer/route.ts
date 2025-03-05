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
    
    // Ordenar precios y obtener el más bajo/fiable
    let selectedPrice = selectMostReliablePrice(prices);
    console.log(`API: Precios encontrados: ${prices.join(', ')}€`);
    console.log(`API: Precio seleccionado: ${selectedPrice}€`);
    
    // Devolver respuesta con cache para reducir carga en Vercel
    return {
      success: true,
      response: new NextResponse(
        JSON.stringify({
          success: true,
          price: selectedPrice,
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
  
  // Patrones más precisos para encontrar precios en el HTML
  const patterns = [
    // Patrón específico para CardMarket (precio con símbolo €)
    /(\d+,\d+)\s*€(?![^<]*<\/span>\s*<span[^>]*>\d+<\/span>)/g, // Evita capturar la cantidad que sigue al precio
    // Precio en elementos sellprice y formato común
    /sellPrice[^>]*>[^<]*?(\d+,\d+)\s*€/g,
    // Precio en formato de tabla de ofertas
    /<div[^>]*class="[^"]*price[^"]*"[^>]*>\s*(\d+,\d+)\s*€\s*<\/div>/g,
    // Precios en sección de tabla (con contexto de precio)
    /<td[^>]*>([^<]*?(\d+,\d+)\s*€[^<]*?)<\/td>/g
  ];
  
  for (const pattern of patterns) {
    const matches = Array.from(html.matchAll(pattern));
    for (const match of matches) {
      // Capturar el grupo que contiene el precio, preferiblemente el segundo grupo si existe
      let priceText = match[1] || match[0];
      
      // Extraer solo números y comas del texto
      const priceMatches = priceText.match(/(\d+,\d+)/);
      if (priceMatches && priceMatches[1]) {
        const price = parseFloat(priceMatches[1].replace(',', '.'));
        // Filtro más estricto para precios realistas (mínimo 3€ para evitar cantidades)
        if (!isNaN(price) && price >= 3 && price < 5000) {
          prices.push(price);
        }
      }
    }
  }
  
  // Si no encontramos precios o los precios son demasiado bajos, intenta buscar el patrón específico
  // de precio en ofertas de CardMarket
  if (prices.length === 0 || Math.min(...prices) < 3) {
    // Intentar extraer los precios de la tabla de ofertas
    const offerTableRegex = /<tr[^>]*>\s*<td[^>]*>[^<]*<\/td>\s*<td[^>]*>[^<]*<\/td>\s*<td[^>]*>([^<]*?(\d+,\d+)\s*€[^<]*?)<\/td>/g;
    const offerMatches = Array.from(html.matchAll(offerTableRegex));
    
    for (const match of offerMatches) {
      if (match[2]) {
        const price = parseFloat(match[2].replace(',', '.'));
        if (!isNaN(price) && price >= 3 && price < 5000) {
          prices.push(price);
          console.log(`API: Encontrado precio en tabla de ofertas: ${price}€`);
        }
      }
    }
  }
  
  return prices;
}

/**
 * Método alternativo de extracción de precios con patrones más específicos para CardMarket
 */
function extractPricesAlternative(html: string): number[] {
  // Buscar específicamente en las secciones de oferta/precio de CardMarket
  const prices: number[] = [];
  
  // Buscar patrones de precio en secciones específicas de CardMarket
  const patterns = [
    // Patrón para precios en la tabla de ofertas
    /<td[^>]*>[^<]*<\/td>\s*<td[^>]*>[^<]*<\/td>\s*<td[^>]*>[^<]*?(\d+,\d+)\s*€[^<]*?<\/td>/g,
    // Patrón para el precio de tendencia
    /Precio de tendencia:?[^<]*?(\d+,\d+)\s*€/g,
    // Patrón para el precio de guía
    /priceGuideValue[^>]*>[^<]*?(\d+,\d+)\s*€[^<]*?</g,
    // Patrón para precio en info del artículo
    /articleRow[^>]*>[\s\S]*?Price:?[^<]*?(\d+,\d+)\s*€/g
  ];
  
  for (const pattern of patterns) {
    const matches = Array.from(html.matchAll(pattern));
    for (const match of matches) {
      if (match[1]) {
        const price = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(price) && price >= 3 && price < 5000) {
          prices.push(price);
          console.log(`API: Encontrado precio alternativo: ${price}€`);
        }
      }
    }
  }
  
  // Si aún no encontramos nada, buscar precios cerca del símbolo € con más contexto
  if (prices.length === 0) {
    // Intentar extraer solo cuando el formato es claramente un precio (con €)
    const euroContextRegex = /(?<!quantity">|stock">|Qty:|units|items|pcs)[^\d]*(\d+,\d+)\s*€/g;
    const euroMatches = Array.from(html.matchAll(euroContextRegex));
    
    for (const match of euroMatches) {
      if (match[1]) {
        const price = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(price) && price >= 3 && price < 5000) {
          prices.push(price);
          console.log(`API: Encontrado precio con contexto €: ${price}€`);
        }
      }
    }
    
    // Solo como último recurso, buscar cualquier decimal
    if (prices.length === 0) {
      const regex = /(\d+[.,]\d+)/g;
      const matches = html.match(regex);
      
      if (matches) {
        for (const match of matches) {
          const price = parseFloat(match.replace(',', '.'));
          // Filtro más estricto
          if (!isNaN(price) && price >= 3 && price < 1000) {
            prices.push(price);
          }
        }
      }
    }
  }
  
  return prices;
}

/**
 * Selecciona el precio más fiable de una lista de precios
 * Prioriza precios que aparecen múltiples veces o el precio más común en un rango
 */
function selectMostReliablePrice(prices: number[]): number {
  if (!prices || prices.length === 0) {
    throw new Error('No hay precios para seleccionar');
  }
  
  // Si solo hay un precio, devolverlo
  if (prices.length === 1) {
    return prices[0];
  }
  
  // Contar frecuencia de precios (redondeados a euros para agrupar similares)
  const priceCounts: Record<number, number> = {};
  
  for (const price of prices) {
    const roundedPrice = Math.round(price);
    priceCounts[roundedPrice] = (priceCounts[roundedPrice] || 0) + 1;
  }
  
  // Encontrar el precio más frecuente
  let mostFrequentPrice = 0;
  let highestFrequency = 0;
  
  for (const [priceStr, count] of Object.entries(priceCounts)) {
    const price = parseInt(priceStr);
    if (count > highestFrequency) {
      highestFrequency = count;
      mostFrequentPrice = price;
    }
  }
  
  // Si hay un precio claramente más frecuente, buscar el precio exacto más cercano a él
  if (highestFrequency > 1) {
    // Encontrar el precio real más cercano al valor redondeado más frecuente
    prices.sort((a, b) => 
      Math.abs(Math.round(a) - mostFrequentPrice) - Math.abs(Math.round(b) - mostFrequentPrice)
    );
    return prices[0];
  }
  
  // Si no hay un precio claramente más frecuente, tomar el precio más bajo que sea realista
  // Filtrar precios extremadamente bajos que podrían ser falsos positivos
  const realisticPrices = prices.filter(p => p >= 3);
  if (realisticPrices.length > 0) {
    realisticPrices.sort((a, b) => a - b);
    return realisticPrices[0]; // Devolver el precio más bajo realista
  }
  
  // Si todo lo demás falla, simplemente ordenar y devolver el más bajo
  prices.sort((a, b) => a - b);
  return prices[0];
} 