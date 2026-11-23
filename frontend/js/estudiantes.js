// Módulo de estudiantes: validación, CRUD y listado.

const Estudiantes = {
  validar(d, idActual) {
    const errores = [];
    if (!Validar.codigo(d.codigo)) errores.push('El código debe tener entre 2 y 10 letras, números o guiones.');
    else if (Datos.estudiantes.some(e => e.id !== idActual && e.codigo.toLowerCase() === d.codigo.toLowerCase())) {
      errores.push('Ya existe un estudiante con ese código.');
    }
    if (!Validar.nombre(d.nombre)) errores.push('El nombre debe tener entre 3 y 60 letras.');
    if (!Validar.correo(d.correo)) errores.push('Escribe un correo válido (ejemplo@correo.com).');
    if (!d.programa) errores.push('Selecciona un programa.');
    if (!Validar.numeroEntre(d.semestre, 1, 10)) errores.push('El semestre debe estar entre 1 y 10.');
    return errores;
  },

  leerFormulario() {
    return {
      codigo: Validar.texto(document.getElementById('estCodigo').value).toUpperCase(),
      nombre: Validar.texto(document.getElementById('estNombre').value),
      correo: Validar.texto(document.getElementById('estCorreo').value).toLowerCase(),
      programa: document.getElementById('estPrograma').value,
      semestre: document.getElementById('estSemestre').value,
      estado: document.getElementById('estEstado').value,
    };
  },

  guardar(ev) {
    ev.preventDefault();
    const idActual = Number(document.getElementById('estId').value) || null;
    const d = this.leerFormulario();
    const errores = this.validar(d, idActual);
    UI.mostrarErrores(document.getElementById('estErrores'), errores);
    if (errores.length) return;

    d.semestre = Number(d.semestre);
    if (idActual) {
      Object.assign(Datos.estudiantes.find(e => e.id === idActual), d);
    } else {
      Datos.estudiantes.push({ id: Datos.siguienteId(Datos.estudiantes), ...d });
    }
    Datos.guardar();
    this.limpiar();
    UI.mensaje(document.getElementById('estMsg'), idActual ? 'Estudiante actualizado.' : 'Estudiante guardado.');
    App.refrescar();
  },

  editar(est) {
    document.getElementById('estId').value = est.id;
    document.getElementById('estCodigo').value = est.codigo;
    document.getElementById('estNombre').value = est.nombre;
    document.getElementById('estCorreo').value = est.correo;
    document.getElementById('estPrograma').value = est.programa;
    document.getElementById('estSemestre').value = est.semestre;
    document.getElementById('estEstado').value = est.estado;
    document.getElementById('estTitulo').textContent = 'Editar estudiante';
    document.getElementById('estGuardar').textContent = 'Actualizar estudiante';
    document.getElementById('estCancelar').hidden = false;
    document.getElementById('estNombre').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  limpiar() {
    document.getElementById('estForm').reset();
    document.getElementById('estId').value = '';
    document.getElementById('estTitulo').textContent = 'Registrar estudiante';
    document.getElementById('estGuardar').textContent = 'Guardar estudiante';
    document.getElementById('estCancelar').hidden = true;
    UI.mostrarErrores(document.getElementById('estErrores'), []);
  },

  eliminar(est) {
    if (!confirm('¿Eliminar a ' + est.nombre + '? También se borrarán sus notas.')) return;
    Datos.estudiantes = Datos.estudiantes.filter(e => e.id !== est.id);
    Datos.notas = Datos.notas.filter(n => n.estudianteId !== est.id);
    Datos.guardar();
    App.refrescar();
  },

  render() {
    const q = document.getElementById('estBuscar').value.trim().toLowerCase();
    const prog = document.getElementById('estFiltro').value;
    const lista = Datos.estudiantes.filter(e =>
      (!prog || e.programa === prog) &&
      (e.nombre.toLowerCase().includes(q) || e.codigo.toLowerCase().includes(q) || e.correo.toLowerCase().includes(q)));

    const tbody = document.getElementById('estFilas');
    UI.vaciar(tbody);
    lista.forEach(e => {
      const tr = document.createElement('tr');

      const tdNombre = UI.crear('td');
      const persona = UI.crear('div', 'person');
      persona.appendChild(UI.avatar(e.nombre));
      const datos = UI.crear('div');
      datos.appendChild(UI.crear('div', '', e.nombre));
      datos.appendChild(UI.crear('small', 'muted', e.correo));
      persona.appendChild(datos);
      tdNombre.appendChild(persona);
      tr.appendChild(tdNombre);

      const prom = Datos.promedioEstudiante(e.id);
      tr.appendChild(UI.celda(e.codigo));
      tr.appendChild(UI.celda(e.programa));
      tr.appendChild(UI.celda(e.semestre));
      tr.appendChild(UI.celda(prom === null ? '—' : prom.toFixed(1)));

      const tdEstado = UI.crear('td');
      tdEstado.appendChild(UI.crear('span', 'badge ' + e.estado.toLowerCase(), e.estado));
      tr.appendChild(tdEstado);

      tr.appendChild(UI.acciones(() => this.editar(e), () => this.eliminar(e),
        { texto: '✨ IA', titulo: 'Analizar rendimiento con IA', accion: () => IA.analizarDesde(e.id) }));
      tbody.appendChild(tr);
    });
    document.getElementById('estVacio').hidden = lista.length > 0;
  },

  iniciar() {
    const progs = PROGRAMAS.map(p => ({ valor: p, texto: p }));
    UI.llenarSelect(document.getElementById('estPrograma'), progs, 'Selecciona uno');
    UI.llenarSelect(document.getElementById('estFiltro'), progs, 'Todos los programas');
    document.getElementById('estForm').addEventListener('submit', ev => this.guardar(ev));
    document.getElementById('estCancelar').addEventListener('click', () => this.limpiar());
    document.getElementById('estBuscar').addEventListener('input', () => this.render());
    document.getElementById('estFiltro').addEventListener('change', () => this.render());
  },
};
