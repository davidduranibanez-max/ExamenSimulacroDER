# Actualización vigente: respaldo en Supabase (7/10/2026)

29 pruebas Node pasan. tests/cloud-history.test.mjs cubre idempotencia, descarga
exacta en otro dispositivo, paginación (>50), consultas por UUID, fallo/reintento,
rechazo de datos corruptos y preferencia del respaldo confirmado.
PostgreSQL temporal (PGlite fuera del repo): google-access.sql + exam-history.sql
repetidos; RLS entre dos alumnos, bajas/anon, sin escritura directa, correo Auth,
resumen e inmutabilidad. Edge aislado/API simulada: copia local con subida fallida,
reintento sin duplicar, recuperación en contexto nuevo, estadísticas, 320 px,
PKCE, revocación y prefijo Pages. Captura cloud-restored-mobile.png ignorada.
No se escribió en Supabase remoto; validar con una cuenta real después de ejecutar
el SQL nuevo y publicar. Google ya funciona según confirmación del docente.
CLOUD_HISTORY.md reemplaza los apartados históricos de persistencia solo local.

# Verificación

## Vigente: Google + lista privada (7 de octubre de 2026)

Los apartados de correo/contraseña y registro local de abajo son históricos.
El usuario autorizó sustituirlos por Google OAuth. 21 pruebas Node pasan:
motor/estadísticas + validación Auth y permiso remoto, rechazo cerrado, PKCE
sin tokens persistentes e importación CSV normalizada/escapada sin reactivar bajas.

PostgreSQL temporal (PGlite fuera del repo): ejecutar el SQL dos veces; autorización
OAuth; rechazo de login con contraseña, baja e identidad Google con email distinto;
anon sin acceso a RPC; alumnos sin lectura/escritura de la lista ni ejecución del
hook; hook con usuario autorizado, desconocido y proveedor Email. Todo pasó.

Edge aislado/SDK real con OAuth, Auth y RPC simulados: redirección completa PKCE,
canje de código, validación remota, rechazo fuera de lista/RPC ausente/token inválido,
recarga sin tokens, datos antiguos preservados, examen y estadísticas, salida,
cancelación, CDN caído, móvil 390/320 px y callback bajo prefijo Pages.
Captura ignorada `test-results/google-login-mobile.png`.

No se configuró Google remoto ni se crearon usuarios reales. El docente debe
seguir GOOGLE_SETUP.md y probar cuenta autorizada/no autorizada antes del push.
Las pruebas simuladas no certifican el consentimiento real Google ni el hook
instalado en el proyecto remoto. El banco sigue público y no cambió.


## Acceso vigente: Supabase Auth (7 de octubre de 2026)

La autenticación local descrita en las pruebas históricas de este documento fue
sustituida por correo/contraseña en Supabase. Edge aislado cargó el SDK real, con
respuestas Auth simuladas para: rechazo de contraseña, éxito seguido de getUser,
recarga con nueva validación remota, sesión antigua ignorada, token rechazado,
Salir, separación de dos UUID, examen/corrección/estadísticas y móvil 390/320 px.
Se conservaron perfiles e IndexedDB antiguos y no hubo errores JS no capturados.
También se comprobó el formulario móvil y los módulos bajo `/ExamenSimulacroDER/`.
Con CDN bloqueado, el acceso permaneció cerrado y mostró el mensaje de conexión.
Un intento con correo ficticio contra Supabase real fue rechazado como se esperaba.
No se usaron cuentas/contraseñas reales, ni se crearon usuarios o tablas remotas.
Pendiente: el docente debe probar su cuenta existente en localhost antes del push.
Las 13 pruebas Node continúan verificando el motor y las estadísticas.

Comprobación posterior de la publicación del commit `8c1c207` en
`https://davidduranibanez-max.github.io/ExamenSimulacroDER/`: en un navegador
limpio aparece correo/contraseña, sin formulario de username ni acceso al botón
Comenzar. Una sesión local antigua tampoco permite entrar. Auth mantiene email
habilitado y registro público cerrado. Captura local ignorada:
`test-results/published-email-auth.png`. Una sesión Supabase válida todavía se
restaura al recargar; no se obliga a repetir contraseña en cada visita.
Esto no es un control de acceso del alojamiento: index.html y el banco siguen
siendo públicos en GitHub Pages. No se inspeccionó la sesión del Chrome del usuario.

## Comandos portables del repositorio

```sh
npm run check
npm test
npm start
```

No requieren npm install. `check` recorre los JSON sin cargar el PDF. `test` usa
el runner estándar de Node. Ejecutar los checks pertinentes al cambio; no repetir
pruebas amplias si el código no cambió y ya se verificaron.

## Cobertura automatizada

`tests/core.test.mjs` cubre:

- Cien preguntas únicas y cinco opciones, con cuatro distractores propios.
- Variación entre rondas y uso de las cinco posiciones correctas.
- Conteo de correctas, incorrectas y pendientes sin mutar el intento.
- Copia/reanudación exacta e índices inválidos.
- Rechazo de bancos incompletos, duplicados y distractores iguales a la correcta.
- Límites del generador aleatorio.
- Oscilador de Conway que vuelve al estado inicial en dos generaciones.

## Prueba de navegador realizada el 6 de octubre de 2026

Navegador: Edge en modo headless mediante Playwright del runtime local. Contexto
aislado y desechable: no se modificaron perfiles reales del usuario.

Se probó registro y acceso, inicio, 100 círculos y cinco radios; 20 respuestas
correctas, 20 incorrectas y 60 pendientes; marcado; salida y recarga; reanudación
con las mismas preguntas/opciones/respuestas; bloqueo de una segunda pestaña;
confirmación de pendientes; resultado 20/100 y colores; filtros; historial;
segunda ronda con nueva selección y opciones; y perfil distinto sin historial ajeno.

Se comprobó además acceso con **DavidDuranIbañez** y **SoledadMachaca**, incluyendo
la ñ y rechazo de contraseña incorrecta. Los perfiles de prueba solo existieron en
el contexto desechable; los dos perfiles iniciales se crean en el navegador del
usuario al cargar o actualizar la página.

Se verificó ausencia de desbordamiento horizontal a 1440, 390 y 320 px. Hubo
capturas de acceso, landing, examen y resultados en `test-results/` (gitignored),
inspeccionadas visualmente. No se detectaron errores de JavaScript en ese recorrido.

La prueba de navegador usa un script local fuera del repo y Playwright del entorno;
no introduce dependencias de ejecución en la página. Para automatizarlo en otra
computadora, añadir Playwright como dependencia de desarrollo en una tarea posterior,
o repetir el recorrido manual descrito debajo.

## Recorrido manual mínimo después de cambios de flujo

1. Abrir localhost y entrar con una cuenta existente; no debe aparecer registro.
2. Comenzar; comprobar 100 preguntas, cinco opciones y navegador de círculos.
3. Responder, cambiar, borrar y marcar; navegar a preguntas lejanas.
4. Volver al inicio, recargar y continuar; comprobar que nada se remezcló.
5. Abrir otra pestaña con ese perfil; verificar que bloquea la edición simultánea.
6. Finalizar con pendientes; confirmar resultado y respuestas señaladas.
7. Abrir historial, exportar una copia y revisar una ronda anterior.
8. Comenzar otro intento; comprobar variación y que el anterior sigue íntegro.
9. Entrar con un segundo perfil; comprobar historial separado.
10. Repetir a 390 y 320 px, incluida apertura del mapa móvil y preguntas largas.

Para GitHub Pages, servir la carpeta padre y abrir `/CEAN/` antes de publicar.
Verificar módulos, CSS, favicon y JSON bajo ese prefijo. Confirmar que el sitio no
requiere recursos con rutas absolutas ni una API de backend.

La prueba final confirmó acceso y descarga de las 100 preguntas bajo
`http://localhost:4180/CEAN/`; CSS, módulos y JSON se resolvieron correctamente.

## Límites de esta verificación

No certifica dificultad, corrección jurídica, ambigüedad ni pertinencia de los
201.800 candidatos. Eso corresponde al docente. Tampoco confirma publicación en
GitHub Pages; esta entrega es local. No se probó recuperación/sincronización porque
no existen esos servicios en esta versión.

## Actualización: temporizador y estadísticas (6 de octubre de 2026)

`tests/analytics.test.mjs` añade seis pruebas (13 en total): plazo fijo a través de
recargas, rechazo de respuestas fuera de tiempo, hora final exacta del vencimiento,
selecciones/cambios/borrado, tiempo visible por pregunta, reloj que retrocede,
migración de intentos antiguos, medianas/varianza/Pearson/histograma con valores
conocidos y combinación de históricos sin inventar tiempos ni mutarlos.

Prueba Edge/Playwright, con reloj simulado y contextos desechables: acceso sin
registro, 60 minutos, tiempos y cambios, reanudación/recarga, dos pestañas,
finalización manual y automática, vencimiento fuera del examen y archivado al
volver, historial antiguo, gráficos, ayudas con mouse/teclado/toque, aislamiento
de David/Soledad y responsive 1440/390/320 px. Repetida bajo `/CEAN/` para comprobar
las rutas relativas. Se simuló una pestaña oculta para excluir su tiempo de lectura
y un fallo de guardado al vencer: respuestas bloqueadas, reintento exitoso e
historial sin duplicados. No se tocaron datos del navegador personal del usuario.
Capturas `test-results/analytics-*.png`, inspeccionadas visualmente.

## Conexión inicial a Supabase (7 de octubre de 2026)

La URL y clave publishable respondieron HTTP 200 en `/auth/v1/settings`:
correo habilitado, registro desactivado. Edge headless en un contexto desechable
cargó el SDK real desde jsDelivr y creó el cliente con la URL esperada. En otra
prueba se bloqueó el CDN: la promesa devolvió `null` y tanto acceso local como
Mis estadísticas siguieron disponibles. Sin errores no capturados de JavaScript.
Pasaron las 13 pruebas Node, la revisión de sintaxis de los dos módulos nuevos
y `git diff --check`. El script de navegador es local, fuera del repositorio.
No se verificaron autenticación remota ni guardado de exámenes en Supabase:
esas funciones todavía no están implementadas. No se tocaron usuarios ni tablas
remotas, ni los datos del navegador personal.

Manual: comprobar que el reloj baja; seleccionar y cambiar respuestas; salir y
volver sin reiniciar la hora; al finalizar entrar en Mis estadísticas, abrir las
ayudas, pasar por los puntos y desplegar tablas de intentos y preguntas. Comprobar
el botón rojo en PC y móvil. Los históricos que no registraban tiempos muestran
«sin registro». El banco no cambió en esta actualización.

## Cambio local: pedir acceso en cada apertura o recarga

Se desactivó la persistencia de Auth y el arranque muestra siempre el formulario.
Edge/SDK real con respuestas Auth simuladas comprobó recarga con petición de
credenciales, contraseña incorrecta, token rechazado, examen, estadísticas,
UUID distintos, datos antiguos conservados, fallo de CDN y móvil/prefijo Pages.
Se mantiene la prueba de rechazo real con una cuenta inexistente en Supabase.
Estas comprobaciones no usaron credenciales reales ni cambiaron usuarios remotos.
La conversación compartida completa confirmó que no se debe añadir OTP ni cambiar
hosting. Los detalles anteriores de sesiones restauradas describen la versión
publicada antes de este cambio local, no el comportamiento nuevo.

## JSON y Excel (7/10/2026)

29 pruebas Node pasan. La prueba cloud-history reconstruye las estadísticas exactas
tras serializar tres intentos completos y sus eventos. performance-export verifica
paquete sin credenciales, XLSX real tipado, textos sin ejecución de fórmulas y
registros antiguos sin tiempos inventados. Descargas Edge de JSON/Excel funcionan
en estadísticas, móvil y prefijo Pages. openpyxl abrió las seis hojas y el paquete
pasó integridad ZIP de lectura; Excel nativo abrió y guardó una copia VALIDADO.
Muestras ficticias ignoradas en test-results. Procedimiento y biblioteca: EXPORTS.md.
