# Guía de Actualización de Precios de Cardmarket

Esta guía explica cómo utilizar la nueva funcionalidad para actualizar los precios de los productos desde Cardmarket directamente desde la interfaz de usuario de Pokebim.

## Índice
- [Descripción de la funcionalidad](#descripción-de-la-funcionalidad)
- [Cómo actualizar precios](#cómo-actualizar-precios)
- [Consideraciones importantes](#consideraciones-importantes)
- [Solución de problemas](#solución-de-problemas)

## Descripción de la funcionalidad

La nueva funcionalidad de actualización de precios permite:

- Actualizar automáticamente los precios de todos los productos con enlaces a Cardmarket desde la interfaz de usuario.
- Ver el resultado de la actualización en tiempo real.
- Mantener actualizados los precios de referencia en el archivo `src/lib/cardmarketService.ts`.

## Cómo actualizar precios

1. Ve a la página de **Catálogo de Productos** (`/products`).
2. Localiza el componente **Actualizador de Precios** que aparece debajo del buscador.
3. Haz clic en el botón **Actualizar Precios**.
4. Confirma la acción en el diálogo que aparece.
5. Espera a que finalice el proceso. Esto puede tomar desde unos segundos hasta varios minutos, dependiendo del número de productos.
6. Se mostrará un mensaje con el resultado de la actualización.
7. La página se recargará automáticamente si la actualización fue exitosa para mostrar los precios actualizados.

![Ejemplo de Actualizador de Precios](assets/price-updater.png)

## Consideraciones importantes

- **Uso responsable**: No ejecutes la actualización de precios con demasiada frecuencia para evitar problemas con Cardmarket. Se recomienda actualizarlos como máximo una vez al día.

- **URLs correctas**: Para que la actualización funcione, cada producto debe tener una URL válida de Cardmarket en el campo correspondiente. Las URLs deben apuntar a la página del producto específico en Cardmarket.

- **Formato de URLs**: Las URLs deben tener el formato:
  ```
  https://www.cardmarket.com/es/Pokemon/Products/Booster-Boxes/[Nombre-Del-Producto]
  ```

- **Mantenimiento de la tabla**: Cada vez que se actualicen los precios, se mantendrá actualizada la tabla `REFERENCE_PRICES` en el archivo `src/lib/cardmarketService.ts`.

## Solución de problemas

### No se actualizan los precios

- Verifica que las URLs de Cardmarket sean correctas y estén actualizadas.
- Asegúrate de que tu conexión a internet es estable.
- Comprueba si hay errores en la consola del navegador (F12 > Console).

### Errores durante la actualización

Si aparecen errores durante la actualización:

1. Revisa los mensajes de error que se muestran.
2. Comprueba que los enlaces a Cardmarket son correctos.
3. Verifica que el formato de las URLs sigue el patrón esperado.

Si el problema persiste, contacta con el equipo de desarrollo para recibir asistencia adicional.

---

Si tienes alguna pregunta adicional o encuentras algún problema, por favor contacta con el equipo de desarrollo de Pokebim. 