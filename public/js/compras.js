(() => {
  const clave='papeleria-borrador-compra';
  const leer=()=>{try{return JSON.parse(sessionStorage.getItem(clave)||'null');}catch{return null;}};
  const confirmada=document.querySelector('[data-compra-confirmada]');
  if(confirmada&&leer()?.operacion===confirmada.dataset.compraConfirmada){try{sessionStorage.removeItem(clave);}catch{}}
  const contenedor=document.querySelector('[data-compra]');if(!contenedor)return;
  const dinero=window.Dinero,form=document.getElementById('formulario-compra'),campos=['proveedorId','fechaRecepcion','referencia','observaciones'];
  let lineas=JSON.parse(contenedor.dataset.lineas),pagina=1,paginas=1,secuencia=0,solicitud,temporizador;
  if(contenedor.dataset.revisar!=='1'){
    const borrador=leer();if(borrador&&Array.isArray(borrador.lineas)&&borrador.operacion){
      lineas=borrador.lineas;form.elements.operacion.value=borrador.operacion;
      for(const campo of campos)if(borrador[campo]!=null)form.elements[campo].value=borrador[campo];
    }
  }
  function nodo(tipo,texto,clase){const e=document.createElement(tipo);e.textContent=texto;if(clase)e.className=clase;return e;}
  function guardar(){try{const datos={operacion:form.elements.operacion.value,lineas};for(const campo of campos)datos[campo]=form.elements[campo].value;sessionStorage.setItem(clave,JSON.stringify(datos));}catch{}}
  function totales(){
    let total=0n,valido=true;
    for(const l of lineas){try{if(!/^\d+$/.test(String(l.cantidad))||Number(l.cantidad)<1)throw Error();total+=dinero.centavos(l.costo)*BigInt(l.cantidad);}catch{valido=false;}}
    let texto='Revisa cantidades y costos';try{if(valido)texto=dinero.formato(dinero.decimal(total));}catch{}
    contenedor.querySelector('[data-subtotal]').textContent=texto;contenedor.querySelector('[data-total]').textContent=texto;
    form.elements.carrito.value=JSON.stringify(lineas.map(l=>({productoId:l.productoId,cantidad:l.cantidad,costo:l.costo})));guardar();
  }
  function pintar(){
    const lista=contenedor.querySelector('[data-lineas-compra]');lista.replaceChildren();
    if(!lineas.length)lista.append(nodo('p','Agrega los productos que ya recibiste.','vacio-carrito'));
    for(const l of lineas){
      const fila=nodo('div','','carrito-linea'),producto=nodo('div','','carrito-producto');producto.append(nodo('strong',l.nombre),nodo('small',l.codigo));
      const controles=nodo('div','','compra-controles');
      for(const [campo,titulo,paso,maximo] of [['cantidad','Cantidad','1','2147483647'],['costo','Costo unitario (COP)','0.01','9999999999.99']]){
        const etiqueta=nodo('label',titulo),input=document.createElement('input');input.type='number';input.min=campo==='cantidad'?'1':'0';input.max=maximo;input.step=paso;input.required=true;input.value=l[campo];input.setAttribute('aria-label',`${titulo} de ${l.nombre}`);
        input.addEventListener('input',()=>{l[campo]=input.value;totales();});etiqueta.append(input);controles.append(etiqueta);
      }
      const quitar=nodo('button','Quitar','enlace');quitar.type='button';quitar.setAttribute('aria-label',`Quitar ${l.nombre}`);quitar.addEventListener('click',()=>{lineas=lineas.filter(x=>x.productoId!==l.productoId);pintar();document.getElementById('buscar-compra').focus();});
      controles.append(quitar);fila.append(producto,controles);lista.append(fila);
    }totales();
  }
  function catalogo(datos){
    const lista=contenedor.querySelector('[data-catalogo]');lista.replaceChildren();
    if(!datos.productos.length)lista.append(nodo('p','No hay productos activos que coincidan.','vacio-carrito'));
    for(const p of datos.productos){
      const fila=nodo('article','','catalogo-producto'),info=nodo('div','','catalogo-informacion');info.append(nodo('h3',p.nombre),nodo('p',p.codigo,'nota'),nodo('strong','Costo sugerido: '+dinero.formato(p.costo)));
      const acciones=nodo('div','','catalogo-accion');acciones.append(nodo('span',`Existencias: ${p.stock}`,'nota'));
      const agregar=nodo('button','Agregar','boton secundario');agregar.type='button';agregar.setAttribute('aria-label',`Agregar ${p.nombre}`);
      agregar.addEventListener('click',()=>{const l=lineas.find(l=>l.productoId===p.productoId);if(l)l.cantidad=Number(l.cantidad||0)+1;else lineas.push({...p,cantidad:1});pintar();contenedor.querySelector('[data-error-carrito]').textContent='';});
      acciones.append(agregar);fila.append(info,acciones);lista.append(fila);
    }
    pagina=datos.pagina;paginas=datos.paginas;contenedor.querySelector('[data-pagina]').textContent=`Página ${pagina} de ${paginas}`;
    contenedor.querySelector('[data-anterior]').disabled=pagina<=1;contenedor.querySelector('[data-siguiente]').disabled=pagina>=paginas;
  }
  const buscador=document.getElementById('buscar-compra'),estado=contenedor.querySelector('[data-estado-busqueda]');
  async function buscar(numero=1){
    clearTimeout(temporizador);const actual=++secuencia;solicitud?.abort();solicitud=new AbortController();estado.textContent='Buscando productos…';
    try{const respuesta=await fetch(`/compras/productos?${new URLSearchParams({q:buscador.value,pagina:numero})}`,{signal:solicitud.signal});if(!respuesta.ok)throw Error();const datos=await respuesta.json();if(actual!==secuencia)return;catalogo(datos);estado.textContent=`${datos.total} ${datos.total===1?'producto encontrado':'productos encontrados'}.`;}catch(e){if(e.name!=='AbortError'&&actual===secuencia)estado.textContent='No se pudo buscar. El detalle de recepción se conserva; reintenta la búsqueda.';}
  }
  buscador.addEventListener('input',()=>{clearTimeout(temporizador);++secuencia;solicitud?.abort();temporizador=setTimeout(()=>buscar(),300);});
  contenedor.querySelector('[data-buscar-compra]').addEventListener('submit',e=>{e.preventDefault();buscar();});
  contenedor.querySelector('[data-anterior]').addEventListener('click',()=>buscar(pagina-1));contenedor.querySelector('[data-siguiente]').addEventListener('click',()=>buscar(pagina+1));
  for(const campo of campos)form.elements[campo].addEventListener('input',guardar);
  form.addEventListener('submit',e=>{
    totales();if(!lineas.length){e.preventDefault();contenedor.querySelector('[data-error-carrito]').textContent='Agrega al menos un producto recibido.';return;}
    const b=form.querySelector('button[type=submit]');b.disabled=true;b.textContent='Registrando…';contenedor.querySelector('[data-estado-compra]').textContent='Espera la confirmación. Un reintento usará la misma operación.';
  });
  addEventListener('pageshow',()=>{const b=form.querySelector('button[type=submit]');b.disabled=false;b.textContent='Confirmar recepción';});pintar();buscar();
})();
