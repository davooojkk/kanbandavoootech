/*
 * El acceso de usuarios todavía no forma parte del proyecto.
 * Este módulo responde al botón del header con un diálogo accesible y devuelve
 * el foco al mismo botón al cerrar, para no desorientar a quien usa teclado.
 */

export function activarDialogoCuenta() {
  const botonCuenta = document.querySelector("#account-action");
  const dialogo = document.querySelector("#account-dialog");
  const botonCerrar = document.querySelector("#account-dialog-close");

  botonCuenta.addEventListener("click", () => {
    dialogo.showModal();
  });

  botonCerrar.addEventListener("click", () => {
    dialogo.close();
  });

  dialogo.addEventListener("close", () => {
    botonCuenta.focus();
  });

  // Pulsar fuera del contenido ofrece una salida cómoda además de Escape.
  dialogo.addEventListener("click", (event) => {
    if (event.target === dialogo) {
      dialogo.close();
    }
  });
}
