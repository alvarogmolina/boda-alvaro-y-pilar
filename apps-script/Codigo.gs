function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return respuesta(false, "Solicitud inválida");
    }

    const datos = JSON.parse(e.postData.contents);

    // Validar todos los textos que se guardarán antes de escribir ninguna fila.
    const asiste = datos.asistencia === "si";
    const acompanante = asiste && datos.plus_one === "si";
    const limites = [
      ["nombre", "Nombre y apellidos", 150, true],
      ["alimentacion_texto", "Necesidades alimentarias", 500, asiste && datos.alimentacion === "si"],
      ["plus_one_nombre", "Nombre del acompañante", 150, acompanante],
      ["plus_one_alimentacion_texto", "Necesidades alimentarias del acompañante", 500, acompanante && datos.plus_one_alimentacion === "si"],
      ["observaciones", "Observaciones", 1000, asiste]
    ];
    for (const [campo, etiqueta, maximo, activo] of limites) {
      if (activo && typeof datos[campo] === "string") {
        const longitud = Array.from(datos[campo]).length;
        if (longitud > maximo) {
          return respuesta(false,
            `El campo «${etiqueta}» es demasiado largo: has escrito ${longitud} caracteres. Por favor, utiliza ${maximo} caracteres o menos.`,
            "", campo);
        }
      }
    }

    // =========================
    // FUNCIONES DE VALIDACIÓN
    // =========================

    function texto(valor) {
      if (typeof valor !== "string") {
        return "";
      }

      let limpio = valor.trim();

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
    .getSheetByName("Respuestas_RSVP");

if (!hoja) {
  throw new Error('No existe la hoja "Respuestas_RSVP"');
}

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

function respuesta(ok, mensaje, id, campo) {

  return ContentService
    .createTextOutput(
      JSON.stringify({
        ok: ok,
        mensaje: mensaje || "",
        id: id || "",
        campo: campo || ""
      })
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}
