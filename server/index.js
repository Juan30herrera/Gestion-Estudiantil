// Servidor: sirve el frontend y expone la API que conecta la aplicación con el servicio de IA.
// La clave de API vive solo aquí (en .env); el navegador nunca la ve.
const path = require('path');
const express = require('express');
const { obtenerConfig } = require('./config');
const { generar: generarReal } = require('./ia/proveedores');
const { ErrorIA } = require('./ia/errores');
const { validarAnalisis, validarConsulta, calcularMetricas } = require('./ia/validar');
const { SISTEMA_ANALISIS, SISTEMA_CONSULTA, contextoAnalisis, contextoConsulta } = require('./ia/prompts');
const { interpretarAnalisis } = require('./ia/respuesta');

// Límite simple por IP (en memoria) para no gastar la cuota de la IA por accidente.
function limitador({ max, ventanaMs }) {
  const visitas = new Map();
  return (req, res, next) => {
    const ahora = Date.now();
    const ip = req.ip || 'local';
    const recientes = (visitas.get(ip) || []).filter(t => ahora - t < ventanaMs);
    if (recientes.length >= max) {
      return res.status(429).json({ error: { codigo: 'DEMASIADAS_SOLICITUDES', mensaje: 'Demasiadas solicitudes seguidas. Espera un minuto e intenta de nuevo.' } });
    }
    recientes.push(ahora);
    visitas.set(ip, recientes);
    next();
  };
}

// `generar` se puede inyectar para probar sin gastar cuota de IA.
function crearApp({ generar = generarReal } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '200kb' }));

  // CORS: solo orígenes locales (permite abrir index.html como archivo durante el desarrollo).
  app.use('/api', (req, res, next) => {
    const origen = req.headers.origin;
    if (origen && (origen === 'null' || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origen))) {
      res.setHeader('Access-Control-Allow-Origin', origen);
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  app.use(express.static(path.join(__dirname, '..', 'frontend')));

  app.get('/api/ia/estado', (req, res) => {
    const cfg = obtenerConfig();
    res.json({
      disponible: cfg.soportado && Boolean(cfg.clave),
      proveedor: cfg.proveedor,
      modelo: cfg.soportado ? cfg.modelo : null,
    });
  });

  const protegido = limitador({ max: 20, ventanaMs: 60_000 });

  // 1) Análisis del rendimiento de un estudiante -> JSON estructurado.
  app.post('/api/ia/analizar-estudiante', protegido, async (req, res, next) => {
    try {
      const datos = validarAnalisis(req.body);
      const metricas = calcularMetricas(datos.notas);
      const texto = await generar({
        system: SISTEMA_ANALISIS,
        user: contextoAnalisis(datos, metricas),
        maxTokens: 1000,
        json: true,
      });
      res.json({ analisis: interpretarAnalisis(texto), metricas });
    } catch (e) { next(e); }
  });

  // 2) Pregunta en lenguaje natural sobre los datos -> texto.
  app.post('/api/ia/consulta', protegido, async (req, res, next) => {
    try {
      const datos = validarConsulta(req.body);
      const respuesta = await generar({
        system: SISTEMA_CONSULTA,
        user: contextoConsulta(datos),
        maxTokens: 700,
        json: false,
      });
      res.json({ respuesta: respuesta.slice(0, 2000) });
    } catch (e) { next(e); }
  });

  app.use('/api', (req, res) => {
    res.status(404).json({ error: { codigo: 'NO_ENCONTRADO', mensaje: 'Ruta de API no encontrada.' } });
  });

  // Manejo de errores centralizado: siempre responde JSON con un mensaje claro.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof ErrorIA) {
      return res.status(err.status).json({ error: { codigo: err.codigo, mensaje: err.message } });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: { codigo: 'SOLICITUD_INVALIDA', mensaje: 'El cuerpo de la solicitud no es JSON válido.' } });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: { codigo: 'SOLICITUD_INVALIDA', mensaje: 'La solicitud es demasiado grande.' } });
    }
    console.error('[ERROR]', err);
    res.status(500).json({ error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado en el servidor.' } });
  });

  return app;
}

if (require.main === module) {
  const cfg = obtenerConfig();
  crearApp().listen(cfg.puerto, () => {
    console.log(`Gestión Estudiantil en http://localhost:${cfg.puerto}`);
    if (!cfg.soportado) console.warn(`AVISO: AI_PROVIDER="${cfg.proveedor}" no es válido (usa "anthropic" o "gemini").`);
    else if (!cfg.clave) console.warn(`AVISO: falta la clave de API de ${cfg.proveedor} en .env. La IA no funcionará hasta configurarla.`);
    else console.log(`IA: ${cfg.proveedor} (${cfg.modelo})`);
  });
}

module.exports = { crearApp };
