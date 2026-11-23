// Utilidades para construir y actualizar la interfaz.

const UI = {
  crear(etiqueta, clase, texto) {
    const nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
  },

  vaciar(nodo) {
    while (nodo.firstChild) nodo.removeChild(nodo.firstChild);
  },

  mostrarErrores(lista, errores) {
    this.vaciar(lista);
    errores.forEach(m => lista.appendChild(this.crear('li', '', m)));
    lista.hidden = errores.length === 0;
  },

  mensaje(nodo, texto) {
    nodo.textContent = texto;
    clearTimeout(nodo._t);
    nodo._t = setTimeout(() => { nodo.textContent = ''; }, 3000);
  },

  llenarSelect(select, opciones, placeholder) {
    const actual = select.value;
    this.vaciar(select);
    if (placeholder) select.appendChild(this.crear('option', '', placeholder)).value = '';
    opciones.forEach(o => {
      const op = this.crear('option', '', o.texto);
      op.value = o.valor;
      select.appendChild(op);
    });
    if ([...select.options].some(o => o.value === actual)) select.value = actual;
  },

  avatar(nombre) {
    const colores = ['#3b3fd6', '#7c4dff', '#19b394', '#e4572e', '#2e86de'];
    const span = this.crear('span', 'avatar',
      nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase());
    span.style.background = colores[nombre.length % colores.length];
    return span;
  },

  celda(texto) {
    return this.crear('td', '', texto);
  },

  acciones(onEditar, onEliminar, extra) {
    const td = this.crear('td', 'acciones');
    if (extra) {
      const x = this.crear('button', 'btn-mini ia', extra.texto);
      x.type = 'button';
      x.title = extra.titulo || extra.texto;
      x.addEventListener('click', extra.accion);
      td.appendChild(x);
    }
    if (onEditar) {
      const b = this.crear('button', 'btn-mini', 'Editar');
      b.type = 'button';
      b.addEventListener('click', onEditar);
      td.appendChild(b);
    }
    const d = this.crear('button', 'btn-mini peligro', 'Eliminar');
    d.type = 'button';
    d.addEventListener('click', onEliminar);
    td.appendChild(d);
    return td;
  },
};
