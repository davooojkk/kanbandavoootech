export function activarDrag(tarea, tarjetaDiv) {
  tarjetaDiv.draggable = true;

  tarjetaDiv.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", tarea.id);
  });
}

export function activarDrop(columna, nuevoEstado, manejarCambiarEstado) {
  columna.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  columna.addEventListener("drop", (event) => {
    const idTarea = Number(event.dataTransfer.getData("text/plain"));
    manejarCambiarEstado(idTarea, nuevoEstado);
  });
}