# Guía de diseño e interacción

Estado: guía prevista, sin pantallas implementadas.

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

Revisar a 360, 768 y 1366 píxeles de ancho; recorrer acciones con teclado; comprobar foco, contraste, estados vacíos, errores y carga. Verificar los recursos con internet desconectado, manteniendo disponibles servidor y MySQL locales. Estas comprobaciones aún no se han ejecutado.
