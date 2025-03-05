import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Define interfaces for our data structures
interface PriceData {
  prices: Record<string, number>;
  timestamp?: string;
}

// Token de seguridad para autorizar actualizaciones
const API_TOKEN = process.env.PRICE_UPDATE_TOKEN || 'pokebim_secret_token';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.substring(7) !== API_TOKEN) {
      return NextResponse.json({ 
        success: false, 
        error: 'No autorizado' 
      }, { status: 401 });
    }
    
    // Obtener los datos de la solicitud y validar el tipo
    const data = await request.json() as PriceData;
    const prices = data.prices;
    const timestamp = data.timestamp || new Date().toISOString();
    
    if (!prices || Object.keys(prices).length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No se proporcionaron precios válidos' 
      }, { status: 400 });
    }
    
    // Registrar los precios actualizados en un archivo de log
    try {
      const logDir = path.join(process.cwd(), 'logs');
      
      // Crear directorio de logs si no existe
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      // Nombre del archivo de log con fecha
      const dateStr = new Date().toISOString().split('T')[0];
      const logFile = path.join(logDir, `price_updates_${dateStr}.json`);
      
      // Crear el objeto de log
      const logEntry = {
        timestamp,
        prices,
        count: Object.keys(prices).length
      };
      
      // Añadir al archivo de log (crear si no existe)
      let logs = [];
      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf8');
        logs = JSON.parse(content);
      }
      logs.push(logEntry);
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf8');
    } catch (logError) {
      console.error('Error al registrar actualización de precios:', logError);
      // Continuamos a pesar del error en el registro
    }
    
    // Construir la tabla de precios actualizada
    const formatTimestamp = new Date(timestamp).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let fileContent = `/**
 * Tabla de precios de referencia para productos destacados
 * Estos precios sirven como referencia y son actualizados automáticamente
 * 
 * Última actualización: ${formatTimestamp}
 */
export const REFERENCE_PRICES: {[key: string]: number} = {
`;
    
    // Añadir cada precio ordenado alfabéticamente
    const sortedEntries = Object.entries(prices).sort(([a], [b]) => a.localeCompare(b));
    for (const [name, price] of sortedEntries) {
      // Asegurarnos de que price es un número
      const numericPrice = typeof price === 'number' ? price : parseFloat(String(price));
      fileContent += `  '${name}': ${numericPrice.toFixed(2)},\n`;
    }
    
    fileContent += "};";
    
    // Ruta al archivo de servicio
    const filePath = path.join(process.cwd(), 'src', 'lib', 'cardmarketService.ts');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Archivo de servicio no encontrado' 
      }, { status: 500 });
    }
    
    // Leer el archivo actual
    const currentContent = fs.readFileSync(filePath, 'utf8');
    
    // Encontrar la sección de REFERENCE_PRICES y reemplazarla
    const pricesSectionRegex = /export const REFERENCE_PRICES[\s\S]*?= {[\s\S]*?};/;
    if (!pricesSectionRegex.test(currentContent)) {
      return NextResponse.json({ 
        success: false, 
        error: 'No se pudo encontrar la sección de precios en el archivo' 
      }, { status: 500 });
    }
    
    const newContent = currentContent.replace(pricesSectionRegex, fileContent);
    
    // Guardar el archivo actualizado
    fs.writeFileSync(filePath, newContent, 'utf8');
    
    return NextResponse.json({ 
      success: true, 
      message: `Precios actualizados correctamente - ${Object.keys(prices).length} productos` 
    });
  } catch (error) {
    console.error('Error al actualizar precios:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Error interno al actualizar precios: ${error instanceof Error ? error.message : 'Error desconocido'}` 
    }, { status: 500 });
  }
} 