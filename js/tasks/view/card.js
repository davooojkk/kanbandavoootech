import { activarDrag } from "../drag.js";
import { LONGITUD_MAXIMA_NOMBRE } from "../model.js";
import { crearControlEstado, crearControlPrioridad } from "./controls.js";

/* La clave conserva el tipo para no confundir un id numérico con uno textual. */
export function obtenerClaveTarea(id) {
  return `${typeof id}:${String(id)}`;
}

function activarEdicionNombre({ tarea, titulo, tarjeta, guardar }) {
  titulo.addEventListener("click", () => {
    tarjeta.draggable = false;
    const campo = document.createElement("input");
    campo.classList.add("input-edit-nombres");
    campo.setAttribute("aria-label", `Nuevo nombre de ${tarea.nombre}`);
    campo.maxLength = LONGITUD_MAXIMA_NOMBRE;
    campo.value = tarea.nombre;

    titulo.replaceWith(campo);
    campo.focus();
    let edicionTerminada = false;

    function cancelar() {
      tarjeta.draggable = true;
      campo.replaceWith(titulo);
      titulo.focus();
    }

    function confirmar() {
      if (edicionTerminada) return;
      edicionTerminada = true;

      const nombre = campo.value.trim();
      if (nombre === "") cancelar();
      else guardar(tarea.id, nombre);
    }

    campo.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        confirmar();
      } else if (event.key === "Escape") {
        event.preventDefault();
        edicionTerminada = true;
        cancelar();
      }
    });
    campo.addEventListener("blur", confirmar);
  });
}

export function crearTarjeta(tarea, acciones) {
  const tarjeta = document.createElement("article");
  tarjeta.classList.add("tarea");
  tarjeta.dataset.tareaId = obtenerClaveTarea(tarea.id);
  tarjeta.setAttribute("role", "listitem");
  tarjeta.setAttribute("aria-describedby", "task-instructions");
  activarDrag(tarea, tarjeta);

  const encabezado = document.createElement("h3");
  encabezado.classList.add("tarea-encabezado");

  const titulo = document.createElement("button");
  titulo.type = "button";
  titulo.classList.add("tarea-titulo");
  titulo.setAttribute("aria-describedby", "edit-name-instructions");
  titulo.textContent = tarea.nombre;
  encabezado.appendChild(titulo);
  activarEdicionNombre({
    tarea,
    titulo,
    tarjeta,
    guardar: acciones.editarNombre,
  });

  const metadatos = document.createElement("div");
  metadatos.classList.add("tarea-meta");
  metadatos.append(
    crearControlPrioridad(tarea, acciones.editarPrioridad),
    crearControlEstado(tarea, acciones.cambiarEstado)
  );

  const eliminar = document.createElement("button");
  eliminar.type = "button";
  eliminar.classList.add("tarea-eliminar");
  eliminar.textContent = "🗑️";
  eliminar.setAttribute("aria-label", `Eliminar ${tarea.nombre}`);
  eliminar.addEventListener("click", () => acciones.eliminar(tarea.id));

  tarjeta.append(encabezado, metadatos, eliminar);
  return tarjeta;
}
