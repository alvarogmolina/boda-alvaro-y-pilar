function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return respuesta(false, "Solicitud inválida");
    }

    const datos = JSON.parse(e.postData.contents);

    const nombre = limpiarTexto(datos.nombre, 100);
    const comentario = limpiarTexto(datos.comentario, 500);

    if (!nombre) {
      return respuesta(false, "Falta el nombre");
    }

    if (!comentario) {
      return respuesta(false, "Falta el comentario");
    }

    const hoja =
      SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName("Comentarios");

    if (!hoja) {
      return respuesta(false, "No existe la hoja Comentarios");
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      hoja.appendRow([
        new Date(),
        nombre,
        comentario,
        "si"
      ]);
    } finally {
      lock.releaseLock();
    }

    return respuesta(true);

  } catch (error) {
    console.error(error);
    return respuesta(false, "No se ha podido guardar el comentario");
  }
}


function doGet() {
  try {
    const hoja =
      SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName("Comentarios");

    if (!hoja) {
      return salidaJSON([]);
    }

    const ultimaFila = hoja.getLastRow();

    if (ultimaFila < 2) {
      return salidaJSON([]);
    }

    const datos = hoja
      .getRange(2, 1, ultimaFila - 1, 4)
      .getValues();

    const comentarios = datos
      .filter(function (fila) {
        return String(fila[3]).toLowerCase() === "si";
      })
      .map(function (fila) {
        return {
          fecha: fila[0],
          nombre: fila[1],
          comentario: fila[2]
        };
      })
      .reverse();

    return salidaJSON(comentarios);

  } catch (error) {
    console.error(error);
    return salidaJSON([]);
  }
}


function limpiarTexto(valor, maximo) {
  if (typeof valor !== "string") {
    return "";
  }

  let limpio = valor.trim().slice(0, maximo);

  // Evita fórmulas en Google Sheets
  if (/^[=+\-@]/.test(limpio)) {
    limpio = "'" + limpio;
  }

  return limpio;
}


function respuesta(ok, mensaje) {
  return salidaJSON({
    ok: ok,
    mensaje: mensaje || ""
  });
}


function salidaJSON(datos) {
  return ContentService
    .createTextOutput(JSON.stringify(datos))
    .setMimeType(ContentService.MimeType.JSON);
}