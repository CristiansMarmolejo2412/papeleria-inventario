require('./configuracion');
const { sequelize } = require('./modelos');
const app = require('./app');
(async () => {
  try {
    await sequelize.authenticate();
    const servidor = app.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => console.log(`Papelería disponible en http://${process.env.HOST || '127.0.0.1'}:${process.env.PORT || 3000}`));
    servidor.on('error', () => { console.error('No se pudo abrir el puerto local.'); process.exitCode = 1; sequelize.close(); });
    for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => servidor.close(async () => { await sequelize.close(); process.exit(0); }));
  } catch { console.error('No se pudo conectar con MySQL. Configura .env y ejecuta npm.cmd run db:crear y npm.cmd run db:migrar.'); process.exitCode = 1; await sequelize.close(); }
})();
