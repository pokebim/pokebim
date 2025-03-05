import { NextRequest, NextResponse } from 'next/server';
// Usamos import dinámico para evitar problemas de compilación
// import chromium from '@sparticuz/chromium';
// import puppeteer from 'puppeteer-core';

// Configuración para entorno Vercel Serverless con memoria limitada
const SAFE_TIMEOUT = 8000; // 8 segundos (menos del límite de Vercel)

/**
 * API optimizada para uso mínimo de memoria que utiliza Puppeteer 
 * para obtener precios de Cardmarket
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
  
  console.log(`Puppeteer: Procesando URL: ${cardmarketUrl}`);
  
  let browser;
  
  try {
    // Importar las dependencias dinámicamente para evitar problemas en build time
    const puppeteer = (await import('puppeteer-core')).default;
    const chromium = (await import('@sparticuz/chromium')).default;
    
    // Configurar Puppeteer para entorno serverless con memoria limitada
    browser = await puppeteer.launch({
      args: [
        ...chromium.args, 
        '--hide-scrollbars', 
        '--disable-web-security',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
        '--single-process', // <- Esta opción reduce drásticamente el uso de memoria
        '--disable-extensions'
      ],
      defaultViewport: {
        width: 800,
        height: 600,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        isLandscape: true
      },
      executablePath: await chromium.executablePath(),
      headless: true,
      ignoreHTTPSErrors: true,
    });
    
    const page = await browser.newPage();
    
    // Configuración agresiva para reducir memoria
    await page.setCacheEnabled(false);
    
    // Configurar navegador para parecer más humano
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Configurar timeout para evitar bloqueos en Vercel
    await page.setDefaultNavigationTimeout(SAFE_TIMEOUT);
    
    // Intercepción agresiva de solicitudes para minimizar uso de memoria
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      // Bloquear recursos innecesarios para agilizar la carga y reducir memoria
      if (['image', 'stylesheet', 'font', 'media', 'script', 'xhr', 'fetch', 'websocket', 'other'].includes(resourceType)) {
        if (resourceType === 'script' && Math.random() < 0.8) {
          // Permitir algunos scripts (20%) para que la página funcione
          req.continue();
        } else if (resourceType === 'xhr' && Math.random() < 0.5) {
          // Permitir algunos XHR (50%) para que la página funcione
          req.continue();
        } else {
          req.abort();
        }
      } else {
        req.continue();
      }
    });
    
    // Navegar a la URL de Cardmarket
    console.log(`Puppeteer: Navegando a: ${cardmarketUrl}`);
    await page.goto(cardmarketUrl, { 
      waitUntil: 'domcontentloaded', // Menos exigente que 'networkidle2'
      timeout: SAFE_TIMEOUT 
    });
    
    // Esperar solo lo mínimo necesario
    await page.waitForTimeout(800);
    
    // Simplificar la extracción - Usar una sola estrategia para reducir carga
    const prices = await page.evaluate(() => {
      // Buscar elementos con precios en la página
      const elements = document.querySelectorAll('.col-price, .price-container, .color-primary');
      const prices = [];
      
      elements.forEach(el => {
        const text = el.textContent || '';
        if (text.includes('€')) {
          // Extraer solo números y coma decimal
          const matches = text.match(/(\d+,\d+)/g);
          if (matches && matches.length) {
            for (const match of matches) {
              // Convertir al formato decimal con punto
              const price = parseFloat(match.replace(',', '.'));
              if (price > 0) {
                prices.push(price);
              }
            }
          }
        }
      });
      
      return prices;
    });
    
    // Cerrar el navegador lo antes posible para liberar memoria
    await browser.close();
    browser = null;
    
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
      } else if (errorMessage.includes('out of memory')) {
        errorMessage = 'Error: Se superó el límite de memoria de Vercel';
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
} 