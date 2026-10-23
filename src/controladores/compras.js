const {randomUUID}=require('node:crypto');
const {Op}=require('sequelize');
const {Proveedor,Producto}=require('../modelos');
const inventario=require('../servicios/inventario');
const servicio=require('../servicios/compras');
const {diaBogota}=require('../servicios/ventas');
const {ErrorValidacion}=require('../servicios/validacion');
const {diagnosticoSeguro}=require('../servicios/arranque');
const ficha=p=>({productoId:p.id,nombre:p.nombre,codigo:p.codigo,costo:p.compra,stock:p.stock});
async function proveedores(seleccionado){return Proveedor.findAll({where:{[Op.or]:[{activo:true},...(seleccionado?[{id:seleccionado}]:[])]},order:[['nombre','ASC']]});}
async function nueva(req,res){res.render('compra-nueva',{titulo:'Registrar recepción',lineas:[],datos:{operacion:randomUUID(),fechaRecepcion:diaBogota()},errores:{},proveedores:await proveedores(),hoy:diaBogota()});}
async function buscar(req,res){const lista=await inventario.listar({q:req.query.q,pagina:req.query.pagina,estado:'activos'});res.json({productos:lista.productos.map(ficha),pagina:lista.pagina,paginas:lista.paginas,total:lista.total});}
async function guardar(req,res){
  try{const compra=await servicio.registrar(req.body);res.redirect(303,`/compras/${compra.id}?confirmada=1`);}
  catch(e){
    let lineas=[];try{lineas=servicio.lineasCompra(req.body.carrito);}catch{
      try{const originales=JSON.parse(req.body.carrito);if(Array.isArray(originales))lineas=originales.slice(0,100).filter(l=>l&&/^\d{1,10}$/.test(String(l.productoId))).map(l=>({productoId:Number(l.productoId),cantidad:String(l.cantidad??'').slice(0,16),costo:String(l.costo??'').slice(0,32)}));}catch{}
    }
    try{const productos=await Producto.findAll({where:{id:lineas.map(l=>l.productoId)}});lineas=lineas.map(l=>({...ficha(productos.find(p=>p.id===l.productoId)||{id:l.productoId,nombre:`Producto #${l.productoId}`,codigo:'No disponible',compra:l.costo,stock:null}),...l}));}
    catch{lineas=lineas.map(l=>({...l,nombre:`Producto #${l.productoId}`,codigo:'Conexión pendiente',stock:null}));}
    const errores=e instanceof ErrorValidacion?e.errores:{general:'No se pudo confirmar la recepción. Los productos se conservan. Reintenta con esta misma operación para evitar duplicados.'};
    if(!(e instanceof ErrorValidacion))console.error(`Error al registrar recepción [${diagnosticoSeguro(e)}]`);
    let opciones=[];try{opciones=await proveedores(/^\d+$/.test(String(req.body.proveedorId))?Number(req.body.proveedorId):null);}catch{}
    res.status(e instanceof ErrorValidacion?422:503).render('compra-nueva',{titulo:'Revisar recepción',lineas,datos:req.body,errores,proveedores:opciones,hoy:diaBogota()});
  }
}
async function historial(req,res){
  const proveedores=await Proveedor.findAll({order:[['nombre','ASC']]});
  try{res.render('compras-historial',{titulo:'Historial de compras',...await servicio.historial(req.query),filtros:req.query,proveedores,errores:{}});}
  catch(e){if(!(e instanceof ErrorValidacion))throw e;res.status(422).render('compras-historial',{titulo:'Historial de compras',compras:[],total:0,pagina:1,paginas:1,filtros:req.query,proveedores,errores:e.errores});}
}
async function detalle(req,res){const compra=await servicio.detalle(req.params.id);if(!compra)return res.status(404).render('mensaje',{titulo:'Compra no encontrada',mensaje:'La recepción solicitada no existe.'});res.render('compra-detalle',{titulo:`Recepción ${compra.numero}`,compra,confirmada:req.query.confirmada==='1'});}
module.exports={nueva,buscar,guardar,historial,detalle};
