const { createHash } = require('node:crypto');
const { Op, Transaction } = require('sequelize');
const { sequelize, Producto, Movimiento, Venta, DetalleVenta, PagoVenta } = require('../modelos');
const { ErrorValidacion } = require('./validacion');
const dinero = require('../../public/js/dinero');
const config = require('../configuracion');
function error(campo,mensaje) { return new ErrorValidacion({[campo]:mensaje}); }
function lineasCarrito(carrito) {
  let lineas;
  try { lineas = typeof carrito === 'string' ? JSON.parse(carrito) : carrito; }
  catch { throw error('carrito','El carrito no es válido. Vuelve a seleccionar los productos.'); }
  if (!Array.isArray(lineas) || !lineas.length || lineas.length > 100) throw error('carrito','Agrega de 1 a 100 productos a la venta.');
  const agrupadas = new Map();
  for (const linea of lineas) {
    if (!linea || !/^\d{1,10}$/.test(String(linea.productoId)) || Number(linea.productoId)<1 || Number(linea.productoId)>2147483647 || !/^\d{1,10}$/.test(String(linea.cantidad)) || Number(linea.cantidad)<1 || Number(linea.cantidad)>2147483647) throw error('carrito','Las cantidades deben ser enteras positivas y los productos válidos.');
    const id = Number(linea.productoId), cantidad = (agrupadas.get(id)||0)+Number(linea.cantidad);
    if(cantidad>2147483647) throw error('carrito','La cantidad acumulada supera el máximo permitido.');
    agrupadas.set(id,cantidad);
  }
  return [...agrupadas].sort((a,b)=>a[0]-b[0]).map(([productoId,cantidad])=>({productoId,cantidad}));
}
function validar(entrada) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(entrada.operacion))) throw error('operacion','La clave de operación no es válida. Abre una nueva venta.');
  const lineas=lineasCarrito(entrada.carrito);
  if(!['efectivo','transferencia'].includes(entrada.medio)) throw error('medio','Selecciona efectivo o transferencia.');
  let recibido=null;
  if(entrada.medio==='efectivo') {
    try { recibido=dinero.decimal(dinero.centavos(entrada.recibido)); }
    catch(e) { throw error('recibido',e.message); }
  }
  const referencia=entrada.medio==='transferencia'?String(entrada.referencia||'').trim():'';
  if(referencia.length>120) throw error('referencia','La referencia puede tener máximo 120 caracteres.');
  const huella=createHash('sha256').update(JSON.stringify({lineas,medio:entrada.medio,recibido,referencia})).digest('hex');
  return {lineas,recibido,referencia,huella,medio:entrada.medio,operacion:String(entrada.operacion).toLowerCase()};
}
async function registrar(entrada) {
  const datos=validar(entrada);
  try {
    return await sequelize.transaction({isolationLevel:Transaction.ISOLATION_LEVELS.READ_COMMITTED},async transaction=>{
      // Reservar la clave antes de bloquear productos: los reintentos esperan al primer resultado.
      const venta=await Venta.create({operacion:datos.operacion,huella:datos.huella,fecha:new Date(),cliente:'Consumidor final',responsable:config.responsable,total:'0.00'},{transaction});
      let total=0n;
      const detalles=[];
      for(const linea of datos.lineas) {
        // Orden estable de bloqueos para evitar ciclos entre carritos de varios productos.
        const producto=await Producto.findByPk(linea.productoId,{transaction,lock:transaction.LOCK.UPDATE});
        if(!producto || !producto.activo) throw error('carrito',`El producto ${producto?.nombre || '#'+linea.productoId} ya no está disponible para vender.`);
        if(producto.stock<linea.cantidad) throw error('carrito',`Existencias insuficientes para ${producto.nombre}: quedan ${producto.stock}.`);
        const subtotal=dinero.centavos(producto.venta)*BigInt(linea.cantidad);
        total+=subtotal;
        if(total>dinero.MAXIMO) throw error('carrito','El total supera el máximo permitido. Reduce las cantidades.');
        detalles.push({producto,linea,subtotal});
      }
      if(total===0n) throw error('carrito','El total de la venta debe ser mayor que cero.');
      const recibido=datos.medio==='efectivo'?dinero.centavos(datos.recibido):total;
      if(recibido<total) throw error('recibido','El importe recibido es insuficiente para pagar la venta.');
      await venta.update({total:dinero.decimal(total)},{transaction});
      for(const {producto,linea,subtotal} of detalles) {
        await DetalleVenta.create({ventaId:venta.id,productoId:producto.id,nombre:producto.nombre,codigo:producto.codigo,precio:producto.venta,costo:producto.compra,cantidad:linea.cantidad,subtotal:dinero.decimal(subtotal)},{transaction});
        await producto.update({stock:producto.stock-linea.cantidad},{transaction});
        await Movimiento.create({productoId:producto.id,ventaId:venta.id,tipo:'salida',cantidad:linea.cantidad,motivo:`Venta ${venta.numero}`,responsable:config.responsable,fecha:venta.fecha},{transaction});
      }
      await PagoVenta.create({ventaId:venta.id,medio:datos.medio,importe:venta.total,recibido:dinero.decimal(recibido),cambio:dinero.decimal(recibido-total),referencia:datos.referencia||null},{transaction});
      return venta;
    });
  } catch(e) {
    if(e.name==='SequelizeUniqueConstraintError') {
      const existente=await Venta.findOne({where:{operacion:datos.operacion}});
      if(existente) {
        if(existente.huella!==datos.huella) throw error('operacion','Esta operación ya fue confirmada con otros datos. Consulta su comprobante antes de crear una nueva venta.');
        return existente;
      }
    }
    throw e;
  }
}
function limitesDia(fecha) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw error('fecha','Selecciona una fecha válida.');
  const inicio=new Date(`${fecha}T00:00:00-05:00`);
  if(!Number.isFinite(inicio.getTime()) || new Date(inicio.getTime()-5*3600000).toISOString().slice(0,10)!==fecha) throw error('fecha','Selecciona una fecha válida.');
  return {[Op.gte]:inicio,[Op.lt]:new Date(inicio.getTime()+86400000)};
}
function diaBogota(ahora=new Date()) {
  const partes=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(ahora);
  const valor=tipo=>partes.find(p=>p.type===tipo).value;
  return `${valor('year')}-${valor('month')}-${valor('day')}`;
}
async function resumenDia(ahora=new Date()) {
  const where={fecha:limitesDia(diaBogota(ahora))};
  // Evitar la conversión de SUM decimal a Number y leer ambos indicadores en una consulta.
  const [filas]=await sequelize.query('SELECT COUNT(*) AS cantidad, CAST(COALESCE(SUM(total),0) AS CHAR) AS total FROM ventas WHERE fecha >= :inicio AND fecha < :fin',{
    replacements:{inicio:where.fecha[Op.gte],fin:where.fecha[Op.lt]},
  });
  return {cantidad:Number(filas[0].cantidad),total:filas[0].total};
}
async function historial(filtros) {
  const where={};
  if(filtros.fecha)where.fecha=limitesDia(String(filtros.fecha));
  if(filtros.numero) {
    const coincidencia=/^(?:V-)?(\d{1,10})$/i.exec(String(filtros.numero).trim());
    where.id=coincidencia?Number(coincidencia[1]):0;
  }
  const total=await Venta.count({where}),paginas=Math.max(1,Math.ceil(total/10));
  const pagina=Math.min(paginas,Math.max(1,parseInt(filtros.pagina,10)||1));
  return {ventas:await Venta.findAll({where,include:[{model:PagoVenta,as:'pago'}],order:[['fecha','DESC'],['id','DESC']],limit:10,offset:(pagina-1)*10}),total,pagina,paginas};
}
async function detalle(id) {
  return Venta.findByPk(id,{include:[{model:DetalleVenta,as:'detalles'},{model:PagoVenta,as:'pago'}],order:[[{model:DetalleVenta,as:'detalles'},'id','ASC']]});
}
module.exports={registrar,lineasCarrito,historial,detalle,resumenDia,limitesDia,diaBogota};
