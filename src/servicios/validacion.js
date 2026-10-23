class ErrorValidacion extends Error {
  constructor(errores) { super('Revisa los campos indicados.'); this.errores = errores; }
}
function validarProducto(entrada, edicion = false) {
  const datos = {}, errores = {};
  for (const [campo, maximo, obligatorio] of [['codigo',40,true],['barras',80,false],['nombre',120,true],['marca',80,false],['ubicacion',80,false]]) {
    datos[campo] = typeof entrada[campo] === 'string' ? entrada[campo].trim() : '';
    if ((obligatorio && !datos[campo]) || datos[campo].length > maximo) errores[campo] = `Introduce ${obligatorio ? 'un valor de ' : 'como máximo '}${maximo} caracteres o menos${obligatorio ? ', sin dejarlo vacío' : ''}.`;
  }
  datos.codigo = datos.codigo.toUpperCase(); datos.barras ||= null;
  for (const campo of ['compra', 'venta']) {
    const valor = String(entrada[campo] ?? '').trim();
    if (!/^\d{1,10}(\.\d{1,2})?$/.test(valor)) errores[campo] = 'Usa un importe entre 0 y 9999999999.99, con máximo dos decimales y punto decimal.';
    else { const [entero, decimal = ''] = valor.split('.'); datos[campo] = `${BigInt(entero)}.${decimal.padEnd(2, '0')}`; }
  }
  for (const campo of edicion ? ['minimo','categoriaId'] : ['stock','minimo','categoriaId']) {
    const valor = String(entrada[campo] ?? '');
    if (!/^\d{1,10}$/.test(valor) || Number(valor) > 2147483647 || (campo === 'categoriaId' && Number(valor) < 1)) errores[campo] = 'Introduce un entero válido, sin valores negativos.';
    else datos[campo] = Number(valor);
  }
  if (edicion && Object.hasOwn(entrada, 'stock')) errores.stock = 'Las existencias no se pueden editar directamente.';
  if (!['0','1'].includes(String(entrada.activo))) errores.activo = 'Selecciona un estado válido.';
  datos.activo = String(entrada.activo) === '1';
  if (Object.keys(errores).length) throw new ErrorValidacion(errores);
  return datos;
}
module.exports = { validarProducto, ErrorValidacion };
