/*
 * Aquí definimos una sola vez cuáles son las prioridades y cómo se muestran.
 * Así, el formulario, las tarjetas y el orden del tablero siempre usan las
 * mismas opciones y no pueden quedar desincronizados.
 */

// La posición también marca el orden visual: primero crítico y al final normal.
export const PRIORIDADES = ["critico", "alto", "normal"];

// Guardamos valores sencillos, pero mostramos al usuario textos bien escritos.
export const ETIQUETAS_PRIORIDAD = {
  critico: "Crítico",
  alto: "Alto",
  normal: "Normal",
};

/**
 * Comprueba que una prioridad sea conocida.
 * Si falta o tiene un valor inesperado, usamos "normal" para que la tarea siga
 * funcionando en lugar de romper su presentación.
 */
export function normalizarPrioridad(prioridad) {
  return PRIORIDADES.includes(prioridad) ? prioridad : "normal";
}

/**
 * Devuelve la posición de una prioridad dentro del orden definido arriba.
 * Como crítico ocupa la posición más baja, al ordenar aparece antes que las
 * prioridades menos urgentes.
 */
export function obtenerPesoPrioridad(prioridad) {
  return PRIORIDADES.indexOf(normalizarPrioridad(prioridad));
}
