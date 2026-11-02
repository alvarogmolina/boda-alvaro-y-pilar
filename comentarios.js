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
    const response = await fetch(COMENTARIOS_URL, { signal: controlador.signal });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const comentarios = await response.json();
    if (controlador !== peticionComentarios) return;
    if (!Array.isArray(comentarios)) throw new Error("Respuesta de comentarios inválida");
    const fragmento = document.createDocumentFragment();

    comentarios.forEach(function (item) {
      const bloque = document.createElement("div");
      bloque.classList.add("comment-card");

      const cabecera = document.createElement("div");
      cabecera.classList.add("comment-header");

      const nombre = document.createElement("strong");
      const fecha = document.createElement("span");
      const mensaje = document.createElement("p");

      nombre.textContent = item.nombre;

      const fechaComentario = new Date(item.fecha);

      fecha.textContent = fechaComentario.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });

      fecha.classList.add("comment-date");

      mensaje.textContent = item.comentario;

      cabecera.appendChild(nombre);
      cabecera.appendChild(fecha);

      bloque.appendChild(cabecera);
      bloque.appendChild(mensaje);

      fragmento.appendChild(bloque);
    });
    listaComentarios.replaceChildren(fragmento);
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
