/*
 * Esta prueba recorre la aplicación como lo haría una persona en el navegador.
 * Agrupa en un solo flujo las operaciones principales, la accesibilidad, el
 * responsive y los fallos de almacenamiento que no aparecen en un uso normal.
 */

let chromium;

try {
  ({ chromium } = require("playwright"));
} catch {
  throw new Error(
    'Playwright no está instalado. Ejecuta "npm install" antes de correr las pruebas.'
  );
}

/**
 * Aprovecha Chrome si ya está instalado y recurre al navegador de Playwright
 * cuando hace falta. Así la prueba no depende de una ruta propia de Windows.
 */
async function iniciarNavegador() {
  try {
    return await chromium.launch({ headless: true, channel: "chrome" });
  } catch (errorChrome) {
    try {
      return await chromium.launch({ headless: true });
    } catch (errorPlaywright) {
      throw new Error(
        'No encontramos un navegador para las pruebas. Ejecuta "npx playwright install chromium".',
        { cause: errorPlaywright ?? errorChrome }
      );
    }
  }
}

(async () => {
  const navegador = await iniciarNavegador();
  const pagina = await navegador.newPage();

  /** Crea una tarea utilizando únicamente los controles visibles del formulario. */
  async function crearTarea(nombre, prioridad) {
    await pagina.locator("#task-input").fill(nombre);
    await pagina.locator("#task-priority").selectOption(prioridad);
    await pagina.getByRole("button", { name: "Añadir tarea" }).click();
  }

  /** Comprueba el envío implícito que espera quien escribe y pulsa Enter. */
  async function crearTareaConEnter(nombre, prioridad) {
    await pagina.locator("#task-input").fill(nombre);
    await pagina.locator("#task-priority").selectOption(prioridad);
    await pagina.locator("#task-input").press("Enter");
  }

  /** Cambia el estado por la alternativa accesible al gesto de arrastrar. */
  async function cambiarEstadoDesdeTarjeta(tarjeta, nombre, nuevoEstado) {
    await tarjeta.locator(".tarea-estado-resumen").click();
    await tarjeta
      .getByRole("button", { name: `Mover ${nombre} a ${nuevoEstado}` })
      .click();
  }

  /** Abre el menú de la tarjeta y selecciona una prioridad por su nombre. */
  async function cambiarPrioridadDesdeTarjeta(
    tarjeta,
    nombre,
    nuevaPrioridad
  ) {
    await tarjeta.locator(".tarea-prioridad").click();
    await tarjeta
      .getByRole("button", {
        name: `Cambiar prioridad de ${nombre} a ${nuevaPrioridad}`,
      })
      .click();
  }

  try {
    // Cada ejecución empieza sin datos para que su resultado no dependa del navegador.
    await pagina.goto("http://127.0.0.1:8765/", { waitUntil: "load" });
    await pagina.evaluate(() => localStorage.clear());
    await pagina.reload({ waitUntil: "load" });

    // Primero verificamos la base semántica antes de interactuar con el tablero.
    const estructuraAccesible = await pagina.evaluate(() => ({
      idioma: document.documentElement.lang,
      nombreInput: document
        .querySelector('label[for="task-input"]')
        ?.textContent.trim(),
      columnasNombradas: [...document.querySelectorAll("main section")].every(
        (seccion) => seccion.getAttribute("aria-labelledby")
      ),
    }));

    if (
      estructuraAccesible.idioma !== "es" ||
      estructuraAccesible.nombreInput !== "Nombre de la tarea" ||
      !estructuraAccesible.columnasNombradas
    ) {
      throw new Error("La estructura semántica principal no es accesible");
    }

    const columnasVacias = pagina.locator(".column-empty:visible");
    if ((await columnasVacias.count()) !== 3) {
      throw new Error("Las columnas vacías no explican su estado inicial");
    }

    const contrasteTextoSecundario = await pagina.evaluate(() => {
      const estilos = getComputedStyle(document.documentElement);

      // La fórmula oficial de contraste necesita convertir cada color a luminancia.
      function luminancia(color) {
        return color
          .match(/[\da-f]{2}/gi)
          .map((canal) => parseInt(canal, 16) / 255)
          .map((canal) =>
            canal <= 0.04045
              ? canal / 12.92
              : ((canal + 0.055) / 1.055) ** 2.4
          )
          .reduce(
            (total, canal, indice) =>
              total + canal * [0.2126, 0.7152, 0.0722][indice],
            0
          );
      }

      const texto = luminancia(
        estilos.getPropertyValue("--texto-apagado").trim()
      );
      const fondo = luminancia(
        // Todas las tarjetas comparten superficie; medimos el contraste real común.
        estilos.getPropertyValue("--tarjeta").trim()
      );
      return (Math.max(texto, fondo) + 0.05) /
        (Math.min(texto, fondo) + 0.05);
    });

    if (contrasteTextoSecundario < 4.5) {
      throw new Error(
        `El texto secundario no alcanza contraste AA: ${contrasteTextoSecundario}`
      );
    }

    await pagina
      .getByRole("button", { name: "Registrarse o iniciar sesión" })
      .click();
    await pagina.getByRole("dialog", { name: "Acceso próximamente" }).waitFor();
    await pagina.getByText("Esta opción aún no está habilitada…").waitFor();
    await pagina.keyboard.press("Escape");

    if (
      (await pagina.locator("#account-dialog").evaluate((dialogo) => dialogo.open)) ||
      !(await pagina
        .getByRole("button", { name: "Registrarse o iniciar sesión" })
        .evaluate((boton) => boton === document.activeElement))
    ) {
      throw new Error("El diálogo no devolvió el foco al botón que lo abrió");
    }
    console.log("Semántica, diálogo y recuperación del foco correctos");

    // Este recorrido comprueba crear, ordenar y editar desde la interfaz real.
    if ((await pagina.locator("#task-input").getAttribute("maxlength")) !== "120") {
      throw new Error("El nombre de la tarea no tiene un límite razonable");
    }

    // La asignación directa simula un dato externo que el límite visual no detiene.
    await pagina.locator("#task-input").evaluate((input) => {
      input.value = "x".repeat(121);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await pagina.locator("#task-input").press("Enter");
    if ((await pagina.locator(".tarea").count()) !== 0) {
      throw new Error("El formulario aceptó un nombre demasiado largo");
    }

    await crearTareaConEnter("Tarea normal", "normal");
    await crearTarea("Tarea crítica", "critico");
    await crearTarea("Tarea alta", "alto");

    if (
      !(await pagina
        .locator("#task-input")
        .evaluate((input) => input === document.activeElement))
    ) {
      throw new Error("El formulario no quedó listo para cargar otra tarea");
    }

    await pagina.waitForFunction(() =>
      document
        .querySelector("#task-announcer")
        .textContent.includes("Tarea alta creada")
    );

    const nombresOrdenados = await pagina
      .locator("#pendientes .tarea-titulo")
      .allTextContents();

    if (
      nombresOrdenados.join("|") !==
      "Tarea crítica|Tarea alta|Tarea normal"
    ) {
      throw new Error(`Orden incorrecto: ${nombresOrdenados.join("|")}`);
    }
    console.log("Orden inicial por prioridad correcto");

    const tareaAlta = pagina
      .locator("#pendientes .tarea")
      .filter({ hasText: "Tarea alta" });
    await cambiarPrioridadDesdeTarjeta(tareaAlta, "Tarea alta", "Crítico");

    if (
      !(await pagina
        .locator("#pendientes .tarea")
        .filter({ hasText: "Tarea alta" })
        .locator(".tarea-prioridad")
        .evaluate((control) => control === document.activeElement))
    ) {
      throw new Error("El foco se perdió al cambiar la prioridad");
    }

    const prioridadesGuardadas = await pagina.evaluate(() =>
      JSON.parse(localStorage.getItem("Mis Tareas"))
    );
    const altaActualizada = prioridadesGuardadas.find(
      (tarea) => tarea.nombre === "Tarea alta"
    );

    if (altaActualizada.prioridad !== "critico") {
      throw new Error("La edición de prioridad no se guardó");
    }
    console.log("Edición de prioridad correcta");

    const tareaNormal = pagina
      .locator("#pendientes .tarea")
      .filter({ hasText: "Tarea normal" });
    await tareaNormal.locator(".tarea-titulo").focus();
    await tareaNormal.locator(".tarea-titulo").press("Enter");
    await pagina.locator(".input-edit-nombres").fill("Tarea normal editada");
    await pagina.locator(".input-edit-nombres").press("Enter");

    if (
      !(await pagina
        .getByRole("button", { name: "Tarea normal editada" })
        .count())
    ) {
      throw new Error("La edición del nombre con teclado no se completó");
    }

    if (
      !(await pagina.evaluate(
        () =>
          document.activeElement?.classList.contains("tarea-titulo") &&
          document.activeElement.textContent === "Tarea normal editada"
      ))
    ) {
      const focoActual = await pagina.evaluate(() => ({
        etiqueta: document.activeElement?.tagName,
        clase: document.activeElement?.className,
        texto: document.activeElement?.textContent,
        tareas: [...document.querySelectorAll(".tarea-titulo")].map(
          (titulo) => titulo.textContent
        ),
      }));
      throw new Error(
        `El foco se perdió al editar el nombre: ${JSON.stringify(focoActual)}`
      );
    }
    console.log("Edición del nombre correcta");

    const tareaNormalEditada = pagina
      .locator("#pendientes .tarea")
      .filter({ hasText: "Tarea normal editada" });
    await cambiarEstadoDesdeTarjeta(
      tareaNormalEditada,
      "Tarea normal editada",
      "Finalizada"
    );
    await pagina
      .locator("#finalizados .tarea")
      .filter({ hasText: "Tarea normal editada" })
      .waitFor();
    if (
      !(await pagina
        .locator("#finalizados .tarea")
        .filter({ hasText: "Tarea normal editada" })
        .locator(".tarea-estado-resumen")
        .evaluate((control) => control === document.activeElement))
    ) {
      throw new Error("El foco se perdió al mover la tarea con teclado");
    }
    console.log("Alternativa accesible al arrastre correcta");

    // Iniciamos el gesto sobre el borde libre, no sobre un botón de la tarjeta.
    await pagina
      .locator("#pendientes .tarea")
      .filter({ hasText: "Tarea crítica" })
      .dragTo(pagina.locator("#en-progreso .column-tasks"), {
        sourcePosition: { x: 6, y: 6 },
        targetPosition: { x: 40, y: 40 },
      });

    const tareaEnProgreso = pagina
      .locator("#en-progreso .tarea")
      .filter({ hasText: "Tarea crítica" });
    if (
      !(await tareaEnProgreso
        .locator(".tarea-estado-resumen")
        .getAttribute("aria-label"))?.includes("Estado actual: En progreso")
    ) {
      throw new Error("El arrastre no actualizó el control de estado");
    }
    console.log("Arrastre y actualización del estado correctos");

    await pagina.reload({ waitUntil: "load" });
    await pagina
      .locator("#en-progreso .tarea")
      .filter({ hasText: "Tarea crítica" })
      .waitFor();
    console.log("Persistencia después de recargar correcta");

    await pagina
      .locator("#en-progreso .tarea")
      .filter({ hasText: "Tarea crítica" })
      .getByRole("button", { name: "Eliminar Tarea crítica" })
      .click();

    if (
      !(await pagina.getByRole("button", { name: "Deshacer" }).isVisible()) ||
      !(await pagina
        .locator("#progreso-title")
        .evaluate((titulo) => titulo === document.activeElement))
    ) {
      throw new Error("El borrado no ofreció recuperación ni un foco lógico");
    }

    await pagina.keyboard.press("Control+z");
    const tareaRecuperada = pagina
      .locator("#en-progreso .tarea")
      .filter({ hasText: "Tarea crítica" });
    await tareaRecuperada.waitFor();

    if (
      !(await tareaRecuperada
        .locator(".tarea-titulo")
        .evaluate((titulo) => titulo === document.activeElement))
    ) {
      throw new Error("Deshacer no restauró el foco en la tarea recuperada");
    }

    await tareaRecuperada
      .getByRole("button", { name: "Eliminar Tarea crítica" })
      .click();

    await pagina.reload({ waitUntil: "load" });
    if (await pagina.getByText("Tarea crítica", { exact: true }).count()) {
      throw new Error("La tarea eliminada reapareció después de recargar");
    }
    console.log("Eliminación reversible, foco y persistencia correctos");

    // Una tarea de versiones anteriores no tenía prioridad y debe seguir cargando.
    await pagina.evaluate(() => {
      localStorage.setItem(
        "Mis Tareas",
        JSON.stringify([
          {
            id: 1,
            nombre: "Tarea antigua",
            estado: "pendiente",
          },
        ])
      );
    });
    await pagina.reload({ waitUntil: "load" });
    await pagina
      .locator("#pendientes .tarea")
      .filter({ hasText: "Tarea antigua" })
      .locator(".tarea-prioridad > span")
      .filter({ hasText: "Normal" })
      .waitFor();
    console.log("Compatibilidad con tareas antiguas correcta");

    // Mezclamos datos reparables y descartables para comprobar ambas decisiones.
    await pagina.evaluate(() => {
      localStorage.setItem(
        "Mis Tareas",
        JSON.stringify([
          {
            id: 1,
            nombre: "Estado reparado",
            estado: "estado desconocido",
            prioridad: "urgente",
          },
          {
            id: 1,
            nombre: "Identificador repetido",
            estado: "pendiente",
            prioridad: "alto",
          },
          null,
          { id: 2, nombre: "   ", estado: "pendiente" },
        ])
      );
    });
    await pagina.reload({ waitUntil: "load" });
    await pagina.locator("#task-storage-status").waitFor();

    if (
      (await pagina.locator("#task-storage-status").getAttribute("data-tipo")) !==
      "informativo"
    ) {
      throw new Error("La reparación no se presentó como aviso informativo");
    }

    await pagina
      .locator("#task-storage-status")
      .waitFor({ state: "hidden", timeout: 11000 });

    if ((await pagina.locator(".tarea").count()) !== 2) {
      throw new Error("La carga no descartó los registros inutilizables");
    }

    const reparacionPersistida = await pagina.evaluate(() => ({
      tareas: JSON.parse(localStorage.getItem("Mis Tareas")),
      respaldo: localStorage.getItem("Respaldo de Mis Tareas"),
    }));

    if (
      reparacionPersistida.tareas.length !== 2 ||
      reparacionPersistida.respaldo === null
    ) {
      throw new Error("La reparación no quedó guardada con su respaldo");
    }

    await pagina.reload({ waitUntil: "load" });
    if (await pagina.locator("#task-storage-status:visible").count()) {
      throw new Error("La reparación volvió a repetirse después de recargar");
    }

    await crearTarea("Identificador nuevo", "normal");
    const tareasReparadas = await pagina.evaluate(() =>
      JSON.parse(localStorage.getItem("Mis Tareas"))
    );
    const idsReparados = tareasReparadas.map((tarea) => tarea.id);
    const estadoReparado = tareasReparadas.find(
      (tarea) => tarea.nombre === "Estado reparado"
    );

    if (
      new Set(idsReparados).size !== idsReparados.length ||
      typeof tareasReparadas.find(
        (tarea) => tarea.nombre === "Identificador nuevo"
      ).id !== "string" ||
      estadoReparado.estado !== "pendiente" ||
      estadoReparado.prioridad !== "normal"
    ) {
      throw new Error("La reparación de tareas guardadas no fue coherente");
    }
    console.log("Validación, reparación e identificadores únicos correctos");

    // Un JSON incompleto no se puede reparar: se respalda y se inicia vacío.
    const contenidoDanado = '{"tareas":';
    await pagina.evaluate((contenido) => {
      localStorage.setItem("Mis Tareas", contenido);
    }, contenidoDanado);
    await pagina.reload({ waitUntil: "load" });

    const recuperacion = await pagina.evaluate(() => ({
      aviso: document.querySelector("#task-storage-status").textContent,
      respaldo: localStorage.getItem("Respaldo de Mis Tareas"),
      tareasVisibles: document.querySelectorAll(".tarea").length,
    }));

    if (
      !recuperacion.aviso.includes("No pudimos leer") ||
      recuperacion.respaldo !== contenidoDanado ||
      recuperacion.tareasVisibles !== 0
    ) {
      throw new Error("La recuperación de JSON dañado no conservó los datos");
    }
    console.log("Recuperación y respaldo de JSON dañado correctos");

    // Simulamos una cuota agotada para confirmar que memoria, pantalla y disco coincidan.
    await crearTarea("Tarea estable", "alto");
    await pagina.evaluate(() => {
      window.setItemOriginal = Storage.prototype.setItem;
      Storage.prototype.setItem = function setItemConCuota(key, value) {
        if (key === "Mis Tareas") {
          throw new DOMException("Espacio agotado", "QuotaExceededError");
        }

        return window.setItemOriginal.call(this, key, value);
      };
    });

    await pagina.locator("#task-input").fill("Cambio sin guardar");
    await pagina.getByRole("button", { name: "Añadir tarea" }).click();

    const falloGuardado = await pagina.evaluate(() => ({
      aviso: document.querySelector("#task-storage-status").textContent,
      entrada: document.querySelector("#task-input").value,
      existeEnPantalla: [...document.querySelectorAll(".tarea-titulo")].some(
        (titulo) => titulo.textContent === "Cambio sin guardar"
      ),
      existeGuardada: JSON.parse(localStorage.getItem("Mis Tareas")).some(
        (tarea) => tarea.nombre === "Cambio sin guardar"
      ),
    }));

    await pagina.evaluate(() => {
      Storage.prototype.setItem = window.setItemOriginal;
      delete window.setItemOriginal;
    });

    if (
      !falloGuardado.aviso.includes("No queda espacio") ||
      falloGuardado.entrada !== "Cambio sin guardar" ||
      falloGuardado.existeEnPantalla ||
      falloGuardado.existeGuardada
    ) {
      throw new Error("El tablero no revirtió correctamente un guardado fallido");
    }
    console.log("Reversión ante falta de espacio correcta");

    // Además de funcionar, los controles deben conservar accesibilidad y geometría.
    const enlacesFooter = await pagina.locator(".site-footer a").evaluateAll(
      (enlaces) => enlaces.map((enlace) => enlace.href)
    );
    if (
      !enlacesFooter.includes("https://www.instagram.com/davotech.uy/") ||
      !enlacesFooter.includes(
        "https://wa.me/5548991702401?text=Hola%2C%20Davotech.%20Quisiera%20comunicarme%20contigo."
      ) ||
      !enlacesFooter.includes("https://donquijotechuy.com/")
    ) {
      throw new Error("Los enlaces del footer no coinciden con los solicitados");
    }

    await pagina.locator("#task-priority").focus();
    await pagina.keyboard.press("Tab");
    const focoVisible = await pagina
      .locator('#task-form > button[type="submit"]')
      .evaluate((boton) => getComputedStyle(boton).outlineStyle !== "none");
    if (!focoVisible) {
      throw new Error("El foco del teclado no es visible");
    }

    const controlesPequenos = await pagina
      .locator(".tarea button, .tarea select, .tarea summary")
      .evaluateAll((controles) =>
        controles
          .map((control) => {
            const medidas = control.getBoundingClientRect();
            return {
              clase: control.className,
              ancho: medidas.width,
              alto: medidas.height,
            };
          })
          // El navegador puede representar 24px como 23.9999px por redondeo interno.
          .filter(({ ancho, alto }) => ancho < 23.99 || alto < 23.99)
      );

    if (controlesPequenos.length > 0) {
      throw new Error(
        `Controles menores a 24px: ${JSON.stringify(controlesPequenos)}`
      );
    }

    await pagina.locator("#task-priority").focus();
    await pagina.waitForTimeout(250);
    const focoPrioridad = await pagina.locator("#task-priority").evaluate((campo) => {
      const estilo = getComputedStyle(campo);
      return {
        borde: estilo.borderColor,
        contorno: estilo.outlineStyle,
        sombra: estilo.boxShadow,
      };
    });

    if (
      focoPrioridad.contorno !== "none" ||
      /\),\s/.test(focoPrioridad.sombra)
    ) {
      throw new Error(
        `El campo de prioridad volvió a mostrar focos superpuestos: ${JSON.stringify(focoPrioridad)}`
      );
    }

    const geometriaFormulario = await pagina.evaluate(() => {
      const medir = (selector) => {
        const caja = document.querySelector(selector).getBoundingClientRect();
        return {
          izquierda: caja.left,
          derecha: caja.right,
          arriba: caja.top,
          abajo: caja.bottom,
          ancho: caja.width,
          alto: caja.height,
        };
      };

      return {
        nombre: medir("#task-input"),
        prioridad: medir("#task-priority"),
        envoltorioPrioridad: medir(".selector-prioridad"),
        boton: medir('#task-form > button[type="submit"]'),
      };
    });

    const controlesFormulario = [
      geometriaFormulario.nombre,
      geometriaFormulario.prioridad,
      geometriaFormulario.boton,
    ];
    const alturasFormulario = controlesFormulario.map(({ alto }) => alto);
    const basesFormulario = controlesFormulario.map(({ abajo }) => abajo);
    const diferencia = (valores) => Math.max(...valores) - Math.min(...valores);

    if (
      diferencia(alturasFormulario) > 1 ||
      diferencia(basesFormulario) > 1 ||
      Math.abs(
        geometriaFormulario.prioridad.ancho -
          geometriaFormulario.envoltorioPrioridad.ancho
      ) > 1
    ) {
      throw new Error(
        `El formulario perdió su alineación: ${JSON.stringify(geometriaFormulario)}`
      );
    }

    const selectorEstado = pagina.locator(".tarea-estado-control").first();
    await selectorEstado.locator("summary").click();
    const aparienciaOpciones = await selectorEstado
      .locator(".tarea-estado-opciones")
      .evaluate((opciones) => {
        const estilo = getComputedStyle(opciones);
        return {
          visible: opciones.getBoundingClientRect().height > 0,
          fondo: estilo.backgroundColor,
          borde: estilo.borderStyle,
        };
      });

    if (
      !aparienciaOpciones.visible ||
      aparienciaOpciones.fondo === "rgba(0, 0, 0, 0)" ||
      aparienciaOpciones.borde === "none" ||
      (await pagina.locator(".tarea select").count()) !== 0
    ) {
      throw new Error("El editor de estado no conserva el diseño de la página");
    }
    await selectorEstado.locator("summary").click();

    const selectorPrioridad = pagina.locator(".tarea-prioridad-control").first();
    await selectorPrioridad.locator("summary").click();
    const aparienciaPrioridad = await selectorPrioridad
      .locator(".tarea-prioridad-opciones")
      .evaluate((opciones) => {
        const estilo = getComputedStyle(opciones);
        return {
          visible: opciones.getBoundingClientRect().height > 0,
          fondo: estilo.backgroundColor,
          borde: estilo.borderStyle,
        };
      });

    if (
      !aparienciaPrioridad.visible ||
      aparienciaPrioridad.fondo === "rgba(0, 0, 0, 0)" ||
      aparienciaPrioridad.borde === "none" ||
      (await pagina.locator(".tarea select").count()) !== 0
    ) {
      throw new Error("El menú de prioridad no conserva el diseño de la página");
    }
    await selectorPrioridad.locator("summary").click();

    const espacioAntesDelFooter = await pagina.evaluate(() => {
      const columnas = [...document.querySelectorAll("main > section")];
      const finalTablero = Math.max(
        ...columnas.map((columna) => columna.getBoundingClientRect().bottom)
      );
      return document.querySelector(".site-footer").getBoundingClientRect().top - finalTablero;
    });

    if (espacioAntesDelFooter < 40) {
      throw new Error(
        `El footer quedó demasiado cerca del tablero: ${espacioAntesDelFooter}px`
      );
    }

    // Los anchos incluyen los puntos donde cambian formulario, columnas y tarjetas.
    for (const ancho of [320, 390, 640, 900, 980, 1280]) {
      await pagina.setViewportSize({ width: ancho, height: 844 });
      await pagina.reload({ waitUntil: "load" });

      const medidas = await pagina.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        contenido: document.documentElement.scrollWidth,
        etiquetaCuentaVisible:
          getComputedStyle(document.querySelector(".account-action-label")).display !==
          "none",
        anchoCuenta: document
          .querySelector(".account-action")
          .getBoundingClientRect().width,
        papelerasFueraDeEsquina: [...document.querySelectorAll(".tarea")]
          .map((tarjeta) => {
            const cajaTarjeta = tarjeta.getBoundingClientRect();
            const cajaPapelera = tarjeta
              .querySelector(".tarea-eliminar")
              .getBoundingClientRect();
            return cajaTarjeta.bottom - cajaPapelera.bottom;
          })
          .filter(
            (separacion) =>
              document.documentElement.clientWidth <= 1100 && separacion > 15
          ),
        estadosDeformados: [...document.querySelectorAll(".tarea-estado-resumen")]
          .map((control) => {
            const caja = control.getBoundingClientRect();
            return {
              alto: caja.height,
              ancho: caja.width,
              contenido: control.scrollWidth,
            };
          })
          .filter(({ alto, ancho, contenido }) => alto > 33 || contenido > ancho + 1),
      }));

      if (medidas.contenido > medidas.viewport) {
        throw new Error(
          `Desbordamiento horizontal a ${ancho}px: ${medidas.contenido}px`
        );
      }


      if (medidas.estadosDeformados.length > 0) {
        throw new Error(
          `Controles de estado deformados a ${ancho}px: ${JSON.stringify(medidas.estadosDeformados)}`
        );
      }


      if (medidas.papelerasFueraDeEsquina.length > 0) {
        throw new Error(
          `Papeleras fuera de la esquina a ${ancho}px: ${JSON.stringify(medidas.papelerasFueraDeEsquina)}`
        );
      }

      if (
        (ancho <= 480 &&
          (medidas.etiquetaCuentaVisible || medidas.anchoCuenta > 45)) ||
        (ancho > 480 && !medidas.etiquetaCuentaVisible)
      ) {
        throw new Error(
          `El acceso del header no responde correctamente a ${ancho}px: ${JSON.stringify(medidas)}`
        );
      }

      const primeraPrioridad = pagina.locator(".tarea-prioridad").first();
      if (await primeraPrioridad.count()) {
        await primeraPrioridad.click();
        const alineacionPrioridad = await pagina
          .locator(".tarea-prioridad")
          .first()
          .evaluate((selector) => getComputedStyle(selector).justifyContent);
        const alineacionEsperada = ancho <= 1100 ? "flex-start" : "center";

        if (alineacionPrioridad !== alineacionEsperada) {
          throw new Error(
            `Prioridad ${alineacionPrioridad} a ${ancho}px; se esperaba ${alineacionEsperada}`
          );
        }

        await pagina.locator("#task-input").focus();
      }
    }
    console.log("Responsive sin desbordamiento entre 320px y 1280px");

    // Usamos otra página para aislar el bloqueo sin contaminar las pruebas anteriores.
    const paginaSinStorage = await navegador.newPage();
    await paginaSinStorage.addInitScript(() => {
      const getItemOriginal = Storage.prototype.getItem;

      Storage.prototype.getItem = function getItemBloqueado(key) {
        if (key === "Mis Tareas") {
          throw new DOMException("Acceso bloqueado", "SecurityError");
        }

        return getItemOriginal.call(this, key);
      };
    });
    await paginaSinStorage.goto("http://127.0.0.1:8765/", {
      waitUntil: "load",
    });

    const avisoSinStorage = await paginaSinStorage
      .locator("#task-storage-status")
      .textContent();

    if (!avisoSinStorage.includes("no permite acceder")) {
      throw new Error("La aplicación no informó el bloqueo de localStorage");
    }

    await paginaSinStorage.close();
    console.log("Bloqueo de lectura de localStorage controlado");

    console.log("OK: todas las pruebas funcionales superadas");
  } finally {
    // El navegador se cierra incluso si una comprobación falla a mitad del recorrido.
    await navegador.close();
  }
})();
