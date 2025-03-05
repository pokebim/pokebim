import puppeteer from 'puppeteer';

let browserPromise: Promise<any> | null = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process'
      ]
    });
  }
  return browserPromise;
}

export async function getCardmarketPrice(url: string): Promise<number | null> {
  if (!url || !url.includes('cardmarket.com')) {
    return null;
  }

  let browser;
  let page;

  try {
    browser = await getBrowser();
    page = await browser.newPage();

    // Configurar el User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/115.0');

    // Navegar a la URL con timeout reducido
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });

    // Esperar a que los precios se carguen con timeout reducido
    await page.waitForSelector('.col-offer .price-container .d-flex .d-flex span.color-primary', {
      timeout: 10000
    });

    // Extraer todos los precios
    const prices = await page.evaluate(() => {
      const priceElements = document.querySelectorAll('.col-offer .price-container .d-flex .d-flex span.color-primary');
      return Array.from(priceElements).map(el => {
        const priceText = el.textContent?.trim() || '';
        return parseFloat(priceText.replace(' €', '').replace(',', '.'));
      }).filter(price => !isNaN(price));
    });

    // Cerrar solo la página, no el navegador
    await page.close();

    // Retornar el precio más bajo si hay precios
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