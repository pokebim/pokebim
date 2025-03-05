# Documentación: Scraping de CardMarket con Puppeteer

Este documento explica la implementación del nuevo sistema de scraping para obtener precios desde CardMarket, utilizando Puppeteer como solución para evitar los bloqueos.

## Problema anterior

El método anterior de scraping directo con fetch y/o proxy estaba siendo bloqueado por CardMarket, lo que resultaba en:
- Precios no actualizados
- Errores 403 (Forbidden)
- Respuestas incompletas o bloqueadas

## Nueva solución: Puppeteer

Hemos implementado una solución basada en Puppeteer, que utiliza un navegador real (headless) para acceder a CardMarket, simulando un usuario real y evitando detecciones de bots.

### Ventajas de Puppeteer

1. **Navegación como usuario real**: Puppeteer utiliza un navegador completo, lo que hace difícil para sitios web detectarlo como bot.
2. **Ejecuta JavaScript**: A diferencia del scraping simple, puede ejecutar el JavaScript de la página, permitiendo acceder a contenido dinámico.
3. **Control avanzado**: Permite esperar a que elementos específicos se carguen, interactuar con la página, etc.

### Implementación en Vercel

Para que funcione en Vercel (entorno serverless), utilizamos:
- `@sparticuz/chromium`: Versión optimizada de Chromium para entornos serverless
- Configuración específica para reducir el tamaño y memoria necesarios
- Optimizaciones para evitar los límites de tiempo de ejecución de Vercel

## Cómo funciona

1. El cliente solicita un precio a través de la función `fetchCardmarketPrice` en `cardmarketService.ts`
2. Esta función realiza una solicitud al endpoint `/api/cardmarket-puppeteer` con la URL de CardMarket
3. El endpoint inicia Puppeteer, navega a la URL y extrae los precios
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
- `vercel.json`: Para aumentar los recursos disponibles para el endpoint de Puppeteer
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

1. **Tiempo de ejecución**: El scraping con Puppeteer es más lento que el scraping directo (2-5 segundos vs <1 segundo)
2. **Recursos**: Consume más memoria y CPU en el servidor
3. **Cuotas de Vercel**: Ten en cuenta que esto utiliza más recursos en Vercel (ejecuta un navegador completo)
4. **Posibles bloqueos futuros**: Aunque mucho más robusto, CardMarket podría implementar métodos más avanzados de detección

## Mantenimiento

Si el scraping deja de funcionar en el futuro:

1. Revisa los selectores CSS en `cardmarket-puppeteer/route.ts` (podrían cambiar si CardMarket actualiza su web)
2. Prueba con diferentes configuraciones de User-Agent
3. Considera añadir captcha solving si CardMarket implementa captchas

## Futuras mejoras

- Implementar un sistema de caché más avanzado para reducir llamadas a CardMarket
- Rotar User-Agents para parecer más natural
- Añadir soporte para proxy rotativo (para cambiar IPs y evitar bloqueos)

---

Documentación creada: [Fecha actual] 