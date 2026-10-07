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

**auth.js** valida correo y contraseña en Supabase Auth y verifica sesiones con
`getUser`. La sesión del SDK usa memoria y renovación de tokens; al abrir/recargar se pide acceso. Los errores
de red no permiten acceso local alternativo; no hay alta pública. **storage.js**
administra IndexedDB y Web Locks por UUID remoto; no contiene autenticación local.
Los perfiles antiguos permanecen intactos y no se vinculan automáticamente a cuentas.

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
| localStorage | `cean.exam.v1.users` | Registro antiguo conservado; no autoriza el acceso |
| Memoria del SDK | Sesión Supabase | Activa hasta cerrar/recargar; sin restauración automática |
| IndexedDB | `cean-exam-v1` / `profiles` / clave userId | `{ active, history }` |
| Web Locks | `cean.exam.v1.<userId>` | Exclusión del examen mientras está abierto |

Las contraseñas se comprueban en Supabase y no se guardan en la aplicación.
El uso de localhost o HTTPS habilita las APIs necesarias. La autenticación remota
no vuelve privado el banco estático ni protege resultados locales contra manipulación.

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
## Integración de Supabase

Desde el 7 de octubre de 2026, `auth.js` usa `supabase-client.js`: promesa singleton
`supabaseReady`, SDK 2.117.2 por CDN y configuración pública en `supabase-config.js`.
No requiere build. La sesión se valida remotamente; si falla la carga o Auth,
se muestra el formulario con error y no se permite acceso por la sesión antigua.
Los exámenes siguen siendo locales por `supabase:<UUID>`; no se crearon tablas ni
sincronización. El banco sigue público. Detalles en `SUPABASE.md`.
