process.env.DB_NAME='papeleria_promax_prueba';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const fs=require('node:fs/promises');
const {chromium}=require('@playwright/test');
const {sequelize,Categoria,Producto,Movimiento,Venta,DetalleVenta,PagoVenta}=require('../src/modelos');
const {guardarProducto}=require('../src/servicios/inventario');
const migrador=require('../scripts/migrar');
const app=require('../src/app');
test('venta en escritorio y móvil, errores recuperables, comprobante e historial',async()=>{
  let navegador,servidor,categoria;const ids=[],errores=[],externas=[];
  const prefijo=`UIV-${randomUUID().slice(0,8)}`;
  try {
    await migrador().up();categoria=await Categoria.create({nombre:prefijo});
    for(const [sufijo,precio,activo] of [['A','1000.10','1'],['B','500.20','1'],['INACTIVO','900','0']]) {
      const p=await guardarProducto({codigo:`${prefijo}-${sufijo}`,barras:`${prefijo}-BARRA-${sufijo}`,nombre:`${prefijo} Cuaderno ${sufijo}`,marca:'Prueba',ubicacion:'Prueba',compra:'100.01',venta:precio,stock:'10',minimo:'2',categoriaId:String(categoria.id),activo});ids.push(p.id);
    }
    servidor=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});const origen=`http://127.0.0.1:${servidor.address().port}`;
    navegador=await chromium.launch({channel:'chrome',headless:true});
    const contexto=await navegador.newContext({viewport:{width:1366,height:1000},reducedMotion:'reduce'});
    await contexto.route('**/*',ruta=>{if(!ruta.request().url().startsWith(origen)){externas.push(ruta.request().url());return ruta.abort();}return ruta.continue();});
    const pagina=await contexto.newPage();pagina.on('pageerror',e=>errores.push(e.message));
    await pagina.goto(origen+'/ventas/nueva');
    await pagina.locator('#buscar-venta').fill(prefijo);
    await pagina.getByText('2 productos encontrados.',{exact:true}).waitFor();
    assert.equal(await pagina.locator('[data-catalogo] article').count(),2);
    const agregar=pagina.getByRole('button',{name:`Agregar ${prefijo} Cuaderno A`,exact:true});await agregar.click();await agregar.click();
    assert.equal(await pagina.locator('.carrito-linea').count(),1);
    assert.equal(await pagina.getByRole('spinbutton',{name:`Cantidad de ${prefijo} Cuaderno A`}).inputValue(),'2');
    await pagina.getByRole('button',{name:`Agregar ${prefijo} Cuaderno B`,exact:true}).click();
    await pagina.getByRole('spinbutton',{name:`Cantidad de ${prefijo} Cuaderno A`}).fill('3');
    assert.equal(await pagina.locator('[data-total]').innerText(),'$ 3.500,50');
    await pagina.getByRole('button',{name:`Quitar ${prefijo} Cuaderno B`,exact:true}).click();
    assert.equal(await pagina.locator('.carrito-linea').count(),1);
    await pagina.getByRole('button',{name:`Agregar ${prefijo} Cuaderno B`,exact:true}).click();
    await pagina.reload();assert.equal(await pagina.locator('.carrito-linea').count(),2,'El carrito sobrevive a una recarga');
    await pagina.locator('#recibido').fill('1');
    await pagina.getByRole('button',{name:'Confirmar venta',exact:true}).click();
    await pagina.getByText('El importe recibido es insuficiente para pagar la venta.',{exact:true}).first().waitFor();
    assert.equal(await pagina.locator('.carrito-linea').count(),2,'El error conserva el carrito');
    await pagina.locator('#recibido').fill('4000');
    await fs.mkdir('test-results',{recursive:true});
    for(const ancho of [1366,360]) {
      await pagina.setViewportSize({width:ancho,height:1000});await pagina.screenshot({path:`test-results/nueva-venta-${ancho}.png`,fullPage:true});
      assert.ok(await pagina.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Venta sin desbordamiento a ${ancho}`);
    }
    await pagina.getByRole('button',{name:'Confirmar venta',exact:true}).click();
    await pagina.waitForURL(/\/ventas\/\d+/);
    await pagina.getByText('Venta confirmada. Las existencias y el pago se registraron correctamente.').waitFor();
    const numero=await pagina.locator('.numero-comprobante').innerText();
    assert.equal(await pagina.locator('.resumen-pago').innerText().then(t=>t.includes('499,50')),true);
    assert.equal((await Producto.findByPk(ids[0])).stock,7);
    for(const ancho of [1366,360]){await pagina.setViewportSize({width:ancho,height:1000});await pagina.screenshot({path:`test-results/comprobante-${ancho}.png`,fullPage:true});}
    await pagina.reload();assert.equal((await Producto.findByPk(ids[0])).stock,7);
    await pagina.emulateMedia({media:'print'});assert.equal(await pagina.locator('.lateral').isVisible(),false);
    await pagina.pdf({path:'test-results/comprobante.pdf',format:'A4'});await pagina.emulateMedia({media:'screen'});
    await pagina.goto(origen+'/ventas');await pagina.locator('#numero').fill(numero);await pagina.getByRole('button',{name:'Filtrar ventas'}).click();
    assert.equal(await pagina.locator('tbody tr').count(),1);
    await pagina.setViewportSize({width:1366,height:1000});await pagina.screenshot({path:'test-results/historial-ventas-1366.png',fullPage:true});
    await pagina.setViewportSize({width:360,height:1000});await pagina.screenshot({path:'test-results/historial-ventas-360.png',fullPage:true});
    assert.ok(await pagina.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await pagina.goto(origen+'/ventas/nueva');assert.equal(await pagina.locator('.carrito-linea').count(),0,'Confirmar limpia el borrador');
    await pagina.locator('#buscar-venta').fill(`${prefijo}-BARRA-B`);await pagina.getByText('1 producto encontrado.',{exact:true}).waitFor();
    await pagina.getByRole('button',{name:`Agregar ${prefijo} Cuaderno B`,exact:true}).click();
    await pagina.locator('#medio').selectOption('transferencia');await pagina.locator('#referencia').fill('PRUEBA-MANUAL');
    await pagina.getByRole('button',{name:'Confirmar venta',exact:true}).click();await pagina.waitForURL(/\/ventas\/\d+/);
    await pagina.getByText('Transferencia registrada manualmente, sin verificación bancaria.',{exact:true}).waitFor();
    await pagina.goto(origen);assert.match(await pagina.locator('.indicadores').innerText(),/ventas registradas/);
    await pagina.goto(origen+'/pendiente/caja');await pagina.getByText(/Pendiente de implementación/).waitFor();
    assert.deepEqual(errores,[]);assert.deepEqual(externas,[]);
  } finally {
    if(navegador)await navegador.close();if(servidor)await new Promise(r=>servidor.close(r));
    const detalles=ids.length?await DetalleVenta.findAll({where:{productoId:ids}}):[];const ventasIds=[...new Set(detalles.map(d=>d.ventaId))];
    if(ventasIds.length){await Movimiento.destroy({where:{ventaId:ventasIds}});await PagoVenta.destroy({where:{ventaId:ventasIds}});await DetalleVenta.destroy({where:{ventaId:ventasIds}});await Venta.destroy({where:{id:ventasIds}});}
    if(ids.length){await Movimiento.destroy({where:{productoId:ids}});await Producto.destroy({where:{id:ids}});}
    if(categoria)await Categoria.destroy({where:{id:categoria.id}});await sequelize.close();
  }
});
