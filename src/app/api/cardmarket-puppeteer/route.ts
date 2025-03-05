import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import chromium from '@sparticuz/chromium';

// Common Chrome/Chromium paths for local development
const CHROME_PATHS = {
  win64: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  win32: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  mac: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  linux: '/usr/bin/google-chrome'
};

// Determinar si estamos en producción (Vercel) o desarrollo local
const isProduction = process.env.VERCEL === '1';

// Configurar el tiempo de ejecución máximo para Vercel (60 segundos)
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  let browser = null;
  
  try {
    // Parse URL parameter
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    console.log(`API: Processing request for URL: ${url}`);
    
    // Validate URL
    if (!url || !url.includes('cardmarket.com')) {
      return NextResponse.json({ error: 'URL inválida o no proporcionada' }, { status: 400 });
    }
    
    // Configurar las opciones de lanzamiento dependiendo del entorno
    let launchOptions = {};
    
    if (isProduction) {
      // En Vercel, usamos @sparticuz/chromium
      launchOptions = {
        executablePath: await chromium.executablePath(),
        args: [
          ...chromium.args,
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
          '--no-sandbox',
          '--disable-web-security',
          '--disable-features=site-per-process',
          '--window-size=1920,1080'
        ],
        headless: chromium.headless,
        defaultViewport: {
          width: 1920,
          height: 1080
        }
      };
      console.log('API: Using Chromium for serverless');
    } else {
      // En desarrollo local, usamos Chrome instalado
      let executablePath = CHROME_PATHS.win64; // Default to Windows 64-bit path
      
      if (process.platform === 'darwin') {
        executablePath = CHROME_PATHS.mac;
      } else if (process.platform === 'linux') {
        executablePath = CHROME_PATHS.linux;
      } else if (process.platform === 'win32') {
        // Check if 64-bit Chrome exists, otherwise try 32-bit path
        if (!fs.existsSync(CHROME_PATHS.win64)) {
          executablePath = CHROME_PATHS.win32;
        }
      }
      
      console.log(`API: Using local Chrome at: ${executablePath}`);
      
      launchOptions = {
        executablePath,
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--window-size=1920,1080',
        ],
        defaultViewport: {
          width: 1920,
          height: 1080
        }
      };
    }
    
    // Launch browser with the appropriate options
    browser = await puppeteer.launch(launchOptions);
    console.log('API: Browser launched successfully');
    
    // Create a new page
    const page = await browser.newPage();
    console.log('API: Page created');
    
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    
    // Add anti-bot detection measures
    await page.evaluateOnNewDocument(() => {
      // Hide WebDriver
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      
      // Add Chrome properties
      window.chrome = {
        app: {
          isInstalled: true,
        },
        runtime: {},
      };
    });
    
    // Navigate to the URL
    console.log(`API: Navigating to ${url}`);
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 20000 // Reducir a 20 segundos para evitar exceder el límite
    });
    console.log('API: Page loaded');
    
    // Extract data de forma más eficiente y robusta
    const pageData = await page.evaluate(() => {
      // Helper function to extract price
      function extractPrice(text) {
        if (!text) return null;
        // Usar una expresión regular más robusta que maneje diferentes formatos de precios
        const match = text.match(/(\d+[.,]\d+)\s*[€$£]/);
        return match ? parseFloat(match[1].replace(',', '.')) : null;
      }
      
      // Get card information
      const title = document.title;
      
      // Get prices - buscando todos los elementos que contienen precios
      const priceElements = [
        ...document.querySelectorAll('.col-offer-price, .price-container .fw-bold, .price'),
        ...document.querySelectorAll('.article-row .price'),
        ...document.querySelectorAll('div[class*="price"]') // Selector que busca cualquier clase que contenga "price"
      ];
      
      // Extraer y filtrar todos los precios válidos
      const prices = [];
      const seen = new Set(); // Para evitar duplicados
      
      priceElements.forEach(el => {
        const text = el.textContent.trim();
        const price = extractPrice(text);
        
        if (price && price > 0 && !seen.has(price)) {
          seen.add(price); // Marcar como visto
          prices.push({
            text,
            price
          });
        }
      });
      
      // Get priceFrom
      const priceFromElement = document.querySelector('.col-offer-price');
      const priceFromText = priceFromElement ? priceFromElement.textContent.trim() : null;
      let priceFrom = priceFromText ? extractPrice(priceFromText) : null;
      
      return {
        title,
        url: window.location.href,
        priceFrom,
        prices: prices.sort((a, b) => a.price - b.price) // Ordenar precios de menor a mayor
      };
    });
    
    // Close browser
    await browser.close();
    browser = null;
    
    // Return the extracted data
    return NextResponse.json({
      success: true,
      data: pageData
    });
    
  } catch (error) {
    console.error('API: Error during processing:', error);
    
    // Close browser if it's still open
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    // Return error response
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 