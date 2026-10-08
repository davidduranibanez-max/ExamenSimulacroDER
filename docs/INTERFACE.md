# Interfaz compacta y marca CEAN

Actualizado el 7 de octubre de 2026. Sin build ni nuevas dependencias: conserva
GitHub Pages, rutas relativas, fuentes normales y fondo de Conway.

## Marca

Título visible y de la pestaña: **Simulador de Examen**.
`assets/cean-logo-silhouette.png` se obtuvo editando la fotografía del docente
con la herramienta integrada **imagegen**; el original en Downloads permanece intacto.
El árbol y las letras CEAN se conservan con fondo transparente. El encabezado usa
el canal alfa como máscara CSS; `background: var(--green)` garantiza exactamente
el verde de la interfaz (`#bcf76a`), incluso al cambiar el tema.

Prompt final de limpieza: «Conservar el árbol y las letras CEAN de la imagen;
convertirlos en formas planas verdes #bcf76a, fondo transparente, bordes limpios,
sin sombras, texturas, degradados ni fondo amarillo». Se usó la imagen original
como objetivo de edición y una segunda edición para limpiar la silueta.

## Espacio y navegación

La cabecera de PC mide unos 72 px, permanece arriba al desplazarse y admite dos
filas en celular. Se reduce el espacio de la landing, las tarjetas, las secciones
estadísticas y el examen. El bloque final de `styles.css`, «Compact layout»,
contiene los ajustes y sus breakpoints.

Cambiar de sección vuelve al inicio. El foco en `main` usa `preventScroll` para
que el navegador no desplace el título debajo de la cabecera fija. El enlace de
salto al contenido conserva su navegación normal para usuarios de teclado.

El mapa de PC ocupa 238 px, muestra siete columnas y puede desplazarse internamente
en pantallas bajas. En móvil se conserva el mapa plegable y los círculos mayores.
Las alternativas se ajustan a su contenido completo, sin elipsis, cortes ni
alturas fijas. El botón Finalizar mantiene su color rojo y el plazo no cambia.

Retirados Marcar para revisar y su leyenda de mapa. Borrar respuesta comparte
fila con Anterior/Siguiente para ahorrar altura. El aviso bajo el reloj también
se retira; la cuenta regresiva y el plazo remoto de una hora siguen vigentes.

Los gráficos tienen desplazamiento horizontal interno en móvil. Las métricas
ocupan dos columnas en teléfonos pequeños. Sus ayudas se muestran al pasar el
mouse/enfocar, y se pueden activar al tocar; en móvil el panel permanece dentro
del ancho visible.

## Acceso y verificación

Google OAuth, hook, lista privada y RPC de permiso se conservan. No se modifican
credenciales ni reglas remotas con un cambio de interfaz. El docente comunicó
que aparentemente resolvió el problema del nuevo correo; falta conocer el mensaje
y la causa para documentar el diagnóstico. No se certificó ese acceso remoto.

Validación local: Node, comprobación de publicación y navegador con SDK/RPC
ficticios bajo `/ExamenSimulacroDER/`. La prueba no inicia ni guarda intentos en
Supabase real. Ver `TESTING.md`; el docente realiza el commit/push.
