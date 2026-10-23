process.env.DB_NAME = 'papeleria_promax_prueba';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const { chromium } = require('@playwright/test');
const { sequelize, Categoria, Producto, Movimiento } = require('../src/modelos');
const { guardarProducto } = require('../src/servicios/inventario');
const app = require('../src/app');
test('interfaz local, teclado, búsqueda y tamaños de pantalla', async () => {
  let navegador, servidor, categoria;
  const ids = [], errores = [], externas = [];
  const prefijo = `UI-${randomUUID().slice(0,8)}`;
  try {
    categoria = await Categoria.create({nombre:prefijo});
    for (const [sufijo,nombre,stock] of [['CUA','Cuaderno argollado','24'],['LAP','Lapicero azul','6'],['PAP','Resma de papel carta','18'],['MAR','Marcador permanente','0']]) {
      const p = await guardarProducto({codigo:`${prefijo}-${sufijo}`,barras:'',nombre,stock,categoriaId:String(categoria.id),marca:'Prueba visual',ubicacion:'Prueba',compra:'1000',venta:'12500',minimo:'8',activo:'1'});
      ids.push(p.id);
    }
    servidor = await new Promise(resolve => { const s = app.listen(0,'127.0.0.1',() => resolve(s)); });
    const origen = `http://127.0.0.1:${servidor.address().port}`;
    navegador = await chromium.launch({ channel:'chrome', headless:true });
    const contexto = await navegador.newContext({ viewport:{width:1366,height:1000}, reducedMotion:'reduce' });
    await contexto.route('**/*',route => {
      if (!route.request().url().startsWith(origen)) { externas.push(route.request().url()); return route.abort(); }
      return route.continue();
    });
    const pagina = await contexto.newPage();
    pagina.on('pageerror',e => errores.push(e.message));
    pagina.on('console',m => { if(m.type() === 'error') errores.push(m.text()); });
    await pagina.goto(origen); await pagina.locator('h1').waitFor();
    assert.match(await pagina.locator('.indicadores').innerText(),/Pendiente/);
    await fs.mkdir('test-results',{recursive:true});
    for (const ancho of [1366,768,360]) {
      await pagina.setViewportSize({width:ancho,height:1000});
      await pagina.screenshot({path:`test-results/inicio-${ancho}.png`,fullPage:true});
      const desbordados = await pagina.evaluate(() => [...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width && r.left>=0 && r.right>innerWidth+1 && !e.closest('.tabla-contenedor');}).map(e=>({tag:e.tagName,clase:e.className,ancho:e.getBoundingClientRect().width})).slice(0,12));
      assert.ok(await pagina.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Sin desbordamiento de página a ${ancho}px: ${JSON.stringify(desbordados)}`);
    }
    await pagina.setViewportSize({width:1366,height:1000});
    await pagina.getByRole('button',{name:'Plegar o desplegar menú'}).click();
    assert.equal(await pagina.locator('body').evaluate(b=>b.classList.contains('menu-plegado')),true);
    await pagina.getByRole('button',{name:'Plegar o desplegar menú'}).click();
    await pagina.setViewportSize({width:360,height:1000});
    await pagina.getByRole('button',{name:'Plegar o desplegar menú'}).click();
    assert.equal(await pagina.locator('#menu').evaluate(e=>e.inert),false);
    await pagina.keyboard.press('Escape');
    assert.equal(await pagina.locator('#menu').evaluate(e=>e.inert),true);
    await pagina.setViewportSize({width:1366,height:1000});
    await pagina.locator('#q').fill(`${prefijo}-LAP`);
    await pagina.waitForURL(`**/*q=${prefijo}-LAP*`);
    await pagina.waitForFunction(() => document.querySelector('[data-resultados]').getAttribute('aria-busy')==='false');
    assert.equal(await pagina.locator('tbody tr').count(),1);
    await pagina.locator('.pestanas').getByText('Agotados',{exact:true}).click();
    await pagina.getByText('No hay productos para mostrar').waitFor();
    await pagina.goto(origen+'/productos/nuevo');
    await pagina.locator('#codigo').fill(`${prefijo}-FORM`);
    await pagina.locator('#nombre').fill('Producto desde navegador');
    await pagina.locator('#categoriaId').selectOption(String(categoria.id));
    await pagina.locator('#compra').fill('250.10'); await pagina.locator('#venta').fill('500.20');
    await pagina.locator('#stock').fill('3');
    await pagina.getByRole('button',{name:'Crear producto',exact:true}).click();
    await pagina.waitForURL(/\/productos\/\d+/);
    const id = Number(/\/productos\/(\d+)/.exec(pagina.url())[1]); ids.push(id);
    await pagina.getByText('Los datos se guardaron correctamente.').waitFor();
    await pagina.getByRole('link',{name:'Editar producto',exact:true}).click();
    assert.equal(await pagina.locator('input[name=stock]').count(),0);
    await pagina.locator('#nombre').fill('Producto editado desde navegador');
    await pagina.getByRole('button',{name:'Guardar cambios'}).click();
    await pagina.getByRole('heading',{level:1,name:'Producto editado desde navegador'}).waitFor();
    pagina.once('dialog',d=>d.accept());
    await pagina.getByRole('button',{name:'Desactivar producto'}).click();
    await pagina.getByText('Producto desactivado. Su historial se conserva.').waitFor();
    assert.equal((await Producto.findByPk(id)).activo,false);
    await pagina.goto(origen+'/pendiente/ventas');
    assert.equal(await pagina.locator('button[type=submit]').count(),0);
    await pagina.goto(origen+'/productos/nuevo');
    await pagina.keyboard.press('Tab');
    assert.ok(await pagina.evaluate(()=>document.activeElement !== document.body),'La navegación por teclado mueve el foco');
    assert.deepEqual(externas,[],'Todos los recursos son locales');
    assert.deepEqual(errores,[],'Sin errores de JavaScript o de carga');
  } finally {
    if(navegador) await navegador.close();
    if(servidor) await new Promise(resolve=>servidor.close(resolve));
    if(ids.length) { await Movimiento.destroy({where:{productoId:ids}}); await Producto.destroy({where:{id:ids}}); }
    if(categoria) await Categoria.destroy({where:{id:categoria.id}});
    await sequelize.close();
  }
});
