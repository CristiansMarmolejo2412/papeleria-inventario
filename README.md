# Papelería: inventario y ventas

Sistema previsto para administrar productos, inventario, ventas y caja de una papelería. Se utilizará inicialmente en un computador Windows, desde el navegador, con servidor y base de datos locales.

## Estado actual

Primera entrega funcional: aplicación local ejecutable, diseño adaptable, categorías y productos persistentes en MySQL. Permite crear, consultar, editar y desactivar productos; buscar por nombre o código, filtrar y paginar. El alta registra el producto y su movimiento inicial en una transacción. La edición no permite cambiar existencias.

Inicio muestra indicadores reales de inventario. Ventas, caja y las demás secciones futuras muestran «Pendiente de implementación», sin importes simulados ni formularios operativos. Usuarios y permisos todavía no están implementados; el responsable de las existencias iniciales es el operador local configurado.

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

Los comprobantes futuros serán internos; la facturación electrónica está fuera de la primera versión.

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

Abre **http://127.0.0.1:3000**. El comando de inicio compila primero los estilos. Detén el servidor con `Ctrl+C`. Para desarrollo con recarga de Node y recompilación de estilos:

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

## Verificaciones y demostración opcional

```powershell
npm.cmd test
npm.cmd run test:integracion
npm.cmd run test:navegador
```

Las pruebas de integración y navegador usan exclusivamente `papeleria_promax_prueba`, con las credenciales de `.env`. Aplica sus migraciones antes de la primera prueba de navegador:

```powershell
$env:DB_NAME = 'papeleria_promax_prueba'
npm.cmd run db:crear
npm.cmd run db:migrar
Remove-Item Env:DB_NAME
```

Integración aplica las migraciones de prueba automáticamente. Ambas pruebas crean registros sintéticos identificables y eliminan solo los que crearon; no vacían bases o tablas. La prueba de navegador requiere Google Chrome instalado; usa Playwright, un puerto local temporal y guarda capturas excluidas de Git en `test-results/`.

Para cargar ejemplos opcionales **solo en la base de prueba**:

```powershell
npm.cmd run demo
$env:DB_NAME = 'papeleria_promax_prueba'
npm.cmd start
```

Después de detener ese servidor, ejecuta `Remove-Item Env:DB_NAME` antes de volver a usar la base de trabajo. La demostración no carga datos en `papeleria_promax` y no duplica productos con sus mismos códigos `DEMO-*`.

Consulta [el estado y las limitaciones verificadas](docs/estado.md). Los respaldos y la restauración siguen pendientes; Git no conserva los datos de MySQL.

## Organización

`src/rutas` recibe solicitudes; `src/controladores` prepara respuestas; `src/servicios` valida y aplica reglas; `src/modelos` define persistencia; `src/vistas` contiene Pug. `migraciones` mantiene el esquema y `public` sirve recursos locales. Los estilos fuente están en `src/estilos`; el CSS generado se regenera con `npm.cmd run css` y no se versiona.

Referencias técnicas: [transacciones de Sequelize](https://sequelize.org/docs/v6/other-topics/transactions/), [migraciones](https://sequelize.org/docs/v6/other-topics/migrations/) y [compilación local de Tailwind](https://tailwindcss.com/docs/installation/tailwind-cli).

## Trabajo por etapas

`main` se conserva estable. Cada etapa se desarrolla y verifica en su propia rama, se documenta y se publica en `origin`, sin fusionar automáticamente a `main`. No se deben versionar credenciales, archivos `.env`, dependencias, datos reales ni respaldos. Git no sustituye las copias de seguridad de MySQL.
