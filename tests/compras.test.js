process.env.DB_NAME='papeleria_promax_prueba';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {Op}=require('sequelize');
const request=require('supertest');
const modelos=require('../src/modelos');
const {sequelize,Categoria,Producto,Proveedor,Compra,DetalleCompra,Movimiento,Venta,DetalleVenta,PagoVenta}=modelos;
const migrador=require('../scripts/migrar');
const proveedores=require('../src/servicios/proveedores');
const compras=require('../src/servicios/compras');
const ventas=require('../src/servicios/ventas');
const {guardarProducto}=require('../src/servicios/inventario');
const app=require('../src/app');
const prefijo=`COM-${randomUUID().slice(0,8)}`,productoIds=[],proveedorIds=[],operaciones=[],operacionesVenta=[];
let categoria,proveedor,csrf;
function datosProveedor(extra={}){return {nombre:`${prefijo} Proveedor ${proveedorIds.length}`,identificacion:'',contacto:'Contacto de prueba',telefono:'3001234567',correo:'prueba@example.test',direccion:'Dirección de prueba',observaciones:'Observación inicial',activo:'1',...extra};}
async function crearProveedor(extra={}){const p=await proveedores.guardar(datosProveedor(extra));proveedorIds.push(p.id);return p;}
async function crearProducto(stock='10',extra={}){const p=await guardarProducto({codigo:`${prefijo}-${productoIds.length}`,nombre:`${prefijo} Producto ${productoIds.length}`,barras:'',marca:'Prueba',ubicacion:'Prueba',compra:'2.10',venta:'10.30',stock,minimo:'1',activo:'1',categoriaId:String(categoria.id),...extra});productoIds.push(p.id);return p;}
function entrada(lineas,extra={}){const operacion=randomUUID();operaciones.push(operacion);return {operacion,proveedorId:String(proveedor.id),fechaRecepcion:ventas.diaBogota(),referencia:'PRUEBA-RECIBO',observaciones:'Mercancía ya recibida',confirmacion:'1',carrito:JSON.stringify(lineas.map(([p,cantidad,costo='3.25'])=>({productoId:p.id,cantidad,costo}))),...extra};}
function entradaVenta(p,cantidad){const operacion=randomUUID();operacionesVenta.push(operacion);return {operacion,carrito:JSON.stringify([{productoId:p.id,cantidad}]),medio:'efectivo',recibido:'10000'};}
async function conteos(){return Promise.all([Compra.count(),DetalleCompra.count(),Movimiento.count()]);}
before(async()=>{await migrador().up();categoria=await Categoria.create({nombre:prefijo});proveedor=await crearProveedor({identificacion:`${prefijo}-ID`});const r=await request(app).get('/proveedores/nuevo').expect(200);csrf=/name="_csrf" value="([^"]+)"/.exec(r.text)[1];});
after(async()=>{
  const comprasIds=(await Compra.findAll({where:{operacion:{[Op.in]:operaciones}},attributes:['id']})).map(c=>c.id);
  const ventasIds=(await Venta.findAll({where:{operacion:{[Op.in]:operacionesVenta}},attributes:['id']})).map(v=>v.id);
  if(comprasIds.length){await Movimiento.destroy({where:{compraId:comprasIds}});await DetalleCompra.destroy({where:{compraId:comprasIds}});await Compra.destroy({where:{id:comprasIds}});}
  if(ventasIds.length){await Movimiento.destroy({where:{ventaId:ventasIds}});await PagoVenta.destroy({where:{ventaId:ventasIds}});await DetalleVenta.destroy({where:{ventaId:ventasIds}});await Venta.destroy({where:{id:ventasIds}});}
  if(productoIds.length){await Movimiento.destroy({where:{productoId:productoIds}});await Producto.destroy({where:{id:productoIds}});}
  if(proveedorIds.length)await Proveedor.destroy({where:{id:proveedorIds}});
  if(categoria)await Categoria.destroy({where:{id:categoria.id}});await sequelize.close();
});
test('proveedores: registro, edición, validaciones, identificación única y paginación',async()=>{
  const datos=datosProveedor({nombre:`${prefijo} HTTP`,identificacion:`${prefijo}-HTTP`});
  await request(app).post('/proveedores').type('form').send({...datos,_csrf:csrf}).expect(303);
  const p=await Proveedor.findOne({where:{identificacion:datos.identificacion}});proveedorIds.push(p.id);
  await request(app).post(`/proveedores/${p.id}`).type('form').send({...datos,contacto:'Nuevo contacto',_csrf:csrf}).expect(303);
  assert.equal((await Proveedor.findByPk(p.id)).contacto,'Nuevo contacto');
  await request(app).post('/proveedores').type('form').send({...datos,_csrf:csrf}).expect(422).expect(/Ya existe/);
  for(const cambio of [{nombre:''},{correo:'correo inválido'},{telefono:'texto'},{direccion:'x'.repeat(241)},{observaciones:'x'.repeat(2001)},{activo:'otro'}])await request(app).post('/proveedores').type('form').send({...datosProveedor(),...cambio,_csrf:csrf}).expect(422);
  await crearProveedor();await crearProveedor();
  for(let i=0;i<9;i++)await crearProveedor({nombre:`${prefijo} Pagina ${i}`});
  const lista=await proveedores.listar({q:prefijo,pagina:'2'});assert.equal(lista.pagina,2);assert.ok(lista.proveedores.length>0);
  await request(app).get('/proveedores?q='+encodeURIComponent(datos.nombre)).expect(200).expect(/Nuevo contacto/);
  await request(app).post(`/proveedores/${p.id}/desactivar`).type('form').send({_csrf:csrf}).expect(303);
  assert.equal((await Proveedor.findByPk(p.id)).activo,false);
  await assert.rejects(proveedores.guardar({...datos}),e=>Boolean(e.errores.identificacion));
});
test('recepción múltiple exacta: stock, costo vigente, historial y persistencia',async()=>{
  const p=await crearProducto('20'),q=await crearProducto('5');
  const datos=entrada([[p,2,'0.10'],[p,1,'0.10'],[q,4,'0.20']]);datos.total='0.01';
  const r=await request(app).post('/compras').type('form').send({...datos,_csrf:csrf}).expect(303);
  const id=Number(/\/compras\/(\d+)/.exec(r.headers.location)[1]);const compra=await compras.detalle(id);
  assert.equal(compra.total,'1.10');assert.equal(compra.detalles.length,2);assert.equal(compra.detalles[0].cantidad,3);
  assert.equal((await Producto.findByPk(p.id)).stock,23);assert.equal((await Producto.findByPk(q.id)).stock,9);
  assert.equal((await Producto.findByPk(p.id)).compra,'0.10');assert.equal((await Producto.findByPk(p.id)).venta,'10.30');
  assert.equal(compra.detalles[0].costoAnterior,'2.10');assert.equal(compra.detalles[0].precioVenta,'10.30');
  assert.equal(await Movimiento.count({where:{compraId:id,tipo:'entrada'}}),2);
  await request(app).get(r.headers.location).expect(200).expect(/Recepción confirmada/).expect(new RegExp(compra.numero));
  await request(app).get(`/productos/${p.id}`).expect(200).expect(new RegExp('/compras/'+id));
  const lista=await compras.historial({fecha:datos.fechaRecepcion,proveedor:proveedor.id});assert.ok(lista.compras.some(c=>c.id===id));
  const hijo=spawnSync(process.execPath,['-e',`const {sequelize}=require('./src/modelos');require('./src/servicios/compras').detalle(${id}).then(c=>{if(!c||c.total!=='1.10'||c.detalles.length!==2)process.exitCode=1;}).catch(()=>process.exitCode=1).finally(()=>sequelize.close());`],{env:process.env,encoding:'utf8'});assert.equal(hijo.status,0);
  const antes=await conteos();await request(app).get(r.headers.location).expect(200);await request(app).post(`/compras/${id}`).type('form').send({_csrf:csrf}).expect(404);await request(app).delete(`/compras/${id}`).expect(404);assert.deepEqual(await conteos(),antes);
});
test('validaciones de recepción y recuperación del detalle tras error',async()=>{
  const p=await crearProducto(),inactivo=await crearProducto('1',{activo:'0'}),pInactivo=await crearProveedor({activo:'0'}),tope=await crearProducto('2147483647');
  const antes=await conteos();
  for(const datos of [entrada([]),entrada([[p,0]]),entrada([[p,'1.5']]),entrada([[p,1,'-1']]),entrada([[p,1,'1.001']]),entrada([[p,1,'10000000000']]),entrada([[inactivo,1]]),entrada([[tope,1]]),entrada([[p,1]],{proveedorId:pInactivo.id}),entrada([[p,1]],{fechaRecepcion:'2099-01-01'}),entrada([[p,1]],{fechaRecepcion:'2026-02-30'}),entrada([[p,1]],{confirmacion:'0'}),entrada([[p,1,'1.00'],[p,1,'2.00']])]){
    await request(app).post('/compras').type('form').send({...datos,_csrf:csrf}).expect(422);
  }
  assert.deepEqual(await conteos(),antes);
  const respuesta=await request(app).post('/compras').type('form').send({...entrada([[p,1,'-1']]),_csrf:csrf}).expect(422);assert.match(respuesta.text,new RegExp(p.codigo));
  await request(app).get('/compras?fecha=2026-02-30').expect(422);
});
test('doble envío simultáneo, reintento y rechazo de una clave alterada',async()=>{
  const p=await crearProducto('1'),datos=entrada([[p,3]]);
  const [a,b]=await Promise.all([compras.registrar(datos),compras.registrar(datos)]);assert.equal(a.id,b.id);
  assert.equal((await Producto.findByPk(p.id)).stock,4);assert.equal(await Movimiento.count({where:{compraId:a.id}}),1);
  assert.equal((await compras.registrar(datos)).id,a.id);
  await assert.rejects(compras.registrar({...datos,observaciones:'Otros datos'}),e=>Boolean(e.errores.operacion));
});
test('compras de distintos proveedores y una venta simultáneas no pierden stock',async()=>{
  const p=await crearProducto('20'),otro=await crearProveedor();
  await Promise.all([compras.registrar(entrada([[p,3,'3.00']])),compras.registrar(entrada([[p,4,'4.00']],{proveedorId:otro.id})),ventas.registrar(entradaVenta(p,2))]);
  const final=await Producto.findByPk(p.id);assert.equal(final.stock,25);assert.equal(final.venta,'10.30');
  const ultimos=await DetalleCompra.findAll({where:{productoId:p.id},order:[['id','DESC']]});assert.equal(final.compra,ultimos[0].costo);
});
test('fallo tardío revierte compra, detalles, entradas, stock y costos',async()=>{
  const p=await crearProducto(),q=await crearProducto(),datos=entrada([[p,2,'7.00'],[q,1,'8.00']]),antes=await conteos();let entradas=0;
  Movimiento.addHook('beforeCreate','fallo_compra',m=>{if(m.tipo==='entrada'&&++entradas===2)throw Error('Fallo controlado de entrada');});
  try{await assert.rejects(compras.registrar(datos),/Fallo controlado/);}finally{Movimiento.removeHook('beforeCreate','fallo_compra');}
  assert.deepEqual(await conteos(),antes);assert.equal((await Producto.findByPk(p.id)).stock,10);assert.equal((await Producto.findByPk(p.id)).compra,'2.10');assert.equal((await Producto.findByPk(q.id)).stock,10);
  const c=await compras.registrar(datos);assert.ok(c.id);
});
test('históricos de proveedor, productos y ventas permanecen tras nuevas recepciones',async()=>{
  const p=await crearProducto(),pv=await crearProveedor({identificacion:`${prefijo}-HIST`});
  const v=await ventas.registrar(entradaVenta(p,1));
  const c=await compras.registrar(entrada([[p,2,'5.10']],{proveedorId:pv.id}));
  const previa=await compras.detalle(c.id);
  await p.update({nombre:'Nombre posterior',codigo:`${prefijo}-NUEVO`});
  await proveedores.guardar(datosProveedor({nombre:'Razón social posterior',identificacion:`${prefijo}-POST`,activo:'0'}),pv.id);
  const antigua=await compras.detalle(c.id);assert.equal(antigua.proveedorNombre,previa.proveedorNombre);assert.equal(antigua.proveedorDatos.contacto,previa.proveedorDatos.contacto);assert.equal(antigua.detalles[0].nombre,previa.detalles[0].nombre);
  assert.equal((await ventas.detalle(v.id)).detalles[0].costo,'2.10');assert.equal((await ventas.detalle(v.id)).detalles[0].precio,'10.30');
  assert.equal((await compras.registrar(entrada([[p,1,'6.25']]))).total,'6.25');
  assert.equal((await compras.detalle(c.id)).detalles[0].costo,'5.10');
  const nuevaVenta=await ventas.registrar(entradaVenta(p,1));assert.equal((await ventas.detalle(nuevaVenta.id)).detalles[0].costo,'6.25');
  const datosReintento={operacion:c.operacion,proveedorId:pv.id,fechaRecepcion:c.fechaRecepcion,referencia:c.referencia,observaciones:c.observaciones,confirmacion:'1',carrito:JSON.stringify([{productoId:p.id,cantidad:2,costo:'5.10'}])};assert.equal((await compras.registrar(datosReintento)).id,c.id);
  await request(app).get(`/compras?proveedor=${pv.id}`).expect(200).expect(new RegExp(c.numero));
  for(let i=0;i<11;i++)await compras.registrar(entrada([[p,1,'0.00']]));
  assert.equal((await compras.historial({proveedor:proveedor.id,pagina:'2'})).pagina,2);
});
