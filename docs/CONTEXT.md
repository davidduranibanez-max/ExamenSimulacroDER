# Contexto breve para continuar

Última actualización: **7 de octubre de 2026**, hora de Bolivia.

## Estado vigente

**Revisión constitucional (7/10/2026):** 327 preguntas locales con 100 incisos cada
una, originales conservados, fuentes CPE 2009 y justificaciones privadas. Se amplían
preguntas para evaluar condiciones normativas completas. Aprobación docente pendiente.
**Supabase aún usa su banco anterior hasta que el docente ejecute los SQL privados.**
Leer CONSTITUTION_REVIEW.md y el LEEME privado; no importar CSV ni publicar esos SQL.
Examen sin Marcar para revisar ni aviso bajo el reloj; Borrar respuesta pasa a la
fila de navegación. marked se conserva en datos antiguos por compatibilidad.

**Interfaz actual (7/10/2026):** «Simulador de Examen», silueta del logo CEAN con
verde del tema, cabecera fija de menor altura y tarjetas/examen compactos.
Serie temporal con puntos por fecha y tendencia local LOESS, calculada desde el
historial sin modificar notas ni almacenamiento. Leer INTERFACE.md y ANALYTICS.md.
El docente dijo que aparentemente resolvió el acceso del nuevo correo; pendiente
su explicación, sin cambios en Auth/lista/permisos remotos en esta actualización.

CEAN / ExamenSimulacroDER es HTML/CSS/JS estático servido por GitHub Pages.
El usuario confirmó Google OAuth con Supabase y ejecutó exam-history.sql.
Último commit local observado: 0798f76 (Act backend completo). El docente hace
su propio commit/push. El asistente no publicó ni cambió la historia Git.

**Cambio actual preparado localmente:** banco completo fuera del repositorio,
sorteo/corrección/progreso por funciones Supabase, sin claves en el examen activo.
El docente ejecutó private-bank.sql y compartió el 7/10/2026 a las 16:52 Bolivia
una fila real en cean_exam_attempts con verification_source=server. Confirma que
la importación permite iniciar/corregir un examen privado. No confirmó el conteo
total de 2018 ni recuperación real en otro navegador. Procedimiento: PRIVATE_BANK.md.
El historial Git anterior y el fork todavía contienen el banco antes público;
retirar archivos actuales no limpia esas copias. No hacer force push sin autorización.

## Acuerdo de acceso y alojamiento

Google → verificación Auth + cean_has_access → landing → examen → resultados.
Mantener GitHub Pages; no cambiar de hosting ni añadir correo/contraseña local,
OTP, SMTP o reparto de códigos. Correos permitidos en cean_authorized_emails;
Authentication Users es el registro de identidades, no la lista de autorización.
Hook Before User Created restringe Google/nuevas cuentas a correos permitidos.
Tokens en memoria, PKCE temporal en sessionStorage; recargar pide Google.
No publicar secretos Google ni claves de administración. Configuración existente
publicable en assets/js/supabase-config.js; SDK 2.117.2 con cliente compartido.

## GitHub y trabajo

- Repo local CEAN; origin antiguo https://github.com/davidduranibanez-max/CEAN.git
  redirige al repo renombrado. No modificar remotos automáticamente.
- Web: https://davidduranibanez-max.github.io/ExamenSimulacroDER/.
- main sigue origin/main; consultar estado antes de subir.
- fork-exsecutor conserva referencia https://github.com/exsecutor000-ship-it/CEAN.git.
- Autor local David Durán Ibáñez, davidduranibanez@gmail.com. Cuentas/remotos: GITHUB.md.
- Node >=20, cero npm install/build. npm start → localhost:4173. Rutas relativas.

## Requisitos

- PC/celular, 2D pixelado con fuentes normales, negro/verde, Conway real detrás.
- 100 preguntas únicas del total de 2018 por intento; cuatro distractores sorteados
  entre 100 propios por pregunta y correcta en posición A–E aleatoria.
- Banco JSON editable privado; respuestas fuente del PDF conservadas. 201800 incisos
  son borradores de generación, pendientes de revisión docente de alta dificultad.
- Sesión de 60 minutos fijada por servidor; guardado local y remoto cada 15 segundos,
  reanudación, revisión verde/roja y finalizar rojo. Después del plazo solo cuenta
  el progreso recibido por Supabase a tiempo. Necesita conexión para comenzar/corregir.
- Historial por UUID, estadísticas con series/media/variabilidad/distribución/Pearson,
  ayudas accesibles y tiempos/eventos por pregunta. No inventar mediciones antiguas.
- Paquete JSON v2 y XLSX real de seis hojas, biblioteca SheetJS local y diferida.
- Aproximadamente 100 alumnos. Plan Free sin compra de recursos; vigilar tamaño/egress.

## Ubicación de los datos

JSON originales intactos: ../banco-privado/data/manifest.json y archivos por materia.
CSV inicial: ../banco-privado/importacion/cean_question_bank_SUPABASE.csv. Generadores Python:
../banco-privado/herramientas. Estos archivos están fuera de la raíz servida/repo.
Frontend solo assets/bank-info.json con total y materias. npm run check controla
el árbol público y, si está disponible, la integridad del banco privado.

Supabase: cean_question_bank y cean_live_exams sin acceso directo al alumno;
cean_current_exam/start_exam/store_progress/finish_exam validan permiso, dueño,
revisión y plazo. Correctas solo después de finalizar. cean_exam_attempts con
RLS por dueño, immutable y verification_source=server para nuevos intentos.
Históricos legacy-client conservados; no son notas certificadas. IndexedDB guarda
copia local, cambios pendientes y recoveryCopies ante colisiones entre dispositivos.

## Lectura progresiva

| Necesidad | Documento / módulo |
|---|---|
| Activar banco privado y límites | PRIVATE_BANK.md, supabase/private-bank.sql |
| Auth Google/lista | SUPABASE.md, GOOGLE_SETUP.md, auth.js / auth-service.js |
| Arquitectura / guardado | ARCHITECTURE.md, storage.js / remote-exam.js |
| Resultados/nube | CLOUD_HISTORY.md, cloud-history.js |
| Banco / edición | QUESTION_BANK.md, scripts/prepare-bank.mjs |
| Tiempo y estadísticas | ANALYTICS.md, timing.js / statistics.js / statistics-view.js |
| JSON / Excel | EXPORTS.md, performance-export.js; no editar vendor |
| Verificaciones | TESTING.md |

No leer todo el banco ni el PDF para cambios de UI. Localizar solo el ID necesario.
33 pruebas Node pasan. Backend probado en PostgreSQL temporal con roles, y flujo
Edge aislado con datos ficticios; activación en Supabase real todavía pendiente.
No se hizo prueba de carga de 100 conexiones. Fuente de 195 páginas intacta en Downloads.

## Corrección de importación CSV (7/10/2026)

La captura del docente mostró DATA INCOMPATIBLE, columnas vacías _1… y 2019filas.
El CSV seleccionado tenía encabezados extra; se conservó intacto. Se generó
cean_question_bank_SUPABASE.csv desde los JSON originales, sin fila vacía final.
PapaParse confirmó 2018filas, tres columnas y cero errores; Python verificó
igualdad completa con originales. Cargar directamente, sin guardar desde Excel.

## Fecha UTC confirmada en resultado real (7/10/2026)

El docente mostró received_at=2026-10-07 20:50:08.922318+00 y origen server.
Ese instante equivale a 16:50:08 del 7/10/2026 en America/La_Paz. Se revisó la
captura guardada y la conversión con Intl.DateTimeFormat. received_at es la hora
de recepción del resultado, no el inicio ni la finalización del examen. No hay
error de cuatro horas: conservar timestamptz/epochUTC; la interfaz ya muestra zona
local del navegador y las hojas Excel documentan UTC. No cambiar el reloj de DB.
La fila server confirma un resultado real; el conteo total del banco y prueba de
recuperación en otro navegador siguen sin confirmación explícita.
