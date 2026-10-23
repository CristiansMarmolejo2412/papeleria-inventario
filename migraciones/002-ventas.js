const { DataTypes: D } = require('sequelize');
module.exports = {
  async up({ context: q }) {
    const id = () => ({type:D.INTEGER.UNSIGNED,primaryKey:true,autoIncrement:true});
    const texto = n => ({type:D.STRING(n),allowNull:false});
    const dinero = () => ({type:D.DECIMAL(18,2),allowNull:false});
    const ventaId = () => ({type:D.INTEGER.UNSIGNED,allowNull:false,references:{model:'ventas',key:'id'},onDelete:'RESTRICT',onUpdate:'CASCADE'});
    const opciones = {engine:'InnoDB',charset:'utf8mb4',collate:'utf8mb4_unicode_ci'};
    const tablas = await q.showAllTables();
    if (!tablas.includes('ventas')) await q.createTable('ventas', {
      id:id(),operacion:{...texto(36),unique:true},huella:texto(64),fecha:{type:D.DATE,allowNull:false},
      cliente:{...texto(120),defaultValue:'Consumidor final'},responsable:texto(120),total:dinero(),
    },opciones);
    if (!tablas.includes('detalles_venta')) await q.createTable('detalles_venta', {
      id:id(),ventaId:ventaId(),productoId:{type:D.INTEGER.UNSIGNED,allowNull:false,references:{model:'productos',key:'id'},onDelete:'RESTRICT'},
      nombre:texto(120),codigo:texto(40),precio:{type:D.DECIMAL(12,2),allowNull:false},costo:{type:D.DECIMAL(12,2),allowNull:false},
      cantidad:{type:D.INTEGER.UNSIGNED,allowNull:false},subtotal:dinero(),
    },opciones);
    if (!tablas.includes('pagos_venta')) await q.createTable('pagos_venta', {
      id:id(),ventaId:{...ventaId(),unique:true},medio:texto(20),importe:dinero(),recibido:dinero(),cambio:dinero(),referencia:{type:D.STRING(120),allowNull:true},
    },opciones);
    const columnas = await q.describeTable('movimientos');
    if (!columnas.ventaId) await q.addColumn('movimientos','ventaId',{...ventaId(),allowNull:true});
    const indices = await q.showIndex('ventas');
    if (!indices.some(i=>i.name==='ventas_fecha')) await q.addIndex('ventas',['fecha'],{name:'ventas_fecha'});
    const [restricciones] = await q.sequelize.query("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND CONSTRAINT_TYPE = 'CHECK'");
    const nombres = restricciones.map(r=>r.CONSTRAINT_NAME);
    for (const [tabla,nombre,regla] of [
      ['ventas','ventas_total_valido','total >= 0'],
      ['detalles_venta','detalles_valores_validos','cantidad > 0 AND precio >= 0 AND costo >= 0 AND subtotal >= 0'],
      ['pagos_venta','pagos_valores_validos',"importe > 0 AND recibido >= importe AND cambio = recibido - importe AND medio IN ('efectivo','transferencia')"],
    ]) if (!nombres.includes(nombre)) await q.sequelize.query(`ALTER TABLE \`${tabla}\` ADD CONSTRAINT \`${nombre}\` CHECK (${regla})`);
  },
};
