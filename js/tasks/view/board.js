import { compararPrioridad } from "../model.js";
import { crearTarjeta, obtenerClaveTarea } from "./card.js";

const LISTA_POR_ESTADO = {
  pendiente: "pendientes",
  "en progreso": "progresos",
  finalizado: "finalizados",
};

const SELECTOR_FOCO = {
  titulo: ".tarea-titulo",
  prioridad: ".tarea-prioridad",
  estado: ".tarea-estado-resumen",
};

function obtenerLista(secciones, estado) {
  return secciones[LISTA_POR_ESTADO[estado]];
}

function actualizarEstadosVacios(secciones) {
  Object.values(secciones).forEach((lista) => {
    const mensaje = lista.parentElement.querySelector(".column-empty");
    if (mensaje) mensaje.hidden = lista.childElementCount > 0;
  });
}

function restaurarFoco(secciones, destino) {
  if (!destino) return;

  if (destino.tipo === "tarea") {
    const clave = obtenerClaveTarea(destino.id);
    const tarjeta = [...document.querySelectorAll(".tarea")].find(
      (elemento) => elemento.dataset.tareaId === clave
    );
    tarjeta?.querySelector(SELECTOR_FOCO[destino.control])?.focus();
    return;
  }

  const lista = obtenerLista(secciones, destino.estado);
  const tarjetas = [...lista.querySelectorAll(".tarea")];
  const indice = Math.min(destino.indice, tarjetas.length - 1);

  if (indice >= 0) tarjetas[indice].querySelector(".tarea-titulo")?.focus();
  else lista.parentElement.querySelector(".column-title")?.focus();
}

/** Reconstruye la vista a partir del estado actual, sin modificar los datos. */
export function renderizarTablero(
  { tareas, secciones, acciones },
  destinoFoco = null
) {
  Object.values(secciones).forEach((lista) => lista.replaceChildren());

  [...tareas].sort(compararPrioridad).forEach((tarea) => {
    obtenerLista(secciones, tarea.estado).appendChild(
      crearTarjeta(tarea, acciones)
    );
  });

  actualizarEstadosVacios(secciones);
  restaurarFoco(secciones, destinoFoco);
}
