import {
  crearIdTarea,
  ESTADOS,
  normalizarPrioridad,
} from "../tasks/model.js";

/* Normaliza registros externos sin leer ni escribir el almacenamiento. */
function prepararTarea(tarea, idsExistentes) {
  if (
    tarea === null ||
    typeof tarea !== "object" ||
    Array.isArray(tarea) ||
    typeof tarea.nombre !== "string" ||
    tarea.nombre.trim() === ""
  ) {
    return { tarea: null, fueReparada: true };
  }

  const nombre = tarea.nombre.trim();
  const estado = ESTADOS.includes(tarea.estado) ? tarea.estado : "pendiente";
  const prioridad = normalizarPrioridad(tarea.prioridad);
  const idEsValido =
    (typeof tarea.id === "string" && tarea.id.trim() !== "") ||
    (typeof tarea.id === "number" && Number.isFinite(tarea.id));
  const idEsUnico = idEsValido && !idsExistentes.has(tarea.id);
  const id = idEsUnico ? tarea.id : crearIdTarea(idsExistentes);

  idsExistentes.add(id);
  return {
    tarea: { id, nombre, estado, prioridad },
    fueReparada:
      !idEsUnico ||
      nombre !== tarea.nombre ||
      estado !== tarea.estado ||
      prioridad !== tarea.prioridad,
  };
}

export function normalizarTareasGuardadas(datos) {
  const idsExistentes = new Set();
  const tareas = [];
  let huboReparaciones = false;

  datos.forEach((dato) => {
    const resultado = prepararTarea(dato, idsExistentes);
    huboReparaciones ||= resultado.fueReparada;
    if (resultado.tarea) tareas.push(resultado.tarea);
  });

  return { tareas, huboReparaciones };
}
