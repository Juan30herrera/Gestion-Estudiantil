// Procesa la respuesta de la IA: la convierte en un objeto validado y seguro para mostrar.
const { ErrorIA } = require('./errores');

const NIVELES = ['bajo', 'medio', 'alto'];
const ilegible = () => new ErrorIA(
  'RESPUESTA_INVALIDA',
  'La IA devolvió una respuesta que no se pudo interpretar. Intenta de nuevo.', 502);

function listaDeTextos(valor, maximo) {
  if (!Array.isArray(valor)) return [];
  return valor
    .filter(x => typeof x === 'string' && x.trim())
    .map(x => x.trim().slice(0, 300))
    .slice(0, maximo);
}

function interpretarAnalisis(texto) {
  // Algunos modelos envuelven el JSON en ```json ... ```: se toma desde la primera { hasta la última }.
  const inicio = texto.indexOf('{');
  const fin = texto.lastIndexOf('}');
  if (inicio === -1 || fin <= inicio) throw ilegible();

  let obj;
  try {
    obj = JSON.parse(texto.slice(inicio, fin + 1));
  } catch {
    throw ilegible();
  }

  if (typeof obj.resumen !== 'string' || !obj.resumen.trim()) throw ilegible();
  const nivel = String(obj.nivel_riesgo || '').toLowerCase();

  return {
    resumen: obj.resumen.trim().slice(0, 800),
    nivelRiesgo: NIVELES.includes(nivel) ? nivel : 'medio',
    fortalezas: listaDeTextos(obj.fortalezas, 4),
    riesgos: listaDeTextos(obj.riesgos, 4),
    recomendaciones: listaDeTextos(obj.recomendaciones, 4),
  };
}

module.exports = { interpretarAnalisis };
