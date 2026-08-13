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

  async function crearTarea(nombre, prioridad) {
    await pagina.locator("#task-input").fill(nombre);
    await pagina.locator("#task-priority").selectOption(prioridad);
    await pagina.getByRole("button", { name: "Añadir tarea" }).click();
  }

  try {
    await pagina.goto("http://127.0.0.1:8765/", { waitUntil: "load" });
    await pagina.evaluate(() => localStorage.clear());
    await pagina.reload({ waitUntil: "load" });

    const estructuraAccesible = await pagina.evaluate(() => ({
      idioma: document.documentElement.lang,
      nombreInput: document.querySelector('label[for="task-input"]')?.innerText,
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

    await pagina.getByRole("button", { name: "Registrarse / Log-in" }).click();
    await pagina.getByRole("dialog", { name: "Acceso próximamente" }).waitFor();
    await pagina.getByText("Esta opción aún no está habilitada…").waitFor();
    await pagina.keyboard.press("Escape");

    if (
      !(await pagina
        .getByRole("button", { name: "Registrarse / Log-in" })
        .evaluate((boton) => boton === document.activeElement))
    ) {
      throw new Error("El diálogo no devolvió el foco al botón que lo abrió");
    }
    console.log("Semántica, diálogo y recuperación del foco correctos");

    await crearTarea("Tarea normal", "normal");
    await crearTarea("Tarea crítica", "critico");
    await crearTarea("Tarea alta", "alto");

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
    await tareaAlta.locator(".tarea-prioridad").click();
    await tareaAlta.locator(".input-edit-prioridad").selectOption("critico");

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
    console.log("Edición del nombre correcta");

    const tareaNormalEditada = pagina
      .locator("#pendientes .tarea")
      .filter({ hasText: "Tarea normal editada" });
    await tareaNormalEditada
      .getByRole("combobox", { name: "Cambiar estado de Tarea normal editada" })
      .selectOption("finalizado");
    await pagina
      .locator("#finalizados .tarea")
      .filter({ hasText: "Tarea normal editada" })
      .waitFor();
    console.log("Alternativa accesible al arrastre correcta");

    await pagina.evaluate(() => {
      const transferencia = new DataTransfer();
      const tarjeta = Array.from(
        document.querySelectorAll("#pendientes .tarea")
      ).find((elemento) => elemento.textContent.includes("Tarea crítica"));

      tarjeta.dispatchEvent(
        new DragEvent("dragstart", {
          bubbles: true,
          dataTransfer: transferencia,
        })
      );
      document.querySelector("#en-progreso").dispatchEvent(
        new DragEvent("drop", {
          bubbles: true,
          dataTransfer: transferencia,
        })
      );
    });

    const tareaEnProgreso = pagina
      .locator("#en-progreso .tarea")
      .filter({ hasText: "Tarea crítica" });
    if (
      (await tareaEnProgreso
        .getByRole("combobox", { name: "Cambiar estado de Tarea crítica" })
        .inputValue()) !== "en progreso"
    ) {
      throw new Error("El arrastre no actualizó el selector de estado");
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

    await pagina.reload({ waitUntil: "load" });
    if (await pagina.getByText("Tarea crítica", { exact: true }).count()) {
      throw new Error("La tarea eliminada reapareció después de recargar");
    }
    console.log("Eliminación y persistencia correctas");

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
      .getByText("Normal", { exact: true })
      .waitFor();
    console.log("Compatibilidad con tareas antiguas correcta");

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
    await pagina.getByRole("alert").waitFor();

    if ((await pagina.locator(".tarea").count()) !== 2) {
      throw new Error("La carga no descartó los registros inutilizables");
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
      .locator('.task-form-options button[type="submit"]')
      .evaluate((boton) => getComputedStyle(boton).outlineStyle !== "none");
    if (!focoVisible) {
      throw new Error("El foco del teclado no es visible");
    }

    const controlesPequenos = await pagina
      .locator(".tarea button, .tarea select")
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
          .filter(({ ancho, alto }) => ancho < 24 || alto < 24)
      );

    if (controlesPequenos.length > 0) {
      throw new Error(
        `Controles menores a 24px: ${JSON.stringify(controlesPequenos)}`
      );
    }

    for (const ancho of [320, 390, 640, 900, 1280]) {
      await pagina.setViewportSize({ width: ancho, height: 844 });
      await pagina.reload({ waitUntil: "load" });

      const medidas = await pagina.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        contenido: document.documentElement.scrollWidth,
      }));

      if (medidas.contenido > medidas.viewport) {
        throw new Error(
          `Desbordamiento horizontal a ${ancho}px: ${medidas.contenido}px`
        );
      }
    }
    console.log("Responsive sin desbordamiento entre 320px y 1280px");

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
    await navegador.close();
  }
})();
