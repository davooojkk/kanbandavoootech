export function cargarTareas() {
  const tareasGuardadas = window.localStorage.getItem("Mis Tareas");

  let tareas;

  if (tareasGuardadas !== null) {
    tareas = JSON.parse(tareasGuardadas);
  } else {
    tareas = [];
  }

  return tareas;
}

export function guardarTareas(tareas) {
  localStorage.setItem("Mis Tareas", JSON.stringify(tareas));
}