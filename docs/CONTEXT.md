# Contexto breve para continuar

Última actualización: **7 de octubre de 2026**, hora de Bolivia.

## Producto y estado

CEAN es un simulador de examen de ingreso a Derecho. La primera versión funcional
está desarrollada y el usuario la publicó en GitHub Pages el 6 de octubre de 2026.
Se restauró el destino original del clon tras un fork a otra cuenta. El último commit
local observado antes de esta actualización es `2531f44` (`Act 4 supabase mejora 2`).
Ahora hay cambios locales de acceso con Supabase por subir por el
usuario. El asistente no hace push ni publica. La revisión docente sigue pendiente.

## GitHub y cuenta de trabajo

- `origin`: `https://github.com/davidduranibanez-max/CEAN.git`.
- `fork-exsecutor`: `https://github.com/exsecutor000-ship-it/CEAN.git`, referencia conservada.
- `main` sigue `origin/main`. Consultar su estado antes de subir; no asumir que el
  seguimiento remoto está actualizado. La publicación actual es
  `https://davidduranibanez-max.github.io/ExamenSimulacroDER/`; el repositorio remoto
  fue renombrado a ExamenSimulacroDER y GitHub redirige la URL antigua. No cambiar
  remotos automáticamente.
- Autor de próximos commits, solo en este repo: David Durán Ibáñez,
  `davidduranibanez@gmail.com`, correo proporcionado por el usuario.
- Credenciales HTTPS, solo en este repo: username `davidduranibanez-max` y separación
  por ruta (`useHttpPath=true`). El usuario aún debe autenticarse en su cuenta al subir.
- No se hizo push, reescritura de historial ni eliminación del fork en esta reparación.
- Procedimiento de cuentas y remotos: `docs/GITHUB.md`.

## Acuerdo vigente de autenticación: Google (reemplaza el anterior)

El 7 de octubre el usuario autorizó **Entrar con Google** para evitar repartir
contraseñas/códigos y mantener GitHub Pages. Reemplaza expresamente el acuerdo
anterior de correo + contraseña de la conversación compartida, que se leyó completa.
No volver a proponer OTP/SMTP, reparto de códigos ni cambio de alojamiento.

Implementación local: botón Google, PKCE y callback en la misma raíz del sitio,
verificación Auth + RPC `cean_has_access` contra lista privada de correos. Hook
Before User Created restringe las nuevas cuentas a Google y correos permitidos.
Los tokens permanecen en memoria; sessionStorage conserva solo PKCE temporalmente.
No hay contraseñas CEAN ni registro público en la interfaz. Los perfiles locales
anteriores se preservan y no se asignan automáticamente a Google.

**Pendiente remoto:** SQL `supabase/google-access.sql`, hook, proveedor Google con
Client ID/Secret, URLs OAuth y altas Google habilitadas después del hook. No se
modificó Supabase remoto. El docente carga correos en bloque; el script incluye su
correo proporcionado, no inventa los de Soledad/alumnos. Leer GOOGLE_SETUP.md.
No usar Authentication Users como lista de autorización: usar cean_authorized_emails.
El usuario hará commit/push. No afirmar que Google está operativo hasta configurarlo.

Flujo: Google → autorización remota → landing → examen 100 preguntas / 60 minutos
→ resultados / historial / estadísticas. Datos del examen siguen locales, banco
sigue público; no se autorizó migrarlo ni añadir panel docente en este cambio.

## Requisitos vigentes

- HTML/CSS/JavaScript puro, rutas relativas; sin backend, build ni npm install.
- Negro/verde lima, geometría pixelada 2D, fuentes normales.
- Juego de la Vida de Conway real en Canvas, pausa, reinicio y movimiento reducido.
- Selección de 100 preguntas sin repetición; cuatro distractores propios por pregunta;
  sorteo de las posiciones A–E en cada intento. Reanudar mantiene todos los sorteos.
- Banco **JSON independiente por pregunta**. Se descartó Markdown a petición del usuario.
- El usuario rechazó compartir distractores y respuestas entre preguntas.
- Cada pregunta dispone de **100 candidatos propios**; dificultad objetivo alta.
- El usuario revisará después: los **201.800 incisos actuales son borradores de generación
  lingüística**, pendientes de pertinencia, gramática, dificultad y respuesta única.
- Historial local por usuario; versión celular y PC.

## Datos de referencia

Fuente: `Banco de Preguntas CPU Derecho CEAN76212424.pdf`, 195 páginas, proporcionado
por el usuario. El original permanece intacto en su carpeta Downloads, fuera del repo.
Importación: 2.018 preguntas consecutivas CPU-0001…CPU-2018; se conservan página,
enunciado y respuesta de referencia. La extracción corrigió espacios internos en los
números 1053 y 1241 para recuperar ambas preguntas.

| Materia | Preguntas |
|---|---:|
| Historia de Bolivia | 589 |
| Historia Universal Contemporánea | 247 |
| Historia Moderna | 120 |
| Constitución Política del Estado | 327 |
| Régimen Universitario | 200 |
| Filosofía | 245 |
| Ética | 77 |
| Nociones de Derecho | 213 |

El banco final de esta versión ocupa **10,46 MiB**; el JSON más grande tiene 33,2 KiB.
Se seleccionan primero 100 IDs del
índice y luego se descargan sus JSON con ocho solicitudes concurrentes. No se
descarga todo el banco para comenzar.

## Dónde tocar

| Cambio | Archivo |
|---|---|
| Estructura HTML base, cabecera y pie | `index.html` |
| Diseño, responsive, estados | `assets/css/styles.css` |
| Vistas, navegación, eventos y guardado | `assets/js/app.js` |
| Sorteos, corrección, validación de intentos | `assets/js/core.js` |
| Perfiles, IndexedDB y Web Locks | `assets/js/storage.js` |
| Google, callback y permisos remotos | `assets/js/auth.js`, `auth-service.js` |
| Configuración Google/Supabase | `docs/GOOGLE_SETUP.md`, `supabase/google-access.sql` |
| Conway/Canvas | `assets/js/life.js` |
| Plazo persistente y registros por pregunta | `assets/js/timing.js` |
| Cálculos estadísticos puros | `assets/js/statistics.js` |
| Gráficos SVG y detalles interactivos | `assets/js/charts.js` |
| Panel, tarjetas, ayudas y tablas | `assets/js/statistics-view.js` |
| Índice del banco | `data/manifest.json` |
| Pregunta/incisos específicos | `data/<materia>/CPU-XXXX.json` |
| Extracción del PDF | `scripts/import-bank.py` |
| Propuesta automática de incisos | `scripts/distractors.py` |
| Servidor portable local | `scripts/serve.mjs` |

## Decisiones relevantes

Se usa IndexedDB para el historial para evitar el pequeño cupo de localStorage.
`auth.js` usa Google/Supabase; verifica usuario y autorización remota. No lee
claves locales. IndexedDB guarda intentos por `supabase:<UUID>`, sin migración
automática de perfiles anteriores. La autenticación necesita Internet. El banco
sigue en JSON públicos y la persistencia de exámenes sigue local.

Los intentos almacenan copias de sus preguntas y cinco opciones, por lo que una
edición del banco no altera un resultado previo. Web Locks impide que dos pestañas
modifiquen el mismo perfil a la vez. Hay un plazo de una hora que sigue corriendo
al salir; se finaliza automáticamente al vencer o al volver al perfil si estaba
cerrado. Se guardan tiempos y eventos por pregunta, con zona horaria y precisión
de milisegundos. Los historiales anteriores carecen de tiempos detallados y se
excluyen de esas métricas. Los intentos antiguos en curso se migran sin alterar
respuestas y se identifican como parciales. Detalle en `docs/ANALYTICS.md`.

## Verificación y pendientes

**Supabase / SimulacroExamenDER**: Google preparado localmente, ajustes remotos
pendientes en GOOGLE_SETUP.md. SDK real probado en Edge con OAuth/Auth/RPC
simulados, sin usar cuentas reales. SQL comprobado en PostgreSQL temporal con
roles y restricciones. 21 pruebas Node del motor/estadísticas/acceso/CSV pasan.
Detalles en TESTING.md. No se hizo commit/push ni cambios remotos.

Pendiente del docente: validación y ajuste de los 201.800 candidatos, especialmente
los generados por familia de conceptos y las mutaciones gramaticales.
Pendiente del usuario: configurar Google/Supabase y subir esta actualización.
No se acordaron cuotas por materia, recuperación de contraseñas ni sincronización.
La migración de historiales antiguos a UUID remotos también requiere definir sus propietarios.

Leer ARCHITECTURE.md, QUESTION_BANK.md o TESTING.md únicamente según la tarea.
