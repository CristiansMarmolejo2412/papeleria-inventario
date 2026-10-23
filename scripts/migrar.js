const path = require('node:path');
const { Umzug, SequelizeStorage } = require('umzug');
const { sequelize } = require('../src/modelos');
function migrador() {
  return new Umzug({ migrations: { glob: path.join(__dirname, '../migraciones/*.js').replaceAll('\\', '/') },
    context: sequelize.getQueryInterface(), storage: new SequelizeStorage({ sequelize }), logger: console });
}
if (require.main === module) migrador().up().then(() => console.log('Migraciones aplicadas.')).catch(() => {
  console.error('No se pudieron aplicar las migraciones. Comprueba conexión, permisos y versión de MySQL.'); process.exitCode = 1;
}).finally(() => sequelize.close());
module.exports = migrador;
