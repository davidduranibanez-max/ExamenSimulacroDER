# Arquitectura

## Ejecución estática

El documento de entrada es `index.html`. Carga un CSS y `app.js` como módulo ES.
Este importa `core.js`, `storage.js`, `life.js`, `timing.js` y `statistics-view.js`.
La vista estadística usa `statistics.js` y `charts.js`. Las URLs del banco se resuelven
con `new URL('../../data/...', import.meta.url)`, por lo que funcionan bajo un
prefijo de GitHub Pages. Todas las vistas viven en el mismo documento y no crean
rutas que requieran reescrituras del servidor.

`scripts/serve.mjs` sirve la raíz del repo por HTTP en 127.0.0.1:4173, bloquea
traversal y rutas ocultas, asigna MIME a módulos y JSON y no realiza persistencia.
También funciona un servidor HTTP estático de Python u otro proveedor.
`.nojekyll` mantiene el sitio como archivos estáticos al publicar desde una rama.

## Responsabilidades

**app.js** administra `auth`, `landing`, `exam`, `results`, `history` y `statistics`. Reutiliza
cabecera, pie, diálogo de confirmación y notificaciones. Renderiza textos externos
con escape HTML; las opciones usan radios nativos con etiquetas. Delegación de
click/change/submit en lugar de un listener por pregunta.

**core.js** carece de dependencias DOM. Define tamaño de examen, Fisher–Yates,
entero aleatorio mediante rechazo, selección de incisos, calificación, validación
de bancos e intentos y formato de tiempo. Sirve tanto al sitio como al validador
Node y las pruebas.

**storage.js** administra perfiles, PBKDF2, sesiones, IndexedDB y exclusión entre
pestañas. Traduce errores de lectura y escritura en mensajes visibles. No borrar
datos corruptos o viejos automáticamente.

`assets/data/profiles.json` contiene los dos perfiles iniciales pedidos por el usuario,
con sales y verificadores PBKDF2, sin contraseña en texto claro. Al iniciar se agregan
únicamente los usuarios faltantes bajo un bloqueo del registro. No reemplaza claves
o perfiles ya existentes. Los usuarios se normalizan a NFC y minúsculas españolas;
se admiten letras Unicode y números. Nombre de perfil y username son campos distintos.

**timing.js** administra el plazo persistente de una hora, las visitas, el tiempo
visible acumulado y los eventos de respuesta. La finalización toma una copia
inmutable y distingue el motivo manual del vencimiento.

**statistics.js** calcula descripciones, histogramas, medias móviles, grupos por
fecha/hora y Pearson sin DOM ni mutaciones del historial.

**charts.js** genera SVG escapado con detalles accesibles y agregación de puntos
cercanos para gráficos de dispersión. **statistics-view.js** compone las tarjetas,
ayudas, gráficos y tablas. No hay librería externa ni bundle.

**life.js** implementa la evolución B3/S23 con bordes periódicos. `stepLife` es
función pura comprobable. `initLife` dibuja celdas con tamaño entero de 12 px y
desactiva suavizado. Evoluciona cada 160 ms; no evoluciona con la pestaña oculta,
pausa explícita o preferencia de movimiento reducido. El canvas es decorativo y
no intercepta eventos.

## Estado de un intento

```js
{
  schemaVersion: 2, id, startedAt, updatedAt, elapsedMs, current,
  timingVersion: 1, timingCoverage, timeLimitMs: 3600000, deadlineAt, observedAt,
  timingStartedAt, startedCalendar,
  questionTimes: [{ activeMs, firstViewedAt, lastViewedAt, events: [/* selecciones y borrados */] }],
  questions: [{ id, number, page, area, question, options: [/* cinco textos */], correct: 0 }],
  answers: [/* cien valores null o índices 0–4 */],
  marked: [/* cien booleanos */],
  completedAt, durationMs, finishReason // solo al finalizar
}
```

`correct` es el índice final después del sorteo, no una letra permanente del banco.
Una respuesta pendiente es `null`, nunca cero. Cada pregunta vale un punto; errores
y pendientes no suman. El resumen calcula porcentajes y aciertos por área. Los
filtros de resultados afectan la revisión, no la calificación.

## Persistencia

| Medio | Clave/objeto | Contenido |
|---|---|---|
| localStorage | `cean.exam.v1.users` | IDs, nombre, usuario, sal y hash |
| sessionStorage | `cean.exam.v1.session` | ID del usuario conectado en esa pestaña |
| IndexedDB | `cean-exam-v1` / `profiles` / clave userId | `{ active, history }` |
| Web Locks | `cean.exam.v1.<userId>` | Exclusión del examen mientras está abierto |

Las contraseñas se derivan usando Web Crypto; no se almacena el texto original.
El uso de localhost o HTTPS habilita las APIs necesarias. El acceso es local y
no protege el banco frente a quien puede leer el JavaScript o modificar el navegador.

La cola `saving` serializa snapshots para evitar que una escritura antigua venza
a la nueva. Se guarda en cada selección/navegación/marcado y cada cinco segundos.
`leaveExam` espera el guardado antes de liberar el bloqueo y navegar. Finalizar
escribe historial y limpia `active` en una sola transacción; si falla, el examen
continúa abierto y ofrece exportación. El guardado en `pagehide` es un esfuerzo
adicional: no sustituye los guardados frecuentes y confirmados.

El plazo es `deadlineAt`, calculado una sola vez a partir del inicio. Se muestra
una cuenta regresiva con comprobaciones cada 250 ms; se persiste cada cinco
segundos, no cuatro veces por segundo. El plazo sigue corriendo fuera del examen.
El tiempo visible acumulado se mide por separado con `performance.now`; se corta
al vencimiento y se excluyen páginas/pestañas ocultas. El guardado final es atómico,
con bloqueo del perfil. Si falla, se mantienen el intento y la exportación; cuando
ya venció, las respuestas quedan bloqueadas y se ofrece reintentar el guardado.

Al cargar inicio/historial/estadísticas se finaliza cualquier intento que venció
mientras el navegador estaba cerrado, tomando el plazo original como hora final.
Nunca se modifica el historial antiguo: los intentos antiguos en curso se migran
al reanudarse con registro parcial y tiempo restante, sin regenerar preguntas.
Ver `ANALYTICS.md` para eventos, métricas y compatibilidad.

## Diseño y accesibilidad

Tokens CSS en `:root`, fondo oscuro, verde lima, ámbar y rojo para estados.
Paneles con remates cuadrados, iconografía simple, fuentes de sistema y canvas
pixelado. Media queries a 1100, 800 y 480 px. Mapa lateral en PC; desplegable en móvil.
Hay enlace para saltar al contenido, etiquetas del formulario de acceso sin registro público, ayudas con mouse/teclado/toque,
radios nativos, foco visible, `dialog` modal y estados anunciados con `aria-live`.

No hay servicios externos, SDK, CDN, analítica o fuentes descargadas.
Las exportaciones excluyen credenciales y contienen copias de los datos del examen.
La importación de copias todavía no está implementada.
# Integración inicial de Supabase

Desde el 7 de octubre de 2026, `index.html` carga también un módulo independiente
`assets/js/supabase-client.js`. Exporta `supabaseReady`, una promesa singleton
que devuelve el cliente del SDK 2.117.2 por CDN o `null` si no puede cargarlo.
La configuración pública vive en `assets/js/supabase-config.js`; no requiere build.
No participa todavía en el acceso ni en el guardado de intentos. El flujo local
continúa independiente de la disponibilidad del servicio. Ver `SUPABASE.md`.
