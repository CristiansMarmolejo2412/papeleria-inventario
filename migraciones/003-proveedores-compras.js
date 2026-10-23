const {DataTypes:D}=require('sequelize');
module.exports={
  async up({context:q}) {
    const id=()=>({type:D.INTEGER.UNSIGNED,primaryKey:true,autoIncrement:true});
    const texto=n=>({type:D.STRING(n),allowNull:false});
    const referencia=(tabla)=>({type:D.INTEGER.UNSIGNED,allowNull:false,references:{model:tabla,key:'id'},onDelete:'RESTRICT',onUpdate:'CASCADE'});
    const dinero=()=>({type:D.DECIMAL(18,2),allowNull:false});
    const opciones={engine:'InnoDB',charset:'utf8mb4',collate:'utf8mb4_unicode_ci'};
    const tablas=await q.showAllTables();
    if(!tablas.includes('proveedores'))await q.createTable('proveedores',{
      id:id(),nombre:texto(160),identificacion:{type:D.STRING(80),allowNull:true,unique:true},
      contacto:texto(120),telefono:texto(40),correo:texto(160),direccion:texto(240),observaciones:{type:D.TEXT,allowNull:false},
      activo:{type:D.BOOLEAN,allowNull:false,defaultValue:true},
    },opciones);
    if(!tablas.includes('compras'))await q.createTable('compras',{
      id:id(),operacion:{...texto(36),unique:true},huella:texto(64),proveedorId:referencia('proveedores'),
      proveedorNombre:texto(160),proveedorIdentificacion:{type:D.STRING(80),allowNull:true},proveedorDatos:{type:D.JSON,allowNull:false},
      fechaRecepcion:{type:D.DATEONLY,allowNull:false},fechaRegistro:{type:D.DATE,allowNull:false},
      referencia:texto(120),observaciones:{type:D.TEXT,allowNull:false},responsable:texto(120),total:dinero(),
    },opciones);
    if(!tablas.includes('detalles_compra'))await q.createTable('detalles_compra',{
      id:id(),compraId:referencia('compras'),productoId:referencia('productos'),nombre:texto(120),codigo:texto(40),
      cantidad:{type:D.INTEGER.UNSIGNED,allowNull:false},costo:{type:D.DECIMAL(12,2),allowNull:false},
      costoAnterior:{type:D.DECIMAL(12,2),allowNull:false},precioVenta:{type:D.DECIMAL(12,2),allowNull:false},subtotal:dinero(),
    },opciones);
    const columnas=await q.describeTable('movimientos');
    if(!columnas.compraId)await q.addColumn('movimientos','compraId',{...referencia('compras'),allowNull:true});
    const indices=await q.showIndex('compras');
    if(!indices.some(i=>i.name==='compras_fecha_proveedor'))await q.addIndex('compras',['fechaRecepcion','proveedorId'],{name:'compras_fecha_proveedor'});
    const [restricciones]=await q.sequelize.query("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA=DATABASE() AND CONSTRAINT_TYPE='CHECK'");
    const nombres=restricciones.map(r=>r.CONSTRAINT_NAME);
    for(const [tabla,nombre,regla] of [['compras','compras_total_valido','total >= 0'],['detalles_compra','detalles_compra_validos','cantidad > 0 AND costo >= 0 AND costoAnterior >= 0 AND precioVenta >= 0 AND subtotal >= 0']])
      if(!nombres.includes(nombre))await q.sequelize.query(`ALTER TABLE \`${tabla}\` ADD CONSTRAINT \`${nombre}\` CHECK (${regla})`);
  },
};
