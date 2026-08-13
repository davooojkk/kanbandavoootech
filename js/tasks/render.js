import { activarDrag } from "./drag.js";
import { ESTADOS } from "./tareas.js";
import {
  ETIQUETAS_PRIORIDAD,
  normalizarPrioridad,
  obtenerPesoPrioridad,
  PRIORIDADES,
} from "./prioridades.js";

/*
 * Este archivo convierte las tareas guardadas en tarjetas visibles.
 * Se ocupa de ordenarlas, colocarlas en su columna y conectar sus controles,
 * pero deja los cambios de datos en manos de las funciones recibidas.
 */

// Traducimos los valores guardados a textos naturales para mostrarlos en la tarjeta.
export const ETIQUETAS_ESTADO = {
  pendiente: "Pendiente",
  "en progreso": "En progreso",
  finalizado: "Finalizada",
};

/** Crea una tarjeta completa y conecta sus acciones de edición y eliminación. */
function crearTarjeta({
  tarea,
  manejadores,
  cancelarEdicion,
}) {
  const tarjetaDiv = document.createElement("article");
  tarjetaDiv.classList.add("tarea");
  tarjetaDiv.setAttribute("role", "listitem");
  tarjetaDiv.setAttribute("aria-describedby", "task-instructions");
  activarDrag(tarea, tarjetaDiv);

  // El título funciona como acceso directo para editar el nombre.
  const tarjetaEncabezado = document.createElement("h3");
  tarjetaEncabezado.classList.add("tarea-encabezado");
  const tarjetaTitulo = document.createElement("button");
  tarjetaTitulo.type = "button";
  tarjetaTitulo.classList.add("tarea-titulo");
  tarjetaTitulo.setAttribute("aria-describedby", "edit-name-instructions");
  tarjetaTitulo.innerText = tarea.nombre;
  tarjetaEncabezado.appendChild(tarjetaTitulo);
  activarEdicionNombre({
    tarea,
    tarjetaTitulo,
    tarjetaDiv,
    guardarEdicion: manejadores.editarNombre,
    cancelarEdicion,
  });

  // El selector conserva el estado visible y ofrece una alternativa al arrastre.
  const tarjetaEstadoContenedor = document.createElement("span");
  tarjetaEstadoContenedor.classList.add("selector-estado");
  const tarjetaEstado = document.createElement("select");
  tarjetaEstado.classList.add("tarea-estado");
  tarjetaEstado.setAttribute("aria-label", `Cambiar estado de ${tarea.nombre}`);

  ESTADOS.forEach((estado) => {
    const opcion = document.createElement("option");
    opcion.value = estado;
    opcion.innerText = `Estado: ${ETIQUETAS_ESTADO[estado]}`;
    tarjetaEstado.appendChild(opcion);
  });

  tarjetaEstado.value = tarea.estado;
  tarjetaEstado.addEventListener("change", () => {
    manejadores.cambiarEstado(tarea.id, tarjetaEstado.value);
  });
  tarjetaEstadoContenedor.appendChild(tarjetaEstado);

  const prioridad = normalizarPrioridad(tarea.prioridad);
  const tarjetaPrioridad = document.createElement("button");
  tarjetaPrioridad.type = "button";
  tarjetaPrioridad.classList.add(
    "tarea-prioridad",
    `tarea-prioridad--${prioridad}`
  );
  tarjetaPrioridad.innerText = ETIQUETAS_PRIORIDAD[prioridad];

  tarjetaPrioridad.setAttribute(
    "aria-label",
    `Editar prioridad de ${tarea.nombre}. Prioridad actual: ${ETIQUETAS_PRIORIDAD[prioridad]}`
  );
  activarEdicionPrioridad({
    tarea,
    tarjetaPrioridad,
    tarjetaDiv,
    guardarEdicion: manejadores.editarPrioridad,
    cancelarEdicion,
  });

  const botonEliminar = document.createElement("button");
  botonEliminar.type = "button";
  botonEliminar.classList.add("tarea-eliminar");
  botonEliminar.innerText = "🗑️";
  botonEliminar.setAttribute("aria-label", `Eliminar ${tarea.nombre}`);
  botonEliminar.addEventListener("click", () => {
    manejadores.eliminar(tarea.id);
  });

  // Añadimos los elementos en el mismo orden en el que se leen en la tarjeta.
  tarjetaDiv.append(
    tarjetaEncabezado,
    tarjetaEstadoContenedor,
    tarjetaPrioridad,
    botonEliminar
  );

  return tarjetaDiv;
}

/** Al pulsar el título, lo cambia temporalmente por un campo de texto. */
function activarEdicionNombre({
  tarea,
  tarjetaTitulo,
  tarjetaDiv,
  guardarEdicion,
  cancelarEdicion,
}) {
  tarjetaTitulo.addEventListener("click", () => {
    // Mientras se escribe, desactivamos el arrastre para evitar movimientos accidentales.
    tarjetaDiv.draggable = false;
    const inputEditar = document.createElement("input");

    inputEditar.classList.add("input-edit-nombres");
    inputEditar.setAttribute("aria-label", `Nuevo nombre de ${tarea.nombre}`);
    inputEditar.value = tarea.nombre;

    tarjetaTitulo.replaceWith(inputEditar);
    inputEditar.focus();

    let edicionCancelada = false;

    function confirmarEdicion() {
      if (edicionCancelada) {
        return;
      }

      const nuevoNombre = inputEditar.value.trim();

      if (nuevoNombre !== "") {
        guardarEdicion(tarea.id, nuevoNombre);
      } else {
        // Si no quedó ningún texto, cancelamos y volvemos a mostrar el nombre anterior.
        cancelarEdicion();
      }
    }

    // Enter quita el foco y aprovecha el mismo guardado que un clic fuera del campo.
    inputEditar.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        inputEditar.blur();
      } else if (event.key === "Escape") {
        edicionCancelada = true;
        cancelarEdicion();
      }
    });

    inputEditar.addEventListener("blur", confirmarEdicion);
  });
}

/** Al pulsar la prioridad, muestra un selector con las tres opciones disponibles. */
function activarEdicionPrioridad({
  tarea,
  tarjetaPrioridad,
  tarjetaDiv,
  guardarEdicion,
  cancelarEdicion,
}) {
  function abrirEdicion() {
    tarjetaDiv.draggable = false;
    const selectPrioridad = document.createElement("select");
    selectPrioridad.classList.add("input-edit-prioridad");
    selectPrioridad.setAttribute("aria-label", `Nueva prioridad de ${tarea.nombre}`);

    // Creamos las opciones desde la lista central para no repetirlas a mano.
    PRIORIDADES.forEach((prioridad) => {
      const opcion = document.createElement("option");
      opcion.value = prioridad;
      opcion.innerText = ETIQUETAS_PRIORIDAD[prioridad];
      selectPrioridad.appendChild(opcion);
    });

    selectPrioridad.value = normalizarPrioridad(tarea.prioridad);

    // Este contenedor permite dibujar y girar nuestra propia flecha con CSS.
    const contenedorSelect = document.createElement("span");
    contenedorSelect.classList.add(
      "selector-prioridad",
      "selector-prioridad--edicion"
    );
    contenedorSelect.appendChild(selectPrioridad);

    tarjetaPrioridad.replaceWith(contenedorSelect);
    selectPrioridad.focus();

    // Recordamos si ya se guardó para no cancelar la edición al perder el foco.
    let edicionGuardada = false;

    selectPrioridad.addEventListener("change", () => {
      edicionGuardada = true;
      guardarEdicion(tarea.id, selectPrioridad.value);
    });

    selectPrioridad.addEventListener("blur", () => {
      if (!edicionGuardada) {
        cancelarEdicion();
      }
    });
  }

  tarjetaPrioridad.addEventListener("click", abrirEdicion);
}

/**
 * Vacía las columnas y vuelve a construir el tablero con los datos actuales.
 * Ordenamos una copia del arreglo: la prioridad cambia el orden en pantalla,
 * pero no modifica por sorpresa el orden de los datos guardados.
 */
export function renderTareas({ tareas, secciones, manejadores }) {
  secciones.pendientes.innerHTML = "";
  secciones.progresos.innerHTML = "";
  secciones.finalizados.innerHTML = "";

  const tareasOrdenadas = [...tareas].sort(
    (tareaA, tareaB) =>
      obtenerPesoPrioridad(tareaA.prioridad) -
      obtenerPesoPrioridad(tareaB.prioridad)
  );

  tareasOrdenadas.forEach((tarea) => {
    const tarjeta = crearTarjeta({
      tarea,
      manejadores,
      cancelarEdicion: () =>
        renderTareas({ tareas, secciones, manejadores }),
    });

    // Después de ordenar, el estado indica en qué columna colocar cada tarjeta.
    if (tarea.estado === "pendiente") {
      secciones.pendientes.appendChild(tarjeta);
    } else if (tarea.estado === "en progreso") {
      secciones.progresos.appendChild(tarjeta);
    } else if (tarea.estado === "finalizado") {
      secciones.finalizados.appendChild(tarjeta);
    }
  });
}
