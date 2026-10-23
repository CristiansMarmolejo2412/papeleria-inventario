# Guía de diseño e interacción

Servicios integrados: enlace propio en el menú y acceso desde inicio; catálogo en superficie clara con búsqueda, estados y páginas. Nueva venta ofrece selector Productos/Servicios turquesa, servicios rápidos desplegables y unidad junto al precio y en el carrito. Por página/cara se explica la cantidad cobrada; los servicios no muestran stock ficticio. Comprobante e historial identifican el tipo. Se conserva crema, beige, café y amarillo con errores junto a los campos y carrito recuperable. Revisado en Chrome a 1366 y 360 píxeles; tablas desplazables dentro de su panel en móvil.

Estado: diseño base implementado para inicio, inventario, productos, categorías, ventas, historial, comprobante, proveedores, compras recibidas y páginas de módulos pendientes. La referencia visual proporcionada se adaptó con fondo cálido, turquesa, tarjetas, menú plegable y estados textuales. Inicio muestra ventas reales del día y caja permanece pendiente; no se copiaron cifras simuladas de la referencia.

## Dirección visual

Interfaz moderna, minimalista, cálida y ligeramente interactiva. Paleta ajustada el 23 de octubre de 2026: fondo crema `#F6F0E5`, menú lateral beige madera claro `#EADBC8`, detalles café `#795C43` y amarillo suave `#F4D478`. El tono madera se representa exclusivamente con colores planos, sin texturas ni imágenes de fondo. El turquesa `#087F79` se conserva para acciones principales, selección y foco.

Tablas, formularios y tarjetas usan superficies claras `#FFFDF9`, texto oscuro `#30291F`, encabezados beige suaves y bordes definidos. Se mantiene la distribución original, incluidos menú plegable, rejillas y desplazamiento de tablas en móvil.

El resumen de existencias usa verde suave con icono de confirmación si no hay alertas, amarillo cuando solo hay pocas existencias y rojo suave si hay productos agotados (prioridad cuando coinciden ambos tipos de alerta). El texto informa cada cantidad y el enlace dirige al filtro prioritario. Sin productos activos se indica explícitamente que todavía no hay productos; no se afirma que exista inventario abastecido. Los contadores y mensajes distinguen singular y plural, por ejemplo «1 producto agotado» y «2 productos agotados».

Tarjetas con bordes redondeados, sombras discretas y espacio generoso. Tipografía legible disponible localmente o del sistema. Iconos locales con etiquetas o nombres accesibles.

## Estructura

- Menú lateral plegable, con iconos y secciones agrupadas: operación (inicio, ventas, caja), inventario (productos, consulta, movimientos, compras y proveedores), relaciones (clientes), análisis (reportes e historial) y administración (usuarios y configuración).
- Tablas con encabezados claros, importes alineados y etiquetas como «Disponible», «Pocas existencias», «Agotado» e «Inactivo»; no depender solo del color.
- Ventas: buscador y productos a la izquierda; detalle, pagos y total a la derecha. En pantallas pequeñas, apilar secciones manteniendo accesibles el total y la acción principal.
- Nueva venta conserva el carrito ante errores y recargas de la pestaña. Los pagos muestran campos según el medio seleccionado; transferencia informa expresamente que el registro es manual. La confirmación abre un comprobante consultable e imprimible, con estilos locales que ocultan navegación y botones al imprimir.
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

Para el ajuste cromático se revisaron además las variantes sin alertas, pocas existencias, agotados e inventario vacío con datos visuales temporales, a 1366 y 360 píxeles. Se comprobaron los colores calculados por el navegador y el singular de los contadores. Ocho combinaciones principales de texto y fondo superaron 4,5:1 de contraste, incluidos café sobre madera (4,52:1) y blanco sobre turquesa (4,86:1). Esta comprobación es parcial y no sustituye una auditoría completa de accesibilidad.

Ventas: recorrido de Chrome a 1366 y 360 píxeles con captura de carrito, comprobante e historial; edición y eliminación de líneas, conservación al recargar y tras pago insuficiente, efectivo y transferencia. Se comprobó el medio de impresión con un PDF local, sin prueba en impresora física. Capturas y PDF permanecen en `test-results/`, excluidos de Git.

Proveedores y compras: formularios con errores junto al campo, tablas de proveedores/historial y recepción en dos columnas (productos a la izquierda, datos y costos a la derecha), apiladas en móvil. Aviso permanente del aumento de stock y costo, con confirmación explícita de mercancía recibida y sin acciones de pago o caja. El detalle confirmado es de consulta y conserva datos históricos; cada entrada del producto enlaza a la compra. Recorrido de Chrome y capturas a 1366 y 360 píxeles, con revisión de ausencia de desbordamiento y conservación de la paleta cálida. Los borradores de ventas y compras se mantienen separados por pestaña.
