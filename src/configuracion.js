require('dotenv').config({ quiet: true });
const nombre = process.env.DB_NAME || 'papeleria_promax';
if (!/^papeleria_promax(?:_prueba)?$/.test(nombre)) throw new Error('La base debe ser papeleria_promax o papeleria_promax_prueba.');
module.exports = {
  nombre,
  usuario: process.env.DB_USER || 'papeleria_app',
  clave: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || '127.0.0.1',
  puerto: Number(process.env.DB_PORT || 3306),
  responsable: process.env.RESPONSABLE_LOCAL || 'Operador local',
};
