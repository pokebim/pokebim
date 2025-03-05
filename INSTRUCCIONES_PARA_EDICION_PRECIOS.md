# Instrucciones para Edición de Precios en Pokebim

## Tabla de Precios de Referencia

La aplicación ahora utiliza una tabla de precios de referencia en lugar de scraping dinámico. Esto se debe a que Cardmarket bloquea activamente los intentos de scraping, lo que hace imposible obtener precios en tiempo real de manera confiable.

### Ubicación de la Tabla de Precios

La tabla de precios de referencia se encuentra en:

```
src/lib/cardmarketService.ts
```

En este archivo, busca la constante `REFERENCE_PRICES` que contiene un objeto con los precios de los productos destacados.

### Actualización de Precios

Para mantener los precios actualizados:

1. Visita manualmente Cardmarket y anota los precios actuales de los productos destacados
2. Actualiza los valores en la tabla `REFERENCE_PRICES`
3. Actualiza la fecha de la última actualización en el comentario
4. Haz commit y push de los cambios

### Formato de la Tabla

La tabla tiene el siguiente formato:

```typescript
export const REFERENCE_PRICES: {[key: string]: number} = {
  // Precios de productos destacados - última actualización: FECHA
  'VSTAR-Universe-Booster-Box': 189.95,
  'Terastal-Festival-ex-Booster-Box': 115.90,
  // etc.
};
```

### Cómo Añadir Nuevos Productos

Para añadir un nuevo producto:

1. Obtén la URL del producto en Cardmarket (ej: https://www.cardmarket.com/es/Pokemon/Products/Booster-Boxes/NUEVO-PRODUCTO-Booster-Box)
2. Extrae el nombre del producto de la URL (la última parte antes de cualquier parámetro de consulta)
3. Añade una nueva entrada a la tabla con el formato: `'NOMBRE-DEL-PRODUCTO': PRECIO`

## Estructura de URLs y Extracción de IDs

La función `extractProductIdFromUrl` extrae el ID del producto de una URL de Cardmarket. El formato típico de URL es:

```
https://www.cardmarket.com/es/Pokemon/Products/Booster-Boxes/NOMBRE-DEL-PRODUCTO?language=N
```

La función extrae el "NOMBRE-DEL-PRODUCTO" de la URL y lo utiliza como clave para buscar en la tabla de precios de referencia.

## Comportamiento con Productos No Listados

Si un producto no está en la tabla de precios de referencia, la aplicación utilizará un precio promedio aproximado (actualmente 119.90€) y mostrará una indicación de que es un precio aproximado.

## ¿Por qué este Enfoque?

Después de múltiples intentos con diferentes soluciones de scraping, hemos determinado que Cardmarket bloquea activamente cualquier intento de obtener precios programáticamente, incluso a través de proxies. Esta solución de precios de referencia manual proporciona:

1. Precios estables y confiables
2. Sin errores 403 o bloqueos de IP
3. Mayor rendimiento al no depender de solicitudes HTTP externas
4. Capacidad para personalizar los precios según las necesidades del negocio

## Opción Avanzada: API Oficial de Cardmarket

Como alternativa a la tabla de precios de referencia, Cardmarket ofrece una API oficial que permite acceder a los datos de precios en tiempo real. Sin embargo, esta opción tiene requisitos específicos:

### Requisitos para Usar la API Oficial

1. **Cuenta de Vendedor Profesional**: Solo los vendedores profesionales pueden solicitar acceso a la API
2. **Aprobación Manual**: Cardmarket revisa y aprueba manualmente las solicitudes de API
3. **Tokens de Acceso**: Necesitarás varios tokens para autenticarte con la API

### Proceso para Obtener Acceso a la API

1. Inicia sesión en tu cuenta de Cardmarket
2. Ve a tu perfil de usuario
3. Busca la sección "API Applications"
4. Solicita una "Dedicated App" (para uso personal)
5. Proporciona una razón detallada para tu solicitud
6. Espera la aprobación (puede tardar varios días)

### Implementación de la API

Hemos creado un archivo de ejemplo que muestra cómo implementar la API oficial:

```
src/lib/cardmarketApiService.ts
```

Para utilizarlo, necesitarás:

1. Configurar las variables de entorno con tus tokens:
   ```
   CARDMARKET_APP_TOKEN
   CARDMARKET_APP_SECRET
   CARDMARKET_ACCESS_TOKEN
   CARDMARKET_ACCESS_TOKEN_SECRET
   ```

2. Modificar el servicio actual para que utilice `getCardmarketPriceFromApi` en lugar de la tabla de precios de referencia

### Documentación Oficial

Para más información sobre la API de Cardmarket, consulta la documentación oficial:
https://api.cardmarket.com/ws/documentation

# Instrucciones para habilitar la edición en línea de precios

He creado dos componentes nuevos que permiten editar valores directamente en la tabla sin necesidad de abrir un modal y recargar la página:

1. `InlineEdit.tsx` - Un componente genérico para edición en línea
2. `PriceInlineEdit.tsx` - Un componente específico para editar precios con formato de moneda

## Cómo integrar PriceInlineEdit en tu página de precios

### 1. Modificar la definición de columnas de la tabla

Busca en tu archivo `src/app/prices/page.tsx` donde defines las columnas de la tabla (generalmente hay un array llamado `columns` o similar).

Encuentra la columna que muestra el precio y modifícala para usar el componente `PriceInlineEdit`. Por ejemplo:

```typescript
// De algo como esto:
{
  header: "Precio",
  accessorKey: "price",
  cell: (info) => formatCurrency(info.getValue() || 0, info.row.original.currency as Currency)
},

// A algo como esto:
{
  header: "Precio",
  accessorKey: "price",
  cell: ({ row }) => (
    <PriceInlineEdit
      id={row.original.id}
      price={row.original.price || 0}
      currency={row.original.currency as Currency}
      onUpdate={(newPrice) => {
        // Esta función se llama después de una actualización exitosa
        // Actualizamos el precio en el estado local para evitar recargar toda la tabla
        const updatedPrices = [...prices]; // Asumiendo que tienes un state llamado prices
        const index = updatedPrices.findIndex(p => p.id === row.original.id);
        if (index !== -1) {
          updatedPrices[index] = { ...updatedPrices[index], price: newPrice };
          setPrices(updatedPrices); // Asumiendo que tienes una función setPrices
        }
      }}
    />
  )
}
```

### 2. Importar el componente

Añade esta línea al inicio de tu archivo `src/app/prices/page.tsx`:

```typescript
import PriceInlineEdit from '@/components/ui/PriceInlineEdit';
```

### 3. Actualizar el estado local si es necesario

Si utilizas funciones de react-table como `useReactTable`, es posible que necesites modificar ligeramente la forma en que actualizas los datos. Asegúrate de que la función `onUpdate` del componente `PriceInlineEdit` actualice correctamente el estado local de los precios.

### Nota importante

Si encuentras algún problema con el contexto de la tabla o la reactividad, puede que necesites ajustar el código para que se adapte a tu implementación específica de la tabla. El principio general es:

1. Editar directamente en la celda de la tabla
2. Cuando el usuario guarda, actualizamos en Firebase y en el estado local
3. La tabla se actualiza sin necesidad de recargar toda la página

## Beneficios de esta implementación

- Sin recarga de página completa
- Edición rápida sin modales
- Experiencia de usuario más fluida para ediciones masivas
- Conserva el contexto y la posición de desplazamiento en la tabla

## Adaptación para otras columnas editables

Si necesitas hacer editables otras columnas (como fecha, proveedor, etc.), puedes:

1. Usar el componente genérico `InlineEdit` para texto y números
2. Crear variantes específicas para otros tipos de campos como fechas o selectores

Estas mejoras harán que la edición masiva de precios sea mucho más rápida y eficiente. 