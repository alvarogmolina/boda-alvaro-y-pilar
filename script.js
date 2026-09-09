// =========================
// MENÚ
// =========================

const menuButton = document.getElementById("menu-button");
const navigation = document.getElementById("navigation");

menuButton.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("open");

  menuButton.setAttribute("aria-expanded", isOpen);
});


// Cerrar menú después de seleccionar una sección

const navigationLinks = navigation.querySelectorAll("a");

navigationLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navigation.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
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