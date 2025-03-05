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
Segunda versión que utilizaba Puppeteer con @sparticuz/chromium, específicamente diseñado para entornos serverless como Vercel. Esta solución era más robusta pero consumía demasiada memoria.

### Versión 3: Implementación Híbrida Optimizada (Mayo 2024)
Implementación actual que combina:
- Solicitudes `fetch` con cabeceras realistas y rotación de user agents
- Sistema de extracción de precios basado en múltiples patrones RegExp
- Mecanismos avanzados de selección de precios basados en frecuencia de ocurrencia
- Estrategias anti-bloqueo y reintentos inteligentes

## Detalles de la Implementación Actual

### Tecnologías Utilizadas
- **Next.js API Routes**: Para crear el endpoint que proporciona los precios
- **RegExp optimizadas**: Patrones específicos para diferentes formatos de precio
- **Rotación de User-Agents**: Para evitar detección como bot
- **Fetch con cabeceras realistas**: Simulando navegadores reales

### Ventajas de la Solución Actual
1. **Eficiencia en recursos**: Consume mucha menos memoria que la versión con Puppeteer
2. **Velocidad mejorada**: Respuestas más rápidas al no tener que iniciar un navegador completo
3. **Resiliencia ante bloqueos**: Implementa rotación de user-agents y cabeceras realistas
4. **Estrategia de reintentos**: Sistema inteligente de reintentos con tiempos de espera progresivos
5. **Identificación precisa de precios**: Algoritmo de selección del precio más fiable
6. **Tratamiento de casos especiales**: Lógica específica para productos como "Super Electric Breaker"

### Sistema de Extracción de Precios
El sistema utiliza múltiples enfoques para extraer precios con precisión:
1. **Patrones RegExp primarios**: Dirigidos a las clases CSS y estructuras más comunes
2. **Patrones RegExp secundarios**: Para formatos alternativos de precio
3. **Filtro de precios inválidos**: Elimina precios irrealistas (demasiado bajos o demasiado altos)
4. **Algoritmo de selección por frecuencia**: Elige el precio que aparece con más frecuencia
5. **Verificación contextual**: Asegura que el precio está en un contexto válido (no en cantidad o similar)

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
  "method": "regex"
}
```

### Sistema Anti-Bloqueo
La implementación incluye varias estrategias para evitar ser bloqueada por CardMarket:
1. **Rotación de User-Agents**: Utiliza diferentes user-agents en cada solicitud
2. **Cabeceras HTTP realistas**: Incluye todas las cabeceras que enviaría un navegador real
3. **Tiempos de espera variables**: Introduce pausas aleatorias entre solicitudes
4. **Reintentos inteligentes**: Si una solicitud es bloqueada, reintenta con diferentes parámetros
5. **Detección de bloqueos**: Identifica respuestas que indican bloqueo y ajusta la estrategia

## Mantenimiento

### Si el scraping falla en el futuro:

1. **Comprobar cambios en CardMarket**:
   - Verificar si han cambiado la estructura HTML de las páginas de productos
   - Actualizar los patrones RegExp en la función de extracción de precios

2. **Ajustar patrones de extracción**:
   - Revisar los patrones en `extractPricesWithRegex` y `extractPricesAlternative`
   - Añadir nuevos patrones si aparecen nuevos formatos de precio

3. **Mejorar estrategias anti-bloqueo**:
   - Actualizar la lista de user-agents
   - Modificar las cabeceras HTTP para seguir simulando navegadores reales

4. **Alternativas si el método actual deja de funcionar**:
   - Considerar volver a la implementación con Puppeteer si es necesario
   - Evaluar servicios externos de scraping (ScrapingBee, ScrapingAnt, etc.)
   - Actualizar a un plan Pro en Vercel para tener más recursos disponibles

## Rendimiento y Escalabilidad

La solución actual está optimizada para funcionar eficientemente con el plan Hobby de Vercel:
- **Uso de memoria**: < 128MB (vs. >1GB con Puppeteer)
- **Tiempo de respuesta**: ~1-3 segundos (vs. ~5-10 segundos con Puppeteer)
- **Límites de simultaneidad**: Puede manejar múltiples solicitudes sin agotar recursos

Para escalar a más productos o mayor frecuencia de actualización:
1. Implementar un sistema de cola para procesar actualizaciones secuencialmente
2. Considerar un enfoque de caché más agresivo para productos populares
3. Distribuir solicitudes a lo largo del tiempo para evitar picos de carga

## Referencias
- [MDN Regular Expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Estrategias Anti-Bot Detection](https://www.zenrows.com/blog/web-scraping-without-getting-blocked) 