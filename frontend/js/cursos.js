// Módulo de cursos: validación, CRUD y listado.

const Cursos = {
  validar(d, idActual) {
    const errores = [];
    if (!Validar.codigo(d.codigo)) errores.push('El código debe tener entre 2 y 10 letras, números o guiones.');
    else if (Datos.cursos.some(c => c.id !== idActual && c.codigo.toLowerCase() === d.codigo.toLowerCase())) {
      errores.push('Ya existe un curso con ese código.');
    }
    if (d.nombre.length < 3 || d.nombre.length > 60) errores.push('El nombre del curso debe tener entre 3 y 60 caracteres.');
    if (!Validar.numeroEntre(d.creditos, 1, 6)) errores.push('Los créditos deben estar entre 1 y 6.');
    return errores;
  },

  guardar(ev) {
    ev.preventDefault();
    const idActual = Number(document.getElementById('curId').value) || null;
    const d = {
      codigo: Validar.texto(document.getElementById('curCodigo').value).toUpperCase(),
      nombre: Validar.texto(document.getElementById('curNombre').value),
      creditos: document.getElementById('curCreditos').value,
    };
    const errores = this.validar(d, idActual);
    UI.mostrarErrores(document.getElementById('curErrores'), errores);
    if (errores.length) return;

    d.creditos = Number(d.creditos);
    if (idActual) {
      Object.assign(Datos.cursos.find(c => c.id === idActual), d);
    } else {
      Datos.cursos.push({ id: Datos.siguienteId(Datos.cursos), ...d });
    }
    Datos.guardar();
    this.limpiar();
    UI.mensaje(document.getElementById('curMsg'), idActual ? 'Curso actualizado.' : 'Curso guardado.');
    App.refrescar();
  },

  editar(curso) {
    document.getElementById('curId').value = curso.id;
    document.getElementById('curCodigo').value = curso.codigo;
    document.getElementById('curNombre').value = curso.nombre;
    document.getElementById('curCreditos').value = curso.creditos;
    document.getElementById('curTitulo').textContent = 'Editar curso';
    document.getElementById('curCancelar').hidden = false;
    document.getElementById('curNombre').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  limpiar() {
    document.getElementById('curForm').reset();
    document.getElementById('curId').value = '';
    document.getElementById('curTitulo').textContent = 'Registrar curso';
    document.getElementById('curCancelar').hidden = true;
    UI.mostrarErrores(document.getElementById('curErrores'), []);
  },

  eliminar(curso) {
    if (!confirm('¿Eliminar el curso ' + curso.nombre + '? También se borrarán sus notas.')) return;
    Datos.cursos = Datos.cursos.filter(c => c.id !== curso.id);
    Datos.notas = Datos.notas.filter(n => n.cursoId !== curso.id);
    Datos.guardar();
    App.refrescar();
  },

  render() {
    const tbody = document.getElementById('curFilas');
    UI.vaciar(tbody);
    Datos.cursos.forEach(c => {
      const tr = document.createElement('tr');
      tr.appendChild(UI.celda(c.codigo));
      tr.appendChild(UI.celda(c.nombre));
      tr.appendChild(UI.celda(c.creditos));
      tr.appendChild(UI.acciones(() => this.editar(c), () => this.eliminar(c)));
      tbody.appendChild(tr);
    });
    document.getElementById('curVacio').hidden = Datos.cursos.length > 0;
  },

  iniciar() {
    document.getElementById('curForm').addEventListener('submit', ev => this.guardar(ev));
    document.getElementById('curCancelar').addEventListener('click', () => this.limpiar());
  },
};
