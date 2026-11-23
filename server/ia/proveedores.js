// Conexión con el servicio de IA. Soporta Gemini (Google).
const { ErrorIA } = require('./errores');
const { obtenerConfig } = require('../config');

function mapearEstado(status) {
  if (status === 401 || status === 403) {
    return new ErrorIA('AUTENTICACION', 'El servicio de IA rechazó la clave de API. Revisa el archivo .env.', 502);
  }
  if (status === 429) {
    return new ErrorIA('LIMITE', 'Se alcanzó el límite de uso del servicio de IA. Espera un momento e intenta de nuevo.', 429);
  }
  if (status === 400 || status === 404) {
    return new ErrorIA('CONFIGURACION', 'El servicio de IA rechazó la solicitud. Revisa la clave y el nombre del modelo en .env.', 502);
  }
  if (status === 503 || status === 529) {
    return new ErrorIA('SOBRECARGA', 'El servicio de IA tiene mucha demanda en este momento. Intenta de nuevo en unos segundos.', 503);
  }
  return new ErrorIA('PROVEEDOR_CAIDO', 'El servicio de IA no está disponible en este momento. Intenta de nuevo más tarde.', 502);
}

async function intentoJSON(url, opciones, timeoutMs) {
  const ctrl = new AbortController();
  const temporizador = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opciones, signal: ctrl.signal });
    if (!res.ok) {
      const detalle = await res.text().catch(() => '');
      console.error(`[IA] El proveedor respondió ${res.status}:`, detalle.slice(0, 300));
      throw mapearEstado(res.status);
    }
    return await res.json();
  } catch (e) {
    if (e instanceof ErrorIA) throw e;
    if (e.name === 'AbortError') {
      throw new ErrorIA('TIEMPO_AGOTADO', 'El servicio de IA tardó demasiado en responder. Intenta de nuevo.', 504);
    }
    if (e instanceof SyntaxError) {
      throw new ErrorIA('RESPUESTA_INVALIDA', 'El servicio de IA devolvió una respuesta ilegible.', 502);
    }
    throw new ErrorIA('PROVEEDOR_CAIDO', 'No se pudo contactar el servicio de IA. Revisa la conexión a internet.', 502);
  } finally {
    clearTimeout(temporizador);
  }
}

const REINTENTABLES = ['SOBRECARGA', 'PROVEEDOR_CAIDO'];
const dormir = (ms) => new Promise(r => setTimeout(r, ms));

// Reintenta (hasta 3 intentos en total) solo ante fallos temporales del proveedor:
// sobrecarga (503/529), errores 5xx o caída de red. No reintenta claves inválidas,
// límites de uso ni tiempos agotados, porque repetirlos no los arregla.
async function llamarJSON(url, opciones, timeoutMs) {
  const espera = process.env.IA_REINTENTO_MS === undefined ? 1000 : Number(process.env.IA_REINTENTO_MS);
  for (let intento = 1; ; intento++) {
    try {
      return await intentoJSON(url, opciones, timeoutMs);
    } catch (e) {
      if (!(e instanceof ErrorIA) || !REINTENTABLES.includes(e.codigo) || intento >= 3) throw e;
      console.warn(`[IA] Fallo temporal (${e.codigo}). Reintento ${intento} de 2…`);
      await dormir(espera * intento);
    }
  }
}

async function generarAnthropic({ system, user, maxTokens }, cfg) {
  const datos = await llamarJSON('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': cfg.clave,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: cfg.modelo,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  }, cfg.timeoutMs);
  return (datos.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
}

async function generarGemini({ system, user, maxTokens, json }, cfg) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.modelo)}:generateContent`;
  const datos = await llamarJSON(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': cfg.clave },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: {
        // Algunos modelos de Gemini gastan parte del límite "pensando": se deja margen.
        maxOutputTokens: Math.max(maxTokens, 4096),
        ...(json ? { responseMimeType: 'application/json' } : {}),
      },
    }),
  }, cfg.timeoutMs);
  const partes = datos.candidates?.[0]?.content?.parts || [];
  return partes.map(p => p.text || '').join('');
}

const PROVEEDORES = { anthropic: generarAnthropic, gemini: generarGemini };

// Devuelve el texto generado o lanza un ErrorIA con un mensaje claro para el usuario.
async function generar(opciones) {
  const cfg = obtenerConfig();
  if (!cfg.soportado) {
    throw new ErrorIA('CONFIGURACION', `AI_PROVIDER="${cfg.proveedor}" no es válido. Usa "anthropic" o "gemini".`, 503);
  }
  if (!cfg.clave) {
    throw new ErrorIA('SIN_CLAVE', 'El servicio de IA no está configurado. Falta la clave de API en el archivo .env.', 503);
  }
  const texto = (await PROVEEDORES[cfg.proveedor](opciones, cfg)).trim();
  if (!texto) {
    throw new ErrorIA('RESPUESTA_INVALIDA', 'El servicio de IA devolvió una respuesta vacía. Intenta de nuevo.', 502);
  }
  return texto;
}

module.exports = { generar };