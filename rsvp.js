const form = document.getElementById("rsvp-form");

const datosAsistente = document.getElementById("datos-asistente");

const detalleAlimentacion =
  document.getElementById("detalle-alimentacion");

const alimentacionTexto =
  document.getElementById("alimentacion-texto");

const plusOneData =
  document.getElementById("plus-one-data");

const plusOneNombre =
  document.getElementById("plus-one-nombre");

const plusOneAlimentacionDetalle =
  document.getElementById("plus-one-alimentacion-detalle");

const plusOneAlimentacionTexto =
  document.getElementById("plus-one-alimentacion-texto");


function limpiarRadios(nombre) {
  document
    .querySelectorAll(`input[name="${nombre}"]`)
    .forEach(input => {
      input.checked = false;
      input.required = false;
    });
}


function hacerRadiosObligatorios(nombre, obligatorio) {
  document
    .querySelectorAll(`input[name="${nombre}"]`)
    .forEach(input => {
      input.required = obligatorio;
    });
}


/* ASISTENCIA */

document
  .querySelectorAll('input[name="asistencia"]')
  .forEach(input => {

    input.addEventListener("change", function () {

      const asiste = this.value === "si";

      datosAsistente.classList.toggle("oculto", !asiste);

      hacerRadiosObligatorios("alimentacion", asiste);
      hacerRadiosObligatorios("bus_ida", asiste);
      hacerRadiosObligatorios("bus_vuelta", asiste);
      hacerRadiosObligatorios("plus_one", asiste);

      if (!asiste) {

        limpiarRadios("alimentacion");
        limpiarRadios("bus_ida");
        limpiarRadios("bus_vuelta");
        limpiarRadios("plus_one");

        alimentacionTexto.value = "";
        alimentacionTexto.required = false;
        detalleAlimentacion.classList.add("oculto");

        plusOneData.classList.add("oculto");
        plusOneNombre.value = "";
        plusOneNombre.required = false;

        limpiarRadios("plus_one_alimentacion");
        limpiarRadios("plus_one_bus_ida");
        limpiarRadios("plus_one_bus_vuelta");

        plusOneAlimentacionTexto.value = "";
        plusOneAlimentacionTexto.required = false;

        plusOneAlimentacionDetalle.classList.add("oculto");

      }

    });

  });


/* ALIMENTACIÓN INVITADO */

document
  .querySelectorAll('input[name="alimentacion"]')
  .forEach(input => {

    input.addEventListener("change", function () {

      const necesitaDetalle = this.value === "si";

      detalleAlimentacion.classList.toggle(
        "oculto",
        !necesitaDetalle
      );

      alimentacionTexto.required = necesitaDetalle;

      if (!necesitaDetalle) {
        alimentacionTexto.value = "";
      }

    });

  });


/* ACOMPAÑANTE */

document
  .querySelectorAll('input[name="plus_one"]')
  .forEach(input => {

    input.addEventListener("change", function () {

      const tieneAcompanante = this.value === "si";

      plusOneData.classList.toggle(
        "oculto",
        !tieneAcompanante
      );

      plusOneNombre.required = tieneAcompanante;

      hacerRadiosObligatorios(
        "plus_one_alimentacion",
        tieneAcompanante
      );

      hacerRadiosObligatorios(
        "plus_one_bus_ida",
        tieneAcompanante
      );

      hacerRadiosObligatorios(
        "plus_one_bus_vuelta",
        tieneAcompanante
      );

      if (!tieneAcompanante) {

        plusOneNombre.value = "";

        limpiarRadios("plus_one_alimentacion");
        limpiarRadios("plus_one_bus_ida");
        limpiarRadios("plus_one_bus_vuelta");

        plusOneAlimentacionTexto.value = "";
        plusOneAlimentacionTexto.required = false;

        plusOneAlimentacionDetalle.classList.add("oculto");

      }

    });

  });


/* ALIMENTACIÓN ACOMPAÑANTE */

document
  .querySelectorAll('input[name="plus_one_alimentacion"]')
  .forEach(input => {

    input.addEventListener("change", function () {

      const necesitaDetalle = this.value === "si";

      plusOneAlimentacionDetalle.classList.toggle(
        "oculto",
        !necesitaDetalle
      );

      plusOneAlimentacionTexto.required = necesitaDetalle;

      if (!necesitaDetalle) {
        plusOneAlimentacionTexto.value = "";
      }

    });

  });


/* LONGITUD DE LOS TEXTOS */

const limitesTexto = [
  ["nombre", "Nombre y apellidos", 150],
  ["alimentacion_texto", "Necesidades alimentarias", 500],
  ["plus_one_nombre", "Nombre del acompañante", 150],
  ["plus_one_alimentacion_texto", "Necesidades alimentarias del acompañante", 500],
  ["observaciones", "Observaciones", 1000]
].map(([nombre, etiqueta, maximo]) => {
  const campo = form.elements.namedItem(nombre);
  const aviso = document.createElement("p");
  aviso.id = `${campo.id}-error`;
  aviso.className = "error-campo";
  aviso.hidden = true;
  aviso.setAttribute("aria-live", "polite");
  campo.setAttribute("aria-describedby", aviso.id);
  campo.insertAdjacentElement("afterend", aviso);
  return { campo, etiqueta, maximo, aviso };
});

let validarLongitudAlEditar = false;

function mostrarErrorTexto(item, mensaje) {
  item.aviso.textContent = mensaje;
  item.aviso.hidden = !mensaje;
  if (mensaje) {
    item.campo.setAttribute("aria-invalid", "true");
  } else {
    item.campo.removeAttribute("aria-invalid");
  }
}

function validarLongitudes() {
  let primerCampo = null;
  limitesTexto.forEach(item => {
    const longitud = Array.from(item.campo.value).length;
    const demasiadoLargo = !item.campo.closest(".oculto") && longitud > item.maximo;
    mostrarErrorTexto(item, demasiadoLargo
      ? `El campo «${item.etiqueta}» es demasiado largo: has escrito ${longitud} caracteres. Por favor, utiliza ${item.maximo} caracteres o menos.`
      : "");
    if (demasiadoLargo && !primerCampo) primerCampo = item.campo;
  });
  return primerCampo;
}

form.addEventListener("input", () => {
  if (validarLongitudAlEditar) validarLongitudes();
});
form.addEventListener("change", () => {
  if (validarLongitudAlEditar) validarLongitudes();
});

/* ENVÍO REAL */

form.addEventListener("submit", async function (event) {

  event.preventDefault();

  validarLongitudAlEditar = true;
  const primerCampoLargo = validarLongitudes();
  if (primerCampoLargo) {
    primerCampoLargo.focus();
    return;
  }

  const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbwBmhsRTE8nOIEYsyJVKzleggixTVyyw_iaGfVlvg0LWR2vCRPIX7gaYArpsSZhUMQq/exec";

  const formData = new FormData(form);
  const datos = Object.fromEntries(formData.entries());

  const boton = form.querySelector('button[type="submit"]');

  boton.disabled = true;
  boton.textContent = "Enviando...";

  try {

    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify(datos)
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const resultado = await response.json();

    if (!resultado.ok) {
      const item = limitesTexto.find(item => item.campo.name === resultado.campo);
      if (item && resultado.mensaje) {
        mostrarErrorTexto(item, resultado.mensaje);
        item.campo.focus();
      } else {
        alert(resultado.mensaje || "El servidor ha rechazado la confirmación");
      }
      return;
    }

    alert("¡Confirmación enviada correctamente!");

    form.reset();
    validarLongitudAlEditar = false;
    limitesTexto.forEach(item => mostrarErrorTexto(item, ""));

    // reset() borra respuestas, pero no los atributos required dinámicos.
    datosAsistente.classList.remove("oculto");
    hacerRadiosObligatorios("alimentacion", true);
    hacerRadiosObligatorios("bus_ida", true);
    hacerRadiosObligatorios("bus_vuelta", true);
    hacerRadiosObligatorios("plus_one", true);

    alimentacionTexto.required = false;
    plusOneNombre.required = false;
    plusOneAlimentacionTexto.required = false;
    hacerRadiosObligatorios("plus_one_alimentacion", false);
    hacerRadiosObligatorios("plus_one_bus_ida", false);
    hacerRadiosObligatorios("plus_one_bus_vuelta", false);

    detalleAlimentacion.classList.add("oculto");
    plusOneData.classList.add("oculto");
    plusOneAlimentacionDetalle.classList.add("oculto");

  } catch (error) {

    console.error(error);

    alert(
      "No se ha podido enviar la confirmación. Inténtalo de nuevo."
    );

  } finally {

    boton.disabled = false;
    boton.textContent = "Enviar confirmación";

  }

});
