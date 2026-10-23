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

## Decisiones pendientes

En la entrega 1 se decidió usar MySQL 8.0.16 o posterior, códigos únicos incluso en inactivos, cantidades enteras e importes `DECIMAL(12,2)` recibidos como cadenas con máximo dos decimales, sin redondeo implícito. Los códigos internos se normalizan a mayúsculas y los códigos de barras vacíos se almacenan como `NULL`. Las fechas se almacenan en UTC y se muestran en Bogotá. El stock solo se establece durante el alta, junto con el movimiento inicial, y no se edita directamente.

Antes de las entregas correspondientes se concretarán: redondeo de descuentos y ventas, métodos de pago, permisos por operación, tratamiento de devoluciones, equivalencias y política de respaldo. La identidad del responsable inicial es un nombre configurado localmente; la autenticación y sus permisos pertenecen a la entrega 2.
