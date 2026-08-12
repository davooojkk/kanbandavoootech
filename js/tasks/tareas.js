export function crearTarea(tareas, nombre) {
  const nuevaTarea = {
    id: Date.now(),
    nombre: nombre,
    estado: "pendiente",
  };

  tareas.push(nuevaTarea);
}

export function eliminarTarea(tareas, id) {
  const tareaEncontrada = tareas.findIndex((tarea) => tarea.id === id);

  if (tareaEncontrada !== -1) {
    tareas.splice(tareaEncontrada, 1);
  }
}

export function cambiarEstado(tareas, id, nuevoEstado) {
  const tareaEncontrada = tareas.find((tarea) => tarea.id === id);

  if (tareaEncontrada !== undefined) {
    tareaEncontrada.estado = nuevoEstado;
  }
}

export function editarNombre(tareas, id, nuevoNombre) {
  const tareaEncontrada = tareas.find((tarea) => tarea.id === id);

  if (tareaEncontrada !== undefined) {
    tareaEncontrada.nombre = nuevoNombre;
  }
}