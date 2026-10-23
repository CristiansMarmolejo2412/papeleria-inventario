# Plan de desarrollo

Cada entrega requiere autorización de su alcance, rama propia, cambios coherentes, verificaciones ejecutadas, documentación de resultados y publicación en `origin` si hay acceso. No se fusionará a `main` automáticamente. Preparación, entrega 1 y ventas básicas con historial (5A) implementadas. Por solicitud expresa del usuario, 5A se adelantó antes de usuarios, movimientos operativos completos y caja, que siguen pendientes. Ver resultados y límites en `estado.md`.

## Entrega 0: preparación documental

Rama: `chore/documentacion-inicial`.

Estado: completada y publicada, commit `0c53b0c`.

Criterios: revisar repositorio y documentación existente; conservar alcance e instrucciones; crear los seis documentos solicitados; comprobar coherencia y enlaces; crear el commit `docs: definir alcance, diseño y plan de desarrollo`; intentar publicar la rama e informar el resultado. No instalar dependencias ni implementar la aplicación. Detenerse al terminar.

## Entrega 1: primera versión funcional de productos

Rama: `feat/productos-inventario-base`, creada desde `chore/documentacion-inicial` para conservar los documentos.

Estado: implementada. Incluye categorías, consultas de inventario, validación, migraciones, diseño local y pruebas automatizadas. Verificaciones de MySQL y navegador registradas en `estado.md`; publicación de la rama se informa al cerrar la entrega.

Alcance: estructura ejecutable Node.js/Express, Sequelize/MySQL, vistas Pug y Tailwind local; diseño base y menú plegable; alta, edición, desactivación y consulta de productos con persistencia, búsqueda por nombre o código, filtros, paginación y existencias. El saldo inicial se registrará con trazabilidad; los movimientos operativos completos llegan en la entrega 3.

Criterios verificables:

- Documentar versiones, instalación en Windows, configuración sin secretos, migraciones y comandos de arranque; añadir exclusiones de Git y `.env.example` antes de generar archivos sensibles.
- Arrancar siguiendo el README con una base de prueba y verificar separación de rutas, controladores, servicios, modelos y vistas.
- Crear y editar un producto con sus campos definidos; reiniciar servidor y verificar persistencia en MySQL. Desactivar sin borrar su registro.
- Buscar por nombre, código interno y de barras; comprobar filtros, paginación, lista vacía, disponibilidad y pocas existencias.
- Rechazar datos inválidos, códigos duplicados según política documentada y existencias negativas desde el servidor.
- Verificar teclado, foco y tamaños definidos en la guía visual; operar sin internet y sin solicitudes a recursos externos.

## Entrega 2: usuarios y permisos

Rama sugerida: `feat/usuarios-permisos`.

Criterios: crear acceso local con roles administrador y vendedor; documentar matriz de permisos; rechazar operaciones no autorizadas en el servidor; comprobar inicio y cierre de sesión, protección de credenciales y desactivación sin borrar historial. Vincular responsables autenticados a futuras operaciones conservando el responsable local histórico de las ventas básicas ya registradas. Esta entrega permanece pendiente.

## Entrega 3: movimientos de inventario

Rama sugerida: `feat/movimientos-inventario`.

Criterios: registrar entradas, salidas y ajustes con fecha, responsable y motivo; consultar historial; verificar que saldo y movimiento cambian juntos, que errores revierten ambos y que solicitudes concurrentes no producen saldo negativo.

## Entrega 4: caja básica

Rama sugerida: `feat/caja`.

Criterios: abrir y cerrar caja; registrar entradas y gastos; calcular efectivo esperado y diferencia; verificar reglas de apertura y cierre y conservar trazabilidad. Documentar la política que vinculará ventas y caja.

## Entrega 5: ventas y comprobante interno

### 5A: ventas básicas e historial

Rama: `feat/ventas`, creada desde `feat/productos-inventario-base` e incluyendo `d160b6c`.

Estado: implementada por autorización expresa del usuario. Pantalla de nueva venta con búsqueda y carrito, acumulación de productos repetidos, efectivo con cambio o transferencia manual, Consumidor final, comprobante interno, historial paginado con fecha y número e indicadores reales de ventas del día en Bogotá. Caja permanece pendiente y se conserva el responsable local sin autenticación.

Criterios verificados: precios y stock recalculados en servidor, importes exactos, valores históricos, transacción única de venta/detalles/pago/movimientos/stock, rechazo de entradas inválidas, insuficiencia de pago o existencias, inactivos y carritos vacíos; idempotencia persistente ante reintento y doble envío; dos ventas concurrentes por la última unidad; reversión completa al fallar el pago; persistencia desde otro proceso, comprobante, historial y límites de día en Bogotá. Se probó el recorrido en Chrome a 1366 y 360 píxeles y se generó un PDF de impresión. Resultados y limitaciones en `estado.md`.

### 5B: ampliaciones pendientes

Pendientes de nueva autorización: descuentos, crédito, pagos combinados, cliente asociado e integración con apertura/cierre de caja. Definir reglas de redondeo, pagos y permisos antes de implementarlos y mantener las garantías transaccionales e históricas de 5A.

## Entrega 6: historial, anulaciones y devoluciones

Rama sugerida: `feat/historial-devoluciones`.

La consulta de ventas y detalles ya está disponible en 5A. Permanecen pendientes las anulaciones y devoluciones con motivo, responsable y fecha, sin borrar historial; verificar reversión o compensación coherente de inventario, pagos y caja, y rechazo de devoluciones excesivas o repetidas antes de declararlas completas.

## Entrega 7: clientes

Rama sugerida: `feat/clientes`.

Criterios: crear, editar y desactivar clientes; asociarlos opcionalmente a ventas; consultar historial de compras sin modificar ventas históricas ni exigir cliente a ventas anónimas.

## Entrega 8: proveedores y compras

Rama sugerida: `feat/compras-proveedores`.

Criterios: administrar proveedores, registrar compras y recibir mercancía; comprobar recepción con movimientos y costos coherentes en una transacción; rechazar recepción duplicada y conservar el historial de proveedores desactivados.

## Entrega 9: presentaciones

Rama sugerida: `feat/presentaciones`.

Criterios: definir unidad base y equivalencias de paquete y caja; comprobar conversiones en compras y ventas, disponibilidad y devoluciones sin duplicar existencias. Documentar precisión de cantidades y conservar equivalencias históricas de operaciones.

## Entrega 10: servicios de papelería

Rama sugerida: `feat/servicios`.

Criterios: configurar impresiones, fotocopias y anillados; vender servicios y productos juntos conservando sus importes históricos; comprobar que vender o devolver un servicio no altera existencias físicas.

## Entrega 11: inicio y reportes

Rama sugerida: `feat/inicio-reportes`.

Los indicadores de inventario y ventas del día y los accesos básicos ya están implementados. Pendientes: estado real de caja, reportes de ventas, inventario, productos más vendidos y ganancias estimadas. Contrastar resultados con datos de prueba, costos históricos, anulaciones y devoluciones; verificar límites de día en `America/Bogota` y documentar la fórmula de ganancia estimada.

## Entrega 12: configuración y respaldos

Rama sugerida: `feat/configuracion-respaldos`.

Criterios: configurar datos del negocio; generar copia de MySQL fuera de Git; restaurarla en una base de prueba y verificar integridad. Documentar procedimiento de recuperación, ubicación, permisos y política de conservación, sin incluir datos reales ni secretos.

## Entrega 13: validación integral local

Rama sugerida: `chore/validacion-local`.

Criterios: ejecutar en Windows el recorrido de productos, compra, recepción, caja, venta, devolución, reportes y respaldo/restauración; comprobar permisos, accesibilidad y uso cotidiano sin internet. Registrar resultados y limitaciones, resolver fallos que impidan operar y actualizar instrucciones de instalación y recuperación. La facturación electrónica continúa fuera del alcance.
