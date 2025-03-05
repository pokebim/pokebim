import puppeteer from 'puppeteer';

export async function getCardmarketPrice(url: string): Promise<number | null> {
  if (!url || !url.includes('cardmarket.com')) {
    return null;
  }

  try {
    // Iniciar el navegador
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Crear una nueva página
    const page = await browser.newPage();

    // Configurar el User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/115.0');

    // Navegar a la URL
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Esperar a que los precios se carguen
    await page.waitForSelector('.col-offer .price-container .d-flex .d-flex span.color-primary', {
      timeout: 5000
    });

    // Extraer todos los precios
    const prices = await page.evaluate(() => {
      const priceElements = document.querySelectorAll('.col-offer .price-container .d-flex .d-flex span.color-primary');
      return Array.from(priceElements).map(el => {
        const priceText = el.textContent?.trim() || '';
        return parseFloat(priceText.replace(' €', '').replace(',', '.'));
      }).filter(price => !isNaN(price));
    });

    // Cerrar el navegador
    await browser.close();

    // Retornar el precio más bajo si hay precios
    if (prices.length > 0) {
      return Math.min(...prices);
    }

    return null;
  } catch (error) {
    console.error('Error al obtener el precio de Cardmarket:', error);
    return null;
  }
} 