// Nunca carga datos de demostración en la base de trabajo.
process.env.DB_NAME = 'papeleria_promax_prueba';
const { sequelize, Categoria } = require('../src/modelos');
const { guardarProducto } = require('../src/servicios/inventario');
(async () => {
  try {
    for (const nombre of ['Cuadernos','Escritura','Papelería']) await Categoria.findOrCreate({where:{nombre}});
    const categorias = await Categoria.findAll();
    const { Producto } = require('../src/modelos');
    for (const [codigo,nombre,categoria,venta,stock] of [['DEMO-CUA-001','Cuaderno argollado','Cuadernos','12500','24'],['DEMO-LAP-001','Lapicero azul','Escritura','1500','6'],['DEMO-PAP-001','Resma de papel carta','Papelería','21000','18'],['DEMO-MAR-001','Marcador permanente','Escritura','3500','0']]) {
      if (await Producto.findOne({where:{codigo}})) continue;
      await guardarProducto({codigo,nombre,categoriaId:String(categorias.find(c=>c.nombre===categoria).id),venta,stock,compra:'0',minimo:'8',activo:'1',marca:'Demostración',ubicacion:'Prueba',barras:''});
    }
    console.log('Demostración cargada exclusivamente en papeleria_promax_prueba.');
  } catch { console.error('No se cargó la demostración. Comprueba la conexión y las migraciones de la base de prueba.'); process.exitCode=1; }
  finally { await sequelize.close(); }
})();
