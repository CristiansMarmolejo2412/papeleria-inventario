# Plan de desarrollo

Cada entrega requiere autorización de su alcance, rama propia, cambios coherentes, verificaciones ejecutadas, documentación de resultados y publicación en `origin` si hay acceso. No se fusionará a `main` automáticamente. Preparación terminada y entrega 1 implementada; entregas 2 a 13 pendientes. Ver resultados y límites en `estado.md`.

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

Criterios: crear acceso local con roles administrador y vendedor; documentar matriz de permisos; rechazar operaciones no autorizadas en el servidor; comprobar inicio y cierre de sesión, protección de credenciales y desactivación sin borrar historial. Vincular responsables a operaciones antes de habilitar movimientos y ventas.

## Entrega 3: movimientos de inventario

Rama sugerida: `feat/movimientos-inventario`.

Criterios: registrar entradas, salidas y ajustes con fecha, responsable y motivo; consultar historial; verificar que saldo y movimiento cambian juntos, que errores revierten ambos y que solicitudes concurrentes no producen saldo negativo.

## Entrega 4: caja básica

Rama sugerida: `feat/caja`.

Criterios: abrir y cerrar caja; registrar entradas y gastos; calcular efectivo esperado y diferencia; verificar reglas de apertura y cierre y conservar trazabilidad. Documentar la política que vinculará ventas y caja.

## Entrega 5: ventas y comprobante interno

Rama sugerida: `feat/ventas`.

Criterios: vender varios productos, aplicar descuentos válidos, cliente opcional, pagos combinados y cambio; imprimir comprobante interno. Verificar representación monetaria exacta y redondeo, precios y costos históricos, y transacción única de venta, pagos, movimientos y existencias. Probar reversión ante error, insuficiencia de existencias, concurrencia, doble clic y reintento con la misma clave sin duplicar venta. Integrar el efecto de pagos en caja según la política documentada.

## Entrega 6: historial, anulaciones y devoluciones

Rama sugerida: `feat/historial-devoluciones`.

Criterios: consultar ventas y detalles; anular y devolver con motivo, responsable y fecha, sin borrar historial; verificar reversión o compensación coherente de inventario, pagos y caja, y rechazo de devoluciones excesivas o repetidas.

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

Criterios: mostrar ventas del día, productos disponibles, pocas existencias, caja y accesos rápidos; generar reportes de ventas, inventario, productos más vendidos y ganancias estimadas. Contrastar resultados con datos de prueba, costos históricos, anulaciones y devoluciones; verificar límites de día en `America/Bogota` y documentar la fórmula de ganancia estimada.

## Entrega 12: configuración y respaldos

Rama sugerida: `feat/configuracion-respaldos`.

Criterios: configurar datos del negocio; generar copia de MySQL fuera de Git; restaurarla en una base de prueba y verificar integridad. Documentar procedimiento de recuperación, ubicación, permisos y política de conservación, sin incluir datos reales ni secretos.

## Entrega 13: validación integral local

Rama sugerida: `chore/validacion-local`.

Criterios: ejecutar en Windows el recorrido de productos, compra, recepción, caja, venta, devolución, reportes y respaldo/restauración; comprobar permisos, accesibilidad y uso cotidiano sin internet. Registrar resultados y limitaciones, resolver fallos que impidan operar y actualizar instrucciones de instalación y recuperación. La facturación electrónica continúa fuera del alcance.
