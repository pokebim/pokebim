# Documentación: Scraping de CardMarket

## Introducción

Este documento detalla la implementación de la solución de scraping para CardMarket, utilizada para obtener precios actualizados de productos de Pokémon de forma automatizada.

## Historial de Implementaciones

### Versión 1: RegExp y Fetch (Abril 2024)
La primera versión utilizaba `fetch` directo con expresiones regulares para extraer precios del HTML. Esta implementación era ligera pero presentaba varios problemas:
- Vulnerabilidad a cambios en la estructura del HTML
- Alto riesgo de ser bloqueada por CardMarket (errores 403 Forbidden)
- Dificultad para extraer precios específicos en ciertos productos

### Versión 2: Headless Browser con Puppeteer (Mayo 2024)
Implementación que utilizaba Puppeteer con @sparticuz/chromium, específicamente diseñado para entornos serverless como Vercel. Esta solución es más robusta y menos propensa a bloqueos, aunque presentaba problemas con dependencias como 'yargs' en entornos serverless.

### Versión 3: Optimización para Vercel (Julio 2024)
Implementación actual que utiliza `puppeteer-core` con `@sparticuz/chromium-min` y carga Chromium desde GitHub CDN. Esta solución resuelve los problemas con 'yargs' y permite mantener el tamaño de la función por debajo del límite de 50MB de Vercel.

## Detalles de la Implementación Actual

### Tecnologías Utilizadas
- **Puppeteer-Core**: Control de navegador headless sin las dependencias problemáticas
- **@sparticuz/chromium-min**: Versión ligera que no incluye el binario de Chromium
- **Chromium desde GitHub CDN**: Carga dinámica del binario directamente desde GitHub
- **Next.js API Routes**: Para crear el endpoint que proporciona los precios

### Ventajas de la Solución Actual
1. **Tamaño reducido**: El tamaño de la función se mantiene por debajo del límite de 50MB de Vercel
2. **Sin problemas con 'yargs'**: Evita errores relacionados con dependencias del sistema
3. **Mayor resistencia contra bloqueos**: Al utilizar un navegador real, es menos probable que sea detectado como bot
4. **Procesamiento avanzado**: Puede ejecutar JavaScript y esperar a que los elementos se carguen completamente
5. **Acceso al DOM completo**: Permite extraer información de manera más precisa y estructurada
6. **Manejo de casos específicos**: Implementa lógica especial para productos como "Super Electric Breaker"

### Consideraciones de Rendimiento
- La implementación está optimizada para el plan Hobby de Vercel (límite de 1024MB de memoria)
- Se utiliza interceptación de recursos para bloquear imágenes y otros archivos innecesarios
- Se configura cuidadosamente el navegador para minimizar el uso de memoria
- Se implementa una estrategia de cache para reducir el número de solicitudes
- Chromium se carga dinámicamente desde GitHub CDN, reduciendo el tamaño de la función

### API Endpoint

Endpoint: `/api/cardmarket-puppeteer`

Parámetros:
- `url`: URL completa del producto en CardMarket (Obligatorio)
- `retry`: Número de intento actual (Opcional, para reintentos automáticos)

Respuesta Exitosa:
```json
{
  "price": 69.90,
  "currency": "€",
  "success": true,
  "method": "puppeteer"
}
```

### Implementación Optimizada
Para resolver problemas con dependencias en Vercel, la implementación incluye:

1. **Uso de @sparticuz/chromium-min**: Versión ligera sin el binario de Chromium
2. **Carga de Chromium desde GitHub CDN**: Evita incluir el binario en el paquete de la función
3. **Optimización de argumentos del navegador**: Configuración para minimizar el uso de recursos
4. **Estrategia de extracción múltiple**: DOM + RegExp para mayor robustez

## Mantenimiento

### Si el scraping falla en el futuro:

1. **Comprobar cambios en CardMarket**:
   - Verificar si han cambiado la estructura HTML de las páginas de productos
   - Actualizar los selectores en la función de extracción de precios

2. **Actualizar dependencias**:
   - Verificar la URL de Chromium en la constante `CHROMIUM_URL`
   - Actualizar a la última versión disponible de @sparticuz/chromium-min y puppeteer-core
   - Consultar https://github.com/Sparticuz/chromium para verificar compatibilidad

3. **Aumentar recursos en Vercel**:
   - Si el proceso consume demasiada memoria, considerar actualizar a un plan Pro
   - Ajustar la configuración de Puppeteer para optimizar el uso de memoria

4. **Alternativas**:
   - Los enfoques basados en fetch con expresiones regulares no han funcionado correctamente
   - Considerar servicios externos de scraping (ScrapingBee, ScrapingAnt, etc.)
   - Evaluar si CardMarket ofrece alguna API oficial en el futuro

## Rendimiento y Escalabilidad

La solución actual está optimizada para funcionar con el plan Hobby de Vercel:
- **Uso de memoria**: Optimizado para mantenerse por debajo del límite de 1024MB
- **Tiempo de respuesta**: ~5-10 segundos (dependiendo del producto)
- **Gestión de recursos**: Cierre inmediato del navegador después de cada uso
- **Tamaño de la función**: Por debajo del límite de 50MB gracias a la carga dinámica de Chromium

Para escalar a más productos o mayor frecuencia de actualización:
1. Implementar un sistema de cola para procesar actualizaciones secuencialmente
2. Considerar un enfoque de caché más agresivo para productos populares
3. Distribuir solicitudes a lo largo del tiempo para evitar picos de carga

## Referencias
- [Puppeteer Documentation](https://pptr.dev/)
- [Sparticuz Chromium](https://github.com/Sparticuz/chromium)
- [Artículo sobre optimización de Chromium en Serverless](https://www.stefanjudis.com/blog/how-to-use-headless-chrome-in-serverless-functions-with-a-50mb-limit/)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Optimizing Serverless Functions](https://vercel.com/guides/optimizing-serverless-functions) 