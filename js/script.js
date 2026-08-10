// ---- selectores DOM ---- //

const formulario = document.querySelector("#task-form");
const formularioInput = document.querySelector("#task-input");
const sectionPendientes = document.querySelector("#pendientes");
const sectionProgresos = document.querySelector("#en-progreso");
const sectionFinalizados = document.querySelector("#finalizados");

// ---- verificamos tareas guardadas ---- //

const tareasGuardadas = window.localStorage.getItem("Mis Tareas");

let tareas;

if (tareasGuardadas !== null) {
  tareas = JSON.parse(tareasGuardadas);
} else {
  tareas = [];
}

// ---- evento del formulario ---- //

formulario.addEventListener("submit", (event) => {
  event.preventDefault();

  const nombreTarea = formularioInput.value.trim();

  if (nombreTarea === "") {
    return;
  }

  crearTarea(nombreTarea);

  formularioInput.value = "";
});

// ---- function crear tarea ---- //

function crearTarea(nombre) {
  const nuevaTarea = {
    id: Date.now(),
    nombre: nombre,
    estado: "pendiente",
  };

  tareas.push(nuevaTarea);

  guardarTareas();
  renderTareas();
}

// ---- function eliminar tareas ---- //

function eliminarTarea(id) {
  const tareaEncontrada = tareas.findIndex((tarea) => tarea.id === id);

  if (tareaEncontrada !== -1) {
    tareas.splice(tareaEncontrada, 1);

    guardarTareas();
    renderTareas();
  }
}

// ---- cambiar estado ---- //

function cambiarEstado(id, nuevoEstado) {
  const tareaEncontrada = tareas.find((tarea) => tarea.id === id);

  if (tareaEncontrada !== undefined) {
    tareaEncontrada.estado = nuevoEstado;

    guardarTareas();
    renderTareas();
  }
}

// ---- creación de tarjeta ---- //

function crearTarjeta(tarea) {
  const tarjetaDiv = document.createElement("div");
  tarjetaDiv.classList.add("tarea");
  activarDrag(tarea, tarjetaDiv);
  const tarjetaTitulo = document.createElement("h1");
  tarjetaTitulo.innerText = tarea.nombre;
  activarEdicion(tarea, tarjetaTitulo, tarjetaDiv);
  const botonEliminar = document.createElement("button");
  botonEliminar.innerText = "🗑️";

  botonEliminar.addEventListener("click", () => {
    eliminarTarea(tarea.id);
  });

  tarjetaDiv.append(tarjetaTitulo, botonEliminar);

  return tarjetaDiv;
}

// ---- cambiar nombre de las tareas ---- //

function editarNombre(id, nuevoNombre) {
  const tareaEncontrada = tareas.find((tarea) => tarea.id === id);

  if (tareaEncontrada !== undefined) {
    tareaEncontrada.nombre = nuevoNombre;

    guardarTareas();
    renderTareas();
  }
}

// ---- abrir input de edicion de nombre ---- //

function activarEdicion(tarea, tarjetaTitulo, tarjetaDiv) {
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
        editarNombre(tarea.id, nuevoNombre);
      } else {
      renderTareas();
    };
    } 

    inputEditar.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        inputEditar.blur();
      }
    });

    inputEditar.addEventListener("blur", guardarEdicion);
  });
}

// ---- render tareas ---- //

function renderTareas() {
  sectionPendientes.innerHTML = "";
  sectionProgresos.innerHTML = "";
  sectionFinalizados.innerHTML = "";

  tareas.forEach((tarea) => {
    const tarjeta = crearTarjeta(tarea);

    if (tarea.estado === "pendiente") {
      sectionPendientes.appendChild(tarjeta);
    } else if (tarea.estado === "en progreso") {
      sectionProgresos.appendChild(tarjeta);
    } else if (tarea.estado === "finalizado") {
      sectionFinalizados.appendChild(tarjeta);
    }
  });
}

// ---- guardar tareas ---- //

function guardarTareas() {
  localStorage.setItem("Mis Tareas", JSON.stringify(tareas));
}

renderTareas();

// ---- Drag & Drop ---- //

function activarDrag(tarea, tarjetaDiv) {
  tarjetaDiv.draggable = true;

  tarjetaDiv.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", tarea.id);
  });
}

function activarDrop(columna, nuevoEstado) {
  columna.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  columna.addEventListener("drop", (event) => {
    const idTarea = Number(event.dataTransfer.getData("text/plain"));
    cambiarEstado(idTarea, nuevoEstado);
  });
}

activarDrop(sectionPendientes, "pendiente");
activarDrop(sectionProgresos, "en progreso");
activarDrop(sectionFinalizados, "finalizado");
