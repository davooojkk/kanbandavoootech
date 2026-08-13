import { cargarTareas, guardarTareas } from "./storage/storage.js";
import {
  crearTarea,
  eliminarTarea,
  cambiarEstado,
  editarNombre,
  editarPrioridad,
} from "./tasks/tareas.js";
import { ETIQUETAS_ESTADO, renderTareas } from "./tasks/render.js";
import { ETIQUETAS_PRIORIDAD } from "./tasks/prioridades.js";
import { activarDrop } from "./tasks/drag.js";
import { activarDialogoCuenta } from "./ui/account.js";

/*
 * Este archivo pone a trabajar juntas las distintas partes de la aplicación.
 * Aquí escuchamos al usuario y coordinamos los cambios, pero dejamos que cada
 * módulo se ocupe de su especialidad: tareas, guardado, arrastre o pantalla.
 */

// Guardamos estas referencias para leer el formulario cuando se crea una tarea.
const formulario = document.querySelector("#task-form");
const formularioInput = document.querySelector("#task-input");
const prioridadInput = document.querySelector("#task-priority");

// Cada columna representa uno de los tres estados posibles de una tarea.
const sectionPendientes = document.querySelector("#pendientes");
const sectionProgresos = document.querySelector("#en-progreso");
const sectionFinalizados = document.querySelector("#finalizados");
const anunciador = document.querySelector("#task-announcer");
const estadoPersistencia = document.querySelector("#task-storage-status");

// La carga también puede traer un aviso si tuvo que reparar datos anteriores.
const resultadoCarga = cargarTareas();
const tareas = resultadoCarga.tareas;

// Reunir las columnas en un objeto hace más clara su entrega al renderizado.
const secciones = {
  pendientes: sectionPendientes.querySelector(".column-tasks"),
  progresos: sectionProgresos.querySelector(".column-tasks"),
  finalizados: sectionFinalizados.querySelector(".column-tasks"),
};

/**
 * Comunica los cambios importantes sin añadir mensajes visuales repetidos.
 * La pequeña espera permite que un lector de pantalla anuncie incluso dos
 * acciones consecutivas con un texto parecido.
 */
function anunciarCambio(mensaje) {
  anunciador.innerText = "";
  window.setTimeout(() => {
    anunciador.innerText = mensaje;
  }, 0);
}

/**
 * Muestra un problema de persistencia tanto visualmente como a tecnologías de
 * asistencia. Cuando un guardado posterior funciona, retiramos el aviso para
 * que la interfaz vuelva a su estado habitual.
 */
function mostrarAvisoPersistencia(mensaje) {
  estadoPersistencia.textContent = mensaje;
  estadoPersistencia.hidden = false;
}

function ocultarAvisoPersistencia() {
  estadoPersistencia.hidden = true;
  estadoPersistencia.textContent = "";
}

function restaurarTareas(respaldo) {
  tareas.splice(0, tareas.length, ...respaldo);
}

function obtenerMensajeGuardado(motivo) {
  return motivo === "sin-espacio"
    ? "No queda espacio para guardar el cambio. La tarea volvió a su estado anterior."
    : "No se pudo guardar el cambio. La tarea volvió a su estado anterior.";
}

/**
 * Ejecuta cada cambio como una unidad: modificar, guardar y mostrar.
 * Si localStorage falla, restauramos la copia anterior. Si aparece un error de
 * programación inesperado, también restauramos los datos, pero lo relanzamos
 * para no esconder una falla que necesita ser corregida.
 */
function ejecutarCambio(cambiarTareas, mensajeExito) {
  const respaldo = tareas.map((tarea) => ({ ...tarea }));
  const cambioRealizado = cambiarTareas();

  if (!cambioRealizado) {
    return false;
  }

  try {
    const resultadoGuardado = guardarTareas(tareas);

    if (!resultadoGuardado.ok) {
      restaurarTareas(respaldo);
      renderTareas(contextoRender);
      mostrarAvisoPersistencia(
        obtenerMensajeGuardado(resultadoGuardado.motivo)
      );
      return false;
    }
  } catch (error) {
    restaurarTareas(respaldo);
    renderTareas(contextoRender);
    throw error;
  }

  ocultarAvisoPersistencia();
  renderTareas(contextoRender);
  anunciarCambio(mensajeExito);
  return true;
}

// Cada una de estas funciones completa el mismo ciclo: cambiar, guardar y mostrar.
function manejarCrearTarea(nombre, prioridad) {
  return ejecutarCambio(
    () => crearTarea(tareas, nombre, prioridad),
    `Tarea ${nombre} creada.`
  );
}

function manejarEliminarTarea(id) {
  const tareaEliminada = tareas.find((tarea) => tarea.id === id);
  return ejecutarCambio(
    () => eliminarTarea(tareas, id),
    `Tarea ${tareaEliminada?.nombre ?? "seleccionada"} eliminada.`
  );
}

function manejarCambiarEstado(id, nuevoEstado) {
  const tareaActualizada = tareas.find((tarea) => tarea.id === id);
  return ejecutarCambio(
    () => cambiarEstado(tareas, id, nuevoEstado),
    `Tarea ${tareaActualizada?.nombre ?? "seleccionada"} movida a ${ETIQUETAS_ESTADO[nuevoEstado]}.`
  );
}

function manejarEditarNombre(id, nuevoNombre) {
  return ejecutarCambio(
    () => editarNombre(tareas, id, nuevoNombre),
    `Nombre actualizado a ${nuevoNombre}.`
  );
}

function manejarEditarPrioridad(id, nuevaPrioridad) {
  const tareaActualizada = tareas.find((tarea) => tarea.id === id);
  return ejecutarCambio(
    () => editarPrioridad(tareas, id, nuevaPrioridad),
    `Prioridad de ${tareaActualizada?.nombre ?? "la tarea"} actualizada a ${ETIQUETAS_PRIORIDAD[nuevaPrioridad]}.`
  );
}

// El render recibe las acciones agrupadas para saber qué hacer con cada control.
const manejadores = {
  eliminar: manejarEliminarTarea,
  cambiarEstado: manejarCambiarEstado,
  editarNombre: manejarEditarNombre,
  editarPrioridad: manejarEditarPrioridad,
};

// Este objeto reúne los datos, las columnas y las acciones que necesita el render.
const contextoRender = {
  tareas,
  secciones,
  manejadores,
};

formulario.addEventListener("submit", (event) => {
  event.preventDefault();

  // Quitamos los espacios de los extremos para no aceptar una tarea vacía.
  const nombreTarea = formularioInput.value.trim();

  if (nombreTarea === "") {
    return;
  }

  const tareaGuardada = manejarCrearTarea(
    nombreTarea,
    prioridadInput.value
  );

  if (!tareaGuardada) {
    formularioInput.focus();
    return;
  }

  // Dejamos el formulario listo para crear la siguiente tarea.
  formularioInput.value = "";
  prioridadInput.value = "normal";
});

formularioInput.addEventListener("input", () => {
  formularioInput.setCustomValidity("");
});

formularioInput.addEventListener("invalid", () => {
  formularioInput.setCustomValidity("Escribe el nombre de la tarea.");
});

// Al soltar una tarjeta, cada columna asigna el estado que le corresponde.
activarDrop(sectionPendientes, "pendiente", manejarCambiarEstado);
activarDrop(sectionProgresos, "en progreso", manejarCambiarEstado);
activarDrop(sectionFinalizados, "finalizado", manejarCambiarEstado);

// El acceso todavía no existe; el diálogo explica su estado y devuelve el foco.
activarDialogoCuenta();

// Al iniciar solo mostramos lo recuperado; todavía no hay ningún cambio que guardar.
renderTareas(contextoRender);

if (resultadoCarga.aviso !== null) {
  mostrarAvisoPersistencia(resultadoCarga.aviso);
}
