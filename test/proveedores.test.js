// Pruebas de la conexión con los proveedores: se simula fetch con el formato real de cada API.
const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { generar } = require('../server/ia/proveedores');

const fetchOriginal = global.fetch;
const entornoOriginal = { ...process.env };
let llamadas;
const simular = (respuesta) => { global.fetch = async (url, op) => { llamadas.push({ url, op }); return respuesta(url, op); }; };
const ok = (obj) => ({ ok: true, status: 200, json: async () => obj, text: async () => JSON.stringify(obj) });
const fallo = (status) => ({ ok: false, status, text: async () => 'detalle', json: async () => ({}) });
const opciones = { system: 'sistema', user: 'usuario', maxTokens: 500, json: true };

beforeEach(() => { llamadas = []; });
afterEach(() => { global.fetch = fetchOriginal; process.env = { ...entornoOriginal }; });

test('sin clave -> SIN_CLAVE (503) y no llama a la red', async () => {
  process.env.AI_PROVIDER = 'anthropic'; delete process.env.ANTHROPIC_API_KEY;
  simular(() => { throw new Error('no debería llamarse'); });
  await assert.rejects(generar(opciones), { codigo: 'SIN_CLAVE', status: 503 });
  assert.equal(llamadas.length, 0);
});

test('proveedor no soportado -> CONFIGURACION', async () => {
  process.env.AI_PROVIDER = 'otro';
  await assert.rejects(generar(opciones), { codigo: 'CONFIGURACION' });
});

test('Anthropic: arma la solicitud y extrae el texto', async () => {
  process.env.AI_PROVIDER = 'anthropic'; process.env.ANTHROPIC_API_KEY = 'k-test'; process.env.ANTHROPIC_MODEL = 'claude-haiku-5-5';
  simular(() => ok({ content: [{ type: 'text', text: 'Hola ' }, { type: 'text', text: 'mundo' }] }));
  assert.equal(await generar(opciones), 'Hola mundo');
  const { url, op } = llamadas[0];
  assert.equal(url, 'https://api.anthropic.com/v1/messages');
  assert.equal(op.headers['x-api-key'], 'k-test');
  const cuerpo = JSON.parse(op.body);
  assert.equal(cuerpo.model, 'claude-haiku-5-5');
  assert.equal(cuerpo.system, 'sistema');
  assert.deepEqual(cuerpo.messages, [{ role: 'user', content: 'usuario' }]);
});

test('Gemini: arma la solicitud (clave en cabecera, no en la URL) y extrae el texto', async () => {
  process.env.AI_PROVIDER = 'gemini'; process.env.GEMINI_API_KEY = 'g-test'; process.env.GEMINI_MODEL = 'modelo-x';
  simular(() => ok({ candidates: [{ content: { parts: [{ text: '{"a":1}' }] } }] }));
  assert.equal(await generar(opciones), '{"a":1}');
  const { url, op } = llamadas[0];
  assert.match(url, /models\/modelo-x:generateContent$/);
  assert.ok(!url.includes('g-test'));
  assert.equal(op.headers['x-goog-api-key'], 'g-test');
  const cuerpo = JSON.parse(op.body);
  assert.equal(cuerpo.generationConfig.responseMimeType, 'application/json');
  assert.equal(cuerpo.systemInstruction.parts[0].text, 'sistema');
});

test('Gemini: respuesta sin candidatos (bloqueada) -> RESPUESTA_INVALIDA', async () => {
  process.env.AI_PROVIDER = 'gemini'; process.env.GEMINI_API_KEY = 'g';
  simular(() => ok({ promptFeedback: { blockReason: 'SAFETY' } }));
  await assert.rejects(generar(opciones), { codigo: 'RESPUESTA_INVALIDA' });
});

test('códigos HTTP del proveedor se traducen a errores claros', async () => {
  process.env.AI_PROVIDER = 'anthropic'; process.env.ANTHROPIC_API_KEY = 'k';
  const casos = [[401, 'AUTENTICACION', 502], [429, 'LIMITE', 429], [400, 'CONFIGURACION', 502], [500, 'PROVEEDOR_CAIDO', 502], [529, 'PROVEEDOR_CAIDO', 502]];
  for (const [estado, codigo, status] of casos) {
    simular(() => fallo(estado));
    await assert.rejects(generar(opciones), { codigo, status }, `HTTP ${estado}`);
  }
});

test('fallo de red -> PROVEEDOR_CAIDO', async () => {
  process.env.AI_PROVIDER = 'anthropic'; process.env.ANTHROPIC_API_KEY = 'k';
  simular(() => { throw new TypeError('fetch failed'); });
  await assert.rejects(generar(opciones), { codigo: 'PROVEEDOR_CAIDO' });
});

test('tiempo de espera agotado -> TIEMPO_AGOTADO (504)', async () => {
  process.env.AI_PROVIDER = 'anthropic'; process.env.ANTHROPIC_API_KEY = 'k'; process.env.IA_TIMEOUT_MS = '50';
  global.fetch = (url, op) => new Promise((_, rechazar) => {
    op.signal.addEventListener('abort', () => rechazar(Object.assign(new Error('abort'), { name: 'AbortError' })));
  });
  await assert.rejects(generar(opciones), { codigo: 'TIEMPO_AGOTADO', status: 504 });
});

test('respuesta vacía -> RESPUESTA_INVALIDA', async () => {
  process.env.AI_PROVIDER = 'anthropic'; process.env.ANTHROPIC_API_KEY = 'k';
  simular(() => ok({ content: [] }));
  await assert.rejects(generar(opciones), { codigo: 'RESPUESTA_INVALIDA' });
});
