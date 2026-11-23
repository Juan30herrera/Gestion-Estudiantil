# Gestión Estudiantil — Versión final con IA

Aplicación web para administrar estudiantes, cursos y notas de una institución educativa, con un Gemini-3.5-flash-lite que analiza el rendimiento de los estudiantes y responde preguntas sobre los datos.
Proyecto de Taller de Programación — entrega final (evolución del prototipo de la Fase II).

## Integrantes
Juan Pablo Herrera Avendaño
Manuel Felipe Cifuentes Torres
Thomas Moreno Alvarez

## Funcionalidades

- **Inicio:** resumen con total de estudiantes, cursos, promedio general, mejores promedios y estudiantes por estado.
- **Estudiantes:** registrar, editar, eliminar, buscar (nombre, código o correo) y filtrar por programa.
- **Cursos:** registrar, editar y eliminar cursos.
- **Notas:** asignar una nota (0.0 a 5.0) a un estudiante en un curso; el promedio se calcula automáticamente.
- **Asistente IA (Gemini-3.5-flash-lite):**
  - **Análisis de rendimiento por estudiante:** resumen, nivel de riesgo (bajo/medio/alto), fortalezas, riesgos y recomendaciones, junto con métricas calculadas por la aplicación. También se abre desde el botón **✨ IA** de cada fila de la tabla de estudiantes.
  - **Preguntas en lenguaje natural sobre los datos:** por ejemplo «¿Quién tiene el mejor promedio?» o «¿Qué estudiantes tienen alguna materia reprobada?».

## Servicio de IA utilizado

La aplicación se conecta a un LLM por medio de una API de Google Gemini. El proveedor se elige en el archivo `.env` :

| Proveedor | Variable `AI_PROVIDER` | Modelo por defecto | Clave de API |
|---|---|---|---|
| **Gemini (Google)** | `gemini` | `gemini-3.8-flash` (también sirve `gemini-4-argon`; se cambia con `GEMINI_MODEL`) | https://aistudio.google.com/apikey |

> **Gemini-3.5-flash-lite:**

### Cómo está integrada la IA

```
Navegador (frontend/js/ia.js)
   │  1. Valida y arma los datos (estudiante, notas, pregunta)
   ▼
Servidor Node/Express (server/index.js)
   │  2. Valida de nuevo la solicitud y calcula las métricas (promedio, aprobadas…)
   │  3. Construye el prompt (server/ia/prompts.js) y llama a la API de IA
   ▼
Servicio de IA (Gemini)
   │  4. Devuelve el análisis (JSON) o la respuesta (texto)
   ▼
Servidor: interpreta y valida la respuesta (server/ia/respuesta.js)
   ▼
Navegador: muestra el resultado en la vista «Asistente IA»
```

Cumple los cinco puntos de la integración:

1. **Conecta** el proyecto con el servicio de IA: `server/ia/proveedores.js`.
2. **Envía** información: las notas del estudiante o los datos consultados, más instrucciones (prompts).
3. **Procesa** la respuesta: la IA responde en JSON; el servidor lo extrae, valida el formato, normaliza el nivel de riesgo y recorta las listas (`server/ia/respuesta.js`).
4. **Presenta** los resultados dentro de la aplicación (vista «Asistente IA»).
5. Es una **funcionalidad real** del proyecto: usa los datos que el usuario registra en la aplicación.

**Por qué hay un servidor y no se llama a la IA desde el navegador:** la clave de API es un secreto. Si estuviera en el JavaScript del frontend, cualquiera podría verla y usarla. Por eso vive solo en el servidor (archivo `.env`, que no se sube a GitHub).

**Qué se envía a la IA y qué no:**
- Análisis por estudiante: solo programa, semestre, estado y notas por curso. **No se envían nombre ni correo.**
- Preguntas: nombres, códigos, programas, cursos y notas. **Nunca se envían correos.**
- Las cifras del análisis (promedio, aprobadas, mejor/peor nota) las calcula la aplicación, no la IA, para que sean exactas.

## Cómo ejecutarlo

### Requisitos
- [Node.js](https://nodejs.org) 18 o superior.
- Una clave de API de Claude o de Gemini (ver tabla de arriba).

### Pasos
1. Clona el repositorio y entra a la carpeta:
   ```bash
   git clone https://github.com/Juan30herrera/Gestion-Estudiantil.git
   cd Gestion-Estudiantil
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea el archivo de configuración y completa tu clave:
   ```bash
   cp .env.example .env        # en Windows: copy .env.example .env
   ```
   Abre `.env` y escribe la clave del proveedor elegido (`ANTHROPIC_API_KEY` o `GEMINI_API_KEY`) y el valor de `AI_PROVIDER`.
4. Inicia la aplicación:
   ```bash
   npm start
   ```
5. Abre **http://localhost:3000** en el navegador y entra a **Asistente IA**.

La pantalla del Asistente IA indica si la conexión está lista: «IA conectada» o, si falta la clave, un aviso. Sin clave, el resto de la aplicación (estudiantes, cursos, notas) funciona igual.

### Pruebas automáticas
```bash
npm test
```
Son 22 pruebas del servidor que **no gastan cuota de IA** (simulan las respuestas): validación de datos, análisis estructurado, formato de las solicitudes a Claude y Gemini, y traducción de errores (clave inválida, límite de uso, tiempo agotado, red caída, respuesta ilegible).

## Validaciones

**Formularios (cliente):**
- Código único y con formato válido (estudiantes y cursos).
- Nombre solo con letras (3 a 60 caracteres) y correo con formato válido.
- Semestre entre 1 y 10, créditos entre 1 y 6, nota entre 0.0 y 5.0.
- Confirmación antes de eliminar; al eliminar un estudiante o curso se borran también sus notas.

**Asistente IA:**
- Cliente: se debe elegir un estudiante con al menos una nota; la pregunta debe tener entre 3 y 300 caracteres.
- Servidor: se vuelve a validar todo lo recibido (tipos, rangos, tamaños máximos) antes de llamar a la IA, y se limpian saltos de línea para que ningún campo altere el prompt.

## Manejo de errores

| Situación | Qué ve el usuario |
|---|---|
| Servidor apagado o sin conexión | «No se pudo conectar con el servidor… Inícialo con `npm start`» |
| Falta la clave de API | Aviso en la pantalla de IA indicando que falta configurarla en `.env` |
| Clave inválida o modelo incorrecto | Mensaje que pide revisar la clave y el modelo en `.env` |
| Límite de uso del proveedor | «Se alcanzó el límite de uso… espera un momento» |
| La IA tarda demasiado (30 s) | «El servicio de IA tardó demasiado… intenta de nuevo» |
| La IA responde algo que no es el formato esperado | «La IA devolvió una respuesta que no se pudo interpretar» |
| Demasiadas solicitudes seguidas (más de 20 por minuto) | «Demasiadas solicitudes seguidas. Espera un minuto» |

Mientras la IA responde se muestra un indicador de carga y se deshabilitan los botones para evitar solicitudes duplicadas. Los errores del servidor se registran en la consola del servidor y al usuario solo se le muestra un mensaje claro, sin detalles internos ni claves.

## Manejo de datos

Los datos de estudiantes, cursos y notas se guardan en el navegador con `localStorage` y persisten al recargar. Al primer uso se cargan datos de ejemplo. La IA no guarda ni modifica esos datos: solo los lee para analizarlos.

## Estructura del proyecto

```
Gestion-Estudiantil/
├── README.md
├── package.json
├── .env.example               plantilla de configuración (sin claves)
├── .gitignore                 excluye .env y node_modules
├── server/
│   ├── index.js               servidor Express y rutas de la API de IA
│   ├── config.js              lectura de variables de entorno
│   └── ia/
│       ├── proveedores.js     conexión con Claude y Gemini
│       ├── prompts.js         instrucciones y contexto enviados a la IA
│       ├── validar.js         validación de solicitudes y cálculo de métricas
│       ├── respuesta.js       interpretación y validación de la respuesta de la IA
│       └── errores.js         errores propios con código y estado HTTP
├── frontend/
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── storage.js         datos y localStorage
│       ├── validaciones.js    reglas de validación
│       ├── ui.js              utilidades de interfaz
│       ├── estudiantes.js     módulo de estudiantes
│       ├── cursos.js          módulo de cursos
│       ├── notas.js           módulo de notas
│       ├── ia.js              módulo del asistente de IA (cliente)
│       └── app.js             navegación y panel de inicio
├── test/                      pruebas automáticas del servidor
└── docs/evidencias/           capturas del funcionamiento
```

### API del servidor

| Método y ruta | Descripción |
|---|---|
| `GET /api/ia/estado` | Indica si la IA está configurada (proveedor y modelo; nunca la clave). |
| `POST /api/ia/analizar-estudiante` | Recibe programa, semestre, estado y notas; devuelve `{ analisis, metricas }`. |
| `POST /api/ia/consulta` | Recibe una pregunta y los datos; devuelve `{ respuesta }`. |

## Evidencias

Las capturas están en `docs/evidencias/`:

1. `01-inicio.png`: panel de inicio.
2. `02-validaciones.png`: mensajes de validación en el formulario.
3. `03-estudiantes.png`: listado con estudiantes registrados y editados.
4. `04-cursos.png`: gestión de cursos.
5. `05-notas.png`: registro de notas.
6. `06-movil.png`: vista en celular.
7. `07-ia-analisis.png`: análisis de rendimiento generado por la IA.
8. `08-ia-consulta.png`: pregunta en lenguaje natural respondida por la IA.
9. `09-ia-error.png`: manejo de errores de la IA (por ejemplo, sin clave configurada).

## Limitaciones

- Las respuestas de la IA son orientativas y pueden contener errores; deben ser revisadas por una persona antes de tomar decisiones.
- Los datos viven en el navegador (`localStorage`); no hay base de datos ni cuentas de usuario.
- El servidor está pensado para uso local o académico; para publicarlo en internet habría que añadir autenticación.
