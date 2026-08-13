import assert from "node:assert/strict";
import {
  cambiarEstado,
  compararPrioridad,
  crearTarea,
  editarNombre,
  editarPrioridad,
  eliminarTarea,
  LONGITUD_MAXIMA_NOMBRE,
} from "./js/tasks/model.js";

/* Prueba las reglas sin DOM, navegador ni localStorage. */
const tareas = [];

assert.equal(crearTarea(tareas, "   ", "normal"), false);
assert.equal(
  crearTarea(tareas, "x".repeat(LONGITUD_MAXIMA_NOMBRE + 1), "normal"),
  false
);
assert.equal(crearTarea(tareas, "Documentar arquitectura", "desconocida"), true);
assert.equal(tareas[0].prioridad, "normal");

const id = tareas[0].id;
assert.equal(editarPrioridad(tareas, id, "critico"), true);
assert.equal(editarPrioridad(tareas, id, "critico"), false);
assert.equal(cambiarEstado(tareas, id, "en progreso"), true);
assert.equal(cambiarEstado(tareas, id, "inexistente"), false);
assert.equal(editarNombre(tareas, id, "  Arquitectura lista  "), true);
assert.equal(tareas[0].nombre, "Arquitectura lista");

crearTarea(tareas, "Tarea normal", "normal");
assert.deepEqual(
  [...tareas].sort(compararPrioridad).map((tarea) => tarea.prioridad),
  ["critico", "normal"]
);
assert.equal(eliminarTarea(tareas, id), true);
assert.equal(eliminarTarea(tareas, id), false);

console.log("OK: reglas puras del modelo verificadas");
