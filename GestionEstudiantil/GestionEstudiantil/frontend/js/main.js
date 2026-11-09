// Datos de ejemplo (solo en memoria)
const estudiantes = [
  { codigo: 'E001', nombre: 'Laura Gómez', programa: 'Ingeniería de Software', semestre: 5, promedio: 4.3, estado: 'Activo' },
  { codigo: 'E002', nombre: 'Carlos Ramírez', programa: 'Ingeniería Industrial', semestre: 3, promedio: 3.8, estado: 'Activo' },
  { codigo: 'E003', nombre: 'Daniela Torres', programa: 'Administración', semestre: 7, promedio: 4.0, estado: 'Activo' },
  { codigo: 'E004', nombre: 'Andrés Pardo', programa: 'Contaduría', semestre: 2, promedio: 3.2, estado: 'Inactivo' },
];

const colores = ['#3b3fd6', '#7c4dff', '#19b394', '#e4572e', '#2e86de'];

const rows = document.getElementById('studentRows');
const emptyMsg = document.getElementById('emptyMsg');
const search = document.getElementById('search');

function render() {
  const q = search.value.trim().toLowerCase();
  const lista = estudiantes.filter(e =>
    e.nombre.toLowerCase().includes(q) || e.programa.toLowerCase().includes(q));

  rows.innerHTML = '';
  lista.forEach(e => {
    const tr = document.createElement('tr');
    // Nombre con avatar de iniciales
    const tdNombre = document.createElement('td');
    const person = document.createElement('div');
    person.className = 'person';
    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    avatar.textContent = e.nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
    avatar.style.background = colores[e.nombre.length % colores.length];
    person.appendChild(avatar);
    person.appendChild(document.createTextNode(e.nombre));
    tdNombre.appendChild(person);
    tr.appendChild(tdNombre);
    [e.codigo, e.programa, e.semestre, e.promedio.toFixed(1)].forEach(v => {
      const td = document.createElement('td');
      td.textContent = v;
      tr.appendChild(td);
    });
    const td = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'badge ' + e.estado.toLowerCase();
    badge.textContent = e.estado;
    td.appendChild(badge);
    tr.appendChild(td);
    rows.appendChild(tr);
  });
  emptyMsg.hidden = lista.length > 0;

  const prom = estudiantes.reduce((s, e) => s + e.promedio, 0) / (estudiantes.length || 1);
  document.getElementById('statTotal').textContent = estudiantes.length;
  document.getElementById('statActivos').textContent = estudiantes.filter(e => e.estado === 'Activo').length;
  document.getElementById('statPromedio').textContent = prom.toFixed(1);
}

search.addEventListener('input', render);

document.getElementById('studentForm').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const f = new FormData(ev.target);
  estudiantes.push({
    codigo: 'E' + String(estudiantes.length + 1).padStart(3, '0'),
    nombre: f.get('nombre'),
    programa: f.get('programa'),
    semestre: Number(f.get('semestre')),
    promedio: Number(f.get('promedio')),
    estado: 'Activo',
  });
  ev.target.reset();
  document.getElementById('formMsg').textContent = 'Estudiante guardado.';
  render();
});

// Menú móvil
const toggle = document.getElementById('menuToggle');
const nav = document.getElementById('mainNav');
toggle.addEventListener('click', () => {
  toggle.setAttribute('aria-expanded', nav.classList.toggle('open'));
});
nav.addEventListener('click', () => nav.classList.remove('open'));

render();
