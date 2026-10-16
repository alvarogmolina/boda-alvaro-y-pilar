# Secciones retiradas temporalmente

Recuperar solo los bloques indicados, sin reemplazar archivos completos ni deshacer cambios posteriores. Los estilos se conservan para reutilizar el diseño.

## Transporte: horarios y paradas

- Versión original: `5c3682bb12fd6fea36c2e776a0e550df029c5b61`.
- Etiqueta local: `transporte-horarios-originales`.
- Archivo: `index.html`, sección `#transporte`.
- Recuperar los tres bloques de trayectos y el enlace de La Rana; actualizar los datos de prueba antes de publicar.
- Estilos: `.transport-*` en `styles.css`.

## Cuenta bancaria

- Versión original: `5c3682bb12fd6fea36c2e776a0e550df029c5b61` (también accesible con la etiqueta anterior).
- Archivo: `index.html`, bloque `.contact-gift` dentro de `#contacto`.
- Incluye frase introductoria, IBAN, botón de copia y mensaje de estado.
- Estilos conservados: `.contact-gift`, `.gift-*` y sus reglas móviles en `styles.css`.
- La lógica de copia permanece en `script.js`, con comprobación de existencia del botón para funcionar también cuando el bloque está retirado.
- Restaurar el bloque HTML completo y comprobar el IBAN antes de publicar: la versión guardada contiene un número de ejemplo.
