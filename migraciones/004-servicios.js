const {DataTypes:D}=require('sequelize');
module.exports={
  async up({context:q}){
    const id=()=>({type:D.INTEGER.UNSIGNED,primaryKey:true,autoIncrement:true});
    const texto=n=>({type:D.STRING(n),allowNull:false});
    const opciones={engine:'InnoDB',charset:'utf8mb4',collate:'utf8mb4_unicode_ci'};
    const tablas=await q.showAllTables();
    if(!tablas.includes('servicios'))await q.createTable('servicios',{
      id:id(),codigo:{...texto(40),unique:true},nombre:texto(120),categoria:texto(80),unidad:texto(40),
      precio:{type:D.DECIMAL(12,2),allowNull:false},descripcion:{type:D.TEXT,allowNull:false},activo:{type:D.BOOLEAN,allowNull:false,defaultValue:true},
    },opciones);
    if(!tablas.includes('detalles_servicio'))await q.createTable('detalles_servicio',{
      id:id(),ventaId:{type:D.INTEGER.UNSIGNED,allowNull:false,references:{model:'ventas',key:'id'},onDelete:'RESTRICT'},
      servicioId:{type:D.INTEGER.UNSIGNED,allowNull:false,references:{model:'servicios',key:'id'},onDelete:'RESTRICT'},
      codigo:texto(40),nombre:texto(120),unidad:texto(40),precio:{type:D.DECIMAL(12,2),allowNull:false},
      cantidad:{type:D.INTEGER.UNSIGNED,allowNull:false},subtotal:{type:D.DECIMAL(18,2),allowNull:false},
    },opciones);
    const [restricciones]=await q.sequelize.query("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA=DATABASE() AND CONSTRAINT_TYPE='CHECK'");
    const nombres=restricciones.map(r=>r.CONSTRAINT_NAME);
    for(const [tabla,nombre,regla] of [['servicios','servicios_precio_positivo','precio > 0'],['detalles_servicio','detalles_servicio_validos','precio > 0 AND cantidad > 0 AND subtotal > 0']])
      if(!nombres.includes(nombre))await q.sequelize.query(`ALTER TABLE \`${tabla}\` ADD CONSTRAINT \`${nombre}\` CHECK (${regla})`);
  },
};
