const { randomUUID } = require('node:crypto');
const { Op } = require('sequelize');
const { Producto } = require('../modelos');
const inventario = require('../servicios/inventario');
const ventas = require('../servicios/ventas');
const { ErrorValidacion } = require('../servicios/validacion');
function ficha(p) { return {productoId:p.id,nombre:p.nombre,codigo:p.codigo,precio:p.venta,stock:p.stock,activo:p.activo}; }
async function nueva(req,res) {
  const listado=await inventario.listar({q:req.query.q,estado:'activos'});
  res.render('venta-nueva',{titulo:'Nueva venta',productos:listado.productos.map(ficha),lineas:[],datos:{operacion:randomUUID(),medio:'efectivo'},errores:{}});
}
async function buscar(req,res) {
  const lista=await inventario.listar({q:req.query.q,pagina:req.query.pagina,estado:'activos'});
  res.json({productos:lista.productos.map(ficha),pagina:lista.pagina,paginas:lista.paginas,total:lista.total});
}
async function guardar(req,res) {
  try {
    const venta=await ventas.registrar(req.body);
    res.redirect(303,`/ventas/${venta.id}?confirmada=1`);
  } catch(e) {
    res.locals.ruta='/ventas/nueva';
    let lineas=[];
    try { lineas=ventas.lineasCarrito(req.body.carrito); } catch { /* El formulario informa el carrito inválido. */ }
    try {
      const productos=await Producto.findAll({where:{id:{[Op.in]:lineas.map(l=>l.productoId)}}});
      lineas=lineas.map(l=>({...ficha(productos.find(p=>p.id===l.productoId)||{id:l.productoId,nombre:`Producto #${l.productoId}`,codigo:'No disponible',venta:'0.00',stock:0,activo:false}),cantidad:l.cantidad}));
    } catch {
      lineas=lineas.map(l=>({...l,nombre:`Producto #${l.productoId}`,codigo:'Conexión pendiente',precio:null,stock:null,activo:false}));
    }
    const errores=e instanceof ErrorValidacion?e.errores:{general:'No se pudo confirmar la venta. Tu carrito se conserva. Reintenta con esta misma operación para evitar duplicados.'};
    if(!(e instanceof ErrorValidacion))console.error(`Error al registrar venta: ${e.name || 'Error'}`);
    res.status(e instanceof ErrorValidacion?422:503).render('venta-nueva',{titulo:'Revisar venta',productos:[],lineas,datos:req.body,errores});
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
module.exports={nueva,buscar,guardar,historial,detalle};
