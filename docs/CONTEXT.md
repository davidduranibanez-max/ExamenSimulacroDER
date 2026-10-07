# Contexto breve para continuar

Última actualización: **6 de octubre de 2026**, hora de Bolivia.

## Producto y estado

CEAN es un simulador de examen de ingreso a Derecho. La primera versión funcional
está desarrollada en este repositorio. El usuario creó el commit `bcd1215`
(`Primera actualizacion`) y su clon quedó apuntando a un fork de otra cuenta.
Se restauró el destino original el 6 de octubre de 2026 sin cambiar commits ni archivos.
El usuario hará la publicación en GitHub Pages y revisará los incisos como docente.

## GitHub y cuenta de trabajo

- `origin`: `https://github.com/davidduranibanez-max/CEAN.git`.
- `fork-exsecutor`: `https://github.com/exsecutor000-ship-it/CEAN.git`, referencia conservada.
- `main` sigue `origin/main`. Tras consultar el original, hay **un commit local por subir**
  y ningún commit remoto por integrar. Volver a consultar si pasa tiempo antes del push.
- Autor de próximos commits, solo en este repo: David Durán Ibáñez,
  `davidduranibanez@gmail.com`, correo proporcionado por el usuario.
- Credenciales HTTPS, solo en este repo: username `davidduranibanez-max` y separación
  por ruta (`useHttpPath=true`). El usuario aún debe autenticarse en su cuenta al subir.
- No se hizo push, reescritura de historial ni eliminación del fork en esta reparación.
- Procedimiento de cuentas y remotos: `docs/GITHUB.md`.

El usuario solicitó dos accesos iniciales: **DavidDuranIbañez** y **SoledadMachaca**.
Sus verificadores de contraseña y sales están en `assets/data/profiles.json`.
No documentar ni guardar la contraseña en texto claro. Se importan al abrir el sitio,
sin reemplazar perfiles existentes y con historiales independientes. El acceso admite
letras Unicode, incluida la ñ, y no distingue mayúsculas/minúsculas.

Flujo: **acceso local → landing → examen de 100 preguntas → resultados → historial**.
Hay guardado automático, reanudación, marcado para revisar, borrado de respuesta,
corrección por pregunta, estadísticas por área y exportación JSON.

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
| Perfiles, contraseña, IndexedDB y Web Locks | `assets/js/storage.js` |
| Conway/Canvas | `assets/js/life.js` |
| Índice del banco | `data/manifest.json` |
| Pregunta/incisos específicos | `data/<materia>/CPU-XXXX.json` |
| Extracción del PDF | `scripts/import-bank.py` |
| Propuesta automática de incisos | `scripts/distractors.py` |
| Servidor portable local | `scripts/serve.mjs` |

## Decisiones relevantes

Se usa IndexedDB para el historial para evitar el pequeño cupo de localStorage.
localStorage contiene únicamente perfiles/credenciales derivadas; sessionStorage
mantiene la sesión de cada pestaña. PBKDF2-SHA256 con sal y 210.000 iteraciones.
Es acceso local, sin seguridad de servidor ni sincronización entre equipos.

Los intentos almacenan copias de sus preguntas y cinco opciones, por lo que una
edición del banco no altera un resultado previo. Web Locks impide que dos pestañas
modifiquen el mismo perfil a la vez. El reloj no impone duración de examen.

## Verificación y pendientes

`npm run check`: banco completo, integridad/IDs/incisos/tamaños. `npm test`: siete
pruebas de sorteos, corrección, persistencia lógica y Conway. Prueba de navegador
con Edge: acceso, dos perfiles, dos pestañas, reanudación, 20 aciertos/20 errores/60
pendientes, historial, nueva ronda y móvil. Capturas locales en `test-results/`, ignoradas.

Pendiente del docente: validación y ajuste de los 201.800 candidatos, especialmente
los generados por familia de conceptos y las mutaciones gramaticales.
Pendiente del usuario: publicación en GitHub Pages. No se acordaron duración límite,
cuotas por materia, recuperación de contraseñas ni sincronización.

Leer ARCHITECTURE.md, QUESTION_BANK.md o TESTING.md únicamente según la tarea.
