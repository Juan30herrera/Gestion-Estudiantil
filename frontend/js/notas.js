// Módulo de notas: asigna una nota a un estudiante en un curso.

const Notas = {
  guardar(ev) {
    ev.preventDefault();
    const estudianteId = Number(document.getElementById('notaEstudiante').value);
    const cursoId = Number(document.getElementById('notaCurso').value);
    const valor = document.getElementById('notaValor').value;

    const errores = [];
    if (!estudianteId) errores.push('Selecciona un estudiante.');
    if (!cursoId) errores.push('Selecciona un curso.');
    if (!Validar.numeroEntre(valor, 0, 5)) errores.push('La nota debe estar entre 0.0 y 5.0.');
    UI.mostrarErrores(document.getElementById('notaErrores'), errores);
    if (errores.length) return;

    const nota = Math.round(Number(valor) * 10) / 10;
    const existente = Datos.notas.find(n => n.estudianteId === estudianteId && n.cursoId === cursoId);
    if (existente) {
      existente.nota = nota;
    } else {
      Datos.notas.push({ id: Datos.siguienteId(Datos.notas), estudianteId, cursoId, nota });
    }
    Datos.guardar();
    document.getElementById('notaForm').reset();
    UI.mensaje(document.getElementById('notaMsg'), existente ? 'Nota actualizada.' : 'Nota guardada.');
    App.refrescar();
  },

  eliminar(n) {
    if (!confirm('¿Eliminar esta nota?')) return;
    Datos.notas = Datos.notas.filter(x => x.id !== n.id);
    Datos.guardar();
    App.refrescar();
  },

  render() {
    UI.llenarSelect(document.getElementById('notaEstudiante'),
      Datos.estudiantes.map(e => ({ valor: e.id, texto: e.codigo + ' · ' + e.nombre })), 'Selecciona un estudiante');
    UI.llenarSelect(document.getElementById('notaCurso'),
      Datos.cursos.map(c => ({ valor: c.id, texto: c.codigo + ' · ' + c.nombre })), 'Selecciona un curso');

    const tbody = document.getElementById('notaFilas');
    UI.vaciar(tbody);
    Datos.notas.forEach(n => {
      const est = Datos.estudiantes.find(e => e.id === n.estudianteId);
      const cur = Datos.cursos.find(c => c.id === n.cursoId);
      if (!est || !cur) return;
      const tr = document.createElement('tr');
      tr.appendChild(UI.celda(est.nombre));
      tr.appendChild(UI.celda(cur.nombre));
      tr.appendChild(UI.celda(n.nota.toFixed(1)));
      const aprobado = n.nota >= 3;
      const td = UI.crear('td');
      td.appendChild(UI.crear('span', 'badge ' + (aprobado ? 'activo' : 'inactivo'), aprobado ? 'Aprobado' : 'Reprobado'));
      tr.appendChild(td);
      tr.appendChild(UI.acciones(null, () => this.eliminar(n)));
      tbody.appendChild(tr);
    });
    document.getElementById('notaVacio').hidden = tbody.children.length > 0;
  },

  iniciar() {
    document.getElementById('notaForm').addEventListener('submit', ev => this.guardar(ev));
  },
};
