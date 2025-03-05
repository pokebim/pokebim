import { NextRequest, NextResponse } from "next/server";
import { REFERENCE_PRICES } from "@/lib/cardmarketService";
import * as fs from 'fs/promises';
import path from 'path';

// Esta API actualiza la tabla de referencias en el archivo cardmarketService.ts
export async function POST(request: NextRequest) {
  try {
    // Solo permitir solicitudes de la misma aplicación
    const appHost = request.headers.get('host');
    const origin = request.headers.get('origin');
    
    // Verificar que la petición viene de un origen válido
    if (!origin?.includes(appHost || '')) {
      return NextResponse.json(
        { success: false, message: "Acceso no autorizado" },
        { status: 403 }
      );
    }
    
    // Obtener los datos de la solicitud
    const data = await request.json();
    const { productId, price } = data;
    
    if (!productId || typeof price !== 'number' || price <= 0) {
      return NextResponse.json(
        { success: false, message: "Datos incorrectos. Se requiere productId y price" },
        { status: 400 }
      );
    }
    
    console.log(`API: Actualizando precio de referencia para ${productId}: ${price}€`);
    
    // Actualizar la tabla de referencias
    const result = await updateReferenceTable(productId, price);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Precio actualizado correctamente para ${productId}: ${price}€`,
      productId,
      price
    });
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    return NextResponse.json(
      { success: false, message: `Error del servidor: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    );
  }
}

/**
 * Actualiza la tabla de REFERENCE_PRICES con el nuevo precio obtenido
 */
async function updateReferenceTable(productId: string, price: number): Promise<{success: boolean, message: string}> {
  try {
    // 1. Obtener la ruta al archivo
    const filePath = path.join(process.cwd(), 'src', 'lib', 'cardmarketService.ts');
    
    // 2. Verificar que el archivo existe
    try {
      await fs.access(filePath);
    } catch (error) {
      return { 
        success: false, 
        message: 'Archivo cardmarketService.ts no encontrado'
      };
    }
    
    // 3. Leer el contenido actual
    const content = await fs.readFile(filePath, 'utf8');
    
    // 4. Buscar la definición de la tabla
    const tableRegex = /export const REFERENCE_PRICES[\s\S]*?= {[\s\S]*?};/;
    if (!tableRegex.test(content)) {
      return {
        success: false,
        message: 'No se encontró la tabla REFERENCE_PRICES en el archivo'
      };
    }
    
    // 5. Obtener el contenido actual de la tabla
    let tableMatch = content.match(tableRegex);
    if (!tableMatch || !tableMatch[0]) {
      return {
        success: false,
        message: 'No se pudo extraer la tabla REFERENCE_PRICES'
      };
    }
    
    const currentTable = tableMatch[0];
    
    // 6. Encontrar la línea que contiene el producto o añadirla al final
    const timestamp = new Date().toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let updatedTable: string;
    const productLineRegex = new RegExp(`'${productId}':\\s*\\d+(\\.\\d+)?`, 'g');
    
    if (productLineRegex.test(currentTable)) {
      // Actualizar precio existente
      updatedTable = currentTable.replace(
        productLineRegex,
        `'${productId}': ${price.toFixed(2)}`
      );
    } else {
      // Añadir nuevo precio a la tabla
      updatedTable = currentTable.replace(
        /}\s*;$/,
        `  '${productId}': ${price.toFixed(2)},\n};`
      );
    }
    
    // 7. Actualizar el timestamp en la tabla
    updatedTable = updatedTable.replace(
      /\/\/ Precios de productos destacados - última actualización: .*\n/,
      `// Precios de productos destacados - última actualización: ${timestamp}\n`
    );
    
    // 8. Reemplazar la tabla en el contenido
    const updatedContent = content.replace(tableRegex, updatedTable);
    
    // 9. Guardar el archivo actualizado
    await fs.writeFile(filePath, updatedContent, 'utf8');
    
    console.log(`Tabla de referencia actualizada con el nuevo precio para ${productId}: ${price.toFixed(2)}€`);
    return {
      success: true,
      message: `Precio actualizado correctamente: ${price.toFixed(2)}€ para ${productId}`
    };
  } catch (error) {
    console.error('Error al actualizar la tabla de referencias:', error);
    return {
      success: false,
      message: `Error al actualizar la tabla de referencias: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
} 