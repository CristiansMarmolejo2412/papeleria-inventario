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
  ventaId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  compraId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
});
const Venta = sequelize.define('ventas', {
  id:{type:DataTypes.INTEGER.UNSIGNED,primaryKey:true,autoIncrement:true},
  numero:{type:DataTypes.VIRTUAL,get(){return `V-${String(this.getDataValue('id')).padStart(8,'0')}`;}},
  operacion:{type:DataTypes.STRING(36),allowNull:false,unique:true},huella:{type:DataTypes.STRING(64),allowNull:false},
  fecha:{type:DataTypes.DATE,allowNull:false},cliente:{type:DataTypes.STRING(120),allowNull:false,defaultValue:'Consumidor final'},
  responsable:{type:DataTypes.STRING(120),allowNull:false},total:{type:DataTypes.DECIMAL(18,2),allowNull:false},
});
const DetalleVenta = sequelize.define('detalles_venta', {
  id:{type:DataTypes.INTEGER.UNSIGNED,primaryKey:true,autoIncrement:true},ventaId:{type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  productoId:{type:DataTypes.INTEGER.UNSIGNED,allowNull:false},nombre:{type:DataTypes.STRING(120),allowNull:false},codigo:{type:DataTypes.STRING(40),allowNull:false},
  precio:{type:DataTypes.DECIMAL(12,2),allowNull:false},costo:{type:DataTypes.DECIMAL(12,2),allowNull:false},
  cantidad:{type:DataTypes.INTEGER.UNSIGNED,allowNull:false},subtotal:{type:DataTypes.DECIMAL(18,2),allowNull:false},
});
const PagoVenta = sequelize.define('pagos_venta', {
  id:{type:DataTypes.INTEGER.UNSIGNED,primaryKey:true,autoIncrement:true},ventaId:{type:DataTypes.INTEGER.UNSIGNED,allowNull:false,unique:true},
  medio:{type:DataTypes.STRING(20),allowNull:false},importe:{type:DataTypes.DECIMAL(18,2),allowNull:false},
  recibido:{type:DataTypes.DECIMAL(18,2),allowNull:false},cambio:{type:DataTypes.DECIMAL(18,2),allowNull:false},referencia:{type:DataTypes.STRING(120),allowNull:true},
});
Producto.belongsTo(Categoria, { foreignKey: 'categoriaId', as: 'categoria' });
const Proveedor=sequelize.define('proveedores',{
  id:{type:DataTypes.INTEGER.UNSIGNED,primaryKey:true,autoIncrement:true},nombre:{type:DataTypes.STRING(160),allowNull:false},
  identificacion:{type:DataTypes.STRING(80),allowNull:true,unique:true},contacto:{type:DataTypes.STRING(120),allowNull:false},
  telefono:{type:DataTypes.STRING(40),allowNull:false},correo:{type:DataTypes.STRING(160),allowNull:false},direccion:{type:DataTypes.STRING(240),allowNull:false},
  observaciones:{type:DataTypes.TEXT,allowNull:false},activo:{type:DataTypes.BOOLEAN,allowNull:false,defaultValue:true},
});
const Compra=sequelize.define('compras',{
  id:{type:DataTypes.INTEGER.UNSIGNED,primaryKey:true,autoIncrement:true},
  numero:{type:DataTypes.VIRTUAL,get(){return `C-${String(this.getDataValue('id')).padStart(8,'0')}`;}},
  operacion:{type:DataTypes.STRING(36),allowNull:false,unique:true},huella:{type:DataTypes.STRING(64),allowNull:false},
  proveedorId:{type:DataTypes.INTEGER.UNSIGNED,allowNull:false},proveedorNombre:{type:DataTypes.STRING(160),allowNull:false},
  proveedorIdentificacion:{type:DataTypes.STRING(80),allowNull:true},proveedorDatos:{type:DataTypes.JSON,allowNull:false},
  fechaRecepcion:{type:DataTypes.DATEONLY,allowNull:false},fechaRegistro:{type:DataTypes.DATE,allowNull:false},
  referencia:{type:DataTypes.STRING(120),allowNull:false},observaciones:{type:DataTypes.TEXT,allowNull:false},
  responsable:{type:DataTypes.STRING(120),allowNull:false},total:{type:DataTypes.DECIMAL(18,2),allowNull:false},
});
const DetalleCompra=sequelize.define('detalles_compra',{
  id:{type:DataTypes.INTEGER.UNSIGNED,primaryKey:true,autoIncrement:true},compraId:{type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  productoId:{type:DataTypes.INTEGER.UNSIGNED,allowNull:false},nombre:{type:DataTypes.STRING(120),allowNull:false},codigo:{type:DataTypes.STRING(40),allowNull:false},
  cantidad:{type:DataTypes.INTEGER.UNSIGNED,allowNull:false},costo:{type:DataTypes.DECIMAL(12,2),allowNull:false},
  costoAnterior:{type:DataTypes.DECIMAL(12,2),allowNull:false},precioVenta:{type:DataTypes.DECIMAL(12,2),allowNull:false},subtotal:{type:DataTypes.DECIMAL(18,2),allowNull:false},
});
Compra.hasMany(DetalleCompra,{foreignKey:'compraId',as:'detalles'});
Compra.belongsTo(Proveedor,{foreignKey:'proveedorId',as:'proveedor'});
Movimiento.belongsTo(Compra,{foreignKey:'compraId'});
Movimiento.belongsTo(Producto, { foreignKey: 'productoId' });
Venta.hasMany(DetalleVenta,{foreignKey:'ventaId',as:'detalles'});
Venta.hasOne(PagoVenta,{foreignKey:'ventaId',as:'pago'});
Movimiento.belongsTo(Venta,{foreignKey:'ventaId'});
module.exports = { sequelize, Categoria, Producto, Movimiento, Venta, DetalleVenta, PagoVenta, Proveedor, Compra, DetalleCompra };
