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


/* ENVÍO REAL */

form.addEventListener("submit", async function (event) {

  event.preventDefault();

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
      throw new Error(
        resultado.mensaje ||
        "El servidor ha rechazado la confirmación"
      );
    }

    alert("¡Confirmación enviada correctamente!");

    form.reset();

    datosAsistente.classList.add("oculto");
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