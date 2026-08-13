import { normalizarPrioridad, PRIORIDADES } from "./prioridades.js";

/*
 * Este archivo contiene las reglas para crear y modificar tareas.
 * No toca la pantalla ni localStorage. Al mantener esas tareas separadas, sus
 * resultados son más fáciles de entender y probar.
 */

// Esta lista reúne los únicos estados que entiende el tablero.
export const ESTADOS = ["pendiente", "en progreso", "finalizado"];

let secuenciaIdAlternativo = 0;

/**
 * Crea un identificador que no se repita entre las tareas conocidas.
 * Los navegadores actuales ofrecen UUID seguros. Conservamos una alternativa
 * sencilla para que la aplicación también funcione en un navegador antiguo.
 */
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

/**
 * Añade una tarea nueva en la columna de pendientes.
 * Antes de incorporarla comprobamos su prioridad para que siempre tenga uno
 * de los tres valores admitidos.
 */
export function crearTarea(tareas, nombre, prioridad = "normal") {
  const nombreLimpio = typeof nombre === "string" ? nombre.trim() : "";

  if (nombreLimpio === "") {
    return false;
  }

  const idsExistentes = new Set(tareas.map((tarea) => tarea.id));
  const nuevaTarea = {
    id: crearIdTarea(idsExistentes),
    nombre: nombreLimpio,
    estado: "pendiente",
    prioridad: normalizarPrioridad(prioridad),
  };

  tareas.push(nuevaTarea);
  return true;
}

/** Busca una tarea por su identificador y la elimina si existe. */
export function eliminarTarea(tareas, id) {
  const tareaEncontrada = tareas.findIndex((tarea) => tarea.id === id);

  if (tareaEncontrada !== -1) {
    tareas.splice(tareaEncontrada, 1);
    return true;
  }

  return false;
}

/** Actualiza el estado y, con él, la columna donde se mostrará la tarea. */
export function cambiarEstado(tareas, id, nuevoEstado) {
  const tareaEncontrada = tareas.find((tarea) => tarea.id === id);

  if (tareaEncontrada !== undefined && ESTADOS.includes(nuevoEstado)) {
    tareaEncontrada.estado = nuevoEstado;
    return true;
  }

  return false;
}

/** Actualiza el nombre sin reemplazar el resto de los datos de la tarea. */
export function editarNombre(tareas, id, nuevoNombre) {
  const tareaEncontrada = tareas.find((tarea) => tarea.id === id);
  const nombreLimpio =
    typeof nuevoNombre === "string" ? nuevoNombre.trim() : "";

  if (tareaEncontrada !== undefined && nombreLimpio !== "") {
    tareaEncontrada.nombre = nombreLimpio;
    return true;
  }

  return false;
}

/**
 * Cambia la prioridad únicamente cuando el nuevo valor es válido.
 * Si llegara un dato desconocido, conservamos la prioridad anterior en vez de
 * modificar la tarea sin que el usuario lo haya pedido.
 */
export function editarPrioridad(tareas, id, nuevaPrioridad) {
  const tareaEncontrada = tareas.find((tarea) => tarea.id === id);

  if (
    tareaEncontrada !== undefined &&
    PRIORIDADES.includes(nuevaPrioridad)
  ) {
    tareaEncontrada.prioridad = nuevaPrioridad;
    return true;
  }

  return false;
}
