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
Implementación mejorada que utiliza `puppeteer-core` con `@sparticuz/chromium-min` y carga Chromium desde GitHub CDN. Esta solución resuelve los problemas con 'yargs' y permite mantener el tamaño de la función por debajo del límite de 50MB de Vercel.

### Versión 4: Solución Definitiva (Agosto 2024)
Implementación actual que utiliza un enfoque optimizado basado en el artículo de Stefan Judis sobre headless Chrome en funciones serverless. Los cambios clave incluyen:
- Uso de `require()` en lugar de importaciones dinámicas para evitar problemas con 'yargs'
- Versiones específicas de puppeteer-core (v21.5.2) y chromium-min (v119.0.2) compatibles entre sí
- Configuración detallada de vercel.json para asignar más memoria y tiempo de ejecución
- Implementación de un sistema de caché más eficiente
- Mejoras en la estabilidad y manejo de errores

### Versión 5: Mejora en la gestión de Chromium

#### Mejoras implementadas en esta versión:

1. **Sistema de caché y bloqueo de archivos**:
   - Se implementó un sistema de caché para conservar la descarga de Chromium entre invocaciones.
   - Se agregó un mecanismo de bloqueo para evitar descargas simultáneas cuando múltiples funciones intentan acceder al mismo tiempo.
   - Verificación previa de la extracción de Chromium para evitar repetir el proceso.

2. **Gestión coordinada de recursos**:
   - Implementación de un mecanismo de espera inteligente con tiempo aleatorio para evitar colisiones.
   - Creación de un directorio de caché dedicado (`/tmp/chromium-cache`).
   - Verificación de existencia y tamaño de los archivos ejecutables.

3. **Mejoras en el manejo de errores**:
   - Detección y solución para el error `ENOENT` con archivos faltantes.
   - Prevención del error `ETXTBSY` mediante coordinación de acceso a recursos.
   - Mejor logging con timestamps para rastrear el proceso completo.

4. **Optimización de rendimiento**:
   - Bloqueo de recursos innecesarios (imágenes, estilos, fuentes) durante la navegación.
   - Mecanismo de liberación de bloqueo en caso de timeout.
   - Configuración optimizada del navegador para entornos serverless.

## Detalles de la Implementación Actual

### Tecnologías Utilizadas
- **Puppeteer-Core (v21.5.2)**: Control de navegador headless sin las dependencias problemáticas
- **@sparticuz/chromium-min (v119.0.2)**: Versión ligera que no incluye el binario de Chromium
- **Chromium desde GitHub CDN**: Carga dinámica del binario usando la URL `https://github.com/Sparticuz/chromium/releases/download/v119.0.0/chromium-v119.0.0-pack.tar`
- **Next.js API Routes**: Para crear el endpoint que proporciona los precios
- **Vercel Serverless Functions**: Configuradas con 1024MB de memoria y 60 segundos de timeout

### Ventajas de la Solución Actual
1. **Sin problemas con 'yargs'**: Evita completamente los errores relacionados con yargs mediante el uso de `require()` directo
2. **Tamaño reducido**: El tamaño de la función se mantiene por debajo del límite de 50MB de Vercel gracias a chromium-min
3. **Mayor resistencia contra bloqueos**: Rotación de User-Agents y configuración adecuada del navegador
4. **Procesamiento avanzado**: Ejecuta JavaScript y espera a que los elementos se carguen completamente
5. **Múltiples estrategias de extracción**: Implementa métodos de DOM y RegExp para mayor robustez
6. **Manejo de casos específicos**: Lógica adaptada para productos como "Super Electric Breaker"
7. **Sistema de reintentos mejorado**: Backoff exponencial y mejor gestión de errores

### Configuración Crítica
- **vercel.json**: Asigna 1024MB de memoria y 60 segundos de timeout a las funciones de la API
- **.vercelignore**: Excluye archivos problemáticos relacionados con yargs
- **next.config.js**: Configuración simplificada sin referencias a paquetes externos

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
  "method": "puppeteer",
  "timeMs": 5234
}
```

### Implementación Optimizada
Para resolver problemas con dependencias en Vercel, la implementación incluye:

1. **Uso de require() directo**: En lugar de importaciones dinámicas para evitar problemas con yargs
2. **Carga de Chromium desde GitHub CDN**: Con URL específica para la versión 119.0.0
3. **Configuración específica de vercel.json**: Para asignar recursos adecuados a la función
4. **Exclusión de archivos problemáticos**: Mediante .vercelignore
5. **Estrategias de extracción múltiple**: DOM + RegExp para mayor robustez

## Mantenimiento

### Si el scraping falla en el futuro:

1. **Comprobar cambios en CardMarket**:
   - Verificar si han cambiado la estructura HTML de las páginas de productos
   - Actualizar los selectores en la función de extracción de precios

2. **Actualizar dependencias**:
   - Actualizar la URL de Chromium en la constante `CHROMIUM_URL` en `route.ts`
   - Actualizar a nuevas versiones compatibles de @sparticuz/chromium-min y puppeteer-core
   - Consultar la [documentación oficial de Sparticuz](https://github.com/Sparticuz/chromium) para versiones actualizadas

3. **Revisar logs en Vercel**:
   - Utilizar la consola de Vercel para examinar los logs de ejecución
   - Verificar si hay problemas de memoria o timeout
   - Ajustar la configuración en vercel.json si es necesario

4. **Alternativas**:
   - Si persisten los problemas, considerar servicios externos de scraping (ScrapingBee, BrightData, etc.)
   - Evaluar la posibilidad de utilizar un servidor dedicado para el scraping

## Rendimiento y Escalabilidad

La solución actual está optimizada para funcionar con el plan Hobby de Vercel:
- **Uso de memoria**: Configurado para utilizar hasta 1024MB en vercel.json
- **Tiempo de respuesta**: ~5-10 segundos (dependiendo del producto)
- **Tiempo máximo de ejecución**: 60 segundos configurado en vercel.json
- **Tamaño de la función**: Por debajo del límite de 50MB gracias a la carga dinámica de Chromium

Para escalar a más productos o mayor frecuencia de actualización:
1. Implementar un sistema de cola para procesar actualizaciones secuencialmente
2. Considerar un enfoque de caché más agresivo para productos populares
3. Distribuir solicitudes a lo largo del tiempo para evitar picos de carga

## Referencias
- [Puppeteer Documentation](https://pptr.dev/)
- [Sparticuz Chromium](https://github.com/Sparticuz/chromium)
- [How to use headless Chrome in serverless functions](https://www.stefanjudis.com/blog/how-to-use-headless-chrome-in-serverless-functions-with-a-50mb-limit/)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Optimizing Serverless Functions](https://vercel.com/guides/optimizing-serverless-functions) 