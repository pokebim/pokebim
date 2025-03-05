import puppeteer from 'puppeteer';
import type { LaunchOptions } from 'puppeteer';

const options: LaunchOptions = {
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--window-size=1920x1080'
  ],
  defaultViewport: {
    width: 1920,
    height: 1080
  },
  executablePath: process.env.CHROME_PATH,
  headless: true,
  ignoreHTTPSErrors: true
};

export async function launchBrowser() {
  return await puppeteer.launch(options);
}

export async function getCardmarketPrice(url: string): Promise<number | null> {
  if (!url || !url.includes('cardmarket.com')) {
    return null;
  }

  let browser = null;
  let page = null;

  try {
    browser = await launchBrowser();
    page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/115.0');

    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });

    await page.waitForSelector('.col-offer .price-container .d-flex .d-flex span.color-primary', {
      timeout: 10000
    });

    const prices = await page.evaluate(() => {
      const priceElements = document.querySelectorAll('.col-offer .price-container .d-flex .d-flex span.color-primary');
      return Array.from(priceElements).map(el => {
        const priceText = el.textContent?.trim() || '';
        return parseFloat(priceText.replace(' €', '').replace(',', '.'));
      }).filter(price => !isNaN(price));
    });

    if (prices.length > 0) {
      return Math.min(...prices);
    }

    return null;
  } catch (error) {
    console.error('Error al obtener el precio de Cardmarket:', error);
    return null;
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (e) {
        console.error('Error cerrando la página:', e);
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Error cerrando el navegador:', e);
      }
    }
  }
} 