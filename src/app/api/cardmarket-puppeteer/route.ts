import { NextRequest, NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

// Configuración para entorno Vercel Serverless
const SAFE_TIMEOUT = 8000; // 8 segundos (menos del límite de Vercel)

/**
 * API que utiliza Puppeteer para obtener precios de Cardmarket
 * Diseñada para funcionar en entornos serverless como Vercel
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
  
  console.log(`Puppeteer: Procesando URL: ${cardmarketUrl}`);
  
  let browser;
  
  try {
    // Configurar Puppeteer para entorno serverless
    browser = await puppeteer.launch({
      args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
      ignoreHTTPSErrors: true,
    });
    
    const page = await browser.newPage();
    
    // Configurar navegador para parecer más humano
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Configurar timeout para evitar bloqueos en Vercel
    await page.setDefaultNavigationTimeout(SAFE_TIMEOUT);
    
    // Intercepción de solicitudes para optimizar y evitar recursos innecesarios
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      // Bloquear recursos innecesarios para agilizar la carga
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    // Navegar a la URL de Cardmarket
    console.log(`Puppeteer: Navegando a: ${cardmarketUrl}`);
    await page.goto(cardmarketUrl, { waitUntil: 'networkidle2' });
    
    // Esperar un poco para que cargue el contenido dinámico
    await page.waitForTimeout(1000);
    
    // Obtener los precios disponibles en la página
    const prices = await page.evaluate(() => {
      const priceElements = Array.from(document.querySelectorAll('.col-price .price-container'));
      return priceElements.map(el => {
        const priceText = el.textContent || '';
        // Limpiar el texto y extraer solo números y coma decimal
        const cleanText = priceText.replace(/[^0-9,]/g, '');
        if (cleanText) {
          // Convertir al formato decimal con punto
          return parseFloat(cleanText.replace(',', '.'));
        }
        return 0;
      }).filter(price => price > 0);
    });
    
    // Si no se encuentra ningún precio con el selector principal, intentar con otros selectores
    if (!prices.length) {
      console.log('Puppeteer: Intentando selectores alternativos...');
      
      // Segunda estrategia de extracción con selectores más generales
      const altPrices = await page.evaluate(() => {
        // Buscar en cualquier elemento con clase color-primary (común en CardMarket)
        const priceElements = Array.from(document.querySelectorAll('.color-primary'));
        return priceElements.map(el => {
          const priceText = el.textContent || '';
          if (priceText.includes('€')) {
            const cleanText = priceText.replace(/[^0-9,]/g, '');
            if (cleanText) {
              return parseFloat(cleanText.replace(',', '.'));
            }
          }
          return 0;
        }).filter(price => price > 0);
      });
      
      // Combinar resultados
      prices.push(...altPrices);
    }
    
    // Capturar una captura de pantalla para depuración (opcional)
    // await page.screenshot({ path: '/tmp/cardmarket-debug.png' });
    
    if (!prices.length) {
      console.log('Puppeteer: No se encontraron precios en la página');
      return NextResponse.json(
        { success: false, error: 'No se encontraron precios en la página' },
        { status: 404 }
      );
    }
    
    // Ordenar precios y obtener el más bajo
    prices.sort((a, b) => a - b);
    const lowestPrice = prices[0];
    
    console.log(`Puppeteer: Precio más bajo encontrado: ${lowestPrice}€`);
    
    // Cerrar el navegador
    await browser.close();
    
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
  } catch (error) {
    console.error('Error en Puppeteer:', error);
    
    // Cerrar el navegador si sigue abierto
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Error al cerrar el navegador:', e);
      }
    }
    
    // Mensajes específicos según el tipo de error
    let errorMessage = 'Error al obtener datos con Puppeteer';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Errores específicos de timeout
      if (errorMessage.includes('Navigation timeout')) {
        errorMessage = 'Timeout: La página tardó demasiado en cargar';
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
} 