const {Op}=require('sequelize');
const {Proveedor}=require('../modelos');
const {ErrorValidacion}=require('./validacion');
function validar(entrada) {
  const datos={},errores={};
  for(const [campo,maximo] of [['nombre',160],['identificacion',80],['contacto',120],['telefono',40],['correo',160],['direccion',240],['observaciones',2000]]) {
    if(entrada[campo]!=null && typeof entrada[campo]!=='string')errores[campo]='Introduce un texto válido.';
    datos[campo]=typeof entrada[campo]==='string'?entrada[campo].trim():'';
    if(datos[campo].length>maximo)errores[campo]=`Usa como máximo ${maximo} caracteres.`;
  }
  if(!datos.nombre)errores.nombre='El nombre o razón social es obligatorio.';
  if(datos.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo))errores.correo='Introduce un correo válido o deja el campo vacío.';
  if(datos.telefono && !/^[0-9+().\s-]{3,40}$/.test(datos.telefono))errores.telefono='Usa números y los símbolos +, -, paréntesis o punto.';
  if(!['0','1'].includes(String(entrada.activo)))errores.activo='Selecciona un estado válido.';
  datos.activo=String(entrada.activo)==='1';datos.identificacion=datos.identificacion.toUpperCase()||null;
  if(Object.keys(errores).length)throw new ErrorValidacion(errores);
  return datos;
}
async function guardar(entrada,id) {
  const datos=validar(entrada);
  try {
    if(!id)return await Proveedor.create(datos);
    const proveedor=await Proveedor.findByPk(id);
    if(!proveedor){const e=new Error('Proveedor no encontrado.');e.status=404;throw e;}
    return await proveedor.update(datos);
  }catch(e){if(e.name==='SequelizeUniqueConstraintError')throw new ErrorValidacion({identificacion:'Ya existe un proveedor con esa identificación, incluso si está inactivo.'});throw e;}
}
async function listar(filtros={}) {
  const where={};
  if(filtros.estado!=='todos')where.activo=filtros.estado!=='inactivos';
  const q=String(filtros.q||'').trim().slice(0,160);
  if(q)where[Op.or]=['nombre','identificacion','contacto'].map(campo=>({[campo]:{[Op.like]:`%${q.replace(/[\\%_]/g,'\\$&')}%`}}));
  const total=await Proveedor.count({where}),paginas=Math.max(1,Math.ceil(total/10));
  const pagina=Math.min(paginas,Math.max(1,parseInt(filtros.pagina,10)||1));
  return {proveedores:await Proveedor.findAll({where,order:[['nombre','ASC'],['id','ASC']],limit:10,offset:(pagina-1)*10}),total,paginas,pagina};
}
module.exports={guardar,listar,validar};
