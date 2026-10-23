const { Op, col, where } = require('sequelize');
const { sequelize, Producto, Categoria, Movimiento } = require('../modelos');
const { validarProducto, ErrorValidacion } = require('./validacion');
const config = require('../configuracion');
function convertirError(error) {
  if (error.name === 'SequelizeUniqueConstraintError') {
    const errores = {};
    for (const detalle of error.errors) errores[detalle.path === 'barras' ? 'barras' : 'codigo'] = 'Este código ya pertenece a otro producto, incluso si está inactivo.';
    throw new ErrorValidacion(errores);
  }
  throw error;
}
async function guardarProducto(entrada, id) {
  const datos = validarProducto(entrada, Boolean(id));
  try {
    return await sequelize.transaction(async (transaction) => {
      const categoria = await Categoria.findByPk(datos.categoriaId, { transaction });
      const existente = id ? await Producto.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE }) : null;
      if (id && !existente) { const error = new Error('Producto no encontrado.'); error.status = 404; throw error; }
      if (!categoria || (!categoria.activo && existente?.categoriaId !== categoria.id)) throw new ErrorValidacion({ categoriaId: 'Selecciona una categoría activa.' });
      if (existente) { await existente.update(datos, { transaction }); return existente; }
      const producto = await Producto.create({ ...datos, creadoEn: new Date() }, { transaction });
      await Movimiento.create({ productoId: producto.id, tipo: 'inicial', cantidad: datos.stock,
        motivo: 'Registro de existencias iniciales', responsable: config.responsable, fecha: new Date() }, { transaction });
      return producto;
    });
  } catch (error) { convertirError(error); }
}
function condicion(filtros) {
  const condiciones = [];
  const busqueda = String(filtros.q || '').slice(0,120).trim();
  if (busqueda) condiciones.push({ [Op.or]: ['nombre','codigo','barras'].map((campo) => ({ [campo]: { [Op.like]: `%${busqueda.replace(/[\\%_]/g, '\\$&')}%` } })) });
  if (/^\d+$/.test(String(filtros.categoria || ''))) condiciones.push({ categoriaId: filtros.categoria });
  if (filtros.estado === 'inactivos') condiciones.push({ activo: false });
  else if (filtros.estado !== 'todos') condiciones.push({ activo: true });
  if (filtros.disponibilidad === 'disponibles') condiciones.push({ stock: { [Op.gt]: 0 } });
  if (filtros.disponibilidad === 'pocas') condiciones.push({ stock: { [Op.gt]: 0 } }, where(col('stock'), Op.lte, col('minimo')));
  if (filtros.disponibilidad === 'agotados') condiciones.push({ stock: 0 });
  return { [Op.and]: condiciones };
}
async function listar(filtros) {
  const paginaSolicitada = Math.min(1000000, Math.max(1, parseInt(filtros.pagina,10) || 1));
  const consulta = { where: condicion(filtros), include: [{ model: Categoria, as: 'categoria' }], order: [['nombre','ASC'],['id','ASC']] };
  const total = await Producto.count({ where: consulta.where });
  const paginas = Math.max(1, Math.ceil(total / 10)), pagina = Math.min(paginas, paginaSolicitada);
  const productos = await Producto.findAll({ ...consulta, limit: 10, offset: (pagina - 1) * 10 });
  return { productos, total, paginas, pagina };
}
async function indicadores() {
  const activos = await Producto.count({ where: { activo: true } });
  const disponibles = await Producto.count({ where: { activo: true, stock: { [Op.gt]: 0 } } });
  const pocas = await Producto.count({ where: condicion({ disponibilidad: 'pocas' }) });
  const agotados = await Producto.count({ where: { activo: true, stock: 0 } });
  return { activos, disponibles, pocas, agotados };
}
module.exports = { guardarProducto, listar, indicadores };
