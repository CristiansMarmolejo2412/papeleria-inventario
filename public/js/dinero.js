(function (raiz) {
  'use strict';
  const MAXIMO = 999999999999999999n;
  function centavos(valor) {
    const texto = String(valor ?? '').trim();
    if (!/^\d{1,16}(\.\d{1,2})?$/.test(texto)) throw new Error('Introduce un importe válido, no negativo y con máximo dos decimales.');
    const [entero, decimal = ''] = texto.split('.');
    const resultado = BigInt(entero) * 100n + BigInt(decimal.padEnd(2,'0'));
    if (resultado > MAXIMO) throw new Error('El importe supera el máximo permitido.');
    return resultado;
  }
  function decimal(valor) {
    if (valor < 0n || valor > MAXIMO) throw new Error('El importe está fuera del rango permitido.');
    return `${valor / 100n}.${String(valor % 100n).padStart(2,'0')}`;
  }
  function formato(valor) {
    // Los acumulados de varias ventas pueden superar el límite de una operación.
    const texto=String(valor ?? '').trim();
    if(!/^\d+(\.\d{1,2})?$/.test(texto))throw new Error('Importe no válido para mostrar.');
    const [entero,fraccion='']=texto.split('.');
    const numero=BigInt(entero)*100n+BigInt(fraccion.padEnd(2,'0'));
    return `$ ${new Intl.NumberFormat('es-CO').format(numero / 100n)}${numero % 100n ? ',' + String(numero % 100n).padStart(2,'0') : ''}`;
  }
  const funciones = { centavos, decimal, formato, MAXIMO };
  if (typeof module === 'object' && module.exports) module.exports = funciones;
  else raiz.Dinero = funciones;
})(typeof globalThis === 'object' ? globalThis : this);
