/**
 * Reúne el contrato entre HTML y JavaScript. Si falta una pieza necesaria,
 * fallamos al iniciar con un mensaje claro en vez de hacerlo mucho después.
 */
export function obtenerElementosInterfaz() {
  function requerir(selector) {
    const elemento = document.querySelector(selector);
    if (!elemento) throw new Error(`No se encontró el elemento ${selector}.`);
    return elemento;
  }

  const columnas = {
    pendientes: requerir("#pendientes"),
    progresos: requerir("#en-progreso"),
    finalizados: requerir("#finalizados"),
  };

  return {
    formulario: {
      formulario: requerir("#task-form"),
      nombreInput: requerir("#task-input"),
      prioridadInput: requerir("#task-priority"),
    },
    columnas,
    secciones: {
      pendientes: requerir("#pendientes .column-tasks"),
      progresos: requerir("#en-progreso .column-tasks"),
      finalizados: requerir("#finalizados .column-tasks"),
    },
    avisos: {
      anunciador: requerir("#task-announcer"),
      estadoPersistencia: requerir("#task-storage-status"),
      avisoDeshacer: requerir("#undo-notice"),
      mensajeDeshacer: requerir("#undo-message"),
      botonDeshacer: requerir("#undo-button"),
    },
  };
}
