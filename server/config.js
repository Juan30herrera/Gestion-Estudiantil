// Lee la configuración desde variables de entorno (.env).
// Se calcula en cada llamada para que las pruebas puedan cambiar el entorno.
require('dotenv').config();

function obtenerConfig() {
  const proveedor = (process.env.AI_PROVIDER || 'anthropic').toLowerCase();
  const claves = {
    anthropic: {
      clave: process.env.ANTHROPIC_API_KEY || '',
      modelo: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
    },
    gemini: {
      clave: process.env.GEMINI_API_KEY || '',
      modelo: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    },
  };
  return {
    puerto: Number(process.env.PORT) || 3000,
    proveedor,
    soportado: Object.keys(claves).includes(proveedor),
    ...(claves[proveedor] || { clave: '', modelo: '' }),
    timeoutMs: Number(process.env.IA_TIMEOUT_MS) || 30000,
  };
}

module.exports = { obtenerConfig };
