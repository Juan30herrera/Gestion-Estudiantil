# Gestión Estudiantil

Prototipo funcional para administrar estudiantes, cursos y notas de una institución educativa. Proyecto de Taller de Programación (Fase II).

## Funcionalidades
- **Inicio:** resumen con total de estudiantes, cursos, promedio general, mejores promedios y estudiantes por estado.
- **Estudiantes:** registrar, editar, eliminar, buscar (nombre, código o correo) y filtrar por programa.
- **Cursos:** registrar, editar y eliminar cursos.
- **Notas:** asignar una nota (0.0 a 5.0) a un estudiante en un curso; el promedio de cada estudiante se calcula automáticamente.
- **Navegación** entre las cuatro vistas desde el menú superior (adaptado a celular).

## Validaciones
- Código único y con formato válido (estudiantes y cursos).
- Nombre solo con letras (3 a 60 caracteres) y correo con formato válido.
- Semestre entre 1 y 10, créditos entre 1 y 6, nota entre 0.0 y 5.0.
- Confirmación antes de eliminar; al eliminar un estudiante o curso se borran también sus notas.

## Manejo de datos
Los datos se guardan en el navegador con `localStorage`, por lo que persisten al recargar la página. Al primer uso se cargan datos de ejemplo.
Todavía no hay backend ni base de datos; la integración de IA se hará en la entrega final.

## Cómo ejecutarlo
1. Descarga o clona el repositorio.
2. Abre `frontend/index.html` en el navegador (no requiere instalar nada).

## Estructura del proyecto
```
GestionEstudiantil/
├── README.md
├── docs/
│   └── evidencias/        capturas del funcionamiento
└── frontend/
    ├── index.html
    ├── css/styles.css
    └── js/
        ├── storage.js         datos y localStorage
        ├── validaciones.js    reglas de validación
        ├── ui.js              utilidades de interfaz
        ├── estudiantes.js     módulo de estudiantes
        ├── cursos.js          módulo de cursos
        ├── notas.js           módulo de notas
        └── app.js             navegación y panel de inicio
```

## Evidencias
Las capturas están en `docs/evidencias/`:
1. `01-inicio.png`: panel de inicio.
2. `02-validaciones.png`: mensajes de validación en el formulario.
3. `03-estudiantes.png`: listado con estudiantes registrados y editados.
4. `04-cursos.png`: gestión de cursos.
5. `05-notas.png`: registro de notas.
6. `06-movil.png`: vista en celular.
