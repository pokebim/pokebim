import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

/**
 * Genera un User-Agent aleatorio pero realista para evitar detección
 */
function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
  ];
  
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * API para obtener el precio más bajo actual de un producto en Cardmarket
 * 
 * Uso: /api/cardmarket-price?url=https://www.cardmarket.com/en/Pokemon/Products/...
 */
export async function GET(request: NextRequest) {
  // Obtener la URL de Cardmarket de los parámetros de consulta
  const searchParams = request.nextUrl.searchParams;
  const cardmarketUrl = searchParams.get('url');
  
  if (!cardmarketUrl) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'URL de Cardmarket no proporcionada' 
      },
      { status: 400 }
    );
  }
  
  try {
    console.log(`API: Obteniendo precio para ${cardmarketUrl}`);
    
    // Agregar un parámetro de timestamp para evitar caché
    const urlWithNoCache = `${cardmarketUrl}${cardmarketUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;
    
    // Realizar la solicitud HTTP a Cardmarket con cabeceras para simular un navegador
    const response = await fetch(urlWithNoCache, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://www.google.com/',
        'DNT': '1'
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error al acceder a Cardmarket: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`API: HTML obtenido, longitud: ${html.length} caracteres`);
    
    if (html.length < 1000) {
      console.error("API: HTML demasiado corto, posible respuesta incompleta o bloqueo");
      throw new Error("Respuesta HTML incompleta o posible bloqueo de Cardmarket");
    }
    
    // Cargar el HTML en cheerio para analizarlo
    const $ = cheerio.load(html);
    
    // ============= ANÁLISIS ESTRUCTURADO DE LA PÁGINA =============
    
    // 0. DEPURACIÓN - Guardamos información de la página para diagnóstico
    const title = $('title').text().trim();
    console.log(`API: Título de la página: "${title}"`);
    
    // Extender el soporte con varios métodos de extracción, especialmente para la estructura proporcionada
    
    // 1. ANÁLISIS ESPECÍFICO DE LA ESTRUCTURA COMPARTIDA POR EL USUARIO
    // Buscar elementos con la clase color-primary que contengan precios en formato europeo
    const specificPriceElements = $('.color-primary:contains("€")');
    
    if (specificPriceElements.length > 0) {
      console.log(`API: Encontrados ${specificPriceElements.length} elementos con clase color-primary que contienen precios`);
      
      const prices: number[] = [];
      
      specificPriceElements.each((index, element) => {
        const text = $(element).text().trim();
        console.log(`API: Texto de elemento #${index + 1}: "${text}"`);
        
        // Regex específica para capturar precios tanto en formato 100,00 € como 100.00 €
        const priceMatch = text.match(/(\d+[.,]\d+)\s*€/);
        
        if (priceMatch && priceMatch[1]) {
          // Convertir a número, reemplazando comas con puntos si es necesario
          const priceText = priceMatch[1];
          const price = parseFloat(priceText.replace(',', '.'));
          
          if (price > 0) {
            prices.push(price);
            console.log(`API: Precio extraído #${index + 1}: ${priceText} -> ${price}€`);
          }
        }
      });
      
      if (prices.length > 0) {
        prices.sort((a, b) => a - b); // Ordenar ascendentemente
        const lowestPrice = prices[0];
        
        console.log(`API: Precio más bajo encontrado del análisis específico: ${lowestPrice}€`);
        
        return NextResponse.json({
          success: true,
          price: lowestPrice,
          url: cardmarketUrl,
          source: 'Análisis de elementos color-primary',
          pricesFound: prices.length,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // 2. ANÁLISIS ESPECÍFICO PARA EL FORMATO DEL USUARIO
    // Estructura exacta como en el ejemplo proporcionado
    const articleRows = $('.article-row');
    console.log(`API: Encontradas ${articleRows.length} filas con clase article-row`);
    
    if (articleRows.length > 0) {
      const prices: number[] = [];
      
      articleRows.each((index, row) => {
        // Buscar el precio en la estructura exacta proporcionada por el usuario
        $(row).find('.col-offer .price-container .color-primary, .d-flex .color-primary').each((_, priceElem) => {
          const text = $(priceElem).text().trim();
          console.log(`API: Texto de precio en article-row #${index + 1}: "${text}"`);
          
          // Regex para extraer el formato 100,00 € específicamente
          const priceMatch = text.match(/(\d+[.,]\d+)\s*€/);
          if (priceMatch && priceMatch[1]) {
            const price = parseFloat(priceMatch[1].replace(',', '.'));
            if (price > 0) {
              prices.push(price);
              console.log(`API: Precio extraído de article-row #${index + 1}: ${price}€`);
            }
          }
        });
        
        // Buscar en la versión móvil de la oferta si existe
        $(row).find('.mobile-offer-container .color-primary').each((_, priceElem) => {
          const text = $(priceElem).text().trim();
          console.log(`API: Texto de precio móvil en article-row #${index + 1}: "${text}"`);
          
          const priceMatch = text.match(/(\d+[.,]\d+)\s*€/);
          if (priceMatch && priceMatch[1]) {
            const price = parseFloat(priceMatch[1].replace(',', '.'));
            if (price > 0) {
              prices.push(price);
              console.log(`API: Precio extraído de versión móvil #${index + 1}: ${price}€`);
            }
          }
        });
      });
      
      if (prices.length > 0) {
        prices.sort((a, b) => a - b); // Ordenar ascendentemente
        const lowestPrice = prices[0];
        
        console.log(`API: Precio más bajo encontrado en article-rows: ${lowestPrice}€`);
        
        return NextResponse.json({
          success: true,
          price: lowestPrice,
          url: cardmarketUrl,
          source: 'Análisis de article-rows',
          pricesFound: prices.length,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // 3. ANÁLISIS GENERAL DE LA TABLA DE OFERTAS
    // Buscar cualquier estructura de oferta
    const offerRows = $('.table-body .article-row, .article-row');
    
    console.log(`API: Encontradas ${offerRows.length} filas de ofertas`);
    
    if (offerRows.length > 0) {
      // Recolectar todos los precios de la tabla de ofertas
      const offers: { price: number, text: string }[] = [];
      
      offerRows.each((index, row) => {
        // Buscar precios en múltiples ubicaciones posibles dentro de article-row
        const priceElements = [
          $(row).find('.col-offer .price-container .color-primary'),
          $(row).find('.color-primary'),
          $(row).find('*:contains("€")')
        ];
        
        // Usar el primer selector que encuentre algo
        let priceElement = null;
        for (const selector of priceElements) {
          if (selector.length > 0) {
            priceElement = selector;
            break;
          }
        }
        
        if (priceElement) {
          const priceText = priceElement.text().trim();
          console.log(`API: Texto de oferta #${index + 1}: "${priceText}"`);
          
          const priceMatch = priceText.match(/(\d+[.,]\d+)\s*€/);
          
          if (priceMatch && priceMatch[1]) {
            const price = parseFloat(priceMatch[1].replace(',', '.'));
            
            if (price > 0) {
              offers.push({ 
                price, 
                text: priceText 
              });
              console.log(`API: Oferta #${index + 1}: ${priceText} -> ${price}€`);
            }
          }
        }
      });
      
      if (offers.length > 0) {
        // Ordenar ofertas por precio ascendente
        offers.sort((a, b) => a.price - b.price);
        
        const lowestPrice = offers[0].price;
        const lowestPriceText = offers[0].text;
        
        console.log(`API: Precio más bajo encontrado: ${lowestPriceText} (${lowestPrice}€)`);
        
        return NextResponse.json({
          success: true,
          price: lowestPrice,
          url: cardmarketUrl,
          source: 'Tabla de ofertas',
          offersCount: offers.length,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // 4. OBTENER DESDE LA INFO GENERAL
    // Buscar el valor "From" en la información del producto
    const fromSection = $('dt:contains("From")').next('dd');
    if (fromSection.length > 0) {
      const fromText = fromSection.text().trim();
      console.log(`API: Texto de sección "From": "${fromText}"`);
      
      const priceMatch = fromText.match(/(\d+[.,]\d+)/);
      if (priceMatch && priceMatch[1]) {
        const price = parseFloat(priceMatch[1].replace(',', '.'));
        
        if (price > 0) {
          console.log(`API: Precio encontrado en sección 'From': ${price}€`);
          
          return NextResponse.json({
            success: true,
            price: price,
            url: cardmarketUrl,
            source: 'Sección From',
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    // 5. RESPALDO FINAL - ANÁLISIS DE TEXTO COMPLETO
    // Último recurso: analizar todo el texto de la página
    const bodyText = $('body').text();
    const eurPriceMatches = bodyText.match(/(\d+[.,]\d+)\s*€/g);
    
    if (eurPriceMatches && eurPriceMatches.length > 0) {
      console.log(`API: Encontrados ${eurPriceMatches.length} posibles precios en texto:`, eurPriceMatches);
      
      const prices = eurPriceMatches
        .map(match => {
          const numMatch = match.match(/(\d+[.,]\d+)/);
          return numMatch ? parseFloat(numMatch[1].replace(',', '.')) : null;
        })
        .filter(price => price !== null && price > 0) as number[];
      
      if (prices.length > 0) {
        const lowestPrice = Math.min(...prices);
        
        console.log(`API: Precio más bajo del análisis de texto: ${lowestPrice}€`);
        
        return NextResponse.json({
          success: true,
          price: lowestPrice,
          url: cardmarketUrl,
          source: 'Análisis de texto',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Si llegamos aquí, no pudimos encontrar ningún precio
    console.error("API: No se pudo encontrar ningún precio en la página.");
    
    // Guardar parte del HTML para análisis posterior
    const htmlSnippet = html.substring(0, 2000);
    console.error(`API: Primeras 2000 caracteres del HTML para diagnóstico:`);
    console.error(htmlSnippet);
    
    throw new Error('No se pudo extraer el precio. La estructura de la página puede haber cambiado.');
    
  } catch (error) {
    console.error('Error al obtener precio de Cardmarket:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Error al obtener precio: ${error instanceof Error ? error.message : String(error)}` 
      },
      { status: 500 }
    );
  }
} 