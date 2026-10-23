require('./configuracion');
const { sequelize } = require('./modelos');
const app = require('./app');
const { comprobarBase, diagnosticoSeguro } = require('./servicios/arranque');
(async () => {
  try {
    await comprobarBase();
    const servidor = app.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => console.log(`Papelería disponible en http://${process.env.HOST || '127.0.0.1'}:${process.env.PORT || 3000}`));
    servidor.on('error', () => { console.error('No se pudo abrir el puerto local.'); process.exitCode = 1; sequelize.close(); });
    for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => servidor.close(async () => { await sequelize.close(); process.exit(0); }));
  } catch (error) {
    console.error(`No se pudo iniciar Papelería [${diagnosticoSeguro(error)}].`);
    console.error(error.code === 'MIGRACIONES_PENDIENTES' ? error.message : 'Comprueba la conexión y el esquema de la base configurada en .env. Ejecuta npm.cmd run db:migrar; no se abrió el servidor.');
    process.exitCode = 1;
    await sequelize.close();
  }
})();
