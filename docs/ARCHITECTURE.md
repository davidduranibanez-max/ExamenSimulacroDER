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

**auth.js** gestiona OAuth Google/PKCE y sanea el callback; **auth-service.js** valida
Auth + permiso remoto, y **auth-storage.js** conserva solamente el verificador
PKCE durante la redirección. Los tokens permanecen en memoria. Recargar pide
Google; no hay acceso alternativo con cuentas/contraseñas locales. **storage.js**
administra IndexedDB/Web Locks por UUID. Los históricos antiguos se preservan.
La tabla de correos, la RPC y el hook están en `supabase/google-access.sql`.
Google remoto funcionando según el docente. Contrato en SUPABASE.md; respaldo de
resultados en CLOUD_HISTORY.md. storage.js coordina copia local y cloud-history.js
mediante el mismo cliente Supabase.

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

Google autentica su propia cuenta; CEAN no recibe la contraseña de Google. Supabase verifica la autorización.
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

Se usa Supabase Auth/Postgres y el SDK por CDN; no hay fuentes externas ni analítica de terceros.
Las exportaciones excluyen credenciales y contienen copias de los datos del examen.
La importación de copias todavía no está implementada.
## Integración de Supabase

Desde el 7 de octubre de 2026, el acceso vigente usa Google con el SDK 2.117.2
por CDN y configuración pública. Callback en la raíz actual del sitio, respetando
el prefijo Pages. La lista se administra en Supabase, no se entrega al navegador.
Google ya fue configurado por el docente. El SQL nuevo exam-history.sql requiere
activación manual. El banco sigue público; los intentos en curso permanecen locales
y los terminados se respaldan en Supabase. SUPABASE.md describe
el contrato y GOOGLE_SETUP.md el procedimiento de instalación.

## Respaldo de resultados (7/10/2026)

Ver CLOUD_HISTORY.md: una fila inmutable por (UUID, intento), RPC con permiso remoto,
RLS por alumno, copia local primero, unión transaccional e interfaz con estado
confirmado/pendiente. Se sincronizan resultados y eventos completos al finalizar;
no se suben respuestas individuales ni se recalifica con un banco actualizado.

## Exportación de rendimiento

performance-export.js construye el paquete JSON versionado y matrices de seis hojas
para SheetJS CE 0.20.3. El proveedor local assets/vendor/xlsx-0.20.3.js se importa
solo al descargar; no hay llamadas a conversores externos. El paquete incluye
historial/eventos completos y estadísticas derivadas del mismo snapshot. XLSX es
un informe estático tipado, no una conexión en vivo. Ver EXPORTS.md y licencia.
