# Papelería: inventario y ventas

Sistema previsto para administrar productos, inventario, ventas y caja de una papelería. Se utilizará inicialmente en un computador Windows, desde el navegador, con servidor y base de datos locales.

## Estado actual

Primera entrega funcional: aplicación local ejecutable, diseño adaptable, categorías y productos persistentes en MySQL. Permite crear, consultar, editar y desactivar productos; buscar por nombre o código, filtrar y paginar. El alta registra el producto y su movimiento inicial en una transacción. La edición no permite cambiar existencias.

Ventas básicas e historial implementados: carrito de varios productos, efectivo con cambio o transferencia manual, comprobante interno imprimible y consulta por fecha o número. Inicio muestra indicadores reales de inventario y el total y número de ventas del día en Bogotá. Caja y las demás secciones futuras continúan pendientes. Usuarios y permisos todavía no están implementados; se conserva el responsable local configurado.

Proveedores y compras recibidas implementados: registro, edición, búsqueda, paginación y desactivación de proveedores; recepción de varios productos con costos exactos, aumento de stock y detalle histórico. Las recepciones son definitivas y no generan pagos ni salidas de caja.

Servicios implementados: catálogo con código único, nombre, categoría, unidad de cobro, precio positivo y descripción; búsqueda, edición, activación y desactivación. Ventas solo de servicios o mixtas con productos, con importes y unidades históricos en comprobantes e historial. El resumen diario incluye ambos tipos; los indicadores de inventario siguen contando únicamente productos físicos.

La interfaz usa fondo crema, menú beige madera claro y detalles café y amarillo suave, con acciones principales turquesa y superficies claras para tablas y formularios. El resumen de existencias distingue ausencia de alertas (verde con confirmación), pocas existencias (amarillo) y agotados (rojo suave), con contadores en singular o plural según corresponda.

## Tecnologías previstas

Node.js, Express 5, Sequelize 6, MySQL 8, Pug 3 y Tailwind CSS 4. El código está separado en rutas, controladores, servicios, modelos y vistas. Se verificó con Node.js **26.3.1**, npm **11.16.0** y MySQL **8.0.46** en Windows. El proyecto declara Node.js 22 o posterior; otras versiones no se han verificado. Las versiones exactas instaladas se conservan en `package-lock.json`.

La operación cotidiana debe funcionar sin internet: scripts, estilos, fuentes e iconos serán locales. La instalación inicial podrá requerir conexión. Se manejarán pesos colombianos (COP) y la zona horaria `America/Bogota`.

## Documentación

- [Instrucciones permanentes](AGENTS.md).
- [Requisitos y reglas de negocio](docs/requisitos.md).
- [Diseño e interacción](docs/diseno.md).
- [Plan por entregas y criterios de finalización](docs/plan-desarrollo.md).
- [Estado, verificaciones y siguiente tarea](docs/estado.md).

Los comprobantes son internos; la facturación electrónica está fuera de la primera versión.

## Instalación en Windows

Requisitos: Node.js con npm, MySQL **8.0.16 o posterior** con servicio iniciado y Git. Esta versión de MySQL permite aplicar las restricciones `CHECK`. Desde PowerShell, situado en este repositorio:

```powershell
npm.cmd ci
Copy-Item .env.example .env
notepad .env
```

Si `.env` ya existe, edítalo sin copiar encima. Se usa `npm.cmd` para funcionar también cuando PowerShell bloquea `npm.ps1`, sin cambiar la política de ejecución. La instalación inicial requiere acceso al registro npm; la operación cotidiana usa únicamente recursos locales.

### Usuario y bases exclusivas

En MySQL Workbench, abre una conexión de administrador. Crea el usuario local `papeleria_app` desde **Administration → Users and Privileges**, con host `localhost`, y establece su contraseña localmente. No la incluyas en documentación ni commits.

Ejecuta como administrador estas sentencias para las dos bases exclusivas y los permisos mínimos de esta entrega:

```sql
CREATE DATABASE IF NOT EXISTS papeleria_promax
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS papeleria_promax_prueba
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON `papeleria\_promax`.* TO 'papeleria_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON `papeleria\_promax\_prueba`.* TO 'papeleria_app'@'localhost';
SHOW GRANTS FOR 'papeleria_app'@'localhost';
```

Los guiones bajos se escapan en `GRANT` para evitar comodines. No se conceden permisos globales ni `DROP`. No se consultan ni modifican bases de otros proyectos. La configuración rechaza nombres diferentes de las dos bases indicadas.

En `.env`, completa `DB_PASSWORD` sin compartirla. Conserva `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_USER=papeleria_app` y `DB_NAME=papeleria_promax`. Define `RESPONSABLE_LOCAL` con el nombre del operador que registrará las existencias iniciales; aún no representa una identidad autenticada. Los secretos, datos y respaldos están excluidos de Git.

### Migraciones y ejecución

```powershell
npm.cmd run db:crear
npm.cmd run db:migrar
npm.cmd start
```

Abre **http://127.0.0.1:3000**. El comando de inicio compila primero los estilos. Detén el servidor con `Ctrl+C`.

Antes de abrir el puerto, el servidor comprueba la conexión, las migraciones y las tablas/columnas de la base seleccionada en `.env`. Si falta una migración o el esquema no corresponde, termina sin anunciarse disponible e indica ejecutar `npm.cmd run db:migrar`. No aplica cambios de esquema automáticamente al iniciar.

Si aparece un error de MySQL durante el uso, la terminal incluye un código de diagnóstico (por ejemplo `ER_NO_SUCH_TABLE` o `ER_BAD_FIELD_ERROR`) sin imprimir consultas, parámetros ni credenciales. Haber migrado `papeleria_promax_prueba` no actualiza `papeleria_promax`. Para actualizar la base de trabajo, detén tu servidor, comprueba que `DB_NAME` seleccione `papeleria_promax`, ejecuta `npm.cmd run db:migrar` y luego `npm.cmd start`. Un servidor iniciado con `npm.cmd start` necesita reiniciarse para cargar cambios de código.

Para desarrollo con recarga de Node y recompilación de estilos:

```powershell
npm.cmd run dev
```

En la interfaz, entra en **Categorías**, crea una categoría activa y luego registra un **Nuevo producto**. La base de trabajo no se rellena con datos de ejemplo automáticamente.

Las migraciones se registran en `SequelizeMeta`; repetir `db:migrar` no recrea las tablas. No se usa `sync`, `force`, ni `alter` de sincronización. MySQL confirma el DDL implícitamente; la migración inicial permite reanudar la creación de tablas si se interrumpe, sin borrarlas. Las operaciones sobre datos usan transacciones cuando corresponde.

## Reglas de esta entrega

- Códigos internos normalizados a mayúsculas y únicos, incluso en productos inactivos. Código de barras opcional y único; los valores vacíos se guardan como `NULL`. La comparación usa la intercalación `utf8mb4_unicode_ci`, sin distinguir mayúsculas ni acentos.
- Importes en `DECIMAL(12,2)`, de 0 a 9999999999.99. El servidor valida y normaliza cadenas decimales sin calcular dinero con coma flotante. No se admiten más de dos decimales; aún no se calculan descuentos o ganancias.
- Cantidades enteras de 0 a 2147483647. Disponible: stock mayor que cero; pocas existencias: stock positivo menor o igual al mínimo; agotado: cero. Un producto inactivo se identifica como tal y queda fuera de los indicadores activos.
- El stock inicial, incluso cero, genera un movimiento con fecha, motivo y responsable en la misma transacción. La edición rechaza el campo `stock`, incluso si se envía manualmente.
- Fechas almacenadas en UTC y mostradas en `America/Bogota`. No se eliminan productos ni categorías desde la aplicación; se desactivan. Se permite conservar una categoría inactiva al editar un producto ya asociado, pero no asignarla a productos nuevos.

## Registro e historial de ventas

Para actualizar una instalación existente, conserva `.env`, detén el servidor, ejecuta `npm.cmd run db:migrar` y vuelve a arrancar con `npm.cmd start`. La migración `002-ventas.js` añade ventas, detalles históricos, pagos, un índice por fecha y una referencia opcional de venta en los movimientos existentes; no borra ni modifica productos o existencias. No hay dependencias nuevas para esta entrega.

1. Abre **http://127.0.0.1:3000/ventas/nueva** o selecciona **Nueva venta**.
2. Busca por nombre, código interno o código de barras. Solo aparecen productos activos, con precio y existencias; los agotados no se pueden agregar desde la interfaz.
3. Agrega productos, cambia cantidades o quita líneas. Volver a agregar el mismo producto acumula su cantidad. Subtotal y total son iguales porque todavía no existen descuentos.
4. La venta se registra a **Consumidor final**. Elige **Efectivo** e introduce el importe recibido, o **Transferencia** con referencia opcional. La transferencia es un registro manual, sin verificación bancaria.
5. Pulsa **Confirmar venta**. Ante errores, conserva el carrito y corrige los campos. Si hubo una interrupción sin confirmación, reintenta la misma operación; no abras otro carrito para repetirla.
6. Consulta e imprime el comprobante interno. **Historial de ventas** permite filtrar por fecha local de Bogotá y buscar el número exacto, como `V-00000001` (también acepta su parte numérica), con páginas de 10 ventas.

El borrador se conserva en `sessionStorage` de la pestaña para soportar recargas y se limpia al abrir su comprobante confirmado. No sustituye los registros persistentes de MySQL ni garantiza recuperación si se borra el almacenamiento del navegador. Node y MySQL deben estar en ejecución para registrar operaciones.

### Integridad y límites de las ventas

- El servidor obtiene precios, costos, nombres, códigos y stock desde MySQL, sin confiar en importes enviados por el navegador. El detalle conserva sus valores históricos aunque cambie el catálogo.
- Los cálculos usan centavos `BigInt`, sin coma flotante. Precio y costo conservan `DECIMAL(12,2)`; subtotal, total y pago usan `DECIMAL(18,2)`, hasta 9999999999999999.99 COP por operación. No se redondea: se rechazan importes con más de dos decimales. El total debe ser positivo.
- Hasta 100 líneas de entrada por operación, agrupadas por producto, con cantidades enteras positivas. El stock se verifica de nuevo al confirmar.
- Venta, detalles, pago, movimientos de salida y descuento de existencias se confirman o revierten juntos. Se bloquean los productos en orden de ID con `SELECT ... FOR UPDATE` e aislamiento `READ COMMITTED`; dos ventas no pueden consumir la misma última unidad.
- Una clave UUID de operación tiene restricción única persistente. El mismo contenido normalizado devuelve el comprobante existente; cambiar cantidades o pago con una clave ya confirmada se rechaza. Tras una reversión completa se puede reintentar esa clave. La confirmación redirige con HTTP 303 a una consulta GET: recargar el comprobante no registra ventas.
- El número interno `V-` seguido del ID con al menos ocho cifras es único. Puede haber saltos por intentos revertidos; no es numeración fiscal.
- Se almacenan fechas UTC y se consultan los días de `America/Bogota` desde las 00:00 inclusive hasta las 00:00 del día siguiente, exclusivas. Los indicadores suman importes decimales directamente en MySQL sin convertirlos a coma flotante.
- Registrar una venta **no abre ni cierra caja**. El responsable sigue siendo `RESPONSABLE_LOCAL`, sin identidad autenticada. No se implementaron clientes, descuentos, crédito, pagos combinados, anulaciones o devoluciones; quedan para entregas posteriores.

## Proveedores y recepción de compras

Actualización: detén el servidor de este proyecto, conserva `.env`, ejecuta `npm.cmd run db:migrar` en la base principal y vuelve a iniciar con `npm.cmd start`. La migración aditiva `003-proveedores-compras.js` crea proveedores, compras y detalles, y agrega `compraId` opcional a movimientos; conserva los datos existentes. No hay dependencias nuevas ni cambios en `package-lock.json`.

1. Abre **http://127.0.0.1:3000/proveedores** y selecciona **Nuevo proveedor**. Nombre o razón social es obligatorio; identificación, contacto, teléfono, correo, dirección y observaciones son opcionales.
2. Guarda el proveedor activo. Su identificación se recorta y normaliza a mayúsculas, y debe ser única incluso en inactivos; vacía se guarda como `NULL`. El correo y el teléfono se validan cuando se informan. No se valida fiscalmente la identificación.
3. En **Compras**, selecciona **Registrar recepción** y elige un proveedor activo. Busca productos activos por nombre o código (también admite código de barras), agrega los recibidos e introduce cantidades enteras positivas y el costo unitario de cada línea.
4. Indica la fecha real de recepción (no futura), referencia opcional y observaciones. Revisa subtotal y total en COP. Agregar otra vez el mismo producto acumula cantidad; conserva el costo editado. El servidor agrupa líneas repetidas con igual costo y rechaza costos diferentes para un mismo producto.
5. Marca **Confirmo que esta mercancía ya fue recibida** y pulsa **Confirmar recepción**. El aviso informa que aumentarán las existencias y se actualizará el costo. La confirmación se valida también en el servidor.
6. Consulta el número interno único `C-<id>` y su detalle. El historial permite fecha de recepción, proveedor (incluidos inactivos) y páginas de 10 compras. En el detalle del producto, cada entrada enlaza a su compra.

### Costos, históricos e integridad

- Cada compra conserva nombre, identificación, contacto y demás datos del proveedor, y nombre, código, cantidad, costo recibido, costo anterior y precio de venta del producto al recibirlo. Desactivar o editar el proveedor o el producto no altera ese historial.
- **Decisión de esta etapa:** el costo de compra vigente es el de la última recepción confirmada para el producto, según el orden de registro, sin promedio ponderado. Una recepción con fecha pasada también actualiza el costo al confirmarla. Los costos históricos de compras y ventas anteriores permanecen intactos; nuevas ventas usan el costo vigente. El precio de venta no cambia.
- Compra, detalle, movimiento de entrada, aumento de stock y actualización del costo se confirman o revierten en una sola transacción `READ COMMITTED`. Se bloquea el proveedor durante su copia histórica y los productos por ID ascendente, compatible con los bloqueos de ventas.
- UUID de operación único y huella de proveedor, fecha, referencia, observaciones y líneas normalizadas: un reintento equivalente devuelve la compra original; la misma clave con cambios se rechaza. Confirmar redirige a GET; recargar el detalle no vuelve a recibir mercancía. Un reintento confirmado sigue funcionando aunque después se desactive el proveedor.
- Costos unitarios de 0 a 9999999999.99 COP, máximo dos decimales; cantidades enteras positivas y saldo final hasta 2147483647; hasta 100 líneas de entrada. Totales en centavos `BigInt` y `DECIMAL(18,2)`, incluidos costos cero. Todos los importes se recalculan en el servidor.
- Fecha de recepción como fecha local de Bogotá, y fecha/hora de registro UTC mostrada en Bogotá. El movimiento registra el instante de confirmación; el detalle conserva ambas fechas. Los números internos pueden tener saltos por operaciones revertidas.
- No existen rutas para editar o eliminar una recepción confirmada. El borrador por pestaña usa una clave distinta del carrito de ventas y se conserva ante recargas o errores hasta consultar la confirmación.
- No se implementan órdenes pendientes, recepciones parciales, cuentas por pagar, pagos a proveedores, anulaciones ni devoluciones. Registrar la recepción **no genera gasto ni salida de caja**. Responsable local configurable; autenticación pendiente.

Para ensayar sin afectar datos de uso, prepara primero las migraciones de `papeleria_promax_prueba`, selecciona esa base temporalmente con `$env:DB_NAME = 'papeleria_promax_prueba'`, ejecuta `npm.cmd run demo` si deseas productos opcionales y arranca con `npm.cmd start`. Crea un proveedor de prueba y sigue el flujo anterior. Al detenerlo, ejecuta `Remove-Item Env:DB_NAME` antes de volver a la base principal. No hay proveedores ni compras de ejemplo automáticos.

## Verificaciones y demostración opcional

```powershell
npm.cmd test
npm.cmd run test:integracion
npm.cmd run test:navegador
npm.cmd run test:ventas
npm.cmd run test:ventas:navegador
npm.cmd run test:compras
npm.cmd run test:compras:navegador
npm.cmd run test:servicios
npm.cmd run test:servicios:navegador
```

Las pruebas de integración, ventas, compras y navegador usan exclusivamente `papeleria_promax_prueba`, con las credenciales de `.env`. Ejecuta los comandos de prueba secuencialmente. Las pruebas de ventas y compras aplican sus migraciones automáticamente; para la prueba original de navegador, prepara primero el esquema:

```powershell
$env:DB_NAME = 'papeleria_promax_prueba'
npm.cmd run db:crear
npm.cmd run db:migrar
Remove-Item Env:DB_NAME
```

Integración aplica las migraciones de prueba automáticamente. Las pruebas crean registros sintéticos identificables y eliminan solo los que crearon; no vacían bases o tablas. Las pruebas de navegador requieren Google Chrome instalado; usan Playwright y un puerto local temporal, y guardan capturas excluidas de Git en `test-results/`. El recorrido de ventas también genera un PDF de comprobante; no se comprobó una impresora física.

Para cargar ejemplos opcionales **solo en la base de prueba**:

```powershell
npm.cmd run demo
$env:DB_NAME = 'papeleria_promax_prueba'
npm.cmd start
```

Después de detener ese servidor, ejecuta `Remove-Item Env:DB_NAME` antes de volver a usar la base de trabajo. La demostración no carga datos en `papeleria_promax` y no duplica productos con sus mismos códigos `DEMO-*`.

Consulta [el estado y las limitaciones verificadas](docs/estado.md). Los respaldos y la restauración siguen pendientes; Git no conserva los datos de MySQL.

## Registrar un servicio y una venta mixta

1. Si hay un servidor anterior, detenlo con `Ctrl+C` en su terminal. Desde el repositorio ejecuta `npm.cmd run db:migrar` y `npm.cmd start`; abre **http://127.0.0.1:3000**.
2. En **Servicios → Nuevo servicio**, registra un código único, nombre de la variante, categoría, unidad de cobro y el precio real de tu negocio. La descripción es opcional. Guarda el servicio activo. No se instalan servicios ni precios de ejemplo en la base principal.
3. En **Nueva venta**, busca y agrega un producto. Cambia el selector a **Servicios** y busca por nombre, código o categoría; también puedes abrir **Servicios rápidos** (los primeros ocho activos por nombre). Agrega el servicio y ajusta su cantidad. Por página o cara, la cantidad corresponde a las páginas o caras cobradas, sin deducir hojas ni otras equivalencias.
4. Repetir un artículo acumula su cantidad en una línea; productos y servicios se distinguen aunque compartan código. Puedes quitar líneas. El precio se toma del catálogo y no se edita en la venta.
5. Selecciona efectivo e importe recibido, o transferencia manual con referencia opcional. Confirma y revisa el comprobante interno; desde allí puedes imprimir y consultar el historial. También puedes registrar una venta que solo contenga servicios.

El servidor recalcula con centavos `BigInt`, bloquea primero productos por ID ascendente y después servicios por ID ascendente, comprueba su estado vigente y confirma venta, detalles, pago y movimientos físicos juntos. La clave de operación y la huella conservan los reintentos anteriores de ventas solo de productos y rechazan reutilización con otros datos. Ante un error se mantiene el carrito y la misma clave; revisa la confirmación antes de abrir otra venta.

La migración aditiva `004-servicios.js` crea el catálogo y `detalles_servicio`, sin modificar ni borrar ventas previas. Cada detalle de servicio conserva código, nombre, unidad, precio, cantidad y subtotal. No tiene existencias ni costo ficticio; cambiar su precio o desactivarlo conserva el historial. Los movimientos solo corresponden a productos físicos. Las ventas del día incluyen ambos tipos; caja sigue pendiente. Consumo de papel, tinta y otros insumos, costos de servicios, clientes, autenticación, crédito y descuentos requieren etapas posteriores.

Las pruebas de servicios usan exclusivamente la base de pruebas, comprueban operaciones reales de MySQL y limpian solo sus registros. El recorrido de Chrome genera capturas de escritorio/móvil y PDF en `test-results/`; no se verificó una impresora física.

## Organización del código

`src/rutas` recibe solicitudes; `src/controladores` prepara respuestas; `src/servicios` valida y aplica reglas; `src/modelos` define persistencia; `src/vistas` contiene Pug. `migraciones` mantiene el esquema y `public` sirve recursos locales. Los estilos fuente están en `src/estilos`; el CSS generado se regenera con `npm.cmd run css` y no se versiona.

Referencias técnicas: [transacciones de Sequelize](https://sequelize.org/docs/v6/other-topics/transactions/), [migraciones](https://sequelize.org/docs/v6/other-topics/migrations/) y [compilación local de Tailwind](https://tailwindcss.com/docs/installation/tailwind-cli).

## Trabajo por etapas

`main` se conserva estable. Cada etapa se desarrolla y verifica en su propia rama, se documenta y se publica en `origin`, sin fusionar automáticamente a `main`. No se deben versionar credenciales, archivos `.env`, dependencias, datos reales ni respaldos. Git no sustituye las copias de seguridad de MySQL.
