# Requisitos

## Entorno y límites

Aplicación local para un computador Windows, accesible desde navegador, con servidor y MySQL locales. La operación cotidiana funcionará sin internet, incluidos todos los recursos visuales y scripts. Tecnologías previstas: Node.js, Express, Sequelize, MySQL, Pug y Tailwind CSS; capas de rutas, controladores, servicios, modelos y vistas.

Idioma de documentación, interfaz y validaciones: español. Nombres de código consistentes y sin tildes. Moneda: pesos colombianos (COP). Zona horaria: `America/Bogota`. Comprobantes internos; facturación electrónica excluida de la primera versión.

## Módulos previstos

| Módulo | Alcance |
| --- | --- |
| Inicio | Ventas del día, productos disponibles, pocas existencias, estado de caja y accesos rápidos. |
| Productos | Código interno y de barras, nombre, categoría, marca, ubicación, costo, precio, existencias mínimas y estado activo. |
| Consulta de inventario | Búsqueda por nombre o código, filtros, disponibilidad y paginación. |
| Movimientos | Entradas, salidas y ajustes con fecha, responsable y motivo. |
| Ventas | Varios productos, descuentos, cliente opcional, pagos combinados, cálculo de cambio y comprobante imprimible. |
| Historial | Consulta de ventas, anulaciones y devoluciones trazables. |
| Clientes | Datos de clientes e historial de compras. |
| Proveedores y compras | Proveedores, compras y recepción de mercancía. |
| Caja | Apertura, cierre, entradas, gastos y diferencias de efectivo. |
| Reportes | Ventas, inventario, productos más vendidos y ganancias estimadas. |
| Usuarios y permisos | Roles de administrador y vendedor, con autorización validada en el servidor. |
| Configuración | Datos del negocio, copias de seguridad y restauración. |
| Presentaciones | Unidad, paquete o caja con equivalencias explícitas. |
| Servicios | Impresiones, fotocopias y anillados, separados del inventario físico. |

## Reglas de negocio obligatorias

1. Guardar venta, pagos, movimientos y descuento de existencias en una sola transacción: confirmar todo o revertir todo.
2. Validar existencias en el servidor y evitar cantidades negativas, incluso con operaciones concurrentes.
3. Evitar ventas duplicadas por doble clic o reintentos mediante un mecanismo persistente de idempotencia.
4. Conservar precios y costos históricos por detalle de venta; cambios posteriores del catálogo no alterarán el historial.
5. No borrar registros necesarios para el historial. Usar desactivación o anulaciones trazables.
6. Registrar fecha, motivo y responsable de ajustes, devoluciones y anulaciones; impedir devolver más de lo vendido y no devuelto.
7. Usar representación monetaria exacta, sin coma flotante binaria para cálculos. Definir precisión y redondeo antes de ventas y descuentos.
8. Mostrar importes en COP y fechas según `America/Bogota`; definir y documentar la estrategia de almacenamiento temporal.
9. Mantener separadas las existencias de productos y la prestación de servicios.
10. Las copias de seguridad de MySQL son independientes de Git. No versionar datos reales, credenciales ni respaldos.

## Servicios integrados implementados

Catálogo con código único incluso inactivo, nombre, categoría y unidad de cobro obligatorios, descripción opcional y precio positivo `DECIMAL(12,2)`. Cada variante es independiente. Registro, edición, búsqueda, paginación, activación y desactivación; ninguna carga automática de precios en la principal.

Ventas de servicios o mixtas, cantidades enteras positivas, selector de tipo, búsqueda y accesos a ocho servicios activos. Cantidad por página/cara significa páginas/caras cobradas. El precio no es editable en venta; se valida actividad y se recalcula con precio vigente. Historial y comprobantes distinguen tipos, conservando código, nombre, unidad y precio históricos de servicio. Consumidor final y pago único siguen vigentes.

Transacción única con detalles de servicio separados de los físicos; bloqueo de productos por ID y luego servicios por ID, sin movimientos ni stock ficticio para servicios. Clave persistente y huella por tipo evitan duplicados y cambios de contenido; los reintentos de ventas físicas anteriores siguen compatibles. El resumen diario incluye servicios; inventario solo productos físicos. Consumo automático de papel/tinta, costos de servicios y sus ganancias siguen pendientes, igual que caja, clientes, crédito, descuentos y autenticación.

## Decisiones generales pendientes

En la entrega 1 se decidió usar MySQL 8.0.16 o posterior, códigos únicos incluso en inactivos, cantidades enteras e importes `DECIMAL(12,2)` recibidos como cadenas con máximo dos decimales, sin redondeo implícito. Los códigos internos se normalizan a mayúsculas y los códigos de barras vacíos se almacenan como `NULL`. Las fechas se almacenan en UTC y se muestran en Bogotá. El stock solo se establece durante el alta, junto con el movimiento inicial, y no se edita directamente.

Antes de las ampliaciones correspondientes se concretarán: redondeo de descuentos, pagos combinados y crédito, permisos por operación, tratamiento de devoluciones, equivalencias y política de respaldo. La identidad del responsable es un nombre configurado localmente; la autenticación y sus permisos pertenecen a la entrega 2.

## Alcance implementado de ventas básicas

Por indicación expresa del usuario, se adelanta el registro e historial antes de caja y autenticación. Se usa Consumidor final y un único pago: efectivo con recibido/cambio, o transferencia manual con referencia opcional. No se verifican movimientos bancarios.

El servidor agrupa productos repetidos y usa exclusivamente sus datos vigentes para calcular el total. Conserva nombre, código, precio y costo históricos; cantidades enteras positivas; cálculos en centavos `BigInt` y almacenamiento `DECIMAL(18,2)` para importes de venta y pago. Bloquea productos por ID ascendente en una transacción `READ COMMITTED`. El UUID de operación único y su huella de contenido permiten reintentos equivalentes y rechazan claves reutilizadas con datos diferentes.

La venta, detalles, pago, salidas y stock se guardan juntos. El comprobante `V-<id>` es interno, único y puede tener saltos de numeración. El historial ofrece fecha de Bogotá, número exacto y páginas de 10 ventas; inicio muestra número y total del día con límites locales convertidos a UTC.

Continúan pendientes descuentos, crédito, pagos combinados, clientes, anulaciones, devoluciones, caja y autenticación. El responsable sigue siendo el nombre local configurado. La política de redondeo de futuros descuentos y las reglas de caja se definirán al autorizar esas ampliaciones.

## Alcance implementado de proveedores y compras recibidas

Proveedores: nombre o razón social obligatorio; identificación opcional única normalizada a mayúsculas, contacto, teléfono, correo, dirección y observaciones. Búsqueda, paginación, edición y desactivación, sin borrar proveedores vinculados al historial.

Recepción de varios productos activos de un proveedor activo: cantidades enteras positivas, costo unitario exacto, fecha local de recepción no futura, referencia y observaciones, confirmación expresa del aumento de existencias, número `C-<id>`, historial por fecha/proveedor y detalle sin edición o eliminación. Datos del proveedor y productos se copian históricamente. Se agrupan productos repetidos con el mismo costo; se rechazan costos diferentes para evitar ambigüedad.

La última recepción confirmada fija el costo de compra vigente por orden de registro, incluso si su fecha es pasada, sin promedio ponderado. No se modifica el precio de venta ni los costos históricos previos. Compra, detalles, entradas, stock y costo se guardan juntos con bloqueo del proveedor y de productos por ID ascendente; compatible con ventas simultáneas. La clave única y la huella normalizada impiden duplicación o reutilización con otros datos.

No se generan gastos ni salidas de caja. Órdenes pendientes, recepciones parciales, cuentas por pagar, pagos a proveedores, anulaciones y devoluciones quedan pendientes; responsable local sin autenticación.
