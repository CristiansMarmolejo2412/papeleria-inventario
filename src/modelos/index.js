const { Sequelize, DataTypes } = require('sequelize');
const config = require('../configuracion');
const sequelize = new Sequelize(config.nombre, config.usuario, config.clave, {
  host: config.host, port: config.puerto, dialect: 'mysql', logging: false,
  timezone: '+00:00', define: { timestamps: false, freezeTableName: true },
});
const Categoria = sequelize.define('categorias', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
});
const Producto = sequelize.define('productos', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  codigo: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  barras: { type: DataTypes.STRING(80), allowNull: true, unique: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false },
  categoriaId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  marca: { type: DataTypes.STRING(80), allowNull: false },
  ubicacion: { type: DataTypes.STRING(80), allowNull: false },
  compra: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  venta: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  stock: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  minimo: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  creadoEn: { type: DataTypes.DATE, allowNull: false },
});
const Movimiento = sequelize.define('movimientos', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  productoId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  tipo: { type: DataTypes.STRING(20), allowNull: false },
  cantidad: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  motivo: { type: DataTypes.STRING(200), allowNull: false },
  responsable: { type: DataTypes.STRING(120), allowNull: false },
  fecha: { type: DataTypes.DATE, allowNull: false },
});
Producto.belongsTo(Categoria, { foreignKey: 'categoriaId', as: 'categoria' });
Movimiento.belongsTo(Producto, { foreignKey: 'productoId' });
module.exports = { sequelize, Categoria, Producto, Movimiento };
