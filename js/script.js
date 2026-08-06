// crear array, agregar input y convertirlo en tarea

const formulario = document.querySelector("#task-form");
const formularioInput = document.querySelector("#task-input");

const tareasGuardadas = window.localStorage.getItem('Mis Tareas');

let tareas; 

if(tareasGuardadas !== null) {
  tareas = JSON.parse(tareasGuardadas);
} else {
  tareas = [];
};

// const tareas = [];


formulario.addEventListener('submit', (event) => {
  event.preventDefault();

  const nombreTarea = formularioInput.value.trim();

  if (nombreTarea === "") {
    return;
  };

  const nuevaTarea = {
    id: Date.now(),
    nombre: nombreTarea,
    estado: "pendiente"
  };

  tareas.push(nuevaTarea);

  guardarTareas();
  renderTareas()

  formularioInput.value = "";

  console.log(tareas);
});


// renderizar tareas

function renderTareas() {
  const sectionPendientes = document.querySelector('#pendientes');
  const sectionProgresos = document.querySelector('#en-progreso');
  const sectionFinalizados = document.querySelector('#finalizados');
  
  
  sectionPendientes.innerHTML = '';
  sectionProgresos.innerHTML = '';
  sectionFinalizados.innerHTML = '';
  
  
  tareas.forEach((tarea) => {
    const tareaTarjeta = document.createElement('div');
    tareaTarjeta.classList.add('tarea');
    const tareaTitulo = document.createElement('h1');
    tareaTitulo.innerText = tarea.nombre;
    const tareaBoton = document.createElement('button');
    tareaBoton.innerText = '→';
    const eliminarBoton = document.createElement('button');
    eliminarBoton.innerText = 'eliminar';
    tareaTarjeta.appendChild(tareaTitulo);
    tareaTarjeta.appendChild(tareaBoton);
    tareaTarjeta.appendChild(eliminarBoton);

    eliminarBoton.addEventListener('click', () => {
      const tareaIndex = tareas.findIndex(
        (tareaActual) => tareaActual.id === tarea.id
      );
      if (tareaIndex !== -1) {
        tareas.splice(tareaIndex, 1);
        guardarTareas();
        renderTareas();
      }
    });
  
      if (tarea.estado === "pendiente") {
        sectionPendientes.appendChild(tareaTarjeta);
        tareaBoton.addEventListener('click', () => {
          tarea.estado = "en progreso";
          guardarTareas();
          renderTareas();
        });
      } else if (tarea.estado === "en progreso") {
        sectionProgresos.appendChild(tareaTarjeta);
        tareaBoton.addEventListener('click', () => {
          tarea.estado = "finalizado";
          guardarTareas();
          renderTareas();
        });
      } else if (tarea.estado === "finalizado") {
        sectionFinalizados.appendChild(tareaTarjeta); 
      };
  });
};

// guardar tareas

function guardarTareas() {
  localStorage.setItem("Mis Tareas", JSON.stringify(tareas));
};


renderTareas();