const DURACION_INFORMATIVO = 10000;
const DURACION_DESHACER = 10000;
const DURACION_SALIDA = 250;

/*
 * Gestiona mensajes temporales y accesibles. El controlador solo comunica qué
 * ocurrió; este módulo decide cómo anunciarlo y cuánto tiempo mostrarlo.
 */
export function crearGestorAvisos({
  anunciador,
  estadoPersistencia,
  avisoDeshacer,
  mensajeDeshacer,
  botonDeshacer,
}) {
  let temporizadorAviso;
  let temporizadorSalida;
  let temporizadorDeshacer;
  let accionDeshacer = null;

  function anunciar(mensaje) {
    anunciador.textContent = "";
    window.setTimeout(() => {
      anunciador.textContent = mensaje;
    }, 0);
  }

  function ocultarPersistencia() {
    window.clearTimeout(temporizadorAviso);
    window.clearTimeout(temporizadorSalida);
    if (estadoPersistencia.hidden) return;

    estadoPersistencia.classList.add("storage-status--closing");
    temporizadorSalida = window.setTimeout(() => {
      estadoPersistencia.hidden = true;
      estadoPersistencia.textContent = "";
      estadoPersistencia.classList.remove("storage-status--closing");
      delete estadoPersistencia.dataset.tipo;
    }, DURACION_SALIDA);
  }

  function mostrarPersistencia({ mensaje, tipo = "error", temporal = false }) {
    window.clearTimeout(temporizadorAviso);
    window.clearTimeout(temporizadorSalida);
    estadoPersistencia.classList.remove("storage-status--closing");
    estadoPersistencia.dataset.tipo = tipo;
    estadoPersistencia.setAttribute("role", tipo === "error" ? "alert" : "status");
    estadoPersistencia.setAttribute(
      "aria-live",
      tipo === "error" ? "assertive" : "polite"
    );
    estadoPersistencia.textContent = mensaje;
    estadoPersistencia.hidden = false;

    if (temporal) {
      temporizadorAviso = window.setTimeout(
        ocultarPersistencia,
        DURACION_INFORMATIVO
      );
    }
  }

  function ocultarDeshacer() {
    window.clearTimeout(temporizadorDeshacer);
    avisoDeshacer.hidden = true;
    mensajeDeshacer.textContent = "";
    accionDeshacer = null;
  }

  function programarCierreDeshacer() {
    window.clearTimeout(temporizadorDeshacer);
    temporizadorDeshacer = window.setTimeout(() => {
      if (!avisoDeshacer.contains(document.activeElement)) ocultarDeshacer();
    }, DURACION_DESHACER);
  }

  function ejecutarDeshacer() {
    if (accionDeshacer === null) return;
    const accion = accionDeshacer;
    ocultarDeshacer();
    accion();
  }

  function ofrecerDeshacer(tarea, accion) {
    accionDeshacer = accion;
    mensajeDeshacer.textContent = `Eliminaste “${tarea.nombre}”.`;
    avisoDeshacer.hidden = false;
    programarCierreDeshacer();
  }

  avisoDeshacer.addEventListener("pointerenter", () => {
    window.clearTimeout(temporizadorDeshacer);
  });
  avisoDeshacer.addEventListener("pointerleave", programarCierreDeshacer);
  avisoDeshacer.addEventListener("focusin", () => {
    window.clearTimeout(temporizadorDeshacer);
  });
  avisoDeshacer.addEventListener("focusout", (event) => {
    if (!avisoDeshacer.contains(event.relatedTarget)) programarCierreDeshacer();
  });
  botonDeshacer.addEventListener("click", ejecutarDeshacer);

  document.addEventListener("keydown", (event) => {
    const elemento = event.target;
    const estaEditando =
      elemento instanceof Element && elemento.matches("input, textarea");
    const solicitaDeshacer =
      (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z";

    if (solicitaDeshacer && !estaEditando && accionDeshacer !== null) {
      event.preventDefault();
      ejecutarDeshacer();
    }
  });

  return {
    anunciar,
    mostrarPersistencia,
    ocultarPersistencia,
    ofrecerDeshacer,
  };
}
