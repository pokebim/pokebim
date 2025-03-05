# Documentación: Scraping de CardMarket con Puppeteer

Este documento explica la implementación del nuevo sistema de scraping para obtener precios desde CardMarket, utilizando Puppeteer como solución para evitar los bloqueos.

## Problema anterior

El método anterior de scraping directo con fetch y/o proxy estaba siendo bloqueado por CardMarket, lo que resultaba en:
- Precios no actualizados
- Errores 403 (Forbidden)
- Respuestas incompletas o bloqueadas

## Nueva solución: Puppeteer (Optimizado para Vercel Hobby)

Hemos implementado una solución basada en Puppeteer, que utiliza un navegador real (headless) para acceder a CardMarket, simulando un usuario real y evitando detecciones de bots. Esta implementación está especialmente optimizada para funcionar con las restricciones del plan Hobby de Vercel (1024MB de memoria).

### Ventajas de Puppeteer

1. **Navegación como usuario real**: Puppeteer utiliza un navegador completo, lo que hace difícil para sitios web detectarlo como bot.
2. **Ejecuta JavaScript**: A diferencia del scraping simple, puede ejecutar el JavaScript de la página, permitiendo acceder a contenido dinámico.
3. **Control avanzado**: Permite esperar a que elementos específicos se carguen, interactuar con la página, etc.

### Implementación en Vercel Hobby (1024MB)

Para que funcione en Vercel con limitaciones de memoria, utilizamos:
- `@sparticuz/chromium`: Versión optimizada de Chromium para entornos serverless
- Configuraciones agresivas para reducir uso de memoria:
  - Modo `--single-process` para Chrome
  - Bloqueo de recursos innecesarios (imágenes, CSS, scripts)
  - Configuración mínima de viewport
  - Cierre temprano del navegador

## Cómo funciona

1. El cliente solicita un precio a través de la función `fetchCardmarketPrice` en `cardmarketService.ts`
2. Esta función realiza una solicitud al endpoint `/api/cardmarket-puppeteer` con la URL de CardMarket
3. El endpoint inicia Puppeteer con configuración de bajo consumo de memoria, navega a la URL y extrae los precios
4. Se selecciona el precio más bajo y se devuelve al cliente
5. El resultado se almacena en la base de datos para futuras referencias

## Configuración y uso

### Requisitos

Se han añadido las siguientes dependencias:
- `puppeteer-core`
- `@sparticuz/chromium`
- `chrome-aws-lambda` (para compatibilidad)

### Configuración adicional

Se ha modificado:
- `vercel.json`: Configurado con 1024MB de memoria (límite del plan Hobby)
- `next.config.js`: Para garantizar la compatibilidad con las nuevas dependencias

### Uso en código

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

1. **Restricciones de memoria**: La implementación está optimizada para el límite de 1024MB del plan Hobby de Vercel
2. **Tasa de éxito reducida**: Al limitar recursos, es posible que algunas páginas complejas no se procesen correctamente
3. **Tiempo de ejecución**: Sigue siendo más lento que el scraping directo (2-5 segundos vs <1 segundo)
4. **Posibles bloqueos futuros**: CardMarket podría implementar métodos más avanzados de detección

## Mantenimiento

Si el scraping deja de funcionar en el futuro:

1. Revisa los selectores CSS en `cardmarket-puppeteer/route.ts` (podrían cambiar si CardMarket actualiza su web)
2. Prueba con diferentes configuraciones de User-Agent
3. Si es posible, considera actualizar a un plan Pro de Vercel para obtener más memoria (3008MB)

## Opciones para mejorar el rendimiento

### Plan Hobby (1024MB):
- Implementar un sistema de caché más avanzado para reducir llamadas a CardMarket
- Programar actualizaciones de precios en lotes pequeños durante la noche

### Con plan Pro de Vercel:
- Actualizar `vercel.json` para usar 3008MB de memoria
- Eliminar las restricciones agresivas de `cardmarket-puppeteer/route.ts`
- Usar navegación más completa y esperar por `networkidle2` para mejor precisión

---

Documentación actualizada: [Fecha actual] 