import { normalizarPrioridad } from "../tasks/prioridades.js";
import { crearIdTarea, ESTADOS } from "../tasks/tareas.js";

// Conservamos la clave anterior para que ninguna actualización pierda tareas guardadas.
const CLAVE_TAREAS = "Mis Tareas";
const CLAVE_RESPALDO = "Respaldo de Mis Tareas";

const ERRORES_STORAGE = ["QuotaExceededError", "SecurityError"];

/** Distingue los problemas del navegador de los errores de programación. */
function esErrorDeStorage(error) {
  return ERRORES_STORAGE.includes(error?.name);
}

/**
 * Intenta conservar el texto dañado antes de iniciar con un tablero vacío.
 * El respaldo es un último recurso: si el navegador tampoco permite crearlo,
 * informamos el fallo en consola sin interrumpir la recuperación de la página.
 */
function respaldarDatos(contenido) {
  try {
    window.localStorage.setItem(CLAVE_RESPALDO, contenido);
    return true;
  } catch (error) {
    console.warn("No se pudo crear el respaldo de las tareas.", error);
    return false;
  }
}

function crearAvisoDatosDanados(respaldoCreado) {
  return respaldoCreado
    ? "No pudimos leer las tareas guardadas. Iniciamos un tablero vacío y conservamos un respaldo."
    : "No pudimos leer las tareas guardadas. Iniciamos un tablero vacío para que puedas continuar.";
}

/** Comprueba los campos esenciales y repara los valores que tienen alternativa. */
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

/**
 * Recupera las tareas y trata localStorage como una entrada externa.
 * Además de migrar prioridades antiguas, valida la forma de cada registro para
 * que un dato incompleto no impida abrir el resto del tablero.
 */
export function cargarTareas() {
  let tareasGuardadas;

  try {
    tareasGuardadas = window.localStorage.getItem(CLAVE_TAREAS);
  } catch (error) {
    if (!esErrorDeStorage(error)) {
      throw error;
    }

    console.error("El navegador no permitió leer las tareas.", error);
    return {
      tareas: [],
      aviso:
        "El navegador no permite acceder a las tareas guardadas. Puedes usar el tablero, pero los cambios podrían no conservarse.",
    };
  }

  if (tareasGuardadas === null) {
    return { tareas: [], aviso: null };
  }

  let datos;

  try {
    datos = JSON.parse(tareasGuardadas);
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error;
    }

    console.error("Las tareas guardadas no contienen JSON válido.", error);
    return {
      tareas: [],
      aviso: crearAvisoDatosDanados(respaldarDatos(tareasGuardadas)),
    };
  }

  if (!Array.isArray(datos)) {
    console.error("Las tareas guardadas no tienen el formato de una lista.");
    return {
      tareas: [],
      aviso: crearAvisoDatosDanados(respaldarDatos(tareasGuardadas)),
    };
  }

  const idsExistentes = new Set();
  const tareas = [];
  let huboReparaciones = false;

  datos.forEach((dato) => {
    const resultado = prepararTarea(dato, idsExistentes);
    huboReparaciones ||= resultado.fueReparada;

    if (resultado.tarea !== null) {
      tareas.push(resultado.tarea);
    }
  });

  return {
    tareas,
    aviso: huboReparaciones
      ? "Reparamos algunos datos guardados para que el tablero pudiera cargarse correctamente."
      : null,
  };
}

/**
 * Guarda una copia completa y devuelve un resultado fácil de interpretar.
 * Solo recuperamos errores propios del almacenamiento. Si JSON.stringify
 * falla por un error de programación, lo dejamos visible para poder corregirlo.
 */
export function guardarTareas(tareas) {
  const contenido = JSON.stringify(tareas);

  try {
    window.localStorage.setItem(CLAVE_TAREAS, contenido);
    return { ok: true };
  } catch (error) {
    if (!esErrorDeStorage(error)) {
      throw error;
    }

    console.error("El navegador no permitió guardar las tareas.", error);
    return {
      ok: false,
      motivo:
        error.name === "QuotaExceededError" ? "sin-espacio" : "no-disponible",
    };
  }
}
