const { randomUUID } = require('node:crypto');
const { Op } = require('sequelize');
const { Producto, Servicio } = require('../modelos');
const inventario = require('../servicios/inventario');
const ventas = require('../servicios/ventas');
const { ErrorValidacion } = require('../servicios/validacion');
function ficha(p) { return {tipo:'producto',productoId:p.id,nombre:p.nombre,codigo:p.codigo,unidad:'unidad',precio:p.venta,stock:p.stock,activo:p.activo}; }
function fichaServicio(s){return {tipo:'servicio',servicioId:s.id,nombre:s.nombre,codigo:s.codigo,categoria:s.categoria,unidad:s.unidad,precio:s.precio,activo:s.activo};}
async function accesos(){return (await Servicio.findAll({where:{activo:true},order:[['nombre','ASC']],limit:8})).map(fichaServicio);}
async function nueva(req,res) {
  const listado=await inventario.listar({q:req.query.q,estado:'activos'});
  res.render('venta-nueva',{titulo:'Nueva venta',productos:listado.productos.map(ficha),accesos:await accesos(),lineas:[],datos:{operacion:randomUUID(),medio:'efectivo'},errores:{}});
}
async function buscar(req,res) {
  const lista=await inventario.listar({q:req.query.q,pagina:req.query.pagina,estado:'activos'});
  res.json({productos:lista.productos.map(ficha),pagina:lista.pagina,paginas:lista.paginas,total:lista.total});
}
async function buscarServicios(req,res){
  const lista=await require('../servicios/servicios').listar({q:req.query.q,pagina:req.query.pagina,estado:'activos'});
  res.json({productos:lista.servicios.map(fichaServicio),pagina:lista.pagina,paginas:lista.paginas,total:lista.total});
}
async function guardar(req,res) {
  try {
    const venta=await ventas.registrar(req.body);
    res.redirect(303,`/ventas/${venta.id}?confirmada=1`);
  } catch(e) {
    res.locals.ruta='/ventas/nueva';
    let lineas=[];
    try { lineas=ventas.lineasCarrito(req.body.carrito); } catch {
      // Conservar las líneas reconocibles aunque una cantidad necesite corrección.
      try{const originales=JSON.parse(req.body.carrito);if(Array.isArray(originales))lineas=originales.slice(0,100).filter(l=>l&&['producto','servicio'].includes(l.tipo||'producto')&&/^\d{1,10}$/.test(String(l.tipo==='servicio'?l.servicioId:l.productoId))).map(l=>l.tipo==='servicio'?{tipo:'servicio',servicioId:Number(l.servicioId),cantidad:String(l.cantidad??'').slice(0,16)}:{productoId:Number(l.productoId),cantidad:String(l.cantidad??'').slice(0,16)});}catch{}
    }
    try {
      const [productos,servicios]=await Promise.all([Producto.findAll({where:{id:{[Op.in]:lineas.filter(l=>l.productoId).map(l=>l.productoId)}}}),Servicio.findAll({where:{id:{[Op.in]:lineas.filter(l=>l.servicioId).map(l=>l.servicioId)}}})]);
      lineas=lineas.map(l=>l.tipo==='servicio'?{...fichaServicio(servicios.find(s=>s.id===l.servicioId)||{id:l.servicioId,nombre:`Servicio #${l.servicioId}`,codigo:'No disponible',unidad:'por confirmar',precio:null,activo:false}),cantidad:l.cantidad}:{...ficha(productos.find(p=>p.id===l.productoId)||{id:l.productoId,nombre:`Producto #${l.productoId}`,codigo:'No disponible',venta:null,stock:0,activo:false}),cantidad:l.cantidad});
    } catch {
      lineas=lineas.map(l=>({...l,tipo:l.tipo||'producto',nombre:`${l.tipo==='servicio'?'Servicio':'Producto'} #${l.servicioId||l.productoId}`,unidad:l.tipo==='servicio'?'por confirmar':'unidad',codigo:'Conexión pendiente',precio:null,activo:false}));
    }
    const errores=e instanceof ErrorValidacion?e.errores:{general:'No se pudo confirmar la venta. Tu carrito se conserva. Reintenta con esta misma operación para evitar duplicados.'};
    if(!(e instanceof ErrorValidacion))console.error(`Error al registrar venta: ${e.name || 'Error'}`);
    let rapidos=[];try{rapidos=await accesos();}catch{}
    res.status(e instanceof ErrorValidacion?422:503).render('venta-nueva',{titulo:'Revisar venta',productos:[],accesos:rapidos,lineas,datos:req.body,errores});
  }
}
async function historial(req,res) {
  try { res.render('ventas-historial',{titulo:'Historial de ventas',...await ventas.historial(req.query),filtros:req.query,errores:{}}); }
  catch(e) {
    if(!(e instanceof ErrorValidacion))throw e;
    res.status(422).render('ventas-historial',{titulo:'Historial de ventas',ventas:[],total:0,pagina:1,paginas:1,filtros:req.query,errores:e.errores});
  }
}
async function detalle(req,res) {
  const venta=await ventas.detalle(req.params.id);
  if(!venta)return res.status(404).render('mensaje',{titulo:'Venta no encontrada',mensaje:'El comprobante solicitado no existe.'});
  res.render('venta-detalle',{titulo:`Venta ${venta.numero}`,venta,confirmada:req.query.confirmada==='1'});
}
module.exports={nueva,buscar,buscarServicios,guardar,historial,detalle};
