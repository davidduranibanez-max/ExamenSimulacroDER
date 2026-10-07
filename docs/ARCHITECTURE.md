# Arquitectura

## Frontend estático y backend Supabase

index.html carga CSS y app.js como módulos ES. Vistas en un único documento, sin
rutas de SPA que requieran reescritura. JS y exportaciones resuelven rutas relativas
al módulo; funcionan bajo /ExamenSimulacroDER/. npm start sirve solo CEAN, bloquea
traversal/archivos ocultos y usa MIME JS/JSON. .nojekyll mantiene Pages estático.
No npm install/build para usar el frontend; requiere Internet y Supabase configurado.

El banco no se descarga desde Pages. assets/bank-info.json contiene únicamente
cantidades/materias. Banco JSON y herramientas originales fuera del repo, en
../banco-privado. scripts/prepare-bank.mjs valida y genera CSV privado; check-public
impide publicar banco/CSV/secretos detectables en el árbol actual. No limpia Git.

## Responsabilidades

- app.js: vistas auth, landing, exam, results, history, statistics; eventos, reloj,
  guardado serializado y diálogos. Escapa texto externo, radios/etiquetas nativos.
- auth.js, auth-service.js: Google PKCE, callback raíz, getUser y cean_has_access.
  Tokens solo memoria; auth-storage.js conserva temporalmente el verificador PKCE.
- remote-exam.js: current/start/progress/finish mediante RPC autenticadas; revisión
  y throttle 15 segundos, errores sin alternativa de sorteo/corrección local.
- storage.js: IndexedDB por supabase:<UUID>, unión transaccional, copia local primero,
  progreso remoto y recuperación inicial. Web Locks excluye pestañas editoras locales.
- cloud-history.js: historial final por dueño, páginas de 50, deduplicación por UUID.
  Para resultados privados lee la fila ya corregida; no la reenvía como nota de cliente.
- core.js: validación y presentación de notas finales; sorteo local genérico sigue
  solo para herramientas/pruebas/compatibilidad, no lo invoca app.js para nuevos exámenes.
- timing.js: visitas, tiempo visible, selecciones/cambios/borrado y calendario local.
- statistics.js, charts.js, statistics-view.js: estadísticas puras y gráficos SVG,
  ayudas mouse/teclado/toque; históricos sin mediciones quedan excluidos de esas métricas.
- performance-export.js: paquetes v2 y seis matrices de hoja; SheetJS CE 0.20.3
  local, import diferido. No se transmite rendimiento a conversores externos.
- life.js: Conway B3/S23 con bordes periódicos, celdas enteras de 12 px, cada 160 ms,
  pausa/pestaña oculta/movimiento reducido; canvas decorativo.

## Contrato privado

private-bank.sql instala tablas y RPC. cean_question_bank guarda cada JSONB completo;
cean_live_exams guarda snapshot con claves y progreso. Ambas tienen RLS y carecen
de SELECT/INSERT/UPDATE/DELETE para anon/authenticated. RPC SECURITY DEFINER con
search_path vacío comprueban Google/lista, dueño, versión y plazo. Esquema interno
cean_private no tiene permisos del alumno. No hay Edge Function ni proceso de build.

cean_start_exam bloquea inicios por alumno: una sesión activa y hasta 20 nuevas/24h.
Sortea 100 preguntas distintas, cuatro distractores propios y cinco posiciones.
Devuelve una copia con correct:null. Servidor guarda correcta privada y plazo de una hora.
cean_store_progress valida respuestas/métricas y copia campos permitidos; nunca
acepta claves, preguntas, identidad o plazo del navegador. expected_revision evita
que otro dispositivo sobreescriba respuestas más recientes. El dueño se deriva de Auth.
cean_finish_exam guarda progreso solo antes del plazo, corrige con snapshot propio
y devuelve resultado con correct:0..4, serverVerified:true, completedAt y duración
servidor. Es idempotente; limpia snapshot activo duplicado después de guardar.

cean_exam_attempts conserva una fila por (user_id,id), snapshot+eventos y resumen,
verification_source=server para resultados nuevos. RLS permite solo dueño autorizado.
cean_save_attempt sirve históricos anteriores con legacy-client y no permite IDs
de sesiones privadas ni confiar en una marca serverVerified enviada por el alumno.
El servidor certifica claves/plazo/nota nueva, no autenticidad del tiempo de lectura
ni de los eventos medidos por navegador. Revisión docente de incisos sigue pendiente.

## Estado y persistencia

Intento activo: 100 preguntas con correct:null, answers[100]null/0..4, marked[100]bool,
current: 0..99, startedAt/deadlineAt, timingVersion: 1, questionTimes[100] con activeMs,
visitas y eventos, remote:true, remoteRevision. Final conserva snapshot y agrega
correctas,completedAt,durationMs,finishReason,serverVerified. No recalificar con banco nuevo.

Cada interacción y cada cinco segundos: copia IndexedDB. Mientras hay uso, remoto cada 15 segundos;
al salir se fuerza y al finalizar se confirma en el servidor antes de archivar.
Una cola serial evita escrituras viejas. Web Locks y revision son protecciones
complementarias entre pestañas y dispositivos. Si remoto tiene revisión nueva,
se conserva snapshot antiguo en recoveryCopies y se reanuda el confirmado.

Si falla red, conservar/exportar copia local y reintentar; no finalizar con claves
locales para una sesión privada. El reloj del servidor aplica una hora fuera del sitio.
Al vencer cuenta último progreso recibido antes del plazo, no respuestas offline
que lleguen después. No hay tarea programada: se archiva al volver/solicitar finish.
Una respuesta recibida antes del cierre HTTP puede haberse guardado: reintento seguro.

Historial terminado se descarga al entrar y mediante Sincronizar historial; se une
sin pisar activos. Copias locales de resultados pendientes/antiguos se respaldan
con permisos del mismo UUID, sin asignar perfiles de username automáticamente.
Tokens no se guardan con datos del examen. Exportaciones son snapshots del momento.

## Diseño y permisos

Negro/verde lima/ámbar/rojo; fuentes de sistema, remates pixelados. Responsive 1100,
800,480px, mapa lateral PC/desplegable celular. Skip-link, foco visible, aria-live,
dialog y controles nativos. CDN solo SDK Supabase; vendor Excel local con licencia.
La pantalla/código del frontend son públicos. La privacidad del banco depende de
Supabase y de retirar versiones antiguas públicas de Git; PRIVATE_BANK.md delimita
copias ya descargadas y preguntas que legítimamente ve un alumno.
