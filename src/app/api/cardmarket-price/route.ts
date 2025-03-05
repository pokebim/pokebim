import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

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
    
    // Realizar la solicitud HTTP a Cardmarket
    const response = await fetch(cardmarketUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/'
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error al acceder a Cardmarket: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Cargar el HTML en cheerio para analizarlo
    const $ = cheerio.load(html);
    
    // Extraer el precio más bajo
    // El precio más bajo suele estar en un elemento con una clase específica 
    // o en una posición específica en la página
    
    // Método 1: Buscar por "From" que suele preceder al precio más bajo
    let lowestPrice = 0;
    
    // Buscar en la sección donde se muestra el precio mínimo (desde/from)
    // Este selector puede necesitar ajustes según la estructura actual del sitio
    const fromLabel = $('dt:contains("From")').next('dd');
    if (fromLabel.length) {
      const priceText = fromLabel.text().trim();
      // Extraer números de un texto como "100,00 €"
      const priceMatch = priceText.match(/(\d+[.,]\d+)/);
      if (priceMatch && priceMatch[0]) {
        // Convertir a número, reemplazando comas con puntos si es necesario
        lowestPrice = parseFloat(priceMatch[0].replace(',', '.'));
      }
    }
    
    // Método alternativo si el anterior falla
    if (lowestPrice <= 0) {
      // Buscar en la tabla de vendedores, ordenar por precio y obtener el primero
      const firstSellerPrice = $('.table-body .row:first-child .col-offer .price-container .color-primary');
      if (firstSellerPrice.length) {
        const priceText = firstSellerPrice.text().trim();
        const priceMatch = priceText.match(/(\d+[.,]\d+)/);
        if (priceMatch && priceMatch[0]) {
          lowestPrice = parseFloat(priceMatch[0].replace(',', '.'));
        }
      }
    }
    
    // Método de respaldo: buscar cualquier precio y tomar el menor
    if (lowestPrice <= 0) {
      const allPrices: number[] = [];
      $('.color-primary').each((_, elem) => {
        const priceText = $(elem).text().trim();
        const priceMatch = priceText.match(/(\d+[.,]\d+)/);
        if (priceMatch && priceMatch[0]) {
          allPrices.push(parseFloat(priceMatch[0].replace(',', '.')));
        }
      });
      
      if (allPrices.length > 0) {
        // Ordenar precios de menor a mayor y tomar el primero
        lowestPrice = Math.min(...allPrices);
      }
    }
    
    if (lowestPrice <= 0) {
      throw new Error('No se pudo extraer el precio de la página');
    }
    
    console.log(`API: Precio extraído para ${cardmarketUrl}: ${lowestPrice}€`);
    
    return NextResponse.json({
      success: true,
      price: lowestPrice,
      url: cardmarketUrl,
      timestamp: new Date().toISOString()
    });
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