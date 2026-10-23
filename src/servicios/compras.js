const {createHash}=require('node:crypto');
const {Transaction,Op}=require('sequelize');
const {sequelize,Proveedor,Producto,Movimiento,Compra,DetalleCompra}=require('../modelos');
const {ErrorValidacion}=require('./validacion');
const {limitesDia,diaBogota}=require('./ventas');
const dinero=require('../../public/js/dinero');
const config=require('../configuracion');
const error=(campo,mensaje)=>new ErrorValidacion({[campo]:mensaje});
function lineasCompra(entrada) {
  let lineas;try{lineas=typeof entrada==='string'?JSON.parse(entrada):entrada;}catch{throw error('carrito','Los productos de la recepción no son válidos.');}
  if(!Array.isArray(lineas)||!lineas.length||lineas.length>100)throw error('carrito','Agrega de 1 a 100 productos a la recepción.');
  const agrupadas=new Map();
  for(const l of lineas){
    if(!l||!/^\d{1,10}$/.test(String(l.productoId))||Number(l.productoId)<1||Number(l.productoId)>2147483647||!/^\d{1,10}$/.test(String(l.cantidad))||Number(l.cantidad)<1||Number(l.cantidad)>2147483647)throw error('carrito','Selecciona productos válidos y cantidades enteras positivas.');
    let costo;try{costo=dinero.decimal(dinero.centavos(l.costo));}catch{throw error('carrito','El costo unitario debe ser no negativo y tener máximo dos decimales.');}
    if(dinero.centavos(costo)>999999999999n)throw error('carrito','El costo unitario no puede superar 9999999999.99 COP.');
    const id=Number(l.productoId),existente=agrupadas.get(id);
    if(existente && existente.costo!==costo)throw error('carrito','Un producto repetido debe tener el mismo costo unitario. Unifica sus líneas.');
    const cantidad=(existente?.cantidad||0)+Number(l.cantidad);
    if(cantidad>2147483647)throw error('carrito','La cantidad acumulada supera el máximo permitido.');
    agrupadas.set(id,{productoId:id,cantidad,costo});
  }
  return [...agrupadas.values()].sort((a,b)=>a.productoId-b.productoId);
}
function validar(entrada){
  if(String(entrada.confirmacion)!=='1')throw error('confirmacion','Confirma que la mercancía ya fue recibida y que aumentará las existencias.');
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(entrada.operacion)))throw error('operacion','La clave de operación no es válida. Abre una nueva recepción.');
  if(!/^\d{1,10}$/.test(String(entrada.proveedorId))||Number(entrada.proveedorId)<1||Number(entrada.proveedorId)>2147483647)throw error('proveedorId','Selecciona un proveedor activo.');
  const fechaRecepcion=String(entrada.fechaRecepcion||'');try{limitesDia(fechaRecepcion);}catch{throw error('fechaRecepcion','Selecciona una fecha de recepción válida.');}
  if(fechaRecepcion<'1000-01-01'||fechaRecepcion>diaBogota())throw error('fechaRecepcion','La fecha debe corresponder a mercancía ya recibida y no puede ser futura.');
  for(const campo of ['referencia','observaciones'])if(entrada[campo]!=null && typeof entrada[campo]!=='string')throw error(campo,'Introduce un texto válido.');
  const referencia=typeof entrada.referencia==='string'?entrada.referencia.trim():'',observaciones=typeof entrada.observaciones==='string'?entrada.observaciones.trim():'';
  if(referencia.length>120)throw error('referencia','La referencia puede tener máximo 120 caracteres.');
  if(observaciones.length>2000)throw error('observaciones','Las observaciones pueden tener máximo 2000 caracteres.');
  const datos={proveedorId:Number(entrada.proveedorId),fechaRecepcion,referencia,observaciones,lineas:lineasCompra(entrada.carrito)};
  return {...datos,operacion:String(entrada.operacion).toLowerCase(),huella:createHash('sha256').update(JSON.stringify(datos)).digest('hex')};
}
function comprobarReintento(compra,datos){
  if(compra.huella!==datos.huella)throw error('operacion','Esta operación ya fue confirmada con datos diferentes. Consulta la compra antes de registrar otra.');
  return compra;
}
async function registrar(entrada){
  const datos=validar(entrada);
  const anterior=await Compra.findOne({where:{operacion:datos.operacion}});
  if(anterior)return comprobarReintento(anterior,datos);
  try{return await sequelize.transaction({isolationLevel:Transaction.ISOLATION_LEVELS.READ_COMMITTED},async transaction=>{
    // Bloquear primero al proveedor evita una desactivación o edición durante la copia histórica.
    const proveedor=await Proveedor.findByPk(datos.proveedorId,{transaction,lock:transaction.LOCK.UPDATE});
    const repetida=await Compra.findOne({where:{operacion:datos.operacion},transaction});
    if(repetida)return comprobarReintento(repetida,datos);
    if(!proveedor||!proveedor.activo)throw error('proveedorId','El proveedor no existe o está inactivo.');
    const compra=await Compra.create({operacion:datos.operacion,huella:datos.huella,proveedorId:proveedor.id,proveedorNombre:proveedor.nombre,
      proveedorIdentificacion:proveedor.identificacion,proveedorDatos:proveedor.get({plain:true}),fechaRecepcion:datos.fechaRecepcion,fechaRegistro:new Date(),
      referencia:datos.referencia,observaciones:datos.observaciones,responsable:config.responsable,total:'0.00'},{transaction});
    let total=0n;
    for(const linea of datos.lineas){
      // Mismo orden que ventas: protege aumentos y salidas concurrentes.
      const producto=await Producto.findByPk(linea.productoId,{transaction,lock:transaction.LOCK.UPDATE});
      if(!producto||!producto.activo)throw error('carrito',`El producto ${producto?.nombre||'#'+linea.productoId} no está activo.`);
      if(producto.stock+linea.cantidad>2147483647)throw error('carrito',`Las existencias de ${producto.nombre} superarían el máximo permitido.`);
      const subtotal=dinero.centavos(linea.costo)*BigInt(linea.cantidad);total+=subtotal;
      if(total>dinero.MAXIMO)throw error('carrito','El total supera el máximo permitido.');
      await DetalleCompra.create({compraId:compra.id,productoId:producto.id,nombre:producto.nombre,codigo:producto.codigo,cantidad:linea.cantidad,
        costo:linea.costo,costoAnterior:producto.compra,precioVenta:producto.venta,subtotal:dinero.decimal(subtotal)},{transaction});
      await producto.update({stock:producto.stock+linea.cantidad,compra:linea.costo},{transaction});
      await Movimiento.create({productoId:producto.id,compraId:compra.id,tipo:'entrada',cantidad:linea.cantidad,motivo:`Recepción ${compra.numero}`,responsable:config.responsable,fecha:compra.fechaRegistro},{transaction});
    }
    await compra.update({total:dinero.decimal(total)},{transaction});return compra;
  });}catch(e){
    if(e.name==='SequelizeUniqueConstraintError'){
      const existente=await Compra.findOne({where:{operacion:datos.operacion}});if(existente)return comprobarReintento(existente,datos);
    }
    throw e;
  }
}
async function historial(filtros={}){
  const where={};
  if(filtros.fecha){try{limitesDia(String(filtros.fecha));}catch{throw error('fecha','Selecciona una fecha válida.');}where.fechaRecepcion=String(filtros.fecha);}
  if(filtros.proveedor){if(!/^\d{1,10}$/.test(String(filtros.proveedor)))throw error('proveedor','Selecciona un proveedor válido.');where.proveedorId=Number(filtros.proveedor);}
  const total=await Compra.count({where}),paginas=Math.max(1,Math.ceil(total/10)),pagina=Math.min(paginas,Math.max(1,parseInt(filtros.pagina,10)||1));
  return {compras:await Compra.findAll({where,order:[['fechaRecepcion','DESC'],['id','DESC']],limit:10,offset:(pagina-1)*10}),total,paginas,pagina};
}
async function detalle(id){return Compra.findByPk(id,{include:[{model:DetalleCompra,as:'detalles'}],order:[[{model:DetalleCompra,as:'detalles'},'id','ASC']]});}
module.exports={registrar,lineasCompra,historial,detalle};
