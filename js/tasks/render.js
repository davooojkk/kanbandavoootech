import { activarDrag } from "./drag.js";

function crearTarjeta(
  tarea,
  manejarEliminarTarea,
  manejarEditarNombre,
  manejarCancelarEdicion
) {
  const tarjetaDiv = document.createElement("div");
  tarjetaDiv.classList.add("tarea");
  activarDrag(tarea, tarjetaDiv);

  const tarjetaTitulo = document.createElement("h1");
  tarjetaTitulo.innerText = tarea.nombre;
  activarEdicion(
    tarea,
    tarjetaTitulo,
    tarjetaDiv,
    manejarEditarNombre,
    manejarCancelarEdicion
  );

  const botonEliminar = document.createElement("button");
  botonEliminar.innerText = "🗑️";

  botonEliminar.addEventListener("click", () => {
    manejarEliminarTarea(tarea.id);
  });

  tarjetaDiv.append(tarjetaTitulo, botonEliminar);

  return tarjetaDiv;
}

function activarEdicion(
  tarea,
  tarjetaTitulo,
  tarjetaDiv,
  manejarEditarNombre,
  manejarCancelarEdicion
) {
  tarjetaTitulo.addEventListener("click", () => {
    tarjetaDiv.draggable = false;
    const inputEditar = document.createElement("input");

    inputEditar.classList.add("input-edit-nombres");
    inputEditar.value = tarea.nombre;

    tarjetaTitulo.replaceWith(inputEditar);
    inputEditar.focus();

    function guardarEdicion() {
      const nuevoNombre = inputEditar.value.trim();

      if (nuevoNombre !== "") {
        manejarEditarNombre(tarea.id, nuevoNombre);
      } else {
        manejarCancelarEdicion();
      }
    }

    inputEditar.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        inputEditar.blur();
      }
    });

    inputEditar.addEventListener("blur", guardarEdicion);
  });
}

export function renderTareas(
  tareas,
  secciones,
  manejarEliminarTarea,
  manejarEditarNombre
) {
  secciones.pendientes.innerHTML = "";
  secciones.progresos.innerHTML = "";
  secciones.finalizados.innerHTML = "";

  tareas.forEach((tarea) => {
    const tarjeta = crearTarjeta(
      tarea,
      manejarEliminarTarea,
      manejarEditarNombre,
      () =>
        renderTareas(
          tareas,
          secciones,
          manejarEliminarTarea,
          manejarEditarNombre
        )
    );

    if (tarea.estado === "pendiente") {
      secciones.pendientes.appendChild(tarjeta);
    } else if (tarea.estado === "en progreso") {
      secciones.progresos.appendChild(tarjeta);
    } else if (tarea.estado === "finalizado") {
      secciones.finalizados.appendChild(tarjeta);
    }
  });
}