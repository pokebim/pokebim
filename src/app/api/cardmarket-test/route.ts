import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Obtener la URL de los parámetros de consulta
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    // Validar la URL
    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'URL no proporcionada. Utiliza ?url=https://www.cardmarket.com/...'
      }, { status: 400 });
    }
    
    // Comprobar si la URL es de CardMarket
    if (!url.includes('cardmarket.com')) {
      return NextResponse.json({
        success: false,
        error: 'La URL debe ser de cardmarket.com'
      }, { status: 400 });
    }
    
    console.log(`API Test: Obteniendo precio para URL: ${url}`);
    
    // Llamar directamente al endpoint de puppeteer usando fetch
    const puppeteerPath = `/api/cardmarket-puppeteer?url=${encodeURIComponent(url)}`;
    console.log(`API Test: Llamando a ${puppeteerPath}`);
    
    try {
      // Construir URL absoluta a partir de la URL de la solicitud
      const requestUrl = new URL(request.url);
      const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
      const puppeteerUrl = `${baseUrl}${puppeteerPath}`;
      
      console.log(`API Test: URL completa: ${puppeteerUrl}`);
      
      // Usamos fetch nativo con URL absoluta
      const response = await fetch(puppeteerUrl);
      
      if (!response.ok) {
        console.error(`API Test: Error HTTP: ${response.status}`);
        return NextResponse.json({
          success: false,
          error: `Error HTTP: ${response.status} ${response.statusText}`,
        }, { status: 500 });
      }
      
      const data = await response.json();
      console.log('API Test: Respuesta recibida:', JSON.stringify(data));
      
      if (data && data.success) {
        // Extraer el precio más bajo
        let lowestPrice = null;
        
        if (data.data) {
          // Primero intentamos usar priceFrom si está disponible
          if (data.data.priceFrom && data.data.priceFrom > 0) {
            lowestPrice = data.data.priceFrom;
            console.log(`API Test: Usando precio "desde": ${lowestPrice}€`);
          } 
          // Si no hay priceFrom, buscamos el precio más bajo en el array de precios
          else if (data.data.prices && data.data.prices.length > 0) {
            // Los precios ya vienen ordenados de menor a mayor
            lowestPrice = data.data.prices[0].price;
            console.log(`API Test: Usando el precio más bajo encontrado: ${lowestPrice}€`);
          }
        }
        
        if (lowestPrice && lowestPrice > 0) {
          console.log(`API Test: Precio obtenido correctamente: ${lowestPrice}€`);
          return NextResponse.json({
            success: true,
            price: lowestPrice,
            currency: '€',
            method: 'puppeteer-direct'
          });
        } else {
          console.error('API Test: No se encontró un precio válido en los datos');
          return NextResponse.json({
            success: false,
            error: 'No se encontró un precio válido en los datos',
            data: data
          }, { status: 500 });
        }
      } else {
        console.error('API Test: Error en la respuesta de puppeteer:', data.error);
        return NextResponse.json({
          success: false,
          error: data.error || 'Error en la respuesta de puppeteer',
          response: data
        }, { status: 500 });
      }
    } catch (fetchError) {
      console.error('API Test: Error al llamar a puppeteer:', fetchError);
      return NextResponse.json({
        success: false,
        error: `Error al llamar a puppeteer: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('API Test: Error general:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 