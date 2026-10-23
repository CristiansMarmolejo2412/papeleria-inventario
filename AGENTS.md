# Instrucciones permanentes

## Alcance y comunicación

- Trabajar por etapas según `docs/plan-desarrollo.md`; atender únicamente la etapa autorizada. La preparación documental terminó; la entrega 1 fue autorizada e implementa productos e inventario base. No iniciar módulos posteriores sin indicación.
- Escribir documentación, interfaz, validaciones, explicaciones y descripciones de commits en español. Usar nombres de código consistentes y sin tildes.
- No marcar como implementadas o probadas funciones que solo estén planificadas. Actualizar README y `docs/estado.md` al finalizar cada etapa; informar cambios, verificaciones realmente ejecutadas, pendientes y commits.

## Entorno y arquitectura

- Objetivo inicial: un computador Windows, navegador, servidor y MySQL locales. La operación cotidiana no debe depender de internet; servir estilos, fuentes, iconos y scripts localmente.
- Tecnologías previstas: Node.js, Express, Sequelize, MySQL, Pug y Tailwind CSS. Separar rutas, controladores, servicios, modelos y vistas; concentrar reglas de negocio en servicios.
- Usar COP y `America/Bogota`. Evitar cálculos monetarios con coma flotante binaria; definir una representación exacta y reglas explícitas de redondeo antes de implementar ventas.
- Seguir los módulos y reglas de `docs/requisitos.md` y la guía de `docs/diseno.md`.
- Usar `npm.cmd` en PowerShell. Aplicar migraciones con Umzug; no usar sincronizaciones destructivas. Limitar bases a `papeleria_promax` y `papeleria_promax_prueba`; mantener datos sintéticos y demostración únicamente en la segunda.
- Conservar el stock fuera de los formularios de edición; crear producto y movimiento inicial atómicamente. Importes decimales exactos y cantidades enteras según el README.

## Integridad de datos

- Confirmar venta, pagos, movimientos y descuento de inventario en una única transacción; revertir todo ante errores.
- Validar existencias en el servidor, también ante solicitudes concurrentes. Impedir cantidades negativas y duplicación de ventas por doble clic o reintentos.
- Conservar precios y costos históricos. No borrar registros necesarios para el historial: desactivar o anular con trazabilidad.
- Registrar motivo y responsable de ajustes, devoluciones y anulaciones. Separar existencias físicas y prestación de servicios.
- Mantener respaldos de la base de datos independientes de Git y verificar restauraciones antes de declarar lista esa función.

## Git y verificación

- Revisar repositorio, rama, remoto, estado y archivos existentes antes de modificar. Conservar cambios ajenos y leer la documentación antes de actualizarla.
- Mantener `main` estable y crear ramas por etapa. No fusionar automáticamente, usar force push ni eliminar historial.
- Crear commits por mejora coherente y verificada con prefijos convencionales y descripción en español, por ejemplo `feat: agregar búsqueda de productos`.
- Al terminar una etapa verificada, publicar su rama en `origin`. Si falla, conservar el commit local e informar el impedimento.
- Excluir credenciales, `.env`, `node_modules`, datos reales y respaldos. Incorporar un `.env.example` sin secretos y reglas de exclusión antes de añadir configuración o dependencias.
- Ejecutar las verificaciones pertinentes a cada entrega y registrar resultados reales. No afirmar pruebas de aplicación en etapas exclusivamente documentales.
