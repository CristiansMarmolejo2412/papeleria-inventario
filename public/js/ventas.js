(() => {
  const clave='papeleria-carrito-venta';
  const leer=()=>{try{return JSON.parse(sessionStorage.getItem(clave)||'null');}catch{return null;}};
  const comprobante=document.querySelector('[data-comprobante]');
  if(comprobante && leer()?.operacion===comprobante.dataset.comprobante) {try{sessionStorage.removeItem(clave);}catch{}}
  document.querySelector('[data-imprimir]')?.addEventListener('click',()=>window.print());
  const contenedor=document.querySelector('[data-venta]');
  if(!contenedor)return;
  const dinero=window.Dinero,form=document.getElementById('formulario-venta');
  const operacion=form.elements.operacion,medio=form.elements.medio,recibido=form.elements.recibido,referencia=form.elements.referencia;
  let lineas=JSON.parse(contenedor.dataset.lineas),catalogo=JSON.parse(contenedor.dataset.productos),pagina=1,paginas=1;
  let temporizador,solicitud,secuencia=0;
  if(contenedor.dataset.revisar!=='1') {
    const borrador=leer();
    if(borrador && Array.isArray(borrador.lineas) && borrador.operacion) {
      lineas=borrador.lineas;operacion.value=borrador.operacion;medio.value=borrador.medio||'efectivo';recibido.value=borrador.recibido||'';referencia.value=borrador.referencia||'';
    }
  }
  function elemento(tipo,texto,clase) {
    const nodo=document.createElement(tipo);nodo.textContent=texto;if(clase)nodo.className=clase;return nodo;
  }
  function guardar() {try{sessionStorage.setItem(clave,JSON.stringify({operacion:operacion.value,lineas,medio:medio.value,recibido:recibido.value,referencia:referencia.value}));}catch{}}
  function actualizarTotales() {
    let total=0n,valido=true;
    for(const l of lineas) {
      try {if(!/^\d+$/.test(String(l.cantidad)) || Number(l.cantidad)<1)throw Error();total+=dinero.centavos(l.precio)*BigInt(l.cantidad);}catch{valido=false;}
    }
    let texto='Por confirmar';
    try{if(valido)texto=dinero.formato(dinero.decimal(total));}catch{valido=false;}
    contenedor.querySelector('[data-subtotal]').textContent=texto;contenedor.querySelector('[data-total]').textContent=texto;
    let cambio='—';
    if(medio.value==='efectivo' && valido && recibido.value) {
      try {const diferencia=dinero.centavos(recibido.value)-total;cambio=diferencia<0n?'Pago insuficiente':dinero.formato(dinero.decimal(diferencia));}catch{cambio='Revisa el importe';}
    }
    contenedor.querySelector('[data-cambio]').textContent=cambio;
    contenedor.querySelector('[data-efectivo]').hidden=medio.value!=='efectivo';
    contenedor.querySelector('[data-transferencia]').hidden=medio.value!=='transferencia';
    recibido.required=medio.value==='efectivo';
    recibido.disabled=medio.value!=='efectivo';referencia.disabled=medio.value!=='transferencia';
    form.elements.carrito.value=JSON.stringify(lineas.map(l=>({productoId:l.productoId,cantidad:l.cantidad})));
    guardar();
  }
  function pintarCarrito() {
    const lista=contenedor.querySelector('[data-carrito]');lista.replaceChildren();
    if(!lineas.length)lista.append(elemento('p','Agrega productos para preparar la venta.','vacio-carrito'));
    for(const linea of lineas) {
      const fila=elemento('div','','carrito-linea');
      const datos=elemento('div','','carrito-producto');datos.append(elemento('strong',linea.nombre),elemento('small',`${linea.codigo} · ${linea.precio===null?'Precio por confirmar':dinero.formato(linea.precio)}`));
      const controles=elemento('div','','carrito-controles');
      const etiqueta=elemento('label','Cantidad');const cantidad=document.createElement('input');cantidad.type='number';cantidad.min='1';cantidad.max='2147483647';cantidad.step='1';cantidad.value=linea.cantidad;cantidad.required=true;cantidad.setAttribute('aria-label',`Cantidad de ${linea.nombre}`);
      cantidad.addEventListener('input',()=>{linea.cantidad=cantidad.value;actualizarTotales();});etiqueta.append(cantidad);
      const quitar=elemento('button','Quitar','enlace');quitar.type='button';quitar.setAttribute('aria-label',`Quitar ${linea.nombre}`);quitar.addEventListener('click',()=>{lineas=lineas.filter(l=>l.productoId!==linea.productoId);pintarCarrito();contenedor.querySelector('#buscar-venta').focus();});
      controles.append(etiqueta,quitar);fila.append(datos,controles);lista.append(fila);
    }
    actualizarTotales();
  }
  function pintarCatalogo() {
    const lista=contenedor.querySelector('[data-catalogo]');lista.replaceChildren();
    if(!catalogo.length)lista.append(elemento('p','No hay productos que coincidan con la búsqueda.','vacio-carrito'));
    for(const producto of catalogo) {
      const fila=elemento('article','','catalogo-producto');const info=elemento('div','','catalogo-informacion');
      info.append(elemento('h3',producto.nombre),elemento('p',producto.codigo,'nota'),elemento('strong',dinero.formato(producto.precio)));
      const accion=elemento('div','','catalogo-accion');accion.append(elemento('span',`${producto.stock} ${producto.stock===1?'unidad disponible':'unidades disponibles'}`,'nota'));
      const agregar=elemento('button',producto.stock>0?'Agregar':'Agotado','boton secundario');agregar.type='button';agregar.disabled=producto.stock===0;agregar.setAttribute('aria-label',`Agregar ${producto.nombre}`);
      agregar.addEventListener('click',()=>{
        const existente=lineas.find(l=>l.productoId===producto.productoId);
        if(existente){Object.assign(existente,producto,{cantidad:Number(existente.cantidad||0)+1});}
        else lineas.push({...producto,cantidad:1});
        pintarCarrito();contenedor.querySelector('[data-error-carrito]').textContent='';
      });
      accion.append(agregar);fila.append(info,accion);lista.append(fila);
    }
    contenedor.querySelector('[data-catalogo-pagina]').textContent=`Página ${pagina} de ${paginas}`;
    contenedor.querySelector('[data-catalogo-anterior]').disabled=pagina<=1;contenedor.querySelector('[data-catalogo-siguiente]').disabled=pagina>=paginas;
  }
  const formularioBusqueda=contenedor.querySelector('[data-buscar-productos]'),buscador=document.getElementById('buscar-venta');
  async function buscar(numero=1) {
    clearTimeout(temporizador);const actual=++secuencia;solicitud?.abort();solicitud=new AbortController();
    const estado=contenedor.querySelector('[data-estado-busqueda]');estado.textContent='Buscando productos…';
    try {
      const respuesta=await fetch(`/ventas/productos?${new URLSearchParams({q:buscador.value,pagina:numero})}`,{signal:solicitud.signal});
      if(!respuesta.ok)throw Error();const datos=await respuesta.json();if(actual!==secuencia)return;
      catalogo=datos.productos;pagina=datos.pagina;paginas=datos.paginas;pintarCatalogo();estado.textContent=`${datos.total} ${datos.total===1?'producto encontrado':'productos encontrados'}.`;
    }catch(e){if(e.name!=='AbortError' && actual===secuencia)estado.textContent='No se pudo buscar. Tu carrito se conserva; pulsa Buscar para reintentar.';}
  }
  buscador.addEventListener('input',()=>{clearTimeout(temporizador);++secuencia;solicitud?.abort();temporizador=setTimeout(()=>buscar(),300);});
  formularioBusqueda.addEventListener('submit',e=>{e.preventDefault();buscar();});
  contenedor.querySelector('[data-catalogo-anterior]').addEventListener('click',()=>buscar(pagina-1));
  contenedor.querySelector('[data-catalogo-siguiente]').addEventListener('click',()=>buscar(pagina+1));
  for(const campo of [medio,recibido,referencia])campo.addEventListener('input',actualizarTotales);
  form.addEventListener('submit',e=>{
    actualizarTotales();
    if(!lineas.length){e.preventDefault();contenedor.querySelector('[data-error-carrito]').textContent='Agrega al menos un producto.';return;}
    const boton=form.querySelector('button[type=submit]');boton.disabled=true;boton.textContent='Confirmando…';
    contenedor.querySelector('[data-estado-venta]').textContent='Registrando venta. Espera la confirmación antes de reintentar.';
  });
  addEventListener('pageshow',()=>{const b=form.querySelector('button[type=submit]');b.disabled=false;b.textContent='Confirmar venta';});
  pintarCarrito();pintarCatalogo();buscar();
})();
