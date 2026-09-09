function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return respuesta(false, "Solicitud inválida");
    }

    const datos = JSON.parse(e.postData.contents);

    // =========================
    // FUNCIONES DE VALIDACIÓN
    // =========================

    function texto(valor, maximo) {
      if (typeof valor !== "string") {
        return "";
      }

      let limpio = valor.trim().slice(0, maximo);

      // Evita que Google Sheets interprete texto como fórmula
      if (/^[=+\-@]/.test(limpio)) {
        limpio = "'" + limpio;
      }

      return limpio;
    }

    function siNo(valor) {
      return valor === "si" || valor === "no";
    }


    // =========================
    // INVITADO PRINCIPAL
    // =========================

    const nombre = texto(datos.nombre, 150);
    const asistencia = datos.asistencia;

    if (!nombre) {
      return respuesta(false, "Falta el nombre");
    }

    if (!siNo(asistencia)) {
      return respuesta(false, "Asistencia inválida");
    }


    // Si NO asiste, no aceptamos datos adicionales
    if (asistencia === "no") {

      const idRespuesta = Utilities.getUuid();
      const fecha = new Date();

      guardarFilas([
        [
          idRespuesta,
          fecha,
          "Invitado",
          "",
          nombre,
          "no",
          "",
          "",
          "",
          "",
          ""
        ]
      ]);

      return respuesta(true, "", idRespuesta);
    }


    // =========================
    // DATOS SI ASISTE
    // =========================

    if (!siNo(datos.alimentacion)) {
      return respuesta(false, "Alimentación inválida");
    }

    if (!siNo(datos.bus_ida)) {
      return respuesta(false, "Autobús de ida inválido");
    }

    if (!siNo(datos.bus_vuelta)) {
      return respuesta(false, "Autobús de vuelta inválido");
    }

    if (!siNo(datos.plus_one)) {
      return respuesta(false, "Acompañante inválido");
    }


    const alimentacion = datos.alimentacion;

    let alimentacionTexto = "";

    if (alimentacion === "si") {
      alimentacionTexto = texto(
        datos.alimentacion_texto,
        500
      );

      if (!alimentacionTexto) {
        return respuesta(
          false,
          "Falta indicar la necesidad alimentaria"
        );
      }
    }


    const observaciones =
      texto(datos.observaciones, 1000);


    // =========================
    // CREAR FILAS
    // =========================

    const idRespuesta = Utilities.getUuid();
    const fecha = new Date();

    const filas = [];

    filas.push([
      idRespuesta,
      fecha,
      "Invitado",
      "",
      nombre,
      "si",
      alimentacion,
      alimentacionTexto,
      datos.bus_ida,
      datos.bus_vuelta,
      observaciones
    ]);


    // =========================
    // ACOMPAÑANTE
    // =========================

    if (datos.plus_one === "si") {

      const plusOneNombre =
        texto(datos.plus_one_nombre, 150);

      if (!plusOneNombre) {
        return respuesta(
          false,
          "Falta el nombre del acompañante"
        );
      }

      if (!siNo(datos.plus_one_alimentacion)) {
        return respuesta(
          false,
          "Alimentación del acompañante inválida"
        );
      }

      if (!siNo(datos.plus_one_bus_ida)) {
        return respuesta(
          false,
          "Autobús de ida del acompañante inválido"
        );
      }

      if (!siNo(datos.plus_one_bus_vuelta)) {
        return respuesta(
          false,
          "Autobús de vuelta del acompañante inválido"
        );
      }


      let plusOneAlimentacionTexto = "";

      if (datos.plus_one_alimentacion === "si") {

        plusOneAlimentacionTexto = texto(
          datos.plus_one_alimentacion_texto,
          500
        );

        if (!plusOneAlimentacionTexto) {
          return respuesta(
            false,
            "Falta indicar la necesidad alimentaria del acompañante"
          );
        }
      }


      filas.push([
        idRespuesta,
        fecha,
        "+1",
        nombre,
        plusOneNombre,
        "si",
        datos.plus_one_alimentacion,
        plusOneAlimentacionTexto,
        datos.plus_one_bus_ida,
        datos.plus_one_bus_vuelta,
        "" // No duplicamos observaciones
      ]);
    }


    guardarFilas(filas);

    return respuesta(true, "", idRespuesta);


  } catch (error) {

    console.error(error);

    return respuesta(
      false,
      "No se ha podido procesar la solicitud"
    );
  }
}



// =========================
// GUARDAR EN SHEETS
// =========================

function guardarFilas(filas) {

  const hoja =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheets()[0];

  const lock = LockService.getScriptLock();

  lock.waitLock(10000);

  try {

    const primeraFila =
      hoja.getLastRow() + 1;

    hoja
      .getRange(
        primeraFila,
        1,
        filas.length,
        filas[0].length
      )
      .setValues(filas);

  } finally {

    lock.releaseLock();
  }
}



// =========================
// RESPUESTA
// =========================

function respuesta(ok, mensaje, id) {

  return ContentService
    .createTextOutput(
      JSON.stringify({
        ok: ok,
        mensaje: mensaje || "",
        id: id || ""
      })
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}