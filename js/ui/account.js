/*
 * El acceso de usuarios todavía no forma parte del proyecto.
 * Este módulo responde al botón del header con un diálogo accesible y devuelve
 * el foco al mismo botón al cerrar, para no desorientar a quien usa teclado.
 */

/**
 * Conecta el botón de cuenta con un `dialog` nativo.
 * `showModal` mantiene la interacción dentro del aviso mientras está abierto;
 * al cerrarlo devolvemos el foco al punto desde el que empezó la acción.
 */
export function activarDialogoCuenta() {
  const botonCuenta = document.querySelector("#account-action");
  const dialogo = document.querySelector("#account-dialog");
  const botonCerrar = document.querySelector("#account-dialog-close");

  /** Centralizar el cierre garantiza la misma recuperación del foco. */
  function cerrarDialogo() {
    if (dialogo.open) {
      dialogo.close();
    }
  }

  botonCuenta.addEventListener("click", () => {
    dialogo.showModal();
  });

  botonCerrar.addEventListener("click", () => {
    cerrarDialogo();
  });

  // `cancel` es la señal nativa de Escape en un dialog modal.
  dialogo.addEventListener("cancel", (event) => {
    event.preventDefault();
    cerrarDialogo();
  });

  // Algunos controladores no generan `cancel`; el teclado conserva una salida segura.
  dialogo.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cerrarDialogo();
    }
  });

  dialogo.addEventListener("close", () => {
    botonCuenta.focus();
  });

  // Pulsar fuera del contenido ofrece una salida cómoda además de Escape.
  dialogo.addEventListener("click", (event) => {
    if (event.target === dialogo) {
      cerrarDialogo();
    }
  });
}
