const { DataTypes: D } = require('sequelize');
module.exports = {
  async up({ context: q }) {
    const id = () => ({ type: D.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true });
    const texto = (n) => ({ type: D.STRING(n), allowNull: false });
    const cantidad = () => ({ type: D.INTEGER.UNSIGNED, allowNull: false });
    const activo = () => ({ type: D.BOOLEAN, allowNull: false, defaultValue: true });
    // MySQL confirma DDL implícitamente: cada tabla es recuperable si una ejecución se interrumpe.
    const tablas = await q.showAllTables();
    if (!tablas.includes('categorias')) await q.createTable('categorias', {
      id: id(), nombre: { ...texto(80), unique: true }, activo: activo(),
    }, { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
    if (!tablas.includes('productos')) await q.createTable('productos', {
      id: id(), codigo: { ...texto(40), unique: true },
      barras: { type: D.STRING(80), allowNull: true, unique: true }, nombre: texto(120),
      categoriaId: { ...cantidad(), references: { model: 'categorias', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
      marca: texto(80), ubicacion: texto(80),
      compra: { type: D.DECIMAL(12, 2), allowNull: false }, venta: { type: D.DECIMAL(12, 2), allowNull: false },
      stock: cantidad(), minimo: cantidad(), activo: activo(), creadoEn: { type: D.DATE, allowNull: false },
    }, { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
    if (!tablas.includes('movimientos')) await q.createTable('movimientos', {
      id: id(), productoId: { ...cantidad(), references: { model: 'productos', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' },
      tipo: texto(20), cantidad: cantidad(), motivo: texto(200), responsable: texto(120), fecha: { type: D.DATE, allowNull: false },
    }, { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
    // Restricciones también en MySQL 8.0.16 o posterior, además de la validación del servidor.
    const [restricciones] = await q.sequelize.query("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND CONSTRAINT_TYPE = 'CHECK'");
    const nombres = restricciones.map((r) => r.CONSTRAINT_NAME);
    if (!nombres.includes('productos_valores_validos')) await q.sequelize.query('ALTER TABLE productos ADD CONSTRAINT productos_valores_validos CHECK (compra >= 0 AND venta >= 0 AND stock >= 0 AND minimo >= 0)');
  },
};
