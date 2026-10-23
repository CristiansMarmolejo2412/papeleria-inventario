# Estado del proyecto

Fecha de referencia de la entrega: 23 de octubre de 2026 (`America/Bogota`). Preparación documental: 22 de octubre de 2026.

## Avances

- Preparación documental terminada y publicada en `chore/documentacion-inicial`, commit `0c53b0c`.
- Entrega 1 implementada en `feat/productos-inventario-base`, creada desde la rama de documentación, con árbol inicialmente limpio. `main` no se modifica ni se fusiona automáticamente.
- Aplicación Express/Pug ejecutable, Tailwind compilado y recursos locales. Menú plegable, tarjetas, mensajes, navegación y adaptación visual basada en la referencia del usuario.
- Categorías con alta, consulta, edición y desactivación. Productos con códigos únicos, categoría, marca, ubicación, costos, precios, mínimos, estado y existencias iniciales.
- Consulta de productos con búsqueda por nombre y códigos, filtros por categoría, disponibilidad y actividad, y páginas de 10 registros. Inicio con indicadores reales del inventario y ventas del día; caja pendiente sin cifras ficticias.
- Creación atómica de producto y movimiento inicial con fecha, motivo y responsable local. Edición sin modificación directa de stock, importes exactos y validación junto a los campos.
- Configuración por `.env` excluido de Git; ejemplo sin secretos. Bases limitadas a `papeleria_promax` y `papeleria_promax_prueba`, migraciones con Umzug y sin sincronización destructiva.

## Entorno y verificaciones ejecutadas

Windows, Node.js 26.3.1, npm 11.16.0 y servicio MySQL 8.0.46. Se usó `npm.cmd` por la restricción de scripts PowerShell. Las credenciales se configuraron localmente y no se incluyen en documentación o commits.

- Instalación de dependencias y archivo de bloqueo; compilación de estilos con `npm.cmd run css`.
- Arranque con `npm.cmd run dev`: servidor local y vigilancia de estilos operativos; comprobación HTTP del inicio en el puerto 3000.
- `npm.cmd test`: cuatro pruebas aprobadas de validación, precisión decimal, protección del stock y compilación de todas las plantillas Pug.
- `npm.cmd run db:crear` y `npm.cmd run db:migrar`: preparación de la base exclusiva de trabajo y aplicación de esquema. Repetir las migraciones no recreó tablas.
- `npm.cmd run test:integracion`: recorrido aprobado con MySQL real en la base exclusiva de prueba. Incluye creación, edición, búsqueda por códigos y nombre, filtros, paginación, desactivación, duplicados internos y de barras, negativos y categorías inactivas. Comprueba el movimiento inicial y su conservación al desactivar.
- La prueba provoca un fallo antes de guardar el movimiento y comprueba que tampoco se conserva el producto. También rechaza solicitudes sin token de formulario y cambios de stock enviados manualmente.
- Persistencia comprobada desde una conexión en otro proceso y arrancando, deteniendo y volviendo a arrancar el servidor, con consulta HTTP del producto después de ambos arranques.
- `npm.cmd run test:navegador`: recorrido aprobado con Google Chrome y Playwright. Revisa 1366, 768 y 360 píxeles, menú plegable, Escape, foco de teclado, búsqueda automática y alta, edición y desactivación desde formularios. Capturas locales en `test-results/`, excluidas de Git; revisión visual de escritorio y móvil.
- Navegador sin solicitudes a recursos externos y sin errores de JavaScript o carga. Las capturas usan movimiento reducido para evitar medir transiciones intermedias al cambiar el tamaño.
- Demostración opcional ejecutada solo en `papeleria_promax_prueba`. Las pruebas eliminan únicamente sus registros sintéticos; no vacían bases ni tablas ni cargan demostración en la base de trabajo.
- Se corrigieron las alertas de dependencias: Tailwind/CLI 4.3.0, dependencias transitivas actualizadas y `uuid` de Sequelize fijado a 11.1.1 compatible con CommonJS. La auditoría posterior informó cero vulnerabilidades. Se conserva `package-lock.json`.

## Ajuste visual de la entrega 1 — 23 de octubre de 2026

- Trabajo sobre `feat/productos-inventario-base`, inicialmente limpia; se conservan la distribución y las operaciones existentes.
- Aplicados fondo crema `#F6F0E5`, lateral beige madera claro `#EADBC8`, detalles café `#795C43` y amarillo suave `#F4D478`. Recursos locales y colores planos, sin texturas ni imágenes de fondo; acciones principales turquesa y superficies claras para tablas y formularios.
- Resumen verde con confirmación si no hay alertas, amarillo para pocas existencias y rojo suave para agotados, con prioridad para estos últimos. Inventario vacío identificado de forma explícita. Corregidos singular y plural en indicadores, resumen y paginación.
- Ejecutados `npm.cmd run css`, `npm.cmd test` (cuatro pruebas aprobadas) y `npm.cmd run test:navegador` (recorrido aprobado con MySQL, menú, búsqueda, alta, edición y desactivación, a 1366, 768 y 360 píxeles).
- Revisión adicional con datos visuales temporales, sin modificar la base de trabajo: variantes sin alertas, pocas existencias, agotados e inventario vacío; capturas de escritorio y móvil, colores calculados y mensajes singulares comprobados. Ocho combinaciones principales de texto y fondo superan contraste 4,5:1. Capturas excluidas de Git en `test-results/`.
- No se modificaron migraciones, dependencias ni reglas de persistencia. No se inició otro módulo. El commit y su publicación se informan al cerrar este ajuste.

## Ventas básicas e historial — 23 de octubre de 2026

- Rama `feat/ventas`, creada desde `feat/productos-inventario-base` con el ajuste visual `d160b6c` y árbol inicialmente limpio. Se conserva la paleta cálida y `main` no se modifica.
- Implementados búsqueda de productos activos por nombre/códigos, catálogo paginado, carrito con cantidades acumuladas, edición/eliminación de líneas, subtotal y total exactos. Borrador por pestaña y conservación del carrito ante errores de validación o registro.
- Consumidor final, pago único en efectivo con recibido/cambio o transferencia manual con referencia opcional. Comprobante interno consultable, número único `V-<id>`, fecha, responsable, detalle histórico y pago; estilos locales de impresión. Historial paginado por fecha de Bogotá y número exacto.
- Inicio con total y número reales de ventas del día. Caja permanece pendiente: no se abren ni cierran cajas al vender.
- Migración aditiva `002-ventas.js`: tablas de ventas, detalles y pagos, índice por fecha y `ventaId` opcional en movimientos. Aplicada primero en prueba y después en la base local. Repetición sin migraciones pendientes y con los productos de uso intactos; no se cargaron ventas de prueba en la base de trabajo.
- Cálculos en centavos `BigInt` y decimales exactos; precios/costos obtenidos del servidor. Se conserva nombre, código, precio y costo históricos. Una transacción incluye venta, detalle, pago, salidas y descuento de existencias.
- Clave de operación UUID con restricción única y huella del contenido normalizado; reintentos equivalentes devuelven el comprobante original y una clave confirmada con otros datos se rechaza. Bloqueos por producto en orden ascendente e aislamiento `READ COMMITTED` impiden vender dos veces la última unidad.

### Verificaciones de esta entrega

- `npm.cmd run css`: compilación correcta. `npm.cmd test`: cuatro pruebas aprobadas, incluidas todas las plantillas actuales.
- `npm.cmd run test:ventas`: siete pruebas aprobadas contra MySQL de prueba. Incluyen efectivo, transferencia, agrupación, precios manipulados ignorados, valores históricos, persistencia desde otro proceso, comprobante/historial, límites de día reales y paginación; rechazos de pagos insuficientes, inactivos, stock insuficiente, ventas vacías y cantidades inválidas.
- Doble envío concurrente con la misma clave: una sola venta y un solo descuento. Dos operaciones distintas sobre la última unidad: solo una confirmada y stock final cero. Reintento posterior devuelve el mismo comprobante; clave reutilizada con cambios se rechaza.
- Fallo controlado al guardar el pago después de descontar existencias: reversión completa de venta, detalles, pago, movimientos y stock. También se verificó respuesta HTTP recuperable con conservación del carrito y reintento de la misma operación.
- `npm.cmd run test:integracion` y `npm.cmd run test:navegador`: regresiones de productos aprobadas, incluida persistencia tras reiniciar el servidor y la interfaz a 1366, 768 y 360 píxeles.
- `npm.cmd run test:ventas:navegador`: Chrome aprobado en 1366 y 360 píxeles, sin desbordamiento de página ni recursos externos. Creación, acumulación, cambio de cantidades, eliminación, recarga del borrador, pago insuficiente con carrito conservado, efectivo con cambio, transferencia, confirmación, recarga del comprobante sin nuevo descuento, historial y caja pendiente.
- Capturas de nueva venta, comprobante e historial revisadas en escritorio y móvil. PDF local generado con medio de impresión y navegación oculta; no se verificó una impresora física. Archivos en `test-results/`, excluidos de Git.
- Todas las verificaciones de venta usan `papeleria_promax_prueba` y eliminan únicamente sus registros sintéticos. No se instalaron dependencias nuevas ni se modificó `.env`.

## Corrección del arranque normal — 23 de octubre de 2026

- Tras el reporte de `SequelizeDatabaseError`, se inspeccionó expresamente `papeleria_promax`, no solo la base de pruebas: cero migraciones pendientes y consultas de productos, ventas del día e historial correctas. El error original no se pudo reproducir ni recuperar; al inspeccionar el puerto 3000 ya no había un servidor escuchando. No se atribuye una causa confirmada al error anterior.
- El arranque comprueba conexión, migraciones pendientes y tablas/columnas de todos los modelos con consultas `LIMIT 0` antes de abrir el puerto. Si falta esquema, termina con indicación de ejecutar las migraciones, sin modificarlo automáticamente.
- Los errores registran el código MySQL seguro, sin consultas, parámetros, mensajes que incluyan datos ni credenciales. El cargador de migraciones CommonJS es explícito, también para diagnósticos ejecutados desde Node sin archivo principal.
- `npm.cmd run db:migrar`: sin pendientes en la base de trabajo. `npm.cmd test`: siete pruebas aprobadas, incluidas migración pendiente, esquema incompleto y protección del diagnóstico.
- Arranque del proceso normal en `127.0.0.1:3000`, usando la base de trabajo: inicio, productos, historial y nueva venta respondieron HTTP 200. Las huellas de todos los productos coinciden antes y después; no se registraron ventas en esa base. Se detuvo únicamente el proceso propio de comprobación; no se cerró ningún proceso del usuario.
- `npm.cmd run test:integracion`: regresión aprobada en la base de pruebas, incluida persistencia tras reiniciar el servidor. No se modificó `.env` ni se borraron productos o registros de uso.

## Límites y pendientes

- Pendientes: autenticación, permisos, movimientos operativos completos, caja, descuentos, crédito, pagos combinados, anulaciones, devoluciones, clientes, compras, presentaciones, servicios, reportes y respaldos/restauración. Las páginas futuras no guardan operaciones. Ventas básicas, consulta del historial e indicadores diarios están implementados; el plan distingue el alcance completo de cada módulo.
- El responsable local es un nombre de configuración; no existe aún autenticación ni una identidad de usuario verificable. El servidor escucha en `127.0.0.1` por defecto.
- Se verificó ausencia de dependencias externas durante las solicitudes, sin desconectar físicamente Windows de internet. No se realizó auditoría integral con lector de pantalla ni medición automatizada de todos los contrastes. Otras versiones de Node y otros navegadores permanecen sin verificar.
- Node 26 emite una advertencia de obsolescencia durante la compilación de Tailwind; el comando termina correctamente. La herramienta de paquetes también informa un script nativo opcional de vigilancia sin aprobar; la compilación y el recorrido verificados funcionan con el binario disponible. No se modificó la política de scripts del sistema.

## Git y siguiente tarea

Commits de implementación: `1b3973a` (`feat: preparar conexión local y migraciones de inventario`) y `0251676` (`feat: gestionar productos e inventario con diseño local y pruebas`). El commit documental y el resultado de publicar la rama se informan al cerrar la entrega; pueden consultarse con `git log --oneline`.

Ventas: commits `5683384` (`feat: registrar ventas atómicas con pagos y control de concurrencia`) y `5713296` (`feat: agregar carrito, historial y comprobantes internos de ventas`). El commit documental y el resultado de publicar `feat/ventas` se informan al cerrar la entrega. El ajuste visual de productos está publicado en `d160b6c`.

Cerrar la entrega de ventas y detenerse. La siguiente propuesta es usuarios y permisos, sujeta a nueva indicación. La instalación, configuración, migraciones, pruebas, demostración y pasos para registrar una venta están en el README.
