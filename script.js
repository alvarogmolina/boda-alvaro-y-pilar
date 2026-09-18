// =========================
// MENÚ
// =========================

const menuButton = document.getElementById("menu-button");
const navigation = document.getElementById("navigation");
const menuOverlay = document.getElementById("menu-overlay");
navigation.inert = true;

function cambiarEstadoMenu(abierto) {
  navigation.inert = !abierto;
  navigation.classList.toggle("open", abierto);
  menuOverlay.classList.toggle("open", abierto);
  menuButton.setAttribute("aria-expanded", String(abierto));
  menuButton.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
  menuButton.textContent = abierto ? "×" : "☰";
}

menuButton.addEventListener("click", () => {
  cambiarEstadoMenu(!navigation.classList.contains("open"));
});

menuOverlay.addEventListener("click", () => {
  cambiarEstadoMenu(false);
  menuButton.focus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navigation.classList.contains("open")) {
    cambiarEstadoMenu(false);
    menuButton.focus();
  }
});

document.querySelector(".header-logo").addEventListener("click", () => {
  cambiarEstadoMenu(false);
});

// Cerrar menú después de seleccionar una sección

const navigationLinks = navigation.querySelectorAll("a");

navigationLinks.forEach((link) => {
  link.addEventListener("click", () => {
    cambiarEstadoMenu(false);
  });
});


// =========================
// CUENTA ATRÁS
// =========================

const countdownElement = document.getElementById("countdown");

const weddingDate = new Date("2027-02-27T12:00:00+01:00");

function updateCountdown() {

  const now = new Date();
  const difference = weddingDate - now;

  if (difference <= 0) {
    countdownElement.textContent = "¡Hoy es el gran día!";
    return;
  }

  const days = Math.floor(
    difference / (1000 * 60 * 60 * 24)
  );

  const hours = Math.floor(
    (difference / (1000 * 60 * 60)) % 24
  );

  const minutes = Math.floor(
    (difference / (1000 * 60)) % 60
  );

  countdownElement.textContent =
    `${days} días · ${hours} h · ${minutes} min`;
}

updateCountdown();

setInterval(updateCountdown, 60000);
