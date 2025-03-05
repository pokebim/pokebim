# Actualización Automática de Precios de Cardmarket

Este directorio contiene scripts para automatizar la obtención y actualización de precios desde Cardmarket.

## Requisitos

- Python 3.7 o superior
- Conexión a Internet
- Permisos de escritura en el directorio del proyecto

## Instalación

1. Asegúrate de tener Python instalado:
   ```bash
   python --version
   ```

2. Instala las dependencias necesarias:
   ```bash
   pip install requests
   ```

3. El script se encargará de instalar CMScrape automáticamente la primera vez que se ejecute.

## Uso

### Actualización Manual

Para actualizar los precios manualmente, ejecuta:

```bash
python update_prices.py
```

Este script realizará las siguientes acciones:
1. Descargar e instalar CMScrape si es necesario
2. Crear una lista de productos a partir del archivo `cardmarketService.ts`
3. Obtener los precios actuales desde Cardmarket
4. Actualizar el archivo `cardmarketService.ts` con los nuevos precios
5. Enviar los precios actualizados al endpoint de la API

### Configuración de la Actualización Automática

#### En Windows:

1. Abre el Programador de Tareas
2. Crea una nueva tarea
3. En la pestaña "Acciones", agrega una nueva acción:
   - Acción: Iniciar un programa
   - Programa/script: `python`
   - Argumentos: `scripts\update_prices.py`
   - Iniciar en: `C:\ruta\a\tu\proyecto\Pokebim`
4. En la pestaña "Desencadenadores", agrega un nuevo desencadenador:
   - Por ejemplo, para actualizar diariamente a las 2 AM

#### En Linux/macOS:

Usa cron para programar la actualización:

1. Edita el crontab: `crontab -e`
2. Añade una línea para ejecutar el script diariamente a las 2 AM:
   ```
   0 2 * * * cd /ruta/a/tu/proyecto/Pokebim && python scripts/update_prices.py >> /tmp/price_update.log 2>&1
   ```

## Estructura de Archivos

- `update_prices.py` - Script principal para actualizar precios
- `product_links.csv` - Lista de productos a consultar (creado automáticamente)
- `prices_output.csv` - Resultados de la consulta (creado automáticamente)
- `CMScrape/` - Directorio donde se instalará CMScrape (creado automáticamente)

## Variables de Entorno

Puedes configurar las siguientes variables de entorno:

- `PRICE_UPDATE_API` - URL del endpoint de actualización de precios (por defecto: http://localhost:3000/api/update-prices)
- `PRICE_UPDATE_TOKEN` - Token de autenticación para el endpoint (por defecto: pokebim_secret_token)

## Solución de Problemas

### El script no puede ejecutar CMScrape

Si hay problemas al ejecutar CMScrape, puedes intentar:

1. Eliminar el directorio `scripts/CMScrape`
2. Ejecutar el script nuevamente para reinstalarlo
3. Si el problema persiste, ejecuta CMScrape manualmente:
   ```bash
   cd scripts/CMScrape
   python CMScrape.py -i ../product_links.csv -o ../prices_output.csv --no-proxies True
   ```

### No se actualizan los precios en la aplicación

1. Verifica que el script tiene permisos para escribir en `src/lib/cardmarketService.ts`
2. Asegúrate de que el endpoint de API está funcionando correctamente
3. Comprueba los logs para ver si hay errores específicos

## Monitoreo

El sistema mantiene registros de las actualizaciones en el directorio `logs/`. Estos archivos contienen información sobre cada actualización, incluyendo los precios obtenidos y el resultado de la operación. 