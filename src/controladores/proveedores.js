const {Proveedor}=require('../modelos');
const servicio=require('../servicios/proveedores');
const {ErrorValidacion}=require('../servicios/validacion');
async function lista(req,res){res.render('proveedores',{titulo:'Proveedores',...await servicio.listar(req.query),filtros:req.query});}
async function formulario(req,res){
  const datos=req.params.id?await Proveedor.findByPk(req.params.id):null;
  if(req.params.id&&!datos)return res.status(404).render('mensaje',{titulo:'Proveedor no encontrado',mensaje:'El proveedor solicitado no existe.'});
  res.render('proveedor-formulario',{titulo:datos?'Editar proveedor':'Nuevo proveedor',datos:datos?.get({plain:true})||{activo:1},errores:{}});
}
async function guardar(req,res){
  try{await servicio.guardar(req.body,req.params.id);res.redirect(303,'/proveedores?mensaje=guardado');}
  catch(e){if(!(e instanceof ErrorValidacion))throw e;res.status(422).render('proveedor-formulario',{titulo:req.params.id?'Editar proveedor':'Nuevo proveedor',datos:{...req.body,id:req.params.id},errores:e.errores});}
}
async function desactivar(req,res){
  const proveedor=await Proveedor.findByPk(req.params.id);
  if(!proveedor)return res.sendStatus(404);
  await proveedor.update({activo:false});res.redirect(303,'/proveedores?estado=inactivos&mensaje=proveedor-desactivado');
}
module.exports={lista,formulario,guardar,desactivar};
