// Manejo de datos: guarda y lee la información en localStorage.

const PROGRAMAS = [
  'Ingeniería de Software',
  'Ingeniería Industrial',
  'Administración',
  'Contaduría',
];

const Almacen = {
  cargar(clave, porDefecto) {
    try {
      const raw = localStorage.getItem(clave);
      return raw ? JSON.parse(raw) : porDefecto;
    } catch (e) {
      return porDefecto;
    }
  },
  guardar(clave, datos) {
    try {
      localStorage.setItem(clave, JSON.stringify(datos));
    } catch (e) {
      console.warn('No se pudo guardar en localStorage', e);
    }
  },
};

const Datos = {
  estudiantes: [],
  cursos: [],
  notas: [],

  iniciar() {
    this.estudiantes = Almacen.cargar('ge_estudiantes', [
      { id: 1, codigo: 'E001', nombre: 'Laura Gómez', correo: 'laura.gomez@correo.com', programa: 'Ingeniería de Software', semestre: 5, estado: 'Activo' },
      { id: 2, codigo: 'E002', nombre: 'Carlos Ramírez', correo: 'carlos.ramirez@correo.com', programa: 'Ingeniería Industrial', semestre: 3, estado: 'Activo' },
      { id: 3, codigo: 'E003', nombre: 'Daniela Torres', correo: 'daniela.torres@correo.com', programa: 'Administración', semestre: 7, estado: 'Activo' },
      { id: 4, codigo: 'E004', nombre: 'Andrés Pardo', correo: 'andres.pardo@correo.com', programa: 'Contaduría', semestre: 2, estado: 'Inactivo' },
    ]);
    this.cursos = Almacen.cargar('ge_cursos', [
      { id: 1, codigo: 'C101', nombre: 'Programación I', creditos: 3 },
      { id: 2, codigo: 'C102', nombre: 'Bases de Datos', creditos: 3 },
      { id: 3, codigo: 'C103', nombre: 'Cálculo Diferencial', creditos: 4 },
    ]);
    this.notas = Almacen.cargar('ge_notas', [
      { id: 1, estudianteId: 1, cursoId: 1, nota: 4.5 },
      { id: 2, estudianteId: 1, cursoId: 2, nota: 4.1 },
      { id: 3, estudianteId: 2, cursoId: 3, nota: 3.4 },
      { id: 4, estudianteId: 3, cursoId: 1, nota: 4.0 },
    ]);
  },

  guardar() {
    Almacen.guardar('ge_estudiantes', this.estudiantes);
    Almacen.guardar('ge_cursos', this.cursos);
    Almacen.guardar('ge_notas', this.notas);
  },

  siguienteId(lista) {
    return lista.reduce((max, x) => Math.max(max, x.id), 0) + 1;
  },

  promedioEstudiante(id) {
    const notas = this.notas.filter(n => n.estudianteId === id);
    if (notas.length === 0) return null;
    return notas.reduce((s, n) => s + n.nota, 0) / notas.length;
  },
};
