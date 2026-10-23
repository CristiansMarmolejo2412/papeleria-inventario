process.env.DB_NAME='papeleria_promax_prueba';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const fs=require('node:fs/promises');
const {chromium}=require('@playwright/test');
const {sequelize,Servicio,DetalleServicio,Categoria,Producto,Movimiento,Venta,DetalleVenta,PagoVenta}=require('../src/modelos');
const {guardarProducto}=require('../src/servicios/inventario');
const app=require('../src/app');
test('servicios y venta mixta en escritorio y móvil, carrito recuperable e impresión',async()=>{
  let navegador,servidor,categoria,producto;const ids=[],operaciones=[],errores=[],externas=[],prefijo=`UIS-${randomUUID().slice(0,8)}`;
  try{
    await require('../scripts/migrar')().up();categoria=await Categoria.create({nombre:prefijo});
    producto=await guardarProducto({codigo:prefijo,nombre:prefijo+' Cuaderno',barras:'',marca:'Prueba',ubicacion:'Prueba',compra:'1',venta:'2.30',stock:'10',minimo:'1',activo:'1',categoriaId:String(categoria.id)});
    servidor=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});const origen=`http://127.0.0.1:${servidor.address().port}`;
    navegador=await chromium.launch({channel:'chrome',headless:true});const contexto=await navegador.newContext({viewport:{width:1366,height:1000},reducedMotion:'reduce'});
    await contexto.route('**/*',ruta=>{if(!ruta.request().url().startsWith(origen)){externas.push(ruta.request().url());return ruta.abort();}return ruta.continue();});
    const p=await contexto.newPage();p.on('pageerror',e=>errores.push(e.message));
    await p.goto(origen+'/servicios/nuevo');
    for(const [campo,valor] of Object.entries({codigo:prefijo,nombre:prefijo+' Copia',categoria:'Copias',unidad:'cara',precio:'0.10',descripcion:'Prueba del catálogo'}))await p.locator('#'+campo).fill(valor);
    await p.getByRole('button',{name:'Crear servicio',exact:true}).click();await p.waitForURL(/\/servicios\?/);
    const s=await Servicio.findOne({where:{codigo:prefijo}});ids.push(s.id);
    await p.goto(origen+`/servicios/${s.id}/editar`);await p.locator('#descripcion').fill('Descripción editada');await p.getByRole('button',{name:'Guardar cambios',exact:true}).click();await p.waitForURL(/\/servicios\?/);assert.equal((await s.reload()).descripcion,'Descripción editada');
    await p.locator('#q-servicio').fill(prefijo);await p.getByRole('button',{name:'Buscar',exact:true}).click();await p.waitForURL(/q=/);assert.equal(await p.locator('tbody tr').count(),1);
    await p.getByRole('button',{name:'Desactivar',exact:true}).click();await p.waitForURL(/estado=inactivos/);await p.locator('#q-servicio').fill(prefijo);await p.getByRole('button',{name:'Buscar',exact:true}).click();await p.waitForURL(/q=/);
    await p.getByRole('button',{name:'Activar',exact:true}).click();await p.waitForURL(/estado=activos/);
    await fs.mkdir('test-results',{recursive:true});
    async function capturas(nombre){for(const ancho of [1366,360]){await p.setViewportSize({width:ancho,height:1000});await p.evaluate(()=>{document.activeElement.blur();window.scrollTo(0,0);});await p.screenshot({path:`test-results/${nombre}-${ancho}.png`,fullPage:true});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${nombre} sin desbordamiento a ${ancho}`);}}
    await capturas('servicios');
    await p.goto(origen+'/ventas/nueva');operaciones.push(await p.locator('[name=operacion]').inputValue());
    await p.getByText('Servicios rápidos',{exact:true}).click();await p.getByRole('button',{name:'Servicio rápido '+s.nombre,exact:true}).click();
    await p.getByRole('button',{name:'Servicios',exact:true}).click();await p.locator('#buscar-venta').fill(prefijo);await p.getByText('1 servicio encontrado.',{exact:true}).waitFor();
    await p.getByRole('button',{name:'Agregar '+s.nombre,exact:true}).click();assert.equal(await p.locator('.carrito-linea').count(),1);assert.equal(await p.getByRole('spinbutton',{name:'Cantidad de '+s.nombre}).inputValue(),'2');
    assert.ok((await p.locator('[data-carrito]').innerText()).includes('por cara'));assert.ok((await p.locator('[data-catalogo]').innerText()).includes('Servicio · por cara'));
    await p.getByRole('button',{name:'Productos',exact:true}).click();await p.getByText('1 producto encontrado.',{exact:true}).waitFor();await p.getByRole('button',{name:'Agregar '+producto.nombre,exact:true}).click();
    await p.reload();assert.equal(await p.locator('.carrito-linea').count(),2);assert.ok((await p.locator('[data-total]').innerText()).includes('2,50'));
    await p.locator('#recibido').fill('1');await p.getByRole('button',{name:'Confirmar venta',exact:true}).click();await p.getByText('El importe recibido es insuficiente para pagar la venta.',{exact:true}).first().waitFor();assert.equal(await p.locator('.carrito-linea').count(),2);
    await p.locator('#recibido').fill('3');await capturas('venta-mixta');await p.getByRole('button',{name:'Confirmar venta',exact:true}).click();await p.waitForURL(/\/ventas\/\d+/);
    assert.equal((await producto.reload()).stock,9);assert.equal(await p.locator('tbody tr').count(),2);assert.ok((await p.locator('tbody').innerText()).includes('Servicio'));assert.ok((await p.locator('tbody').innerText()).includes('cara'));
    await capturas('comprobante-mixto');await p.emulateMedia({media:'print'});assert.equal(await p.locator('.lateral').isVisible(),false);await p.pdf({path:'test-results/comprobante-mixto.pdf',format:'A4'});await p.emulateMedia({media:'screen'});
    await p.reload();assert.equal((await producto.reload()).stock,9);
    const numero=await p.locator('.numero-comprobante').innerText();await p.goto(origen+'/ventas?numero='+numero);assert.ok((await p.locator('tbody').innerText()).includes('Productos y servicios'));
    await p.goto(origen+'/ventas/nueva');operaciones.push(await p.locator('[name=operacion]').inputValue());assert.equal(await p.locator('.carrito-linea').count(),0);
    await p.getByRole('button',{name:'Servicios',exact:true}).click();await p.locator('#buscar-venta').fill(prefijo);await p.getByText('1 servicio encontrado.',{exact:true}).waitFor();await p.getByRole('button',{name:'Agregar '+s.nombre,exact:true}).click();await p.locator('#medio').selectOption('transferencia');await p.getByRole('button',{name:'Confirmar venta',exact:true}).click();await p.waitForURL(/\/ventas\/\d+/);await p.getByText('Venta de servicios confirmada. El pago se registró sin movimientos de inventario.').waitFor();assert.equal((await producto.reload()).stock,9);
    assert.deepEqual(errores,[]);assert.deepEqual(externas,[]);
  }finally{
    if(navegador)await navegador.close();if(servidor)await new Promise(resolve=>servidor.close(resolve));
    const ventas=(await Venta.findAll({where:{operacion:operaciones},attributes:['id']})).map(v=>v.id);
    if(ventas.length){await Movimiento.destroy({where:{ventaId:ventas}});await DetalleServicio.destroy({where:{ventaId:ventas}});await DetalleVenta.destroy({where:{ventaId:ventas}});await PagoVenta.destroy({where:{ventaId:ventas}});await Venta.destroy({where:{id:ventas}});}
    if(ids.length)await Servicio.destroy({where:{id:ids}});if(producto){await Movimiento.destroy({where:{productoId:producto.id}});await Producto.destroy({where:{id:producto.id}});}if(categoria)await Categoria.destroy({where:{id:categoria.id}});await sequelize.close();
  }
});
