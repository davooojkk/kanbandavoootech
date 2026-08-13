/*
 * Durante el arrastre solo trasladamos el identificador de la tarea.
 * Cuando se suelta, app.js realiza el cambio y se encarga de guardarlo y
 * mostrarlo. Así el arrastre no duplica responsabilidades.
 */

/** Prepara una tarjeta para que pueda comenzar un arrastre. */
export function activarDrag(tarea, tarjetaDiv) {
  tarjetaDiv.draggable = true;

  tarjetaDiv.addEventListener("dragstart", (event) => {
    // JSON conserva si un identificador antiguo era numérico o uno nuevo es texto.
    event.dataTransfer.setData("text/plain", JSON.stringify(tarea.id));
  });
}

/** Prepara una columna para recibir tarjetas y comunicar su nuevo estado. */
export function activarDrop(columna, nuevoEstado, manejarCambiarEstado) {
  columna.addEventListener("dragover", (event) => {
    // El navegador necesita esta llamada para permitir que la tarjeta se suelte aquí.
    event.preventDefault();
  });

  columna.addEventListener("drop", (event) => {
    const datoTransferido = event.dataTransfer.getData("text/plain");

    try {
      const idTarea = JSON.parse(datoTransferido);
      manejarCambiarEstado(idTarea, nuevoEstado);
    } catch (error) {
      // Ignoramos texto externo que no fue generado por una tarjeta del tablero.
      if (!(error instanceof SyntaxError)) {
        throw error;
      }
    }
  });
}
