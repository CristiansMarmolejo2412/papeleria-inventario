const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pug = require('pug');
const { validarProducto, ErrorValidacion } = require('../src/servicios/validacion');
const base = { codigo:'lap-01', barras:'', nombre:'Lápiz', marca:'', ubicacion:'', compra:'125.10', venta:'200', stock:'3', minimo:'2', categoriaId:'1', activo:'1' };
test('normaliza códigos e importes sin perder precisión decimal', () => {
  const datos = validarProducto(base);
  assert.equal(datos.codigo,'LAP-01'); assert.equal(datos.barras,null);
  assert.equal(datos.compra,'125.10'); assert.equal(datos.venta,'200.00');
  assert.equal(validarProducto({...base,venta:'9999999999.99'}).venta,'9999999999.99');
});
test('rechaza negativos, fracciones de stock, campos vacíos y valores monetarios ambiguos', () => {
  for (const [campo, valor] of [['stock','-1'],['stock','1.5'],['minimo','-2'],['categoriaId','0'],['nombre',' '],['codigo',''],['venta','1.001'],['compra','1e4'],['venta','10000000000'],['venta','1,20'],['activo','otro']]) {
    assert.throws(() => validarProducto({...base,[campo]:valor}), e => e instanceof ErrorValidacion && Boolean(e.errores[campo]), `${campo}: ${valor}`);
  }
});
test('la edición no permite inyectar existencias', () => {
  assert.throws(() => validarProducto(base,true), e => Boolean(e.errores.stock));
  const {stock,...edicion} = base;
  assert.equal(Object.hasOwn(validarProducto(edicion,true),'stock'),false);
});
test('todas las plantillas Pug compilan', () => {
  for (const archivo of fs.readdirSync(path.join(__dirname,'../src/vistas')).filter(a => a.endsWith('.pug'))) {
    assert.doesNotThrow(() => pug.compileFile(path.join(__dirname,'../src/vistas',archivo)), archivo);
  }
});
