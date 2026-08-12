import {
  cargarTareas,
  guardarTareas,
} from "./storage/storage.js";

import {
  crearTarea,
  eliminarTarea,
  cambiarEstado,
  editarNombre,
} from "./tasks/tareas.js";

import { renderTareas } from "./tasks/render.js";
import { activarDrop } from "./tasks/drag.js";

const formulario = document.querySelector("#task-form");
const formularioInput = document.querySelector("#task-input");

const sectionPendientes = document.querySelector("#pendientes");
const sectionProgresos = document.querySelector("#en-progreso");
const sectionFinalizados = document.querySelector("#finalizados");

let tareas = cargarTareas();

const secciones = {
  pendientes: sectionPendientes,
  progresos: sectionProgresos,
  finalizados: sectionFinalizados,
};

function actualizarAplicacion() {
  guardarTareas(tareas);
  renderTareas(
    tareas,
    secciones,
    manejarEliminarTarea,
    manejarEditarNombre
  );
}

function manejarCrearTarea(nombre) {
  crearTarea(tareas, nombre);
  actualizarAplicacion();
}

function manejarEliminarTarea(id) {
  eliminarTarea(tareas, id);
  actualizarAplicacion();
}

function manejarCambiarEstado(id, nuevoEstado) {
  cambiarEstado(tareas, id, nuevoEstado);
  actualizarAplicacion();
}

function manejarEditarNombre(id, nuevoNombre) {
  editarNombre(tareas, id, nuevoNombre);
  actualizarAplicacion();
}

formulario.addEventListener("submit", (event) => {
  event.preventDefault();

  const nombreTarea = formularioInput.value.trim();

  if (nombreTarea === "") {
    return;
  }

  manejarCrearTarea(nombreTarea);
  formularioInput.value = "";
});

activarDrop(sectionPendientes, "pendiente", manejarCambiarEstado);
activarDrop(sectionProgresos, "en progreso", manejarCambiarEstado);
activarDrop(sectionFinalizados, "finalizado", manejarCambiarEstado);

renderTareas(
  tareas,
  secciones,
  manejarEliminarTarea,
  manejarEditarNombre
);