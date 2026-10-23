(() => {
  const botonesMenu = document.querySelectorAll('[data-menu]');
  function actualizarMenu() {
    const movil = matchMedia('(max-width:760px)').matches;
    botonesMenu.forEach(b => b.setAttribute('aria-expanded', String(movil ? document.body.classList.contains('menu-abierto') : !document.body.classList.contains('menu-plegado'))));
    document.getElementById('menu').inert = movil && !document.body.classList.contains('menu-abierto');
  }
  botonesMenu.forEach(boton => boton.addEventListener('click', () => {
    const movil = matchMedia('(max-width:760px)').matches;
    document.body.classList.toggle(movil ? 'menu-abierto' : 'menu-plegado');
    actualizarMenu();
    if (movil && document.body.classList.contains('menu-abierto')) document.querySelector('.cerrar-menu').focus();
    else document.querySelector('.boton-menu').focus();
  }));
  addEventListener('resize', actualizarMenu); actualizarMenu();
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-abierto')) {
      document.body.classList.remove('menu-abierto'); actualizarMenu(); document.querySelector('.boton-menu').focus();
    }
  });
  document.querySelectorAll('[data-cerrar-aviso]').forEach(b => b.addEventListener('click', () => b.closest('.aviso').remove()));
  document.querySelectorAll('form[data-guardar]').forEach(form => form.addEventListener('submit', e => {
    if (form.dataset.confirmar && !confirm(form.dataset.confirmar)) { e.preventDefault(); return; }
    form.querySelectorAll('button[type=submit]').forEach(b => { b.disabled = true; b.textContent = 'Guardando…'; });
  }));
  const formulario = document.querySelector('[data-busqueda]');
  if (!formulario) return;
  let temporizador, solicitud, secuencia = 0;
  const resultados = document.querySelector('[data-resultados]');
  const campo = formulario.querySelector('[name=q]');
  async function buscar() {
    const actual = ++secuencia;
    solicitud?.abort(); solicitud = new AbortController();
    const url = `${formulario.action}?${new URLSearchParams(new FormData(formulario))}`;
    resultados.setAttribute('aria-busy','true');
    try {
      const respuesta = await fetch(url, { signal: solicitud.signal });
      if (!respuesta.ok) throw new Error('Búsqueda no disponible');
      const documento = new DOMParser().parseFromString(await respuesta.text(), 'text/html');
      if (actual !== secuencia) return;
      resultados.innerHTML = documento.querySelector('[data-resultados]').innerHTML;
      history.replaceState(null, '', url);
      // Las pestañas deben conservar los filtros de la consulta más reciente.
      document.querySelectorAll('.pestanas a').forEach(a => {
        const destino = new URL(a.href); const nuevos = new URL(url);
        nuevos.searchParams.set('disponibilidad',destino.searchParams.get('disponibilidad') || '');
        a.href = nuevos;
      });
    } catch(error) {
      if (error.name !== 'AbortError' && actual === secuencia) {
        resultados.innerHTML = '<p role="alert" class="aviso error">No pudimos buscar. Comprueba MySQL y pulsa Buscar para reintentar.</p>';
      }
    } finally { if (actual === secuencia) resultados.setAttribute('aria-busy','false'); }
  }
  campo.addEventListener('input', () => {
    clearTimeout(temporizador); ++secuencia; solicitud?.abort();
    temporizador = setTimeout(buscar, 300);
  });
  formulario.querySelectorAll('select').forEach(select => select.addEventListener('change', () => { clearTimeout(temporizador); buscar(); }));
  formulario.addEventListener('submit', e => { e.preventDefault(); clearTimeout(temporizador); buscar(); });
})();
