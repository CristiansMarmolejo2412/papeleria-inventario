const {Servicio}=require('../modelos');
const servicio=require('../servicios/servicios');
const {ErrorValidacion}=require('../servicios/validacion');
async function lista(req,res){res.render('servicios',{titulo:'Servicios de papelería',...await servicio.listar(req.query),filtros:req.query});}
async function formulario(req,res){
  const datos=req.params.id?await Servicio.findByPk(req.params.id):null;
  if(req.params.id&&!datos)return res.status(404).render('mensaje',{titulo:'Servicio no encontrado',mensaje:'El servicio solicitado no existe.'});
  res.render('servicio-formulario',{titulo:datos?'Editar servicio':'Nuevo servicio',datos:datos?.get({plain:true})||{activo:1},errores:{}});
}
async function guardar(req,res){
  try{await servicio.guardar(req.body,req.params.id);res.redirect(303,'/servicios?mensaje=guardado');}
  catch(e){if(!(e instanceof ErrorValidacion))throw e;res.status(422).render('servicio-formulario',{titulo:req.params.id?'Editar servicio':'Nuevo servicio',datos:{...req.body,id:req.params.id},errores:e.errores});}
}
async function estado(req,res){
  if(!['0','1'].includes(req.body.activo))return res.status(422).render('mensaje',{titulo:'Estado inválido',mensaje:'Selecciona activar o desactivar el servicio.'});
  const s=await Servicio.findByPk(req.params.id);if(!s)return res.sendStatus(404);
  await s.update({activo:req.body.activo==='1'});res.redirect(303,`/servicios?estado=${s.activo?'activos':'inactivos'}&mensaje=guardado`);
}
module.exports={lista,formulario,guardar,estado};
