import { normalizarTareasGuardadas } from "./task-schema.js";

/*
 * Este módulo es la frontera entre la aplicación y localStorage. Como cualquier
 * contenido guardado puede estar incompleto, ser antiguo o haber sido editado
 * desde fuera, aquí se valida antes de entregarlo al resto del tablero.
 */

// Conservamos la clave anterior para que ninguna actualización pierda tareas guardadas.
const CLAVE_TAREAS = "Mis Tareas";
const CLAVE_RESPALDO = "Respaldo de Mis Tareas";

// Estos son fallos esperables del navegador; los demás deben seguir siendo visibles.
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

/** Construye un aviso persistente según haya sido posible crear el respaldo. */
function crearAvisoDatosDanados(respaldoCreado) {
  return {
    mensaje: respaldoCreado
      ? "No pudimos leer las tareas guardadas. Iniciamos un tablero vacío y conservamos un respaldo."
      : "No pudimos leer las tareas guardadas. Iniciamos un tablero vacío para que puedas continuar.",
    tipo: "error",
    temporal: false,
  };
}

/**
 * Conserva el contenido original antes de guardar la versión reparada.
 * Solo reemplazamos los datos cuando el respaldo existe: así una limpieza
 * automática nunca elimina la única copia disponible de un registro dañado.
 */
function guardarReparaciones(tareasGuardadas, tareas) {
  if (!respaldarDatos(tareasGuardadas)) {
    return false;
  }

  return guardarTareas(tareas).ok;
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
      aviso: {
        mensaje:
          "El navegador no permite acceder a las tareas guardadas. Puedes usar el tablero, pero los cambios podrían no conservarse.",
        tipo: "error",
        temporal: false,
      },
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

  const { tareas, huboReparaciones } = normalizarTareasGuardadas(datos);

  const reparacionesGuardadas =
    !huboReparaciones || guardarReparaciones(tareasGuardadas, tareas);

  // La respuesta reúne los datos utilizables y, cuando corresponde, su aviso visual.
  return {
    tareas,
    aviso: huboReparaciones
      ? reparacionesGuardadas
        ? {
            mensaje:
              "Reparamos algunos datos guardados y conservamos una copia de su versión anterior.",
            tipo: "informativo",
            temporal: true,
          }
        : {
            mensaje:
              "Reparamos algunos datos durante esta sesión, pero el navegador no permitió guardar la reparación.",
            tipo: "error",
            temporal: false,
          }
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
