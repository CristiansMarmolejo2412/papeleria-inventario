const {Op}=require('sequelize');
const {Servicio}=require('../modelos');
const {ErrorValidacion}=require('./validacion');
const dinero=require('../../public/js/dinero');
function validar(entrada){
  const datos={},errores={};
  for(const [campo,maximo] of [['codigo',40],['nombre',120],['categoria',80],['unidad',40],['descripcion',2000]]){
    datos[campo]=typeof entrada[campo]==='string'?entrada[campo].trim():'';
    if((campo!=='descripcion'&&!datos[campo])||datos[campo].length>maximo)errores[campo]=`Introduce ${campo==='descripcion'?'como máximo':'un valor de 1 a'} ${maximo} caracteres${campo==='descripcion'?'':' sin dejar el campo vacío'}.`;
    if(entrada[campo]!=null&&typeof entrada[campo]!=='string')errores[campo]='Introduce un texto válido.';
  }
  datos.codigo=datos.codigo.toUpperCase();
  try{const precio=dinero.centavos(entrada.precio);if(precio<=0n||precio>999999999999n)throw Error();datos.precio=dinero.decimal(precio);}catch{errores.precio='Introduce un precio mayor que cero, hasta 9999999999.99 COP y con máximo dos decimales.';}
  if(!['0','1'].includes(String(entrada.activo)))errores.activo='Selecciona un estado válido.';
  datos.activo=String(entrada.activo)==='1';
  if(Object.keys(errores).length)throw new ErrorValidacion(errores);return datos;
}
async function guardar(entrada,id){
  const datos=validar(entrada);
  try{if(!id)return await Servicio.create(datos);const s=await Servicio.findByPk(id);if(!s){const e=Error('Servicio no encontrado.');e.status=404;throw e;}return await s.update(datos);}
  catch(e){if(e.name==='SequelizeUniqueConstraintError')throw new ErrorValidacion({codigo:'Este código ya pertenece a otro servicio, incluso si está inactivo.'});throw e;}
}
async function listar(filtros={}){
  const where={};if(filtros.estado!=='todos')where.activo=filtros.estado!=='inactivos';
  const q=String(filtros.q||'').trim().slice(0,120);
  if(q)where[Op.or]=['nombre','codigo','categoria'].map(campo=>({[campo]:{[Op.like]:`%${q.replace(/[\\%_]/g,'\\$&')}%`}}));
  const total=await Servicio.count({where}),paginas=Math.max(1,Math.ceil(total/10)),pagina=Math.min(paginas,Math.max(1,parseInt(filtros.pagina,10)||1));
  return {servicios:await Servicio.findAll({where,order:[['categoria','ASC'],['nombre','ASC'],['id','ASC']],limit:10,offset:(pagina-1)*10}),total,paginas,pagina};
}
module.exports={guardar,listar,validar};
