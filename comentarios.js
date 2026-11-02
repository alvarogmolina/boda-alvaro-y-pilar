const COMENTARIOS_URL =
  "https://script.google.com/macros/s/AKfycbztUIyXYDHRP9lsBBVyhsdp7wqQe82VmIG6DQxhu-WO_h_MmDHuPyIopAZCOYjSG-A88w/exec";

const formularioComentarios = document.getElementById("form-comentarios");
const listaComentarios = document.getElementById("lista-comentarios");
const mensajeExito = document.getElementById("comentario-exito");
const cargaComentarios = document.getElementById("comentarios-cargando");
const errorComentarios = document.getElementById("comentarios-error");
const reintentarComentarios = document.getElementById("comentarios-reintentar");
let peticionComentarios = null;
let comentariosCargados = false;


// Estado local de los hilos; conserva borradores al actualizar el listado.
let comentariosActuales = [];
const hilosComentarios = new Map();

function elementoComentario(item, respuesta = false) {
  const bloque = document.createElement('div');
  bloque.className = respuesta ? 'comment-reply' : 'comment-card';
  const cabecera = document.createElement('div');
  cabecera.className = 'comment-header';
  const nombre = document.createElement('strong');
  nombre.textContent = item.nombre;
  const fecha = document.createElement('span');
  fecha.className = 'comment-date';
  fecha.textContent = new Date(item.fecha).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
  const mensaje = document.createElement('p');
  mensaje.textContent = item.comentario;
  cabecera.append(nombre, fecha);
  bloque.append(cabecera, mensaje);
  return bloque;
}

function botonRespuesta(texto) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'comment-action';
  boton.textContent = texto;
  return boton;
}

function nuevaSolicitudRespuesta() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

function crearHilo(item) {
  const hilo = { abierto: false, enviando: false, requestId: '', firma: '' };
  hilo.boton = botonRespuesta('Responder');
  hilo.boton.setAttribute('aria-expanded', 'false');
  hilo.form = document.createElement('form');
  hilo.form.className = 'comments-form reply-form';
  hilo.form.id = `respuesta-${item.id}`;
  hilo.form.hidden = true;
  hilo.boton.setAttribute('aria-controls', hilo.form.id);
  const titulo = document.createElement('p');
  titulo.textContent = `Responder a ${item.nombre}`;
  hilo.form.appendChild(titulo);
  function campo(etiqueta, tipo, nombre, maximo) {
    const grupo = document.createElement('div');
    grupo.className = 'form-group';
    const label = document.createElement('label');
    const input = document.createElement(tipo);
    input.id = `${hilo.form.id}-${nombre}`;
    input.name = nombre;
    input.required = true;
    input.maxLength = maximo;
    if (tipo === 'textarea') input.rows = 3;
    else input.type = 'text';
    label.htmlFor = input.id;
    label.textContent = etiqueta;
    grupo.append(label, input);
    hilo.form.appendChild(grupo);
    return input;
  }
  hilo.nombre = campo('Nombre *', 'input', 'nombre', 100);
  hilo.texto = campo('Respuesta *', 'textarea', 'comentario', 500);
  const aviso = document.createElement('p');
  aviso.className = 'reply-notice';
  aviso.textContent = 'Tu respuesta aparecerá publicada en esta página.';
  hilo.form.appendChild(aviso);
  const acciones = document.createElement('div');
  acciones.className = 'reply-actions';
  hilo.enviar = botonRespuesta('Enviar respuesta');
  hilo.enviar.type = 'submit';
  hilo.cancelar = botonRespuesta('Cancelar');
  acciones.append(hilo.enviar, hilo.cancelar);
  hilo.form.appendChild(acciones);
  hilo.estado = document.createElement('p');
  hilo.estado.className = 'reply-status';
  hilo.estado.setAttribute('role', 'status');
  hilo.estado.hidden = true;
  hilo.boton.addEventListener('click', () => {
    hilo.form.hidden = false;
    hilo.boton.setAttribute('aria-expanded', 'true');
    hilo.nombre.focus();
  });
  hilo.cancelar.addEventListener('click', () => {
    hilo.form.hidden = true;
    hilo.boton.setAttribute('aria-expanded', 'false');
    hilo.boton.focus();
  });
  hilo.form.addEventListener('submit', async event => {
    event.preventDefault();
    if (hilo.enviando || !hilo.form.reportValidity()) return;
    const nombre = hilo.nombre.value.trim();
    const comentario = hilo.texto.value.trim();
    if (!nombre || !comentario) {
      hilo.estado.textContent = 'Escribe tu nombre y tu respuesta.';
      hilo.estado.hidden = false;
      return;
    }
    const firma = JSON.stringify([nombre, comentario]);
    if (!hilo.requestId || firma !== hilo.firma) {
      hilo.requestId = nuevaSolicitudRespuesta();
      hilo.firma = firma;
    }
    hilo.enviando = true;
    const controles = Array.from(hilo.form.elements);
    controles.forEach(c => { c.disabled = true; });
    hilo.enviar.textContent = 'Enviando...';
    hilo.estado.hidden = true;
    try {
      const response = await fetch(COMENTARIOS_URL, {
        method: 'POST',
        body: JSON.stringify({ nombre, comentario, parentId: item.id, requestId: hilo.requestId })
      });
      if (!response.ok) throw new Error('No se ha podido enviar la respuesta. Inténtalo de nuevo.');
      const resultado = await response.json();
      if (!resultado.ok) throw new Error(resultado.mensaje || 'No se ha podido enviar la respuesta.');
      if (!resultado.comentario || resultado.comentario.parentId !== item.id) {
        throw new Error('Actualiza los comentarios para comprobar si se ha recibido tu respuesta.');
      }
      // La respuesta confirmada por el servidor se muestra sin otra petición GET.
      // Cancelar una lectura pendiente impide que una lista antigua la borre.
      if (peticionComentarios) {
        peticionComentarios.abort();
        peticionComentarios = null;
        cargaComentarios.hidden = true;
        reintentarComentarios.disabled = false;
        listaComentarios.setAttribute('aria-busy', 'false');
      }
      if (!comentariosActuales.some(c => c.id === resultado.comentario.id)) {
        comentariosActuales.push(resultado.comentario);
      }
      hilo.requestId = '';
      hilo.firma = '';
      hilo.form.reset();
      hilo.form.hidden = true;
      hilo.boton.setAttribute('aria-expanded', 'false');
      hilo.abierto = true;
      hilo.estado.textContent = '¡Gracias! Tu respuesta se ha publicado correctamente.';
      hilo.estado.hidden = false;
      mostrarComentarios();
      const nueva = document.getElementById(`comentario-${resultado.comentario.id}`);
      if (nueva) nueva.focus();
    } catch (error) {
      hilo.estado.textContent = error.message || 'No se ha podido enviar la respuesta. Inténtalo de nuevo.';
      hilo.estado.hidden = false;
    } finally {
      hilo.enviando = false;
      controles.forEach(c => { c.disabled = false; });
      hilo.enviar.textContent = 'Enviar respuesta';
    }
  });
  return hilo;
}

function mostrarComentarios() {
  const fragmento = document.createDocumentFragment();
  const principales = comentariosActuales.filter(c => !c.parentId);
  const respuestas = new Map();
  comentariosActuales.filter(c => c.parentId).forEach(c => {
    if (!respuestas.has(c.parentId)) respuestas.set(c.parentId, []);
    respuestas.get(c.parentId).push(c);
  });
  principales.forEach(item => {
    const bloque = elementoComentario(item);
    // Compatibilidad con el backend anterior: sin ID se muestra el comentario sin Responder.
    if (typeof item.id === 'string' && /^[a-f0-9-]{36}$/i.test(item.id)) {
      if (!hilosComentarios.has(item.id)) hilosComentarios.set(item.id, crearHilo(item));
      const hilo = hilosComentarios.get(item.id);
      bloque.appendChild(hilo.boton);
      const hijas = respuestas.get(item.id) || [];
      if (hijas.length) {
        const details = document.createElement('details');
        details.className = 'comment-thread';
        details.open = hilo.abierto;
        const summary = document.createElement('summary');
        summary.textContent = `Ver respuestas (${hijas.length})`;
        details.appendChild(summary);
        hijas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).forEach(respuesta => {
          const tarjeta = elementoComentario(respuesta, true);
          tarjeta.id = `comentario-${respuesta.id}`;
          tarjeta.tabIndex = -1;
          details.appendChild(tarjeta);
        });
        details.addEventListener('toggle', () => {
          if (details.isConnected) hilo.abierto = details.open;
        });
        bloque.appendChild(details);
      }
      bloque.append(hilo.form, hilo.estado);
    }
    fragmento.appendChild(bloque);
  });
  listaComentarios.replaceChildren(fragmento);
}

function cargarComentarios() {
  // Un envío confirmado necesita una lectura nueva, posterior a ese envío.
  // Cancelar la lectura anterior evita mostrar una respuesta desactualizada.
  if (peticionComentarios) peticionComentarios.abort();
  const controlador = new AbortController();
  peticionComentarios = controlador;
  return solicitarComentarios(controlador);
}

async function solicitarComentarios(controlador) {
  cargaComentarios.hidden = comentariosCargados;
  errorComentarios.hidden = true;
  reintentarComentarios.disabled = true;
  listaComentarios.setAttribute("aria-busy", "true");
  try {
    const response = await fetch(COMENTARIOS_URL + "?respuestas=1", { signal: controlador.signal });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const comentarios = await response.json();
    if (controlador !== peticionComentarios) return;
    if (!Array.isArray(comentarios)) throw new Error("Respuesta de comentarios inválida");
    comentariosActuales = comentarios;
    mostrarComentarios();
    comentariosCargados = true;

  } catch (error) {
    if (controlador !== peticionComentarios || error.name === "AbortError") return;
    console.error("Error al cargar comentarios:", error);
    errorComentarios.hidden = false;
  } finally {
    if (controlador === peticionComentarios) {
      cargaComentarios.hidden = true;
      reintentarComentarios.disabled = false;
      listaComentarios.setAttribute("aria-busy", "false");
      peticionComentarios = null;
    }
  }
}

reintentarComentarios.addEventListener("click", () => {
  if (!peticionComentarios) cargarComentarios();
});

formularioComentarios.addEventListener("submit", async function (event) {
  event.preventDefault();

  const boton = formularioComentarios.querySelector('button[type="submit"]');
  if (boton.disabled) return;

  const formData = new FormData(formularioComentarios);

  const datos = {
    nombre: formData.get("nombre"),
    comentario: formData.get("comentario")
  };

  // FormData ya contiene las respuestas; ahora se puede bloquear la edición.
  const controles = Array.from(formularioComentarios.elements, campo => ({
    campo,
    desactivado: campo.disabled
  }));
  controles.forEach(({ campo }) => { campo.disabled = true; });
  boton.textContent = "Enviando...";

  mensajeExito.hidden = true;

  try {
    const response = await fetch(COMENTARIOS_URL, {
      method: "POST",
      body: JSON.stringify(datos)
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const resultado = await response.json();

    if (!resultado.ok) {
      throw new Error(
        resultado.mensaje ||
        "No se ha podido guardar el comentario"
      );
    }

    formularioComentarios.reset();

    await cargarComentarios();

    mensajeExito.hidden = false;

    setTimeout(function () {
      mensajeExito.hidden = true;
    }, 5000);

  } catch (error) {
    console.error("Error al enviar comentario:", error);

    alert(
      "No se ha podido enviar el comentario. Inténtalo de nuevo."
    );

  } finally {
    controles.forEach(({ campo, desactivado }) => {
      campo.disabled = desactivado;
    });
    boton.textContent = "Enviar mensaje";
  }
});


cargarComentarios();
