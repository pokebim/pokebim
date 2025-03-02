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