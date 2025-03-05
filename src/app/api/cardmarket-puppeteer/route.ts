import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

// Common Chrome/Chromium paths
const CHROME_PATHS = {
  win64: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  win32: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  mac: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  linux: '/usr/bin/google-chrome'
};

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
    
    // Determine Chrome path based on platform
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
    
    console.log(`API: Using Chrome at: ${executablePath}`);
    
    // Configure browser options
    const launchOptions = {
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
    
    // Launch browser
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
      timeout: 30000 
    });
    console.log('API: Page loaded');
    
    // Extract data
    const pageData = await page.evaluate(() => {
      // Helper function to extract price
      function extractPrice(text) {
        const match = text.match(/(\d+[.,]\d+)\s*€/);
        return match ? parseFloat(match[1].replace(',', '.')) : null;
      }
      
      // Get card information
      const title = document.title;
      
      // Get prices - especially looking for the "desde X €" text
      const priceFromElement = document.querySelector('.col-offer-price');
      const priceFromText = priceFromElement ? priceFromElement.textContent.trim() : null;
      let priceFrom = null;
      
      if (priceFromText) {
        priceFrom = extractPrice(priceFromText);
      }
      
      // Get all price elements
      const allPriceElements = document.querySelectorAll('.price, .fw-bold, .font-weight-bold');
      const prices = [];
      
      allPriceElements.forEach(el => {
        const text = el.textContent.trim();
        const price = extractPrice(text);
        if (price && price > 0) {
          prices.push({
            text,
            price
          });
        }
      });
      
      return {
        title,
        url: window.location.href,
        priceFrom,
        prices: prices.sort((a, b) => a.price - b.price)
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