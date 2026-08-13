# kanbandavoootech

Tablero Kanban local para organizar tareas en tres estados: pendientes, en progreso y finalizadas. Cada tarea tiene una prioridad —Crítico, Alto o Normal— y el tablero ordena automáticamente cada columna de mayor a menor urgencia.

El proyecto está hecho con HTML, CSS y módulos nativos de JavaScript. No necesita framework, compilador ni servidor de datos: las tareas se conservan en `localStorage`.

## Funciones principales

- Crear, renombrar, mover y eliminar tareas.
- Cambiar estado mediante selector accesible o drag and drop.
- Editar prioridad y reordenar cada columna automáticamente.
- Recuperar una eliminación durante diez segundos con **Deshacer**, `Control + Z` o `Command + Z`.
- Validar, reparar y respaldar datos antiguos o dañados.
- Revertir la interfaz si el navegador no permite guardar.
- Navegar con teclado y recibir anuncios mediante lectores de pantalla.
- Adaptarse sin desbordamiento desde 320 hasta 1280 píxeles y tamaños superiores.

## Arquitectura de JavaScript

La estructura separa las reglas del producto, la coordinación y la interfaz. `app.js` funciona únicamente como punto de composición: crea los módulos y conecta sus dependencias.

```text
js/
├── app.js                     inicia y conecta la aplicación
├── storage/
│   ├── storage.js             lee, respalda y persiste localStorage
│   └── task-schema.js         valida y normaliza registros externos
├── tasks/
│   ├── model.js               reglas puras, estados y prioridades
│   ├── controller.js          transacciones, guardado y acciones
│   ├── drag.js                gesto de arrastrar y zonas de destino
│   └── view/
│       ├── board.js           orden, columnas y recuperación del foco
│       ├── card.js            estructura y edición de una tarjeta
│       └── controls.js        selectores de estado y prioridad
└── ui/
    ├── dom.js                 contrato entre HTML y JavaScript
    ├── task-form.js           validación y envío del formulario
    ├── feedback.js            avisos, anuncios y Deshacer
    └── account.js             diálogo del acceso futuro
```

### Flujo de un cambio

Una acción de la vista llama al controlador. El controlador pide al modelo que modifique los datos, intenta guardarlos y solo entonces vuelve a renderizar. Si `localStorage` falla, restaura la copia anterior antes de actualizar la pantalla.

```text
interfaz → controlador → modelo → localStorage
                │              │
                └── vista ←────┘
```

Esta separación deja tres garantías útiles:

- El modelo puede probarse sin navegador.
- La vista no puede guardar ni modificar datos por su cuenta.
- Todas las acciones comparten persistencia, reversión, anuncios y recuperación del foco.

## Arquitectura de CSS

`css/style.css` es el único punto de entrada. Las cascade layers expresan el orden de precedencia y evitan resolver conflictos acumulando selectores cada vez más específicos.

```text
css/
├── settings/       tokens de color, espacio, radios y movimiento
├── base/           reset y estilos globales del documento
├── layout/         estructura general de página y tablero
├── components/     formulario, columnas, tarjetas, selectores y navegación
├── utilities/      accesibilidad y preferencia de movimiento reducido
└── style.css       orden explícito de todas las capas
```

Los selectores de tarjeta tienen una base compartida y variantes independientes para estado y prioridad. Header y footer también viven en componentes separados. Los breakpoints están junto al componente que adaptan; así una nueva pieza no necesita añadir excepciones a un archivo responsive global.

La paleta se mantiene en 17 variables. El color señala acciones, estados y prioridades; la jerarquía restante depende de tipografía, alineación y una escala espacial basada en 8 píxeles. Las sombras se reservan para elementos que realmente se superponen, como menús y diálogos.

## Accesibilidad y robustez

La página declara el español, conserva nombres accesibles, utiliza regiones semánticas y ofrece foco visible. Después de renderizar, el foco vuelve al control actualizado; al borrar, continúa en una tarjeta vecina o en el encabezado de la columna vacía.

El diálogo nativo se cierra con `Escape` y devuelve el foco al header. `Enter` envía el formulario mediante `requestSubmit`, y los nombres tienen un límite de 120 caracteres tanto en HTML como en el modelo.

Los datos recuperados se tratan como entrada externa: se comprueba su estructura, se normalizan valores seguros y se conservan respaldos antes de reemplazar información dañada. Los errores de cuota o permisos revierten el cambio para mantener memoria, pantalla y almacenamiento sincronizados.

## Cómo añadir una función

Para mantener los límites actuales:

1. Añade la regla y la validación en `tasks/model.js`.
2. Expón la operación mediante `tasks/controller.js` para reutilizar el ciclo de guardado.
3. Añade o adapta un componente dentro de `tasks/view/` o `ui/`.
4. Coloca sus estilos en un archivo de componente y sus variantes responsive en ese mismo archivo.
5. Incorpora el recorrido a `test-smoke.cjs`, incluida la persistencia y la continuidad del foco cuando corresponda.

Los comentarios del código se reservan para explicar responsabilidades, decisiones y casos que no son evidentes. No narran línea por línea lo que JavaScript o CSS ya expresan por sí mismos.

## Pruebas

Primero inicia la web en `http://127.0.0.1:8765/`. Después instala las dependencias y ejecuta:

```bash
npm install
npm test
```

`test-model.mjs` comprueba las reglas puras en pocos milisegundos. Después, `test-smoke.cjs` recorre creación con botón y `Enter`, edición, prioridades, drag and drop real, eliminación reversible, foco, recarga, datos antiguos, JSON dañado, cuota agotada, bloqueo de `localStorage`, contraste y responsive entre 320 y 1280 píxeles.

Si Chrome no está instalado, Playwright puede preparar Chromium con:

```bash
npx playwright install chromium
```

## Historial breve

- **1.0:** operaciones básicas del tablero.
- **1.1:** drag and drop y simplificación de acciones.
- **1.2:** corrección de duplicados y conflictos entre edición y arrastre.
- **1.3:** primera división del JavaScript en módulos.
- **2.0:** prioridades, orden automático, responsive, accesibilidad y persistencia robusta.
- **2.1:** menús propios, refinamiento visual minimalista, eliminación reversible, continuidad del foco y nueva arquitectura modular de JavaScript y CSS.

## Desarrollo asistido con IA

Desde la versión 2.0 empecé a utilizar Codex durante el desarrollo. Es mi primera experiencia probando un flujo de trabajo con agentes de IA, por lo que el proyecto puede contener decisiones o prácticas mejorables relacionadas con este proceso. El código está documentado en español para poder revisar qué hace cada módulo, entender las decisiones importantes y mantener control humano sobre su funcionamiento.
