// Base exclusiva de prueba: nunca usa ni vacía la base de trabajo.
process.env.DB_NAME = 'papeleria_promax_prueba';
const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { spawnSync, spawn } = require('node:child_process');
const net = require('node:net');
const request = require('supertest');
const { sequelize, Categoria, Producto, Movimiento } = require('../src/modelos');
const migrador = require('../scripts/migrar');
const app = require('../src/app');
const { guardarProducto, listar } = require('../src/servicios/inventario');
const prefijo = `PRUEBA-${randomUUID().slice(0,8)}`;
let categoria, token;
const ids = [];
async function comprobarReinicio(id) {
  const puerto = await new Promise(resolve => {
    const s = net.createServer(); s.listen(0,'127.0.0.1',() => { const p = s.address().port; s.close(()=>resolve(p)); });
  });
  for (let intento=0;intento<2;intento++) {
    const hijo = spawn(process.execPath,['src/servidor.js'], { env:{...process.env,HOST:'127.0.0.1',PORT:String(puerto)},stdio:['ignore','pipe','pipe'] });
    try {
      await new Promise((resolve,reject) => {
        const limite = setTimeout(()=>reject(new Error('El servidor no arrancó a tiempo.')),15000);
        hijo.stdout.on('data',salida=>{if(salida.toString().includes('Papelería disponible')){clearTimeout(limite);resolve();}});
        hijo.once('error',e=>{clearTimeout(limite);reject(e);});
        hijo.once('exit',codigo=>{clearTimeout(limite);if(codigo)reject(new Error('El proceso del servidor no pudo arrancar.'));});
      });
      await request(`http://127.0.0.1:${puerto}`).get(`/productos/${id}`).expect(200).expect(/Editado/);
    } finally {
      if(hijo.exitCode === null) await new Promise(resolve=>{hijo.once('exit',resolve);hijo.kill();});
    }
  }
}
const datos = (sufijo,stock='5') => ({ codigo:`${prefijo}-${sufijo}`, barras:'', nombre:`${prefijo} Lápiz ${sufijo}`, marca:'Prueba', ubicacion:'Prueba', compra:'100.10', venta:'250.25', stock, minimo:'2', categoriaId:String(categoria.id), activo:'1' });
before(async () => {
  await sequelize.authenticate(); await migrador().up();
  categoria = await Categoria.create({ nombre: prefijo });
  const respuesta = await request(app).get('/productos/nuevo').expect(200);
  token = /name="_csrf" value="([^"]+)"/.exec(respuesta.text)[1];
});
after(async () => {
  // Solo elimina los registros sintéticos creados en esta ejecución, por sus identificadores.
  if (ids.length) { await Movimiento.destroy({ where: { productoId: ids } }); await Producto.destroy({ where: { id: ids } }); }
  if (categoria) await Categoria.destroy({ where: { id: categoria.id } });
  await sequelize.close();
});
test('recorrido real de productos, filtros, persistencia y transacciones en MySQL', async () => {
  const primera = await request(app).post('/productos').type('form').send({...datos('UNO'),_csrf:token}).expect(303);
  const id = Number(/\/productos\/(\d+)/.exec(primera.headers.location)[1]); ids.push(id);
  const producto = await Producto.findByPk(id);
  assert.equal(producto.compra,'100.10'); assert.equal(producto.stock,5);
  assert.equal(await Movimiento.count({where:{productoId:id}}),1);
  await request(app).get(primera.headers.location).expect(200).expect(/Registro de existencias iniciales/);
  await request(app).get(`/productos/${id}/editar`).expect(200);
  const { stock, ...edicion } = datos('UNO');
  await request(app).post(`/productos/${id}`).type('form').send({...edicion,nombre:`${prefijo} Editado`,_csrf:token}).expect(303);
  assert.equal((await Producto.findByPk(id)).stock,5);
  await request(app).post(`/productos/${id}`).type('form').send({...edicion,stock:'999',_csrf:token}).expect(422);
  await request(app).post('/productos').type('form').send({...datos('UNO'),_csrf:token}).expect(422).expect(/ya pertenece/);
  await request(app).post('/productos').type('form').send({...datos('NEG'),stock:'-1',_csrf:token}).expect(422);
  await request(app).post('/productos').type('form').send({...datos('CSRF')}).expect(403);
  const dos = await guardarProducto({...datos('DOS','1'),barras:`${prefijo}-BARRAS`}); ids.push(dos.id);
  const tres = await guardarProducto(datos('TRES','0')); ids.push(tres.id);
  await assert.rejects(guardarProducto({...datos('BARRA'),barras:`${prefijo}-BARRAS`}),e => Boolean(e.errores.barras));
  assert.equal((await listar({q:`${prefijo}-BARRAS`})).total,1);
  assert.equal((await listar({q:prefijo,categoria:categoria.id,disponibilidad:'pocas'})).total,1);
  assert.equal((await listar({q:prefijo,disponibilidad:'agotados'})).total,1);
  assert.equal((await listar({q:prefijo,disponibilidad:'disponibles'})).total,2);
  await request(app).get(`/productos?q=${prefijo}&categoria=${categoria.id}`).expect(200).expect(/Editado/);
  const hijo = spawnSync(process.execPath,['-e', `const {sequelize,Producto}=require('./src/modelos'); Producto.findByPk(${id}).then(p=>{if(!p||p.stock!==5)process.exitCode=1;}).catch(()=>process.exitCode=1).finally(()=>sequelize.close());`],{cwd:process.cwd(),env:process.env,encoding:'utf8'});
  assert.equal(hijo.status,0,'Una nueva conexión en otro proceso recupera el registro persistido');
  await comprobarReinicio(id);
  const antes = await Producto.count();
  const gancho = 'fallo_controlado_prueba';
  Movimiento.addHook('beforeCreate',gancho,() => { throw new Error('Fallo simulado solo en prueba'); });
  try { await assert.rejects(guardarProducto(datos('REVERTIR')),/Fallo simulado/); }
  finally { Movimiento.removeHook('beforeCreate',gancho); }
  assert.equal(await Producto.count(),antes,'El fallo del movimiento revierte también el producto');
  assert.equal(await Producto.count({where:{codigo:`${prefijo}-REVERTIR`}}),0);
  await request(app).post(`/productos/${id}/desactivar`).type('form').send({_csrf:token}).expect(303);
  assert.equal((await Producto.findByPk(id)).activo,false);
  assert.equal(await Movimiento.count({where:{productoId:id}}),1);
  await request(app).post('/productos').type('form').send({...datos('UNO'),_csrf:token}).expect(422);
  assert.equal((await listar({q:`${prefijo}-UNO`,estado:'inactivos'})).total,1);
  for (let i=0;i<9;i++) { const p = await guardarProducto(datos(`PAG-${i}`)); ids.push(p.id); }
  const pagina = await listar({q:prefijo,estado:'todos',pagina:'2'});
  assert.equal(pagina.total,12); assert.equal(pagina.productos.length,2); assert.equal(pagina.paginas,2);
  await request(app).get('/').expect(200).expect(/Pendiente/);
  await request(app).get('/categorias').expect(200);
  await request(app).post('/categorias').type('form').send({nombre:categoria.nombre,activo:'1',_csrf:token}).expect(422).expect(/Ya existe/);
  await request(app).post(`/categorias/${categoria.id}`).type('form').send({nombre:categoria.nombre,activo:'0',_csrf:token}).expect(303);
  await assert.rejects(guardarProducto(datos('CATEGORIA-INACTIVA')),e => Boolean(e.errores.categoriaId));
  await request(app).get('/pendiente/caja').expect(200).expect(/Pendiente de implementación/);
});
