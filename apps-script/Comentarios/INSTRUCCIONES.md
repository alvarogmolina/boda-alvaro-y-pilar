# Activar respuestas a comentarios

Estos cambios están preparados en local. No se ha modificado Google Sheets ni el proyecto publicado de Apps Script.

1. Guarda una copia de seguridad de la hoja y del código actual de **Comentarios**.
2. Abre el proyecto de Apps Script que sirve los comentarios (no el de confirmar asistencia).
3. Sustituye su código por el contenido completo de `Codigo.gs`, en esta misma carpeta, y guarda.
4. Selecciona la función `prepararComentarios` y pulsa **Ejecutar**. Autoriza si Google lo solicita. Espera a que termine correctamente.
   - Conserva las columnas A:D, sus datos y su visibilidad.
   - Añade las columnas `comentario_id`, `comentario_padre_id` y `solicitud_id` al final de la hoja y asigna IDs a los comentarios existentes.
   - Puede ejecutarse otra vez sin cambiar los IDs ya asignados.
5. Ve a **Implementar → Gestionar implementaciones**, edita la implementación web existente, selecciona **Nueva versión** e implementa conservando la URL y los permisos actuales.
6. Prueba la web local con el backend actualizado. Las pruebas de envío desde la web local sí guardan respuestas reales en la hoja. Hasta actualizar el backend, la web muestra los comentarios sin el botón Responder.
7. Cuando esté comprobado, publica los cambios de la web. La web anterior seguirá mostrando solo los comentarios principales mientras tanto.

## Uso y moderación

- Cualquier visitante puede responder indicando nombre y texto. No hay cuentas ni verificación de identidad.
- Las respuestas se publican inmediatamente; solo existe un nivel de respuestas.
- Los hilos empiezan cerrados con “Ver respuestas (n)”. Tras enviar, se abre el hilo.
- Los comentarios mantienen su orden y las respuestas aparecen de más antigua a más reciente.
- La columna D conserva el criterio de visibilidad: `si` publica la fila; otro valor la oculta.
- Ocultar un comentario principal oculta también sus respuestas. Restaurarlo muestra las respuestas que sigan marcadas como visibles.
- No cambies los IDs manualmente. Si ordenas la hoja, ordena filas completas incluyendo las nuevas columnas.
- Los reintentos del mismo envío conservan un identificador para evitar duplicados. Esto no es una protección contra spam deliberado.

## Comprobaciones antes de publicar

- En móvil y escritorio: abrir/cerrar hilos, abrir/cancelar el formulario y comprobar que los campos y botones no desbordan.
- Enviar una respuesta de prueba y comprobar que aparece bajo su comentario; recargar y comprobar su persistencia.
- Ocultar la fila de prueba en D tras terminar. No hace falta borrar comentarios.
- Verificar carga, error y Reintentar sin conexión. El formulario conserva el texto cuando falla el envío.

Las comprobaciones automatizadas locales usan datos simulados. La comprobación visual en navegador y la integración real quedan pendientes de actualizar Apps Script.
