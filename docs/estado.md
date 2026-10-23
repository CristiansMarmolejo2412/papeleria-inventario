# Estado del proyecto

Fecha de referencia de la entrega: 23 de octubre de 2026 (`America/Bogota`). Preparación documental: 22 de octubre de 2026.

## Avances

- Preparación documental terminada y publicada en `chore/documentacion-inicial`, commit `0c53b0c`.
- Entrega 1 implementada en `feat/productos-inventario-base`, creada desde la rama de documentación, con árbol inicialmente limpio. `main` no se modifica ni se fusiona automáticamente.
- Aplicación Express/Pug ejecutable, Tailwind compilado y recursos locales. Menú plegable, tarjetas, mensajes, navegación y adaptación visual basada en la referencia del usuario.
- Categorías con alta, consulta, edición y desactivación. Productos con códigos únicos, categoría, marca, ubicación, costos, precios, mínimos, estado y existencias iniciales.
- Consulta de productos con búsqueda por nombre y códigos, filtros por categoría, disponibilidad y actividad, y páginas de 10 registros. Inicio con indicadores reales del inventario; ventas y caja pendientes sin cifras ficticias.
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

## Límites y pendientes

- Entregas 2 a 13 pendientes: autenticación, permisos, movimientos operativos, caja, ventas, anulaciones, devoluciones, clientes, compras, presentaciones, servicios, reportes y respaldos/restauración. Las páginas futuras no guardan operaciones.
- El responsable local es un nombre de configuración; no existe aún autenticación ni una identidad de usuario verificable. El servidor escucha en `127.0.0.1` por defecto.
- Se verificó ausencia de dependencias externas durante las solicitudes, sin desconectar físicamente Windows de internet. No se realizó auditoría integral con lector de pantalla ni medición automatizada de todos los contrastes. Otras versiones de Node y otros navegadores permanecen sin verificar.
- Node 26 emite una advertencia de obsolescencia durante la compilación de Tailwind; el comando termina correctamente. La herramienta de paquetes también informa un script nativo opcional de vigilancia sin aprobar; la compilación y el recorrido verificados funcionan con el binario disponible. No se modificó la política de scripts del sistema.

## Git y siguiente tarea

Commits de implementación: `1b3973a` (`feat: preparar conexión local y migraciones de inventario`) y `0251676` (`feat: gestionar productos e inventario con diseño local y pruebas`). El commit documental y el resultado de publicar la rama se informan al cerrar la entrega; pueden consultarse con `git log --oneline`.

Cerrar esta entrega y detenerse. La siguiente propuesta es la entrega 2 (usuarios y permisos), sujeta a nueva indicación. La instalación, configuración, migraciones, pruebas, demostración y pasos para abrir la aplicación están en el README.
