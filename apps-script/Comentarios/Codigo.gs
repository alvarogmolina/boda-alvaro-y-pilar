// Hoja Comentarios: las columnas A:D originales no se modifican.
// Ejecutar prepararComentarios una vez antes de publicar esta versión.
function prepararComentarios() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const hoja = obtenerHoja();
    if (hoja.getLastRow() < 1) throw new Error('La hoja debe conservar su fila de encabezados en A:D.');
    const nombres = ['comentario_id', 'comentario_padre_id', 'solicitud_id'];
    nombres.forEach(function (nombre) {
      const cabecera = hoja.getRange(1, 1, 1, Math.max(4, hoja.getLastColumn())).getValues()[0];
      if (cabecera.indexOf(nombre) === -1) {
        const columna = Math.max(4, hoja.getLastColumn()) + 1;
        if (columna > hoja.getMaxColumns()) hoja.insertColumnsAfter(hoja.getMaxColumns(), columna - hoja.getMaxColumns());
        hoja.getRange(1, columna).setValue(nombre);
      }
    });
    const columnas = obtenerColumnas(hoja);
    const filas = leerFilas(hoja, columnas.ancho);
    filas.forEach(function (fila, indice) {
      if (!fila[columnas.id] && (fila[0] || fila[1] || fila[2])) {
        hoja.getRange(indice + 2, columnas.id + 1).setValue(Utilities.getUuid());
      }
    });
    SpreadsheetApp.flush();
    console.log('Preparación completada. Se conservan los datos y la visibilidad de A:D.');
  } finally {
    lock.releaseLock();
  }
}

function obtenerHoja() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Comentarios');
  if (!hoja) throw new Error('No existe la hoja Comentarios');
  return hoja;
}

function obtenerColumnas(hoja) {
  const ancho = Math.max(4, hoja.getLastColumn());
  const cabecera = hoja.getRange(1, 1, 1, ancho).getValues()[0];
  const columnas = {
    id: cabecera.indexOf('comentario_id'),
    padre: cabecera.indexOf('comentario_padre_id'),
    solicitud: cabecera.indexOf('solicitud_id'),
    ancho: ancho
  };
  if (columnas.id < 4 || columnas.padre < 4 || columnas.solicitud < 4) {
    throw new Error('Ejecuta prepararComentarios antes de publicar.');
  }
  return columnas;
}

function leerFilas(hoja, ancho) {
  const cantidad = hoja.getLastRow() - 1;
  return cantidad > 0 ? hoja.getRange(2, 1, cantidad, ancho).getValues() : [];
}

function visible(fila) {
  return String(fila[3]).trim().toLowerCase() === 'si';
}

function convertirFila(fila, columnas) {
  return {
    id: String(fila[columnas.id]),
    parentId: String(fila[columnas.padre] || ''),
    fecha: fila[0],
    nombre: fila[1],
    comentario: fila[2]
  };
}

function doGet(e) {
  try {
    const hoja = obtenerHoja();
    const columnas = obtenerColumnas(hoja);
    const filas = leerFilas(hoja, columnas.ancho);
    const principales = filas.filter(f => f[columnas.id] && !f[columnas.padre] && visible(f));
    const ids = new Set(principales.map(f => String(f[columnas.id])));
    // La respuesta sigue siendo una lista: compatible con la estructura anterior.
    // Antes de desplegar la web nueva, esta devuelve solo los comentarios originales.
    const incluirRespuestas = e && e.parameter && e.parameter.respuestas === '1';
    const publicas = filas.filter(f => f[columnas.id] && visible(f) &&
      (!f[columnas.padre] || (incluirRespuestas && ids.has(String(f[columnas.padre])))));
    return salidaJSON(publicas.map(f => convertirFila(f, columnas)).reverse());
  } catch (error) {
    console.error(error);
    return respuesta(false, 'No se han podido cargar los comentarios.');
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return respuesta(false, 'Solicitud inválida');
    const datos = JSON.parse(e.postData.contents);
    if (!datos || typeof datos !== 'object') return respuesta(false, 'Solicitud inválida');
    if (typeof datos.nombre !== 'string' || !datos.nombre.trim()) return respuesta(false, 'Falta el nombre');
    if (typeof datos.comentario !== 'string' || !datos.comentario.trim()) return respuesta(false, 'Falta el comentario');
    if (datos.nombre.length > 100 || datos.comentario.length > 500) {
      return respuesta(false, 'Utiliza como máximo 100 caracteres para el nombre y 500 para el mensaje.');
    }
    const nombre = limpiarTexto(datos.nombre, 100);
    const comentario = limpiarTexto(datos.comentario, 500);
    const padre = datos.parentId === undefined ? '' : datos.parentId;
    const solicitud = datos.requestId === undefined ? '' : datos.requestId;
    const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    if (typeof padre !== 'string' || (padre && !uuid.test(padre)) ||
        typeof solicitud !== 'string' || (solicitud && !uuid.test(solicitud)) || (padre && !solicitud)) {
      return respuesta(false, 'Solicitud inválida');
    }
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const hoja = obtenerHoja();
      const columnas = obtenerColumnas(hoja);
      const filas = leerFilas(hoja, columnas.ancho);
      if (padre && !filas.some(f => String(f[columnas.id]) === padre && !f[columnas.padre] && visible(f))) {
        return respuesta(false, 'Este comentario ya no está disponible para responder.');
      }
      // Un reintento tras una conexión interrumpida no crea otra respuesta.
      const anterior = solicitud && filas.find(f => String(f[columnas.solicitud]) === solicitud);
      if (anterior) {
        if (!visible(anterior) || anterior[1] !== nombre || anterior[2] !== comentario || String(anterior[columnas.padre] || '') !== padre) {
          return respuesta(false, 'Esta solicitud ya se procesó. Recarga los comentarios antes de volver a enviar.');
        }
        return salidaJSON({ok: true, comentario: convertirFila(anterior, columnas)});
      }
      const fila = new Array(columnas.ancho).fill('');
      fila[0] = new Date(); fila[1] = nombre; fila[2] = comentario; fila[3] = 'si';
      fila[columnas.id] = Utilities.getUuid();
      fila[columnas.padre] = padre;
      fila[columnas.solicitud] = solicitud;
      hoja.appendRow(fila);
      SpreadsheetApp.flush();
      return salidaJSON({ok: true, comentario: convertirFila(fila, columnas)});
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error);
    return respuesta(false, 'No se ha podido guardar el comentario');
  }
}

function limpiarTexto(valor, maximo) {
  if (typeof valor !== 'string') return '';
  let limpio = valor.trim().slice(0, maximo);
  if (/^[=+\-@]/.test(limpio)) limpio = "'" + limpio;
  return limpio;
}

function respuesta(ok, mensaje) {
  return salidaJSON({ok: ok, mensaje: mensaje || ''});
}

function salidaJSON(datos) {
  return ContentService.createTextOutput(JSON.stringify(datos)).setMimeType(ContentService.MimeType.JSON);
}
