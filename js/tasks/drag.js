/*
 * Durante el arrastre solo trasladamos el identificador de la tarea.
 * Cuando se suelta, app.js realiza el cambio y se encarga de guardarlo y
 * mostrarlo. Así el arrastre no duplica responsabilidades.
 */

/**
 * Prepara una tarjeta para el arrastre sin bloquear sus controles internos.
 * La alternativa de estado de la tarjeta mantiene esta acción disponible para
 * teclado y lectores de pantalla sin depender del gesto de arrastrar.
 */
export function activarDrag(tarea, tarjetaDiv) {
  tarjetaDiv.draggable = true;

  tarjetaDiv.addEventListener("dragstart", (event) => {
    // Los controles internos deben poder pulsarse sin iniciar un arrastre.
    if (event.target.closest("button, input, select, details")) {
      event.preventDefault();
      return;
    }

    tarjetaDiv.classList.add("tarea--arrastrando");
    event.dataTransfer.effectAllowed = "move";
    // JSON conserva si un identificador antiguo era numérico o uno nuevo es texto.
    event.dataTransfer.setData("text/plain", JSON.stringify(tarea.id));
  });

  tarjetaDiv.addEventListener("dragend", () => {
    tarjetaDiv.classList.remove("tarea--arrastrando");
    document
      .querySelectorAll(".column-tasks--destino")
      .forEach((lista) => lista.classList.remove("column-tasks--destino"));
  });
}

/**
 * Permite soltar sobre una columna y entrega el identificador a la aplicación.
 * Este módulo no modifica tareas directamente: así el cambio pasa por el mismo
 * guardado y la misma reversión que una acción realizada con teclado.
 */
export function activarDrop(columna, nuevoEstado, manejarCambiarEstado) {
  columna.addEventListener("dragover", (event) => {
    // El navegador necesita esta llamada para permitir que la tarjeta se suelte aquí.
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    columna.querySelector(".column-tasks")?.classList.add("column-tasks--destino");
  });

  columna.addEventListener("dragleave", (event) => {
    if (!columna.contains(event.relatedTarget)) {
      columna
        .querySelector(".column-tasks")
        ?.classList.remove("column-tasks--destino");
    }
  });

  columna.addEventListener("drop", (event) => {
    event.preventDefault();
    columna
      .querySelector(".column-tasks")
      ?.classList.remove("column-tasks--destino");
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
