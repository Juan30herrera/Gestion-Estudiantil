// Validación de lo que llega desde el navegador, antes de enviarlo a la IA.
const { ErrorIA } = require('./errores');

const invalido = (msg) => new ErrorIA('SOLICITUD_INVALIDA', msg, 400);
const esTexto = (v, min, max) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;
const esNumero = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
// Quita saltos de línea y caracteres de control para que un campo no pueda "romper" el prompt.
const limpiar = (s) => String(s).replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();

function validarAnalisis(body) {
  const e = body?.estudiante;
  if (!e || typeof e !== 'object') throw invalido('Falta la información del estudiante.');
  if (!esTexto(e.programa, 2, 80)) throw invalido('El programa del estudiante no es válido.');
  if (!esNumero(e.semestre, 1, 10)) throw invalido('El semestre debe estar entre 1 y 10.');
  if (!['Activo', 'Inactivo'].includes(e.estado)) throw invalido('El estado del estudiante no es válido.');

  if (!Array.isArray(body.notas) || body.notas.length === 0) {
    throw invalido('El estudiante no tiene notas registradas. Registra al menos una nota para analizarlo.');
  }
  if (body.notas.length > 50) throw invalido('Hay demasiadas notas para analizar (máximo 50).');

  const notas = body.notas.map((n, i) => {
    if (!esTexto(n?.curso, 1, 80)) throw invalido(`La nota ${i + 1} no tiene un nombre de curso válido.`);
    if (!esNumero(n.nota, 0, 5)) throw invalido(`La nota ${i + 1} debe estar entre 0.0 y 5.0.`);
    if (n.creditos !== undefined && !esNumero(n.creditos, 1, 6)) throw invalido(`Los créditos de la nota ${i + 1} no son válidos.`);
    return { curso: limpiar(n.curso), creditos: n.creditos ?? null, nota: n.nota };
  });

  return {
    estudiante: { programa: limpiar(e.programa), semestre: e.semestre, estado: e.estado },
    notas,
  };
}

function validarConsulta(body) {
  if (!esTexto(body?.pregunta, 3, 300)) throw invalido('Escribe una pregunta de entre 3 y 300 caracteres.');
  const d = body.datos;
  if (!d || !Array.isArray(d.estudiantes) || !Array.isArray(d.cursos) || !Array.isArray(d.notas)) {
    throw invalido('Faltan los datos de estudiantes, cursos o notas.');
  }
  if (d.estudiantes.length === 0) throw invalido('No hay estudiantes registrados para consultar.');
  if (d.estudiantes.length > 200 || d.cursos.length > 100 || d.notas.length > 1000) {
    throw invalido('Hay demasiados datos para consultar.');
  }

  const estudiantes = d.estudiantes.map((x, i) => {
    if (!esTexto(x?.nombre, 1, 60) || !esTexto(x?.programa, 1, 80)) throw invalido(`El estudiante ${i + 1} no es válido.`);
    return {
      codigo: limpiar(x.codigo ?? ''), nombre: limpiar(x.nombre), programa: limpiar(x.programa),
      semestre: Number(x.semestre) || 0, estado: x.estado === 'Inactivo' ? 'Inactivo' : 'Activo',
    };
  });
  const cursos = d.cursos.map((c, i) => {
    if (!esTexto(c?.nombre, 1, 80)) throw invalido(`El curso ${i + 1} no es válido.`);
    return { codigo: limpiar(c.codigo ?? ''), nombre: limpiar(c.nombre), creditos: Number(c.creditos) || 0 };
  });
  const notas = d.notas.map((n, i) => {
    if (!esTexto(n?.estudiante, 1, 60) || !esTexto(n?.curso, 1, 80) || !esNumero(n?.nota, 0, 5)) {
      throw invalido(`La nota ${i + 1} no es válida.`);
    }
    return { estudiante: limpiar(n.estudiante), curso: limpiar(n.curso), nota: n.nota };
  });

  return { pregunta: limpiar(body.pregunta), estudiantes, cursos, notas };
}

// Métricas calculadas por el servidor (no por la IA) para que los números sean exactos.
function calcularMetricas(notas) {
  const total = notas.length;
  const promedio = notas.reduce((s, n) => s + n.nota, 0) / total;
  const aprobadas = notas.filter(n => n.nota >= 3).length;
  const creditos = notas.reduce((s, n) => s + (n.creditos || 0), 0);
  const ponderado = creditos > 0 && notas.every(n => n.creditos)
    ? notas.reduce((s, n) => s + n.nota * n.creditos, 0) / creditos
    : null;
  return {
    totalNotas: total,
    promedio: Math.round(promedio * 100) / 100,
    promedioPonderado: ponderado === null ? null : Math.round(ponderado * 100) / 100,
    aprobadas,
    reprobadas: total - aprobadas,
    mejorNota: Math.max(...notas.map(n => n.nota)),
    peorNota: Math.min(...notas.map(n => n.nota)),
  };
}

module.exports = { validarAnalisis, validarConsulta, calcularMetricas };
