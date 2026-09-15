const COMENTARIOS_URL =
  "https://script.google.com/macros/s/AKfycbztUIyXYDHRP9lsBBVyhsdp7wqQe82VmIG6DQxhu-WO_h_MmDHuPyIopAZCOYjSG-A88w/exec";

const formularioComentarios = document.getElementById("form-comentarios");
const listaComentarios = document.getElementById("lista-comentarios");
const mensajeExito = document.getElementById("comentario-exito");


async function cargarComentarios() {
  try {
    const response = await fetch(COMENTARIOS_URL);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const comentarios = await response.json();

    listaComentarios.innerHTML = "";

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

      listaComentarios.appendChild(bloque);
    });

  } catch (error) {
    console.error("Error al cargar comentarios:", error);
  }
}


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
