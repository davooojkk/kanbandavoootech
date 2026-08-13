import { cargarTareas } from "./storage/storage.js";
import { crearControladorTareas } from "./tasks/controller.js";
import { activarDrop } from "./tasks/drag.js";
import { activarDialogoCuenta } from "./ui/account.js";
import { crearGestorAvisos } from "./ui/feedback.js";
import { obtenerElementosInterfaz } from "./ui/dom.js";
import { activarFormularioTareas } from "./ui/task-form.js";

/* Punto de composición: crea módulos y conecta sus dependencias. */
const interfaz = obtenerElementosInterfaz();
const carga = cargarTareas();
const avisos = crearGestorAvisos(interfaz.avisos);
const tareas = crearControladorTareas({
  tareas: carga.tareas,
  secciones: interfaz.secciones,
  avisos,
});

activarFormularioTareas({ ...interfaz.formulario, crear: tareas.crear });
activarDrop(interfaz.columnas.pendientes, "pendiente", tareas.cambiarEstado);
activarDrop(interfaz.columnas.progresos, "en progreso", tareas.cambiarEstado);
activarDrop(interfaz.columnas.finalizados, "finalizado", tareas.cambiarEstado);
activarDialogoCuenta();
tareas.renderizar();

if (carga.aviso) avisos.mostrarPersistencia(carga.aviso);
