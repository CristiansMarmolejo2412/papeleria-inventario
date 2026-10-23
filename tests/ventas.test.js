process.env.DB_NAME='papeleria_promax_prueba';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {spawnSync}=require('node:child_process');
const request=require('supertest');
const {Op}=require('sequelize');
const {sequelize,Categoria,Producto,Movimiento,Venta,DetalleVenta,PagoVenta}=require('../src/modelos');
const migrador=require('../scripts/migrar');
const {guardarProducto}=require('../src/servicios/inventario');
const ventas=require('../src/servicios/ventas');
const dinero=require('../public/js/dinero');
const app=require('../src/app');
const prefijo=`VEN-${randomUUID().slice(0,8)}`,ids=[],operaciones=[];
let categoria,csrf;
async function producto(stock='10',extras={}) {
  const p=await guardarProducto({codigo:`${prefijo}-${ids.length}`,barras:`${prefijo}-B-${ids.length}`,nombre:`${prefijo} Producto ${ids.length}`,marca:'Prueba',ubicacion:'Prueba',compra:'0.10',venta:'0.30',stock,minimo:'1',activo:'1',categoriaId:String(categoria.id),...extras});
  ids.push(p.id);return p;
}
function entrada(lineas,extras={}) {
  const operacion=randomUUID();operaciones.push(operacion);
  return {operacion,carrito:JSON.stringify(lineas.map(([p,cantidad])=>({productoId:p.id,cantidad}))),medio:'efectivo',recibido:'100',...extras};
}
async function conteos() {return Promise.all([Venta.count(),DetalleVenta.count(),PagoVenta.count(),Movimiento.count()]);}
before(async()=>{
  await migrador().up();categoria=await Categoria.create({nombre:prefijo});
  const r=await request(app).get('/ventas/nueva').expect(200);csrf=/name="_csrf" value="([^"]+)"/.exec(r.text)[1];
});
after(async()=>{
  const registros=await Venta.findAll({where:{operacion:{[Op.in]:operaciones}},attributes:['id']});const ventasIds=registros.map(v=>v.id);
  if(ventasIds.length){await Movimiento.destroy({where:{ventaId:ventasIds}});await PagoVenta.destroy({where:{ventaId:ventasIds}});await DetalleVenta.destroy({where:{ventaId:ventasIds}});await Venta.destroy({where:{id:ventasIds}});}
  if(ids.length){await Movimiento.destroy({where:{productoId:ids}});await Producto.destroy({where:{id:ids}});}
  if(categoria)await Categoria.destroy({where:{id:categoria.id}});
  await sequelize.close();
});
test('dinero exacto, agrupación y límites del día de Bogotá',()=>{
  assert.equal(dinero.decimal(dinero.centavos('0.10')+dinero.centavos('0.20')),'0.30');
  assert.throws(()=>dinero.decimal(dinero.centavos('9999999999.99')*2147483647n),/rango/);
  assert.deepEqual(ventas.lineasCarrito([{productoId:1,cantidad:1},{productoId:1,cantidad:2}]),[{productoId:1,cantidad:3}]);
  assert.throws(()=>ventas.limitesDia('2026-02-30'));
  assert.equal(dinero.formato('10000000000000000.01'),'$ 10.000.000.000.000.000,01');
});
test('venta HTTP, precios del servidor, acumulación, comprobante e historial persistentes',async()=>{
  const p=await producto(),otro=await producto('4',{venta:'1.25'});
  const datos=entrada([[p,1],[p,2],[otro,1]],{recibido:'5.00'});
  datos.carrito=JSON.stringify(JSON.parse(datos.carrito).map(l=>({...l,precio:'0.01',nombre:'Nombre manipulado',costo:'0.00'})));
  datos.total='0.01';datos.precio='0.01';
  const antes=await ventas.resumenDia();
  const r=await request(app).post('/ventas').type('form').send({...datos,_csrf:csrf}).expect(303);
  const id=Number(/\/ventas\/(\d+)/.exec(r.headers.location)[1]);
  const venta=await ventas.detalle(id);
  assert.equal(venta.total,'2.15');assert.equal(venta.detalles.length,2);assert.equal(venta.detalles[0].cantidad,3);
  assert.equal(venta.detalles[0].costo,'0.10');assert.equal(venta.pago.cambio,'2.85');
  assert.equal((await Producto.findByPk(p.id)).stock,7);
  const movimientos=await Movimiento.findAll({where:{ventaId:id}});assert.equal(movimientos.length,2);assert.equal(movimientos[0].tipo,'salida');
  const despues=await ventas.resumenDia();assert.equal(despues.cantidad,antes.cantidad+1);
  assert.equal(dinero.centavos(despues.total)-dinero.centavos(antes.total),215n);
  await request(app).get(r.headers.location).expect(200).expect(/Consumidor final/).expect(/Venta confirmada/).expect(new RegExp(venta.numero));
  const conteo=await conteos();
  await request(app).get(r.headers.location).expect(200);await request(app).get(r.headers.location).expect(200);assert.deepEqual(await conteos(),conteo);
  await request(app).get(`/ventas?numero=${venta.numero}`).expect(200).expect(new RegExp(venta.numero));
  await request(app).get(`/ventas?fecha=${ventas.diaBogota()}`).expect(200).expect(new RegExp(venta.numero));
  await request(app).get('/ventas?fecha=2026-02-30').expect(422);
  await p.update({nombre:'Nombre posterior',codigo:`${prefijo}-CAMBIO`,venta:'99.00',compra:'50.00'});
  const historica=await ventas.detalle(id);assert.equal(historica.detalles[0].precio,'0.30');assert.notEqual(historica.detalles[0].nombre,'Nombre posterior');
  const hijo=spawnSync(process.execPath,['-e',`const {sequelize}=require('./src/modelos');require('./src/servicios/ventas').detalle(${id}).then(v=>{if(!v||v.total!=='2.15'||v.detalles.length!==2)process.exitCode=1;}).catch(()=>process.exitCode=1).finally(()=>sequelize.close());`],{env:process.env,encoding:'utf8'});
  assert.equal(hijo.status,0,'La venta persiste en otra instancia de la aplicación');
});
test('rechaza insuficiencia, inactivos, vacías y cantidades inválidas sin efectos',async()=>{
  const p=await producto('1'),inactivo=await producto('3',{activo:'0'});
  const casos=[entrada([[p,1]],{recibido:'0.01'}),entrada([[p,2]]),entrada([[inactivo,1]]),entrada([]),entrada([[p,0]]),entrada([[p,-1]]),entrada([[p,'1.5']]),entrada([[p,1]],{medio:'credito'}),entrada([[p,1]],{recibido:'-1'})];
  const antes=await conteos();
  for(const datos of casos)await request(app).post('/ventas').type('form').send({...datos,_csrf:csrf}).expect(422);
  assert.deepEqual(await conteos(),antes);assert.equal((await Producto.findByPk(p.id)).stock,1);
  const respuesta=await request(app).post('/ventas').type('form').send({...entrada([[p,1]],{recibido:'0.01'}),_csrf:csrf}).expect(422);
  assert.match(respuesta.text,/insuficiente/);assert.match(respuesta.text,new RegExp(p.codigo));
});
test('reintento y doble envío simultáneo generan solo una venta',async()=>{
  const p=await producto('1');const datos=entrada([[p,1]]);
  const resultados=await Promise.all([ventas.registrar(datos),ventas.registrar(datos)]);
  assert.equal(resultados[0].id,resultados[1].id);assert.equal((await Producto.findByPk(p.id)).stock,0);
  const repetida=await ventas.registrar(datos);assert.equal(repetida.id,resultados[0].id);
  await assert.rejects(ventas.registrar({...datos,recibido:'101'}),e=>Boolean(e.errores.operacion));
  assert.equal(await Movimiento.count({where:{ventaId:repetida.id}}),1);
});
test('dos ventas distintas compiten por la última unidad; solo una se confirma',async()=>{
  const p=await producto('1');const resultados=await Promise.allSettled([ventas.registrar(entrada([[p,1]])),ventas.registrar(entrada([[p,1]]))]);
  assert.equal(resultados.filter(r=>r.status==='fulfilled').length,1);
  const fallo=resultados.find(r=>r.status==='rejected');assert.match(fallo.reason.errores.carrito,/insuficientes/);
  assert.equal((await Producto.findByPk(p.id)).stock,0);
});
test('un error al guardar el pago revierte venta, detalles, movimientos y existencias',async()=>{
  const p=await producto('5'),q=await producto('5');const antes=await conteos(),datos=entrada([[p,2],[q,1]]);
  PagoVenta.addHook('beforeCreate','fallo_pago',()=>{throw new Error('Fallo controlado de pago');});
  try {
    await assert.rejects(ventas.registrar(datos),/Fallo controlado/);
    const respuesta=await request(app).post('/ventas').type('form').send({...datos,_csrf:csrf}).expect(503);
    assert.match(respuesta.text,/Tu carrito se conserva/);assert.match(respuesta.text,new RegExp(p.codigo));
  }finally{PagoVenta.removeHook('beforeCreate','fallo_pago');}
  assert.deepEqual(await conteos(),antes);assert.equal((await Producto.findByPk(p.id)).stock,5);assert.equal((await Producto.findByPk(q.id)).stock,5);
  const venta=await ventas.registrar(datos);assert.ok(venta.id,'La misma clave se puede reintentar tras una reversión');
});
test('transferencia manual, paginación y límites temporales',async()=>{
  const p=await producto('20');
  for(let i=0;i<11;i++)await ventas.registrar(entrada([[p,1]],{medio:'transferencia',referencia:i===0?'Referencia de prueba':''}));
  const historial=await ventas.historial({pagina:'2'});assert.equal(historial.pagina,2);assert.ok(historial.ventas.length>0);
  const v=await Venta.findOne({where:{operacion:operaciones.at(-1)}});const detalle=await ventas.detalle(v.id);
  assert.equal(detalle.pago.medio,'transferencia');assert.equal(detalle.pago.recibido,'0.30');assert.equal(detalle.pago.cambio,'0.00');
  assert.equal(ventas.diaBogota(new Date('2026-10-23T04:59:59Z')),'2026-10-22');
  assert.equal(ventas.diaBogota(new Date('2026-10-23T05:00:00Z')),'2026-10-23');
  const {limitesDia}=ventas;
  assert.equal(limitesDia('2026-10-23')[Op.gte].toISOString(),'2026-10-23T05:00:00.000Z');
  assert.equal(limitesDia('2026-10-23')[Op.lt].toISOString(),'2026-10-24T05:00:00.000Z');
  const claves=operaciones.slice(-4),fechas=['2020-01-01T04:59:59Z','2020-01-01T05:00:00Z','2020-01-02T04:59:59Z','2020-01-02T05:00:00Z'];
  for(let i=0;i<claves.length;i++)await Venta.update({fecha:new Date(fechas[i])},{where:{operacion:claves[i]}});
  const dia=await ventas.historial({fecha:'2020-01-01'}),incluidas=dia.ventas.map(v=>v.operacion);
  assert.ok(incluidas.includes(claves[1]));assert.ok(incluidas.includes(claves[2]));assert.ok(!incluidas.includes(claves[0]));assert.ok(!incluidas.includes(claves[3]));
});
