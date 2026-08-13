import { guardarTareas } from "../storage/storage.js";
import {
  cambiarEstado,
  compararPrioridad,
  crearTarea,
  editarNombre,
  editarPrioridad,
  eliminarTarea,
  ETIQUETAS_ESTADO,
  ETIQUETAS_PRIORIDAD,
} from "./model.js";
import { renderizarTablero } from "./view/board.js";

/*
 * Orquesta el ciclo modificar → guardar → renderizar. Las vistas no escriben
 * datos y el modelo no conoce la pantalla; aquí se conectan ambas partes.
 */
export function crearControladorTareas({ tareas, secciones, avisos }) {
  const contextoVista = { tareas, secciones, acciones: null };

  function renderizar(destinoFoco = null) {
    renderizarTablero(contextoVista, destinoFoco);
  }

  function restaurar(respaldo) {
    tareas.splice(0, tareas.length, ...respaldo);
  }

  function mensajeErrorGuardado(motivo) {
    return motivo === "sin-espacio"
      ? "No queda espacio para guardar el cambio. La tarea volvió a su estado anterior."
      : "No se pudo guardar el cambio. La tarea volvió a su estado anterior.";
  }

  /** Ejecuta una transacción local y revierte memoria y pantalla si falla. */
  function ejecutarCambio(mutacion, mensajeExito, destinoFoco = null) {
    const respaldo = tareas.map((tarea) => ({ ...tarea }));
    if (!mutacion()) return false;

    try {
      const resultado = guardarTareas(tareas);
      if (!resultado.ok) {
        restaurar(respaldo);
        renderizar(destinoFoco);
        avisos.mostrarPersistencia({
          mensaje: mensajeErrorGuardado(resultado.motivo),
          tipo: "error",
        });
        return false;
      }
    } catch (error) {
      restaurar(respaldo);
      renderizar(destinoFoco);
      throw error;
    }

    avisos.ocultarPersistencia();
    renderizar(destinoFoco);
    avisos.anunciar(mensajeExito);
    return true;
  }

  function crear(nombre, prioridad) {
    return ejecutarCambio(
      () => crearTarea(tareas, nombre, prioridad),
      `Tarea ${nombre} creada.`
    );
  }

  function destinoTrasEliminar(tarea) {
    const indice = tareas
      .filter((elemento) => elemento.estado === tarea.estado)
      .sort(compararPrioridad)
      .findIndex((elemento) => elemento.id === tarea.id);
    return { tipo: "eliminacion", estado: tarea.estado, indice };
  }

  function restaurarEliminada(tarea, indiceOriginal) {
    ejecutarCambio(
      () => {
        if (tareas.some((elemento) => elemento.id === tarea.id)) return false;
        tareas.splice(Math.min(indiceOriginal, tareas.length), 0, tarea);
        return true;
      },
      `Tarea ${tarea.nombre} recuperada.`,
      { tipo: "tarea", id: tarea.id, control: "titulo" }
    );
  }

  function eliminar(id) {
    const tarea = tareas.find((elemento) => elemento.id === id);
    const indiceOriginal = tareas.findIndex((elemento) => elemento.id === id);
    if (!tarea) return false;

    const copia = { ...tarea };
    const eliminada = ejecutarCambio(
      () => eliminarTarea(tareas, id),
      `Tarea ${tarea.nombre} eliminada. Puedes deshacerla durante diez segundos con el botón o con Control más Z.`,
      destinoTrasEliminar(tarea)
    );

    if (eliminada) {
      avisos.ofrecerDeshacer(copia, () =>
        restaurarEliminada(copia, indiceOriginal)
      );
    }
    return eliminada;
  }

  function mover(id, nuevoEstado) {
    const tarea = tareas.find((elemento) => elemento.id === id);
    return ejecutarCambio(
      () => cambiarEstado(tareas, id, nuevoEstado),
      `Tarea ${tarea?.nombre ?? "seleccionada"} movida a ${ETIQUETAS_ESTADO[nuevoEstado]}.`,
      { tipo: "tarea", id, control: "estado" }
    );
  }

  function renombrar(id, nombre) {
    return ejecutarCambio(
      () => editarNombre(tareas, id, nombre),
      `Nombre actualizado a ${nombre}.`,
      { tipo: "tarea", id, control: "titulo" }
    );
  }

  function priorizar(id, prioridad) {
    const tarea = tareas.find((elemento) => elemento.id === id);
    return ejecutarCambio(
      () => editarPrioridad(tareas, id, prioridad),
      `Prioridad de ${tarea?.nombre ?? "la tarea"} actualizada a ${ETIQUETAS_PRIORIDAD[prioridad]}.`,
      { tipo: "tarea", id, control: "prioridad" }
    );
  }

  contextoVista.acciones = {
    eliminar,
    cambiarEstado: mover,
    editarNombre: renombrar,
    editarPrioridad: priorizar,
  };

  return { crear, cambiarEstado: mover, renderizar };
}
