// Punto de entrada: navegación entre vistas y panel de inicio.

const App = {
  vistas: ['inicio', 'estudiantes', 'cursos', 'notas'],

  iniciar() {
    Datos.iniciar();
    Estudiantes.iniciar();
    Cursos.iniciar();
    Notas.iniciar();

    window.addEventListener('hashchange', () => this.mostrar());
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('mainNav');
    toggle.addEventListener('click', () => toggle.setAttribute('aria-expanded', nav.classList.toggle('open')));
    nav.addEventListener('click', () => nav.classList.remove('open'));

    this.refrescar();
    this.mostrar();
  },

  mostrar() {
    const hash = location.hash.replace('#', '');
    const actual = this.vistas.includes(hash) ? hash : 'inicio';
    this.vistas.forEach(v => {
      document.getElementById('vista-' + v).hidden = v !== actual;
    });
    document.querySelectorAll('[data-nav]').forEach(a => {
      a.classList.toggle('activo', a.dataset.nav === actual);
    });
    window.scrollTo(0, 0);
  },

  refrescar() {
    Estudiantes.render();
    Cursos.render();
    Notas.render();
    this.renderInicio();
  },

  renderInicio() {
    document.getElementById('statTotal').textContent = Datos.estudiantes.length;
    document.getElementById('statCursos').textContent = Datos.cursos.length;
    const notas = Datos.notas.map(n => n.nota);
    const general = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
    document.getElementById('statPromedio').textContent = general.toFixed(1);

    // Mejores promedios
    const ranking = Datos.estudiantes
      .map(e => ({ e, prom: Datos.promedioEstudiante(e.id) }))
      .filter(x => x.prom !== null)
      .sort((a, b) => b.prom - a.prom)
      .slice(0, 3);
    const lista = document.getElementById('topList');
    UI.vaciar(lista);
    ranking.forEach(x => {
      const li = UI.crear('li');
      li.appendChild(UI.crear('span', '', x.e.nombre));
      li.appendChild(UI.crear('strong', '', x.prom.toFixed(1)));
      lista.appendChild(li);
    });
    document.getElementById('topVacio').hidden = ranking.length > 0;

    // Estudiantes por estado
    const estados = document.getElementById('estadoList');
    UI.vaciar(estados);
    ['Activo', 'Inactivo'].forEach(est => {
      const li = UI.crear('li');
      li.appendChild(UI.crear('span', 'badge ' + est.toLowerCase(), est));
      li.appendChild(UI.crear('strong', '', Datos.estudiantes.filter(e => e.estado === est).length));
      estados.appendChild(li);
    });
  },
};

document.addEventListener('DOMContentLoaded', () => App.iniciar());
