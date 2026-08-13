# kanbandavoootech

-- versión 1.0 --

No considero que sea necesario ponerme a explicar para que sirve un Kan Ban pero en el caso de que no lo conozcas, 
a continuación lo explico brevemente.

El Kan Ban es un sistema visual desarrollado en los años '40 en Toyota, Japón. El Ingeniero Taiichi Ohno 
creo este sistema para organizar stocks y tareas de la mejor forma posible.

Esta primera versión cuenta con funciones básicas como añadir tareas, editarlas, cambiar su estado de manera progresiva 
y eliminarlas. Nada más. Un sistema simple y practico, en proximas versiones pretendo añadir nuevas funciones.

-- versión 1.1 --
En esta versión, podemos disfrutar de un comodo drag & drop, eliminé el botón de avanzar la tarea ya que queda
completamente inutilizado, ajusté el css eliminando los estilos que ya no se usan, cambié el grotesco boton de
eliminar por un simple emoji minimalista.

-- versión 1.2 --

Corrigiendo unos bugs en cuanto a las tareas, basicamente en la version anterior se duplicaban las tareas
cuando guardabamos las mismas, generando doble tarea sin sentido. También pasaba que cuando editabamos el 
texto de una tarea, al mismo tiempo podiamos hacer drag & drop, lo cual no tenía sentido, era incomodo e
ineficiente. Todos estos errores fueron corregidos.

-- versión 1.3 --

Refactorización nueva de JS, buscando dividir toda la estructura del lenguaje en distintos archivos, para
evitar sobrecargar a "script.js" con todas las responsabilidades de javascript en el proyecto.

-- versión 2.0 --

En esta versión añadí prioridades —Crítico, Alto y Normal—, su orden automático dentro de cada estado y la posibilidad de editarlas desde cada tarjeta. También mejoré el responsive y pulí la interfaz manteniendo su identidad minimalista.

Los campos de texto y selectores ahora responden de forma suave al pasar el cursor, recibir foco o desplegarse. Estas microinteracciones ayudan a reconocer qué control está activo sin recargar la interfaz, y se desactivan automáticamente cuando el sistema solicita reducir el movimiento.

La interfaz ahora incluye un header con la identidad de Davotech y un acceso de usuario preparado para futuras versiones, además de un footer con contactos y otros proyectos. Como el registro todavía no está disponible, el botón abre un diálogo que lo explica claramente.

También trabajé la accesibilidad: la página declara correctamente el español, utiliza encabezados y secciones con significado, ofrece nombres comprensibles para lectores de pantalla, muestra el foco del teclado y anuncia los cambios importantes. Las tareas pueden editarse y cambiar de estado sin depender del mouse; el drag and drop se mantiene como una alternativa visual.

Todo el código JavaScript quedó documentado para facilitar el control de su funcionamiento y entender la responsabilidad de cada parte. Los comentarios explican qué hace el código y justifican brevemente las decisiones importantes, evitando repetir lo evidente.

También reforcé la persistencia local. Al abrir el tablero se comprueba que las tareas guardadas tengan una estructura válida, se reparan datos antiguos cuando existe una alternativa segura y se conserva un respaldo si el contenido está dañado. Si el navegador bloquea el almacenamiento o se queda sin espacio, el cambio se deshace para que la pantalla, la memoria y lo guardado no queden desincronizados. El aviso se muestra con lenguaje claro y también puede ser anunciado por lectores de pantalla.

Las tareas nuevas usan identificadores únicos en lugar de depender únicamente de la hora de creación. Esta decisión evita que dos tareas creadas muy cerca una de la otra terminen compartiendo el mismo identificador y afecten acciones como editar, mover o eliminar.

La prueba automatizada recorre las acciones principales y también simula datos dañados, espacio agotado y acceso bloqueado a `localStorage`. Para ejecutarla, primero inicia la web en `http://127.0.0.1:8765/`, luego instala las dependencias con `npm install` y ejecuta `npm test`. Si no tienes Chrome instalado, puedes preparar Chromium con `npx playwright install chromium`.

Además, empecé a usar Codex en el desarrollo. Es la primera vez que pruebo un flujo de trabajo con IA, por lo que el proyecto todavía puede contener problemas o prácticas mejorables relacionadas con el uso de agentes de IA.
