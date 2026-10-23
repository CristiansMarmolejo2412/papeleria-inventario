process.env.DB_NAME='papeleria_promax_prueba';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const fs=require('node:fs/promises');
const {chromium}=require('@playwright/test');
const {sequelize,Categoria,Producto,Proveedor,Compra,DetalleCompra,Movimiento}=require('../src/modelos');
const {guardarProducto}=require('../src/servicios/inventario');
const migrador=require('../scripts/migrar');
const app=require('../src/app');
test('proveedor y recepción manual en escritorio y móvil con historial enlazado',async()=>{
  let navegador,servidor,categoria,proveedor;const ids=[],errores=[],externas=[];
  const prefijo=`UIC-${randomUUID().slice(0,8)}`;
  try{
    await migrador().up();categoria=await Categoria.create({nombre:prefijo});
    for(const sufijo of ['A','B']){const p=await guardarProducto({codigo:`${prefijo}-${sufijo}`,nombre:`${prefijo} Cuaderno ${sufijo}`,barras:'',marca:'Prueba',ubicacion:'Prueba',compra:'2.10',venta:'10.30',stock:'20',minimo:'2',activo:'1',categoriaId:String(categoria.id)});ids.push(p.id);}
    servidor=await new Promise(r=>{const s=app.listen(0,'127.0.0.1',()=>r(s));});const origen=`http://127.0.0.1:${servidor.address().port}`;
    navegador=await chromium.launch({channel:'chrome',headless:true});const contexto=await navegador.newContext({viewport:{width:1366,height:1000},reducedMotion:'reduce'});
    await contexto.route('**/*',r=>{if(!r.request().url().startsWith(origen)){externas.push(r.request().url());return r.abort();}return r.continue();});
    const pagina=await contexto.newPage();pagina.on('pageerror',e=>errores.push(e.message));
    await fs.mkdir('test-results',{recursive:true});
    async function capturas(nombre){for(const ancho of [1366,360]){await pagina.setViewportSize({width:ancho,height:1000});await pagina.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});await pagina.screenshot({path:`test-results/${nombre}-${ancho}.png`,fullPage:true});assert.ok(await pagina.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${nombre}: sin desbordamiento a ${ancho}px`);}}
    await pagina.goto(origen+'/proveedores/nuevo');
    await pagina.locator('#nombre').fill(`${prefijo} Distribuidora`);await pagina.locator('#identificacion').fill(prefijo);await pagina.locator('#contacto').fill('Persona de prueba');await pagina.locator('#telefono').fill('texto');await pagina.locator('#correo').fill('proveedor@example.test');await pagina.locator('#direccion').fill('Dirección de prueba');await pagina.locator('#observaciones').fill('Observaciones del proveedor');
    await pagina.getByRole('button',{name:'Crear proveedor',exact:true}).click();await pagina.getByText('Usa números y los símbolos +, -, paréntesis o punto.',{exact:true}).waitFor();
    assert.equal(await pagina.locator('#nombre').inputValue(),`${prefijo} Distribuidora`);
    await pagina.locator('#telefono').fill('3001234567');await capturas('proveedor-formulario');await pagina.getByRole('button',{name:'Crear proveedor',exact:true}).click();await pagina.waitForURL(/\/proveedores\?/);
    proveedor=await Proveedor.findOne({where:{identificacion:prefijo}});assert.ok(proveedor);
    await pagina.locator('#q-proveedor').fill(prefijo);await pagina.getByRole('button',{name:'Buscar',exact:true}).click();
    await pagina.getByRole('link',{name:'Editar',exact:true}).click();await pagina.locator('#contacto').fill('Contacto actualizado');await pagina.getByRole('button',{name:'Guardar cambios',exact:true}).click();
    await pagina.goto(origen+'/compras/nueva');await pagina.locator('#proveedorId').selectOption(String(proveedor.id));await pagina.locator('#buscar-compra').fill(prefijo);await pagina.getByText('2 productos encontrados.',{exact:true}).waitFor();
    const agregarA=pagina.getByRole('button',{name:`Agregar ${prefijo} Cuaderno A`,exact:true});await agregarA.click();await agregarA.click();
    assert.equal(await pagina.locator('.carrito-linea').count(),1);assert.equal(await pagina.getByRole('spinbutton',{name:`Cantidad de ${prefijo} Cuaderno A`}).inputValue(),'2');
    await pagina.getByRole('spinbutton',{name:`Costo unitario (COP) de ${prefijo} Cuaderno A`}).fill('3.15');await pagina.getByRole('button',{name:`Agregar ${prefijo} Cuaderno B`,exact:true}).click();
    await pagina.getByRole('spinbutton',{name:`Cantidad de ${prefijo} Cuaderno B`}).fill('3');await pagina.getByRole('spinbutton',{name:`Costo unitario (COP) de ${prefijo} Cuaderno B`}).fill('4.20');
    await pagina.locator('#referencia').fill('RECIBO-MANUAL');await pagina.locator('#observaciones').fill('Dos referencias de cuadernos recibidas');
    assert.equal(await pagina.locator('[data-total]').innerText(),'$ 18,90');await pagina.reload();assert.equal(await pagina.locator('.carrito-linea').count(),2);
    await pagina.locator('#buscar-compra').fill(prefijo);await pagina.getByText('2 productos encontrados.',{exact:true}).waitFor();
    await pagina.getByRole('checkbox',{name:'Confirmo que esta mercancía ya fue recibida.'}).check();await capturas('recepcion-nueva');
    await pagina.getByRole('button',{name:'Confirmar recepción',exact:true}).click();await pagina.waitForURL(/\/compras\/\d+/);
    await pagina.getByText('Recepción confirmada. Las existencias aumentaron y el costo de compra quedó actualizado.',{exact:true}).waitFor();
    const url=pagina.url(),compraId=Number(/\/compras\/(\d+)/.exec(url)[1]);await capturas('recepcion-detalle');
    assert.equal((await Producto.findByPk(ids[0])).stock,22);assert.equal((await Producto.findByPk(ids[0])).compra,'3.15');assert.equal((await Producto.findByPk(ids[0])).venta,'10.30');
    assert.equal((await Producto.findByPk(ids[1])).stock,23);await pagina.reload();assert.equal((await Producto.findByPk(ids[0])).stock,22);
    assert.equal(await pagina.locator('button[type=submit]').count(),0,'La recepción confirmada no tiene edición');
    await pagina.goto(origen+`/productos/${ids[0]}`);await pagina.getByRole('link',{name:new RegExp('Recepción C-')}).click();assert.ok(pagina.url().includes(`/compras/${compraId}`));
    await pagina.goto(origen+`/compras?proveedor=${proveedor.id}`);assert.equal(await pagina.locator('tbody tr').count(),1);await capturas('compras-historial');
    await pagina.goto(origen+`/proveedores?q=${prefijo}`);pagina.once('dialog',d=>d.accept());await pagina.getByRole('button',{name:'Desactivar',exact:true}).click();await pagina.getByText('Proveedor desactivado. Sus compras históricas se conservan.').waitFor();await capturas('proveedores-lista');
    await pagina.goto(origen+`/compras/${compraId}`);await pagina.getByText(`${prefijo} Distribuidora`,{exact:true}).waitFor();
    await pagina.goto(origen+'/compras/nueva');assert.equal(await pagina.locator(`option[value="${proveedor.id}"]`).count(),0,'El proveedor inactivo no se selecciona para nuevas recepciones');assert.equal(await pagina.locator('.carrito-linea').count(),0,'Se limpia el borrador confirmado');
    assert.deepEqual(errores,[]);assert.deepEqual(externas,[]);
  }finally{
    if(navegador)await navegador.close();if(servidor)await new Promise(r=>servidor.close(r));
    if(proveedor){const compras=await Compra.findAll({where:{proveedorId:proveedor.id},attributes:['id']});const comprasIds=compras.map(c=>c.id);if(comprasIds.length){await Movimiento.destroy({where:{compraId:comprasIds}});await DetalleCompra.destroy({where:{compraId:comprasIds}});await Compra.destroy({where:{id:comprasIds}});}await Proveedor.destroy({where:{id:proveedor.id}});}
    if(ids.length){await Movimiento.destroy({where:{productoId:ids}});await Producto.destroy({where:{id:ids}});}if(categoria)await Categoria.destroy({where:{id:categoria.id}});await sequelize.close();
  }
});
