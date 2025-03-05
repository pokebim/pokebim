import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

let browser: any = null;

async function getBrowser() {
  if (!browser) {
    // Desactivar WebGL ya que no lo necesitamos para scraping
    chromium.setGraphicsMode = false;

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    });
  }
  return browser;
}

export async function getCardmarketPrice(url: string): Promise<number | null> {
  if (!url || !url.includes('cardmarket.com')) {
    return null;
  }

  let page;

  try {
    const browser = await getBrowser();
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
  }
} 