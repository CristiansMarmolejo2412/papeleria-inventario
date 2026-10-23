# Papelería: inventario y ventas

Sistema previsto para administrar productos, inventario, ventas y caja de una papelería. Se utilizará inicialmente en un computador Windows, desde el navegador, con servidor y base de datos locales.

## Estado actual

Preparación documental. No hay aplicación ejecutable, dependencias instaladas, base de datos configurada ni módulos implementados. Los criterios de las entregas funcionales están pendientes de ejecución.

## Tecnologías previstas

Node.js, Express, Sequelize, MySQL, Pug y Tailwind CSS. El código se organizará en rutas, controladores, servicios, modelos y vistas. Las versiones y los comandos de instalación se definirán y verificarán durante la primera entrega funcional.

La operación cotidiana debe funcionar sin internet: scripts, estilos, fuentes e iconos serán locales. La instalación inicial podrá requerir conexión. Se manejarán pesos colombianos (COP) y la zona horaria `America/Bogota`.

## Documentación

- [Instrucciones permanentes](AGENTS.md).
- [Requisitos y reglas de negocio](docs/requisitos.md).
- [Diseño e interacción](docs/diseno.md).
- [Plan por entregas y criterios de finalización](docs/plan-desarrollo.md).
- [Estado, verificaciones y siguiente tarea](docs/estado.md).

La primera entrega funcional abarcará estructura ejecutable, diseño base y productos con persistencia, búsqueda y consulta de existencias. Los comprobantes serán internos; la facturación electrónica está fuera de la primera versión.

## Trabajo por etapas

`main` se conserva estable. Cada etapa se desarrolla y verifica en su propia rama, se documenta y se publica en `origin`, sin fusionar automáticamente a `main`. No se deben versionar credenciales, archivos `.env`, dependencias, datos reales ni respaldos. Git no sustituye las copias de seguridad de MySQL.
