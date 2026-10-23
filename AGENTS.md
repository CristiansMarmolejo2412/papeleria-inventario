# Instrucciones permanentes

## Alcance y comunicación

- Trabajar por etapas según `docs/plan-desarrollo.md`; atender únicamente la etapa autorizada. Están implementados productos, inventario base, ventas e historial, proveedores con recepción de compras y servicios integrados con ventas. Usuarios y caja continúan pendientes. No iniciar módulos posteriores sin indicación.
- Escribir documentación, interfaz, validaciones, explicaciones y descripciones de commits en español. Usar nombres de código consistentes y sin tildes.
- No marcar como implementadas o probadas funciones que solo estén planificadas. Actualizar README y `docs/estado.md` al finalizar cada etapa; informar cambios, verificaciones realmente ejecutadas, pendientes y commits.

## Entorno y arquitectura

- Objetivo inicial: un computador Windows, navegador, servidor y MySQL locales. La operación cotidiana no debe depender de internet; servir estilos, fuentes, iconos y scripts localmente.
- Tecnologías previstas: Node.js, Express, Sequelize, MySQL, Pug y Tailwind CSS. Separar rutas, controladores, servicios, modelos y vistas; concentrar reglas de negocio en servicios.
- Usar COP y `America/Bogota`. Evitar cálculos monetarios con coma flotante binaria; definir una representación exacta y reglas explícitas de redondeo antes de implementar ventas.
- Seguir los módulos y reglas de `docs/requisitos.md` y la guía de `docs/diseno.md`.
- Usar `npm.cmd` en PowerShell. Aplicar migraciones con Umzug; no usar sincronizaciones destructivas. Limitar bases a `papeleria_promax` y `papeleria_promax_prueba`; mantener datos sintéticos y demostración únicamente en la segunda.
- Conservar el stock fuera de los formularios de edición; crear producto y movimiento inicial atómicamente. Importes decimales exactos y cantidades enteras según el README.
- Ventas básicas: Consumidor final, un pago en efectivo o transferencia manual, sin descuentos, crédito, pagos combinados, anulaciones ni devoluciones. Caja y autenticación siguen pendientes; conservar el responsable local configurado.
- Calcular dinero con centavos `BigInt` y cadenas decimales; bloquear productos por ID ascendente dentro de la transacción. Conservar la clave de operación al reintentar y rechazar su reutilización con datos diferentes. No generar otra clave automáticamente ante un error de confirmación.
- Compras: registrar únicamente mercancía ya recibida de proveedores activos, con confirmación explícita. Compra, detalle, entradas, stock y costo vigente son atómicos. Bloquear proveedor y luego productos por ID ascendente; ventas siguen el mismo orden de productos.
- La última recepción confirmada fija el costo de compra vigente, sin promedio ponderado ni ordenación retroactiva por fecha. No cambiar el precio de venta ni los históricos. Las recepciones confirmadas no se editan ni borran; no generan pagos ni salidas de caja. Órdenes pendientes, recepciones parciales, cuentas por pagar, pagos, anulaciones y devoluciones quedan fuera de esta etapa.

## Integridad de datos

- Confirmar venta, pagos, movimientos y descuento de inventario en una única transacción; revertir todo ante errores.
- Validar existencias en el servidor, también ante solicitudes concurrentes. Impedir cantidades negativas y duplicación de ventas por doble clic o reintentos.
- Conservar precios y costos históricos. No borrar registros necesarios para el historial: desactivar o anular con trazabilidad.
- Registrar motivo y responsable de ajustes, devoluciones y anulaciones. Separar existencias físicas y prestación de servicios.
- Mantener respaldos de la base de datos independientes de Git y verificar restauraciones antes de declarar lista esa función.
- Servicios: catálogo independiente sin stock. Ventas solo de servicios o mixtas; bloquear productos por ID y luego servicios por ID, validar actividad/precio en servidor y guardar unidades e importes históricos en `detalles_servicio`. No generar movimientos para servicios ni simular existencias. Consumo y costos de insumos siguen pendientes; conservar Consumidor final y el responsable local.

## Git y verificación

- Revisar repositorio, rama, remoto, estado y archivos existentes antes de modificar. Conservar cambios ajenos y leer la documentación antes de actualizarla.
- Mantener `main` estable y crear ramas por etapa. No fusionar automáticamente, usar force push ni eliminar historial.
- Crear commits por mejora coherente y verificada con prefijos convencionales y descripción en español, por ejemplo `feat: agregar búsqueda de productos`.
- Al terminar una etapa verificada, publicar su rama en `origin`. Si falla, conservar el commit local e informar el impedimento.
- Excluir credenciales, `.env`, `node_modules`, datos reales y respaldos. Incorporar un `.env.example` sin secretos y reglas de exclusión antes de añadir configuración o dependencias.
- Ejecutar las verificaciones pertinentes a cada entrega y registrar resultados reales. No afirmar pruebas de aplicación en etapas exclusivamente documentales.
