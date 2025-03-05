# Documentación: Scraping de CardMarket sin Puppeteer

Este documento explica la implementación del nuevo sistema de scraping para obtener precios desde CardMarket, utilizando un enfoque ligero basado en fetch para evitar los problemas con Puppeteer en Vercel Hobby.

## Problema anterior

El método anterior de scraping directo con fetch y/o proxy estaba siendo bloqueado por CardMarket, lo que resultaba en:
- Precios no actualizados
- Errores 403 (Forbidden)
- Respuestas incompletas o bloqueadas

## La solución con Puppeteer y sus limitaciones

Inicialmente implementamos Puppeteer como solución, pero encontramos que:
1. Puppeteer requiere demasiada memoria (>3GB) para funcionar correctamente
2. Vercel Hobby limita las funciones serverless a 1024MB de memoria
3. Incluso con optimizaciones extremas, Puppeteer daba errores 500 por límites de memoria

## Nueva solución: Fetch con regexp

Hemos reemplazado Puppeteer por un enfoque más ligero:

1. **Fetch directo**: Utilizamos la API fetch estándar para obtener el HTML de CardMarket
2. **Extracción con RegExp**: Usamos expresiones regulares para extraer los precios del HTML
3. **Manejo de errores mejorado**: Detección y gestión más robusta de fallos

### Ventajas de este enfoque

1. **Mucho más ligero**: Funciona dentro del límite de 1024MB de Vercel Hobby
2. **Más rápido**: La respuesta es casi inmediata en comparación con Puppeteer
3. **Menos propenso a errores**: Menos componentes que pueden fallar

## Cómo funciona

1. El cliente solicita un precio a través de la función `fetchCardmarketPrice` en `cardmarketService.ts`
2. Esta función realiza una solicitud al endpoint `/api/cardmarket-puppeteer` (mantuvimos el nombre)
3. El endpoint hace un fetch directo a CardMarket y utiliza RegExp para extraer los precios
4. Se selecciona el precio más bajo y se devuelve al cliente
5. El resultado se almacena en la base de datos para futuras referencias

## Configuración y uso

### Requisitos

Se han eliminado las siguientes dependencias que ya no son necesarias:
- `puppeteer-core`
- `@sparticuz/chromium`
- `chrome-aws-lambda`

### Configuración simplificada

Se ha modificado:
- `vercel.json`: Configurado con 1024MB de memoria (límite del plan Hobby)
- `next.config.js`: Eliminadas referencias a Puppeteer y configuraciones especiales
- `route.ts`: Reemplazado Puppeteer por fetch + RegExp

### Uso en código (sin cambios)

Para obtener un precio de CardMarket:

```typescript
import { fetchCardmarketPrice } from '@/lib/cardmarketService';

// Obtener precio
const result = await fetchCardmarketPrice('https://www.cardmarket.com/en/Pokemon/Products/Singles/...');

if (result.success) {
  console.log(`Precio: ${result.price}€`);
} else {
  console.error(`Error: ${result.error}`);
}
```

## Limitaciones y consideraciones

1. **Robustez reducida**: Al no usar un navegador real, es más susceptible a cambios en la estructura de la página
2. **Posibles falsos positivos**: Las expresiones regulares podrían extraer números que no son precios
3. **Detección de bot**: CardMarket podría bloquear peticiones que no provengan de un navegador real

## Mantenimiento

Si el scraping deja de funcionar en el futuro:

1. Revisa los patrones RegExp en `cardmarket-puppeteer/route.ts` (podrían necesitar ajustes si CardMarket cambia)
2. Prueba con diferentes configuraciones de User-Agent
3. Considera implementar un sistema de proxy rotativo si CardMarket bloquea las peticiones

## Alternativas si este enfoque falla

Si este enfoque más ligero falla en el futuro, estas son las opciones:

1. **Plan Pro de Vercel**: Actualizar a un plan Pro permitiría usar la solución completa con Puppeteer
2. **Servicio externo**: Utilizar servicios como ScrapingBee, BrightData o similares
3. **Auto-hosting**: Implementar un servicio separado especializado en scraping (en Railway, Render, etc.)

---

Documentación actualizada: [Fecha actual] 