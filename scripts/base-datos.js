const mysql = require('mysql2/promise');
const config = require('../src/configuracion');
(async () => {
  let conexion;
  try {
    conexion = await mysql.createConnection({ host: config.host, port: config.puerto, user: config.usuario, password: config.clave });
    await conexion.query(`CREATE DATABASE IF NOT EXISTS \`${config.nombre}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Base exclusiva preparada: ${config.nombre}`);
  } catch { console.error('No se pudo crear la base exclusiva. Revisa las credenciales y el permiso CREATE en MySQL.'); process.exitCode = 1; }
  finally { if (conexion) await conexion.end(); }
})();
