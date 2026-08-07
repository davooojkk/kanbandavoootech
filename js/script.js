// ---- selectores DOM ---- //

const formulario = document.querySelector('#task-form');
const formularioInput = document.querySelector('#task-input');
const sectionPendientes = document.querySelector('#pendientes');
const sectionProgresos = document.querySelector('#en-progreso');
const sectionFinalizados = document.querySelector('#finalizados');

// ---- verificamos tareas guardadas ---- //

const tareasGuardadas = window.localStorage.getItem('Mis Tareas');

let tareas;

if (tareasGuardadas !== null) {
  tareas = JSON.parse(tareasGuardadas);
} else {
  tareas = [];
};

// ---- evento del formulario ---- //

formulario.addEventListener('submit', (event) => {
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

};

// ---- function eliminar tareas ---- //

function eliminarTarea(id) {
  const tareaEncontrada = tareas.findIndex(
    (tarea) => tarea.id === id 
  );

  if(tareaEncontrada !== -1) {
    tareas.splice(tareaEncontrada, 1);

    guardarTareas();
    renderTareas();
  }
  };

  

// ---- cambiar estado ---- //

function cambiarEstado(id, nuevoEstado) {
  const tareaEncontrada = tareas.find(
    (tarea) => tarea.id === id
  );

  if(tareaEncontrada !== undefined) {
    tareaEncontrada.estado = nuevoEstado;

    guardarTareas();
    renderTareas();
  }
};

// ---- obtener siguiente estado ---- //

function pasarEstado(estadoActual) {
  if(estadoActual === "pendiente") {
    return "en progreso";
  } else if (estadoActual === "en progreso") {
    return "finalizado";
  }
};

// ---- creación de tarjeta ---- //

function crearTarjeta(tarea) {

  const tarjetaDiv = document.createElement('div');
  tarjetaDiv.classList.add('tarea');
  const tarjetaTitulo = document.createElement('h1');
  tarjetaTitulo.innerText = tarea.nombre
  const botonAvanzar = document.createElement('button')
  botonAvanzar.innerText = "→";
  const botonEliminar = document.createElement('button');
  botonEliminar.innerText = 'Eliminar';

  botonEliminar.addEventListener('click', () => {
    eliminarTarea(tarea.id);
  });
  botonAvanzar.addEventListener('click', () => {
    const siguienteEstado = pasarEstado(tarea.estado);
    
    if (siguienteEstado !== undefined) {
      cambiarEstado(tarea.id, siguienteEstado)
    };
  });

  tarjetaDiv.append(
  tarjetaTitulo,
  botonAvanzar,
  botonEliminar
);

return tarjetaDiv;
  
}

// ---- render tareas ---- //

function renderTareas() {
  sectionPendientes.innerHTML = "";
  sectionProgresos.innerHTML = "";
  sectionFinalizados.innerHTML = "";

  tareas.forEach(tarea => {
    const tarjeta = crearTarjeta(tarea);

    if (tarea.estado === "pendiente") {
      sectionPendientes.appendChild(tarjeta);
    } else if (tarea.estado === "en progreso") {
      sectionProgresos.appendChild(tarjeta);
    } else if (tarea.estado === "finalizado") {
      sectionFinalizados.appendChild(tarjeta)
    }

  });
};

// ---- guardar tareas ---- //

function guardarTareas() {
   localStorage.setItem("Mis Tareas", JSON.stringify(tareas));
 };

renderTareas();


