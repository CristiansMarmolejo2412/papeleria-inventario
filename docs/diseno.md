# Guía de diseño e interacción

Estado: diseño base implementado para inicio, inventario, productos, categorías y páginas de módulos pendientes. La referencia visual proporcionada se adaptó con fondo cálido, turquesa, tarjetas, menú plegable y estados textuales. Ventas y caja muestran su estado pendiente; no se copiaron cifras simuladas de la referencia.

## Dirección visual

Interfaz moderna, minimalista, cálida y ligeramente interactiva. Fondo blanco cálido, turquesa principal y detalles coral y amarillo suave. Paleta inicial orientativa: fondo `#FFFCF7`, texto `#243735`, turquesa `#087F79`, coral `#E98573` y amarillo `#F6DE91`. Verificar contraste en las combinaciones finales; reservar tonos suaves para superficies y acompañar estados con texto.

Tarjetas con bordes redondeados, sombras discretas y espacio generoso. Tipografía legible disponible localmente o del sistema. Iconos locales con etiquetas o nombres accesibles.

## Estructura

- Menú lateral plegable, con iconos y secciones agrupadas: operación (inicio, ventas, caja), inventario (productos, consulta, movimientos, compras y proveedores), relaciones (clientes), análisis (reportes e historial) y administración (usuarios y configuración).
- Tablas con encabezados claros, importes alineados y etiquetas como «Disponible», «Pocas existencias», «Agotado» e «Inactivo»; no depender solo del color.
- Ventas: buscador y productos a la izquierda; detalle, pagos y total a la derecha. En pantallas pequeñas, apilar secciones manteniendo accesibles el total y la acción principal.
- Adaptar menú, formularios y tablas a distintos tamaños; permitir desplazamiento controlado de tablas sin ocultar acciones esenciales.

## Interacción y accesibilidad

- Buscar mientras se escribe, con breve espera para limitar solicitudes y sin mostrar resultados antiguos sobre una búsqueda nueva. Incluir filtros rápidos y paginación; conservar el contexto al volver del detalle.
- Mostrar validaciones junto al campo, conservar los valores introducidos e indicar cómo corregir el error. La validación visual complementará la del servidor.
- Dar mensajes claros de éxito, error y carga; diferenciar lista vacía de búsqueda sin resultados y ofrecer una acción útil.
- Usar transiciones sutiles y respetar la preferencia de movimiento reducido. Permitir navegación con teclado y foco visible; restaurar el foco al cerrar diálogos.
- Identificar acciones por texto accesible. Confirmar anulaciones y ajustes con motivo y responsable cuando corresponda.
- Indicar guardado en curso y evitar envíos repetidos en la interfaz; la integridad y la idempotencia se garantizarán también en el servidor.
- Comprobantes internos imprimibles, legibles y con estilos de impresión locales.

## Verificación cuando existan pantallas

Se ejecutó una prueba con Chrome a 360, 768 y 1366 píxeles: capturas, ausencia de desbordamiento horizontal de página, menú, teclado, búsqueda y operaciones de productos. Las tablas conservan desplazamiento horizontal con región enfocable por teclado. Se revisaron visualmente capturas de escritorio y móvil.

La prueba bloquea recursos ajenos al servidor local y verifica que no se soliciten. Esto comprueba la independencia de recursos externos; no equivale a desconectar físicamente Windows de internet. Se probó preferencia de movimiento reducido para capturas estables. No se realizó auditoría completa con lector de pantalla ni medición automatizada de contraste de todas las combinaciones.
