const { sequelize } = require('../modelos');
const migrador = require('../../scripts/migrar');

async function comprobarBase(conexion = sequelize, migraciones = migrador()) {
  await conexion.authenticate();
  const pendientes = await migraciones.pending();
  if (pendientes.length) {
    const error = new Error('Hay migraciones pendientes. Detén el servidor y ejecuta npm.cmd run db:migrar antes de iniciar de nuevo.');
    error.code = 'MIGRACIONES_PENDIENTES';
    throw error;
  }
  // LIMIT 0 valida tablas y columnas de todos los modelos sin leer registros de uso.
  for (const modelo of Object.values(conexion.models)) {
    await modelo.findAll({ limit: 0, raw: true, logging: false });
  }
}

function diagnosticoSeguro(error) {
  const codigo = error.original?.code || error.parent?.code || error.code;
  return typeof codigo === 'string' && /^[A-Z][A-Z0-9_]{1,79}$/.test(codigo) ? codigo : 'ERROR_NO_CLASIFICADO';
}

module.exports = { comprobarBase, diagnosticoSeguro };
