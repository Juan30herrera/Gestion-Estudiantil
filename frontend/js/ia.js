// Módulo de IA: conecta la interfaz con el servidor, que a su vez usa el servicio de IA.
// Flujo: datos del navegador -> POST /api/ia/... -> servidor valida y consulta a la IA
//        -> respuesta validada -> se muestra en pantalla.

const IA = {
  // Si se abre index.html como archivo, se apunta al servidor local.
  base: location.protocol === 'file:' ? 'http://localhost:3000' : '',
  ocupado: false,
  ejemplos: [
    '¿Quién tiene el mejor promedio?',
    '¿Qué estudiantes tienen alguna materia reprobada?',
    '¿Cuál es el promedio por programa?',
  ],

  // ---------- Comunicación con el servidor ----------
  async pedir(ruta, opciones = {}) {
    const ctrl = new AbortController();
    const temporizador = setTimeout(() => ctrl.abort(), 40000);
    let res;
    try {
      res = await fetch(this.base + ruta, {
        ...opciones,
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
      });
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('La solicitud tardó demasiado. Intenta de nuevo.');
      throw new Error('No se pudo conectar con el servidor de la aplicación. Inícialo con «npm start» y abre http://localhost:3000.');
    } finally {
      clearTimeout(temporizador);
    }

    let datos = null;
    try { datos = await res.json(); } catch { /* respuesta que no es JSON */ }
    if (!res.ok) {
      throw new Error(datos?.error?.mensaje ||
        'El servidor no respondió como se esperaba. ¿Abriste la aplicación con «npm start»?');
    }
    if (!datos) throw new Error('El servidor devolvió una respuesta vacía.');
    return datos;
  },

  post(ruta, cuerpo) {
    return this.pedir(ruta, { method: 'POST', body: JSON.stringify(cuerpo) });
  },

  // ---------- Estado de la conexión ----------
  async verEstado() {
    const caja = document.getElementById('iaEstado');
    try {
      const e = await this.pedir('/api/ia/estado');
      if (e.disponible) {
        caja.className = 'ia-estado ok';
        caja.textContent = `IA conectada: ${e.proveedor} (${e.modelo}).`;
      } else {
        caja.className = 'ia-estado aviso';
        caja.textContent = 'La IA no está configurada: falta la clave de API en el archivo .env del servidor.';
      }
    } catch (err) {
      caja.className = 'ia-estado error';
      caja.textContent = err.message;
    }
  },

  // ---------- Utilidades de interfaz ----------
  cargando(boton, activo, textoNormal, zona, mensaje) {
    this.ocupado = activo;
    document.getElementById('iaAnalizar').disabled = activo;
    document.getElementById('iaConsultar').disabled = activo;
    boton.textContent = activo ? 'Consultando…' : textoNormal;
    UI.vaciar(zona);
    if (activo) {
      const c = UI.crear('div', 'ia-cargando');
      c.appendChild(UI.crear('span', 'spinner'));
      c.appendChild(UI.crear('span', '', mensaje));
      zona.appendChild(c);
    }
  },

  mostrarError(zona, texto) {
    UI.vaciar(zona);
    zona.appendChild(UI.crear('div', 'ia-error', texto));
  },

  // ---------- Análisis de un estudiante ----------
  armarAnalisis(est) {
    const notas = Datos.notas
      .filter(n => n.estudianteId === est.id)
      .map(n => {
        const curso = Datos.cursos.find(c => c.id === n.cursoId);
        return curso ? { curso: curso.nombre, creditos: curso.creditos, nota: n.nota } : null;
      })
      .filter(Boolean);
    return {
      estudiante: { programa: est.programa, semestre: Number(est.semestre), estado: est.estado },
      notas,
    };
  },

  async analizar() {
    if (this.ocupado) return;
    const zona = document.getElementById('iaAnalisis');
    const boton = document.getElementById('iaAnalizar');
    const id = Number(document.getElementById('iaEstudiante').value);

    const errores = [];
    const est = Datos.estudiantes.find(e => e.id === id);
    if (!est) errores.push('Selecciona un estudiante.');
    const cuerpo = est ? this.armarAnalisis(est) : null;
    if (est && cuerpo.notas.length === 0) {
      errores.push('Este estudiante no tiene notas registradas. Registra al menos una nota en la sección Notas.');
    }
    UI.mostrarErrores(document.getElementById('iaErrores'), errores);
    if (errores.length) { UI.vaciar(zona); return; }

    this.cargando(boton, true, 'Analizar con IA', zona, 'La IA está analizando las notas…');
    try {
      const r = await this.post('/api/ia/analizar-estudiante', cuerpo);
      this.cargando(boton, false, 'Analizar con IA', zona);
      this.mostrarAnalisis(zona, est, r);
    } catch (e) {
      this.cargando(boton, false, 'Analizar con IA', zona);
      this.mostrarError(zona, e.message);
    }
  },

  // Entrada desde el botón "✨ IA" de la tabla de estudiantes.
  analizarDesde(id) {
    document.getElementById('iaEstudiante').value = String(id);
    location.hash = '#ia';
    this.analizar();
  },

  mostrarAnalisis(zona, est, { analisis, metricas }) {
    UI.vaciar(zona);

    const cab = UI.crear('div', 'ia-cabecera');
    cab.appendChild(UI.crear('strong', '', 'Análisis de ' + est.nombre));
    cab.appendChild(UI.crear('span', 'badge riesgo-' + analisis.nivelRiesgo, 'Riesgo ' + analisis.nivelRiesgo));
    zona.appendChild(cab);

    const chips = UI.crear('div', 'ia-metricas');
    const chip = (etiqueta, valor) => {
      const c = UI.crear('div', 'ia-metrica');
      c.appendChild(UI.crear('strong', '', valor));
      c.appendChild(UI.crear('span', '', etiqueta));
      chips.appendChild(c);
    };
    chip('Promedio', metricas.promedio.toFixed(2));
    if (metricas.promedioPonderado !== null) chip('Ponderado por créditos', metricas.promedioPonderado.toFixed(2));
    chip('Aprobadas', `${metricas.aprobadas} de ${metricas.totalNotas}`);
    chip('Mejor / peor nota', `${metricas.mejorNota.toFixed(1)} / ${metricas.peorNota.toFixed(1)}`);
    zona.appendChild(chips);

    zona.appendChild(UI.crear('p', 'ia-resumen', analisis.resumen));

    const seccion = (titulo, items) => {
      if (!items.length) return;
      zona.appendChild(UI.crear('h4', '', titulo));
      const ul = UI.crear('ul', 'ia-lista');
      items.forEach(t => ul.appendChild(UI.crear('li', '', t)));
      zona.appendChild(ul);
    };
    seccion('Fortalezas', analisis.fortalezas);
    seccion('Riesgos', analisis.riesgos);
    seccion('Recomendaciones', analisis.recomendaciones);

    zona.appendChild(UI.crear('p', 'hint', 'Generado por IA. Las cifras (promedio, aprobadas) las calcula la aplicación; el texto es orientativo.'));
  },

  // ---------- Pregunta en lenguaje natural ----------
  armarConsulta() {
    const nombre = id => Datos.estudiantes.find(e => e.id === id)?.nombre;
    const curso = id => Datos.cursos.find(c => c.id === id)?.nombre;
    return {
      estudiantes: Datos.estudiantes.map(e => ({
        codigo: e.codigo, nombre: e.nombre, programa: e.programa, semestre: Number(e.semestre), estado: e.estado,
      })),
      cursos: Datos.cursos.map(c => ({ codigo: c.codigo, nombre: c.nombre, creditos: c.creditos })),
      notas: Datos.notas
        .map(n => ({ estudiante: nombre(n.estudianteId), curso: curso(n.cursoId), nota: n.nota }))
        .filter(n => n.estudiante && n.curso),
    };
  },

  async consultar() {
    if (this.ocupado) return;
    const zona = document.getElementById('iaRespuesta');
    const boton = document.getElementById('iaConsultar');
    const pregunta = document.getElementById('iaPregunta').value.trim();

    const errores = [];
    if (pregunta.length < 3) errores.push('Escribe una pregunta de al menos 3 caracteres.');
    if (Datos.estudiantes.length === 0) errores.push('Registra al menos un estudiante para poder consultar.');
    UI.mostrarErrores(document.getElementById('iaConsultaErrores'), errores);
    if (errores.length) { UI.vaciar(zona); return; }

    this.cargando(boton, true, 'Preguntar a la IA', zona, 'La IA está buscando la respuesta…');
    try {
      const r = await this.post('/api/ia/consulta', { pregunta, datos: this.armarConsulta() });
      this.cargando(boton, false, 'Preguntar a la IA', zona);
      zona.appendChild(UI.crear('p', 'ia-texto', r.respuesta));
      zona.appendChild(UI.crear('p', 'hint', 'Generado por IA. Verifica la información antes de usarla.'));
    } catch (e) {
      this.cargando(boton, false, 'Preguntar a la IA', zona);
      this.mostrarError(zona, e.message);
    }
  },

  // ---------- Inicio y refresco ----------
  render() {
    UI.llenarSelect(document.getElementById('iaEstudiante'),
      Datos.estudiantes.map(e => ({ valor: e.id, texto: e.codigo + ' · ' + e.nombre })), 'Selecciona un estudiante');
  },

  iniciar() {
    document.getElementById('iaAnalizar').addEventListener('click', () => this.analizar());
    document.getElementById('iaConsultar').addEventListener('click', () => this.consultar());

    const pregunta = document.getElementById('iaPregunta');
    const contador = document.getElementById('iaContador');
    pregunta.addEventListener('input', () => { contador.textContent = pregunta.value.length + '/300'; });
    pregunta.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) this.consultar();
    });

    const cont = document.getElementById('iaEjemplos');
    this.ejemplos.forEach(t => {
      const b = UI.crear('button', 'chip', t);
      b.type = 'button';
      b.addEventListener('click', () => { pregunta.value = t; contador.textContent = t.length + '/300'; pregunta.focus(); });
      cont.appendChild(b);
    });
  },
};
