import { LONGITUD_MAXIMA_NOMBRE } from "../tasks/model.js";

function mensajeNombre(nombre) {
  return nombre.length > LONGITUD_MAXIMA_NOMBRE
    ? `Usa como máximo ${LONGITUD_MAXIMA_NOMBRE} caracteres.`
    : "Escribe el nombre de la tarea.";
}

/** Conecta el formulario y deja la creación real en manos del controlador. */
export function activarFormularioTareas({
  formulario,
  nombreInput,
  prioridadInput,
  crear,
}) {
  formulario.addEventListener("submit", (event) => {
    event.preventDefault();
    const nombre = nombreInput.value.trim();

    if (nombre === "" || nombre.length > LONGITUD_MAXIMA_NOMBRE) {
      nombreInput.setCustomValidity(mensajeNombre(nombre));
      nombreInput.reportValidity();
      nombreInput.focus();
      return;
    }

    if (!crear(nombre, prioridadInput.value)) {
      nombreInput.focus();
      return;
    }

    formulario.reset();
    prioridadInput.value = "normal";
    nombreInput.focus();
  });

  nombreInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.isComposing) {
      event.preventDefault();
      formulario.requestSubmit();
    }
  });

  nombreInput.addEventListener("input", () => {
    nombreInput.setCustomValidity("");
  });

  nombreInput.addEventListener("invalid", () => {
    nombreInput.setCustomValidity(mensajeNombre(nombreInput.value.trim()));
  });
}
