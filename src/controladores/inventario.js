const { UniqueConstraintError } = require('sequelize');
const { Categoria, Producto, Movimiento } = require('../modelos');
const servicio = require('../servicios/inventario');
const { ErrorValidacion } = require('../servicios/validacion');
async function pagina(req, res) {
  const [lista, categorias, resumen] = await Promise.all([servicio.listar(req.query), Categoria.findAll({ order: [['nombre','ASC']] }), servicio.indicadores()]);
  res.render('inventario', { ...lista, categorias, resumen, filtros: req.query, inicio: req.path === '/', titulo: req.path === '/' ? 'Resumen de tu papelería' : 'Productos e inventario' });
}
async function formulario(req,res) {
  const producto = req.params.id ? await Producto.findByPk(req.params.id) : null;
  if (req.params.id && !producto) return res.status(404).render('mensaje', { titulo: 'Producto no encontrado', mensaje: 'El producto solicitado no existe.' });
  const categorias = await Categoria.findAll({ order: [['nombre','ASC']] });
  res.render('producto-formulario', { titulo: producto ? 'Editar producto' : 'Nuevo producto', datos: producto?.get({plain:true}) || { activo: 1, stock: 0, minimo: 0 }, errores: {}, categorias, edicion: Boolean(producto) });
}
async function guardar(req,res) {
  try { const producto = await servicio.guardarProducto(req.body, req.params.id); res.redirect(303, `/productos/${producto.id}?mensaje=guardado`); }
  catch (error) {
    if (!(error instanceof ErrorValidacion)) throw error;
    res.status(422).render('producto-formulario', { titulo: req.params.id ? 'Editar producto' : 'Nuevo producto', datos: { ...req.body, id: req.params.id }, errores: error.errores,
      categorias: await Categoria.findAll({ order: [['nombre','ASC']] }), edicion: Boolean(req.params.id) });
  }
}
async function detalle(req,res) {
  const producto = await Producto.findByPk(req.params.id, { include: [{ model: Categoria, as: 'categoria' }] });
  if (!producto) return res.status(404).render('mensaje', { titulo: 'Producto no encontrado', mensaje: 'El producto solicitado no existe.' });
  const movimientos = await Movimiento.findAll({ where: { productoId: producto.id }, order: [['id','DESC']] });
  res.render('producto-detalle', { titulo: producto.nombre, producto, movimientos });
}
async function desactivar(req,res) {
  const producto = await Producto.findByPk(req.params.id);
  if (!producto) return res.sendStatus(404);
  await producto.update({ activo: false });
  res.redirect(303, `/productos/${producto.id}?mensaje=desactivado`);
}
async function categorias(req,res, errores = {}, datos = {}) {
  res.status(Object.keys(errores).length ? 422 : 200).render('categorias', { titulo: 'Categorías', categorias: await Categoria.findAll({ order: [['nombre','ASC']] }), errores, datos });
}
async function editarCategoria(req,res) {
  const categoria = await Categoria.findByPk(req.params.id);
  if (!categoria) return res.status(404).render('mensaje', { titulo: 'Categoría no encontrada', mensaje: 'La categoría solicitada no existe.' });
  return categorias(req,res,{},categoria.get({plain:true}));
}
async function guardarCategoria(req,res) {
  const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
  const datos = { ...req.body, id: req.params.id };
  if (!nombre || nombre.length > 80) return categorias(req,res,{ nombre: 'Introduce un nombre de 1 a 80 caracteres.' },datos);
  if (!['0','1'].includes(req.body.activo)) return categorias(req,res,{ activo: 'Selecciona un estado válido.' },datos);
  try {
    if (req.params.id) {
      const categoria = await Categoria.findByPk(req.params.id);
      if (!categoria) return res.sendStatus(404);
      await categoria.update({ nombre, activo: req.body.activo === '1' });
    } else await Categoria.create({ nombre, activo: req.body.activo === '1' });
    res.redirect(303, '/categorias?mensaje=guardado');
  } catch (error) {
    if (error instanceof UniqueConstraintError) return categorias(req,res,{ nombre: 'Ya existe una categoría con ese nombre.' },datos);
    throw error;
  }
}
module.exports = { pagina, formulario, guardar, detalle, desactivar, categorias, editarCategoria, guardarCategoria };
