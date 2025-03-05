import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Import required packages
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Configure cache directories
const CACHE_DIR = process.platform === 'win32' 
  ? path.join(process.cwd(), '.chromium-cache') 
  : '/tmp/chromium-cache';

// Install the stealth plugin
puppeteerExtra.use(StealthPlugin());

// Log the start of processing
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
    
    console.log('API: Loading dependencies...');
    
    // Import modules dynamically to reduce memory usage until needed
    const chromium = await import('@sparticuz/chromium');
    
    console.log('API: Dependencies loaded successfully');
    
    // Ensure cache directory exists
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      console.log(`API: Cache directory created: ${CACHE_DIR}`);
    }
    
    // Configure browser launch options with anti-detection measures
    const launchOptions = {
      args: [
        ...chromium.default.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--hide-scrollbars',
        '--disable-notifications',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-sync',
        '--no-default-browser-check',
        '--no-first-run',
        '--disable-background-networking',
        '--window-size=1920,1080',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
      ],
      defaultViewport: {
        width: 1920,
        height: 1080
      },
      executablePath: process.platform === 'win32'
        ? await chromium.default.executablePath({
            folder: CACHE_DIR,
          })
        : await chromium.default.executablePath(
            'https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar',
            { targetDirectory: CACHE_DIR }
          ),
      headless: true,
      ignoreHTTPSErrors: true
    };
    
    console.log('API: Launching browser...');
    
    // Launch browser with stealth
    browser = await puppeteerExtra.launch(launchOptions);
    
    console.log('API: Browser launched successfully');
    
    // Create a new page with additional evasion techniques
    const page = await browser.newPage();
    
    // Apply additional evasion techniques
    await page.evaluateOnNewDocument(() => {
      // Override properties that identify as headless
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      
      // Mock the Chrome app
      if (!window.chrome) {
        window.chrome = {};
      }
      window.chrome.app = {
        InstallState: 'hehe',
        RunningState: 'running',
        getDetails: () => ({}),
        getIsInstalled: () => true,
        installState: () => 'installed',
        isInstalled: true,
        runningState: () => 'running',
      };
      
      // Mock window.Notification
      window.Notification = {
        permission: 'default',
        requestPermission: () => Promise.resolve('default'),
      };
      
      // Add WebGL renderer
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
          return 'Intel Inc.';
        }
        if (parameter === 37446) {
          return 'Intel Iris OpenGL Engine';
        }
        return getParameter.apply(this, [parameter]);
      };
    });
    
    // Set cookies and additional headers to appear more human
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-User': '?1',
      'Sec-Fetch-Dest': 'document',
      'Accept-Encoding': 'gzip, deflate, br',
      'Upgrade-Insecure-Requests': '1'
    });
    
    console.log(`API: Navigating to URL: ${url}`);
    
    // Navigate to the page with wait until load to ensure full page load
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('API: Page loaded successfully');
    
    // Extract prices using more reliable techniques
    const result = await page.evaluate(() => {
      // Look for prices with various selectors to enhance reliability
      const priceElements = [
        ...document.querySelectorAll('.price-card'),
        ...document.querySelectorAll('.product-price'),
        ...document.querySelectorAll('.col-offer-price'),
        ...document.querySelectorAll('.price'),
        ...document.querySelectorAll('[data-price]')
      ];
      
      const prices = priceElements.map(el => {
        // Try to get price from different attributes and contents
        const text = el.textContent?.trim() || '';
        const dataPrice = el.getAttribute('data-price') || '';
        
        // Regular expression to match prices in various formats
        const priceRegex = /(\d+[,.]\d+)/;
        const textMatch = text.match(priceRegex);
        const dataPriceMatch = dataPrice.match(priceRegex);
        
        return {
          text: text,
          dataPrice: dataPrice,
          extractedFromText: textMatch ? textMatch[0] : null,
          extractedFromData: dataPriceMatch ? dataPriceMatch[0] : null
        };
      });
      
      return {
        title: document.title,
        url: window.location.href,
        prices: prices
      };
    });
    
    console.log('API: Data extracted successfully');
    
    // Close browser to free resources
    await browser.close();
    browser = null;
    
    // Return the extracted data
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error: any) {
    console.error('API: Error during processing:', error);
    
    // Return appropriate error response
    return NextResponse.json({ 
      error: error.message || 'Error processing request',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { 
      status: 500 
    });
    
  } finally {
    // Ensure browser is closed to prevent memory leaks
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.error('API: Error closing browser:', error);
      }
    }
  }
} 