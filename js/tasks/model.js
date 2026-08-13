/*
 * Reglas del dominio de tareas. Este módulo no conoce el DOM ni localStorage:
 * recibe datos, aplica una regla y comunica si hubo un cambio real.
 */

export const ESTADOS = ["pendiente", "en progreso", "finalizado"];
export const PRIORIDADES = ["critico", "alto", "normal"];
export const LONGITUD_MAXIMA_NOMBRE = 120;

export const ETIQUETAS_ESTADO = {
  pendiente: "Pendiente",
  "en progreso": "En progreso",
  finalizado: "Finalizada",
};

export const ETIQUETAS_PRIORIDAD = {
  critico: "Crítico",
  alto: "Alto",
  normal: "Normal",
};

const PESO_PRIORIDAD = {
  critico: 0,
  alto: 1,
  normal: 2,
};

let secuenciaIdAlternativo = 0;

export function normalizarPrioridad(prioridad) {
  return PRIORIDADES.includes(prioridad) ? prioridad : "normal";
}

export function compararPrioridad(tareaA, tareaB) {
  return (
    PESO_PRIORIDAD[normalizarPrioridad(tareaA.prioridad)] -
    PESO_PRIORIDAD[normalizarPrioridad(tareaB.prioridad)]
  );
}

/** Genera un UUID y conserva una alternativa para navegadores antiguos. */
export function crearIdTarea(idsExistentes = new Set()) {
  let id;

  do {
    if (typeof globalThis.crypto?.randomUUID === "function") {
      id = globalThis.crypto.randomUUID();
    } else {
      secuenciaIdAlternativo += 1;
      id = `${Date.now()}-${secuenciaIdAlternativo}`;
    }
  } while (idsExistentes.has(id));

  return id;
}

export function crearTarea(tareas, nombre, prioridad = "normal") {
  const nombreLimpio = typeof nombre === "string" ? nombre.trim() : "";

  if (
    nombreLimpio === "" ||
    nombreLimpio.length > LONGITUD_MAXIMA_NOMBRE
  ) {
    return false;
  }

  tareas.push({
    id: crearIdTarea(new Set(tareas.map((tarea) => tarea.id))),
    nombre: nombreLimpio,
    estado: "pendiente",
    prioridad: normalizarPrioridad(prioridad),
  });
  return true;
}

export function eliminarTarea(tareas, id) {
  const indice = tareas.findIndex((tarea) => tarea.id === id);

  if (indice === -1) {
    return false;
  }

  tareas.splice(indice, 1);
  return true;
}

export function cambiarEstado(tareas, id, nuevoEstado) {
  const tarea = tareas.find((elemento) => elemento.id === id);

  if (
    tarea === undefined ||
    !ESTADOS.includes(nuevoEstado) ||
    tarea.estado === nuevoEstado
  ) {
    return false;
  }

  tarea.estado = nuevoEstado;
  return true;
}

export function editarNombre(tareas, id, nuevoNombre) {
  const tarea = tareas.find((elemento) => elemento.id === id);
  const nombreLimpio =
    typeof nuevoNombre === "string" ? nuevoNombre.trim() : "";

  if (
    tarea === undefined ||
    nombreLimpio === "" ||
    nombreLimpio.length > LONGITUD_MAXIMA_NOMBRE
  ) {
    return false;
  }

  tarea.nombre = nombreLimpio;
  return true;
}

export function editarPrioridad(tareas, id, nuevaPrioridad) {
  const tarea = tareas.find((elemento) => elemento.id === id);

  if (
    tarea === undefined ||
    !PRIORIDADES.includes(nuevaPrioridad) ||
    tarea.prioridad === nuevaPrioridad
  ) {
    return false;
  }

  tarea.prioridad = nuevaPrioridad;
  return true;
}
