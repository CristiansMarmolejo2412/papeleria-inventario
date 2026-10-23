const express = require('express');
const helmet = require('helmet');
const path = require('node:path');
const { randomBytes, timingSafeEqual } = require('node:crypto');
const app = express();
const token = randomBytes(32).toString('hex');
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: { directives: { 'upgrade-insecure-requests': null } }, strictTransportSecurity: false }));
app.set('view engine','pug'); app.set('views',path.join(__dirname,'vistas'));
app.use(express.static(path.join(__dirname,'../public')));
app.use(express.urlencoded({ extended: false, limit: '32kb' }));
app.use((req,res,next) => {
  res.locals.ruta = req.path; res.locals.csrf = token;
  res.locals.dinero = require('../public/js/dinero').formato;
  res.locals.fecha = (valor) => new Intl.DateTimeFormat('es-CO',{ dateStyle:'medium', timeStyle:'short', timeZone:'America/Bogota' }).format(new Date(valor));
  res.locals.disponibilidad = (p) => !p.activo ? 'Inactivo' : p.stock === 0 ? 'Agotado' : p.stock <= p.minimo ? 'Pocas existencias' : 'Disponible';
  res.locals.enlace = (cambios) => `?${new URLSearchParams({ ...req.query, ...cambios })}`;
  res.locals.aviso = { guardado:'Los datos se guardaron correctamente.', desactivado:'Producto desactivado. Su historial se conserva.' }[req.query.mensaje];
  if (req.method === 'POST') {
    const recibido = Buffer.from(String(req.body._csrf || ''));
    if (recibido.length !== Buffer.byteLength(token) || !timingSafeEqual(recibido, Buffer.from(token))) return res.status(403).render('mensaje',{ titulo:'Formulario vencido', mensaje:'Recarga la página y vuelve a intentarlo.' });
  }
  next();
});
app.use(require('./rutas'));
app.use((req,res) => res.status(404).render('mensaje',{ titulo:'Página no encontrada', mensaje:'Revisa la dirección o vuelve al inicio.' }));
app.use((error,req,res,next) => {
  if (res.headersSent) return next(error);
  console.error(`Error de solicitud: ${error.name || 'Error'}`);
  res.status(error.status || 500).render('mensaje',{ titulo:'No pudimos completar la operación', mensaje: error.status === 404 ? 'Producto no encontrado.' : 'Comprueba la conexión local con MySQL y que las migraciones estén aplicadas. Los datos enviados no se guardaron.' });
});
module.exports = app;
