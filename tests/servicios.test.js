process.env.DB_NAME='papeleria_promax_prueba';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {spawnSync}=require('node:child_process');
const request=require('supertest');
const {sequelize,Servicio,DetalleServicio,Categoria,Producto,Movimiento,Venta,DetalleVenta,PagoVenta}=require('../src/modelos');
const catalogo=require('../src/servicios/servicios');
const ventas=require('../src/servicios/ventas');
const {guardarProducto}=require('../src/servicios/inventario');
const app=require('../src/app');
const prefijo=`SER-${randomUUID().slice(0,8)}`,ids=[],operaciones=[];
let categoria,producto,csrf;
function datos(extra={}){return {codigo:`${prefijo}-${ids.length}`,nombre:`${prefijo} Fotocopia ${ids.length}`,categoria:'Copias',unidad:'cara',precio:'0.10',descripcion:'Solo prueba',activo:'1',...extra};}
async function crear(extra={}){const s=await catalogo.guardar(datos(extra));ids.push(s.id);return s;}
function entrada(lineas,extra={}){const operacion=randomUUID();operaciones.push(operacion);return {operacion,medio:'efectivo',recibido:'1000',carrito:JSON.stringify(lineas),...extra};}
const linea=(s,cantidad=1)=>({tipo:'servicio',servicioId:s.id,cantidad});
before(async()=>{
  await require('../scripts/migrar')().up();categoria=await Categoria.create({nombre:prefijo});
  producto=await guardarProducto({codigo:prefijo,nombre:prefijo,barras:'',marca:'Prueba',ubicacion:'Prueba',compra:'1.25',venta:'2.30',stock:'20',minimo:'1',activo:'1',categoriaId:String(categoria.id)});
  csrf=/name="_csrf" value="([^"]+)"/.exec((await request(app).get('/servicios/nuevo').expect(200)).text)[1];
});
after(async()=>{
  const ventaIds=(await Venta.findAll({where:{operacion:operaciones},attributes:['id']})).map(v=>v.id);
  if(ventaIds.length){await Movimiento.destroy({where:{ventaId:ventaIds}});await DetalleServicio.destroy({where:{ventaId:ventaIds}});await DetalleVenta.destroy({where:{ventaId:ventaIds}});await PagoVenta.destroy({where:{ventaId:ventaIds}});await Venta.destroy({where:{id:ventaIds}});}
  if(ids.length)await Servicio.destroy({where:{id:ids}});
  if(producto){await Movimiento.destroy({where:{productoId:producto.id}});await Producto.destroy({where:{id:producto.id}});}
  if(categoria)await Categoria.destroy({where:{id:categoria.id}});await sequelize.close();
});
test('catálogo HTTP: alta, edición, búsqueda, estados, duplicados y validaciones',async()=>{
  const d=datos();await request(app).post('/servicios').type('form').send({...d,_csrf:csrf}).expect(303);
  const s=await Servicio.findOne({where:{codigo:d.codigo}});ids.push(s.id);
  await request(app).post(`/servicios/${s.id}`).type('form').send({...d,nombre:prefijo+' Editado',_csrf:csrf}).expect(303);
  await request(app).get('/servicios?q='+prefijo).expect(200).expect(/Editado/);
  for(const cambio of [{precio:'0'},{precio:'-1'},{precio:'0.001'},{precio:'10000000000'},{nombre:''},{codigo:''},{categoria:''},{unidad:''},{activo:'otro'}])await request(app).post('/servicios').type('form').send({...datos(),...cambio,_csrf:csrf}).expect(422);
  await request(app).post('/servicios').type('form').send({...d,_csrf:csrf}).expect(422).expect(/otro servicio/);
  await request(app).post(`/servicios/${s.id}/estado`).type('form').send({activo:'0',_csrf:csrf}).expect(303);assert.equal((await Servicio.findByPk(s.id)).activo,false);
  await request(app).get('/ventas/servicios?q='+prefijo).expect(200).expect(r=>assert.equal(r.body.total,0));
  await request(app).post(`/servicios/${s.id}/estado`).type('form').send({activo:'1',_csrf:csrf}).expect(303);
  for(let i=0;i<11;i++)await crear();assert.equal((await catalogo.listar({q:prefijo,pagina:2})).servicios.length,2);
  const r=await request(app).get('/ventas/servicios?q='+prefijo).expect(200);assert.equal(r.body.total,12);assert.equal('stock' in r.body.productos[0],false);
});
test('venta de servicios exacta sin inventario: persistencia, resumen, historial y precios históricos',async()=>{
  const s=await crear(),movimientos=await Movimiento.count(),stock=(await producto.reload()).stock,antes=await ventas.resumenDia();
  const d=entrada([{...linea(s,2),precio:'999'},linea(s)]);const v=await ventas.registrar(d),detalle=await ventas.detalle(v.id);
  assert.equal(v.total,'0.30');assert.equal(detalle.detalles.length,0);assert.equal(detalle.servicios.length,1);assert.equal(detalle.servicios[0].cantidad,3);assert.equal(detalle.servicios[0].unidad,'cara');
  assert.equal(await Movimiento.count(),movimientos);assert.equal((await producto.reload()).stock,stock);
  const despues=await ventas.resumenDia();assert.equal(despues.cantidad,antes.cantidad+1);
  const dinero=require('../public/js/dinero');assert.equal(dinero.centavos(despues.total)-dinero.centavos(antes.total),30n);
  await catalogo.guardar({...s.get({plain:true}),nombre:'Nombre nuevo',codigo:`${prefijo}-CAMBIO`,unidad:'trabajo',precio:'900',activo:'0'},s.id);
  const historico=await ventas.detalle(v.id);assert.equal(historico.servicios[0].nombre,s.nombre);assert.equal(historico.servicios[0].precio,'0.10');assert.equal(historico.servicios[0].unidad,'cara');
  await request(app).get(`/ventas/${v.id}?confirmada=1`).expect(200).expect(/sin movimientos de inventario/).expect(/cara/);
  await request(app).get('/ventas?numero='+v.numero).expect(200).expect(/Servicios/);
  const hijo=spawnSync(process.execPath,['-e',`const m=require('./src/modelos');require('./src/servicios/ventas').detalle(${v.id}).then(v=>{if(v.total!=='0.30'||v.servicios[0].unidad!=='cara')process.exitCode=1;}).finally(()=>m.sequelize.close());`],{env:process.env});assert.equal(hijo.status,0);
  assert.equal((await ventas.registrar(d)).id,v.id,'El reintento sigue válido después de desactivar y cambiar el precio');
});
test('venta mixta: acumula por tipo, descuenta solo productos y conserva sus costos',async()=>{
  const s=await crear(),stock=(await producto.reload()).stock;
  assert.equal(ventas.lineasCarrito([{productoId:1,cantidad:1},{tipo:'servicio',servicioId:1,cantidad:2}]).length,2,'Los IDs coincidentes son distintos por tipo');
  const v=await ventas.registrar(entrada([{productoId:producto.id,cantidad:2},linea(s,3)]));const d=await ventas.detalle(v.id);
  assert.equal(v.total,'4.90');assert.equal(d.detalles[0].costo,'1.25');assert.equal(d.servicios[0].subtotal,'0.30');assert.equal((await producto.reload()).stock,stock-2);
  assert.equal(await Movimiento.count({where:{ventaId:v.id}}),1);
  await request(app).get('/ventas?numero='+v.numero).expect(200).expect(/Productos y servicios/);
});
test('rechazos, conservación del carrito y transacción completamente revertida',async()=>{
  const s=await crear(),inactivo=await crear({activo:'0'}),antes=await Venta.count(),stock=(await producto.reload()).stock;
  for(const l of [linea(s,0),linea(s,-1),linea(s,1.5),linea(inactivo),{tipo:'otro',servicioId:s.id,cantidad:1},{...linea(s),productoId:producto.id}])await assert.rejects(ventas.registrar(entrada([l])));
  const d=entrada([linea(s,3)],{recibido:'0.01'});const r=await request(app).post('/ventas').type('form').send({...d,_csrf:csrf}).expect(422).expect(/insuficiente/);assert.ok(r.text.includes('servicioId'));assert.ok(r.text.includes(s.nombre));
  const fallo=entrada([{productoId:producto.id,cantidad:1},linea(s)]);
  PagoVenta.addHook('beforeCreate','fallo-servicios',()=>{throw Error('Fallo de prueba');});
  try{await assert.rejects(ventas.registrar(fallo));}finally{PagoVenta.removeHook('beforeCreate','fallo-servicios');}
  assert.equal(await Venta.count(),antes);assert.equal((await producto.reload()).stock,stock);assert.equal(await Venta.count({where:{operacion:fallo.operacion}}),0);
  assert.equal(await DetalleServicio.count({where:{servicioId:s.id}}),0);
  assert.equal(await DetalleVenta.count({where:{productoId:producto.id}}),1,'Solo permanece la venta mixta anterior');
});
test('doble envío concurrente, reintento diferente y compatibilidad de claves de productos',async()=>{
  const s=await crear(),d=entrada([linea(s,2)]),[a,b]=await Promise.all([ventas.registrar(d),ventas.registrar(d)]);
  assert.equal(a.id,b.id);assert.equal(await DetalleServicio.count({where:{ventaId:a.id}}),1);
  await assert.rejects(ventas.registrar({...d,carrito:JSON.stringify([linea(s,3)])}),e=>Boolean(e.errores.operacion));
  const p=entrada([{productoId:producto.id,cantidad:1}]),v=await ventas.registrar(p);
  assert.equal((await ventas.registrar({...p,carrito:JSON.stringify([{tipo:'producto',productoId:producto.id,cantidad:1}])})).id,v.id);
});
test('venta mixta concurrente sobre última unidad y precio vigente confirmado en servidor',async()=>{
  const s=await crear();await producto.update({stock:1});
  await catalogo.guardar({...s.get({plain:true}),precio:'0.20',activo:'1'},s.id);
  const carrito=[{productoId:producto.id,cantidad:1},linea(s,2)];
  const resultados=await Promise.allSettled([ventas.registrar(entrada(carrito)),ventas.registrar(entrada(carrito))]);
  assert.equal(resultados.filter(r=>r.status==='fulfilled').length,1);
  assert.equal((await producto.reload()).stock,0);
  const v=resultados.find(r=>r.status==='fulfilled').value;assert.equal(v.total,'2.70');
  assert.equal(await Movimiento.count({where:{ventaId:v.id}}),1);assert.equal(await DetalleServicio.count({where:{ventaId:v.id}}),1);
});
