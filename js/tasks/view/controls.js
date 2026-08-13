import {
  ESTADOS,
  ETIQUETAS_ESTADO,
  ETIQUETAS_PRIORIDAD,
  normalizarPrioridad,
  PRIORIDADES,
} from "../model.js";

/*
 * Selectores internos de una tarjeta. Comparten el comportamiento de apertura
 * y teclado; cada variante solo aporta sus opciones y sus textos accesibles.
 */

function conectarDesplegable(control, activador) {
  control.addEventListener("toggle", () => {
    if (!control.open) return;

    document.querySelectorAll(".tarea details[open]").forEach((otro) => {
      if (otro !== control) otro.open = false;
    });
  });

  control.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && control.open) {
      control.open = false;
      activador.focus();
    }
  });

  control.addEventListener("focusout", () => {
    window.requestAnimationFrame(() => {
      if (!control.contains(document.activeElement)) control.open = false;
    });
  });
}

function crearFlecha(claseEspecifica) {
  const flecha = document.createElement("span");
  flecha.classList.add("selector-tarea__flecha", claseEspecifica);
  flecha.setAttribute("aria-hidden", "true");
  return flecha;
}

function crearOpcion({ texto, ariaLabel, actual, clases, alElegir }) {
  const opcion = document.createElement("button");
  opcion.type = "button";
  opcion.classList.add("selector-tarea__opcion", ...clases);
  opcion.textContent = texto;
  opcion.setAttribute("aria-label", ariaLabel);
  opcion.setAttribute("aria-pressed", String(actual));

  if (actual) opcion.classList.add("selector-tarea__opcion--actual");
  opcion.addEventListener("click", alElegir);
  return opcion;
}

export function crearControlEstado(tarea, cambiarEstado) {
  const control = document.createElement("details");
  control.classList.add(
    "selector-tarea",
    "selector-tarea--estado",
    "tarea-estado-control"
  );

  const activador = document.createElement("summary");
  activador.classList.add("selector-tarea__activador", "tarea-estado-resumen");
  activador.setAttribute(
    "aria-label",
    `Cambiar estado de ${tarea.nombre}. Estado actual: ${ETIQUETAS_ESTADO[tarea.estado]}`
  );

  const etiqueta = document.createElement("span");
  etiqueta.classList.add("tarea-estado-etiqueta");
  etiqueta.textContent = "Estado";

  const valor = document.createElement("span");
  valor.classList.add("tarea-estado-valor");
  valor.textContent = ETIQUETAS_ESTADO[tarea.estado];
  activador.append(etiqueta, valor, crearFlecha("tarea-estado-flecha"));

  const opciones = document.createElement("div");
  opciones.classList.add("selector-tarea__opciones", "tarea-estado-opciones");

  ESTADOS.forEach((estado) => {
    const actual = estado === tarea.estado;
    opciones.appendChild(
      crearOpcion({
        texto: ETIQUETAS_ESTADO[estado],
        ariaLabel: `Mover ${tarea.nombre} a ${ETIQUETAS_ESTADO[estado]}`,
        actual,
        clases: [
          "tarea-estado-opcion",
          ...(actual ? ["tarea-estado-opcion--actual"] : []),
        ],
        alElegir: () => {
          control.open = false;
          if (!actual) cambiarEstado(tarea.id, estado);
        },
      })
    );
  });

  control.append(activador, opciones);
  conectarDesplegable(control, activador);
  return control;
}

export function crearControlPrioridad(tarea, editarPrioridad) {
  const prioridadActual = normalizarPrioridad(tarea.prioridad);
  const control = document.createElement("details");
  control.classList.add(
    "selector-tarea",
    "selector-tarea--prioridad",
    "tarea-prioridad-control"
  );

  const activador = document.createElement("summary");
  activador.classList.add(
    "selector-tarea__activador",
    "tarea-prioridad",
    `tarea-prioridad--${prioridadActual}`
  );
  activador.setAttribute(
    "aria-label",
    `Editar prioridad de ${tarea.nombre}. Prioridad actual: ${ETIQUETAS_PRIORIDAD[prioridadActual]}`
  );

  const valor = document.createElement("span");
  valor.textContent = ETIQUETAS_PRIORIDAD[prioridadActual];
  activador.append(valor, crearFlecha("tarea-prioridad-flecha"));

  const opciones = document.createElement("div");
  opciones.classList.add(
    "selector-tarea__opciones",
    "tarea-prioridad-opciones"
  );

  PRIORIDADES.forEach((prioridad) => {
    const actual = prioridad === prioridadActual;
    opciones.appendChild(
      crearOpcion({
        texto: ETIQUETAS_PRIORIDAD[prioridad],
        ariaLabel: `Cambiar prioridad de ${tarea.nombre} a ${ETIQUETAS_PRIORIDAD[prioridad]}`,
        actual,
        clases: [
          "tarea-prioridad-opcion",
          `tarea-prioridad-opcion--${prioridad}`,
          ...(actual ? ["tarea-prioridad-opcion--actual"] : []),
        ],
        alElegir: () => {
          control.open = false;
          if (!actual) editarPrioridad(tarea.id, prioridad);
        },
      })
    );
  });

  control.append(activador, opciones);
  conectarDesplegable(control, activador);
  return control;
}
