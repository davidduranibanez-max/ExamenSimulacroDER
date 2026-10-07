# CEAN
Sistema y simulador de examen para practicar el ingreso a la carrera de Derecho

Para retomar el desarrollo, empezar por [docs/CONTEXT.md](docs/CONTEXT.md).
Las instrucciones para futuras sesiones están en [AGENTS.md](AGENTS.md).
Documentación por tema: [arquitectura](docs/ARCHITECTURE.md),
[banco e incisos](docs/QUESTION_BANK.md) y [verificación](docs/TESTING.md).

## Ejecutar en cualquier computadora

Requiere Node.js 20 o posterior. No hay dependencias que instalar ni compilación.

Desde una terminal situada en la carpeta de este repositorio:

```sh
npm start
```

Abre http://localhost:4173. Para usar otro puerto: `node scripts/serve.mjs 8080`.
También puedes utilizar `python -m http.server 4173` desde la raíz del repositorio.
Mantén el mismo origen (protocolo, host y puerto) para acceder al historial local.
No abras `index.html` directamente: el navegador necesita HTTP para leer los JSON.

## GitHub Pages

Todo es HTML, CSS, JavaScript y JSON estático. Las rutas son relativas y funcionan
bajo `https://usuario.github.io/CEAN/` y bajo un dominio propio. No hay rutas de
servidor ni secretos. Se inicializa un cliente externo de Supabase con configuración
pública; el acceso se valida con Supabase Auth y el historial sigue siendo local. `.nojekyll` permite servir los archivos
directamente.

Cuando quieras publicar, sube los cambios y selecciona **Settings → Pages →
Deploy from a branch → main → /(root)** (o la rama que utilices). GitHub ejecuta automáticamente la publicación de Pages; no necesitas escribir
un workflow propio. El usuario publicó la primera versión. Los cambios de esta
actualización se prepararon localmente, sin push ni despliegue del asistente.

## Banco de preguntas e incisos

Se extrajeron las **2.018 preguntas y respuestas** del PDF proporcionado por el
docente. La numeración original y la página del PDF se conservan. Hay ocho materias.

`data/manifest.json` contiene el índice. Cada pregunta tiene un JSON propio, por
ejemplo `data/historia-bolivia/CPU-0001.json`:

```json
{
  "version": 2,
  "id": "CPU-0001",
  "number": 1,
  "page": 5,
  "area": "Historia de Bolivia",
  "question": "Enunciado de la pregunta…",
  "correct": "Respuesta correcta del PDF.",
  "distractors": ["Inciso ficticio 1.", "Inciso ficticio 2.", "…"],
  "review": "pending",
  "difficulty": "target-high",
  "generation": "linguistic-draft"
}
```

Cada registro contiene **100 distractores propios**, almacenados como textos
independientes. No hay referencias a respuestas de otras preguntas ni un catálogo
compartido. Se generaron **201.800 candidatos** mediante mutaciones lingüísticas,
numéricas y familias de conceptos. **Son borradores, no un banco de alta dificultad
validado.** Revisa gramática, pertinencia, posibles equivalencias y que solo la
respuesta de `correct` sea válida. La revisión docente fue reservada por el usuario.

Edita directamente `correct`, `question` o cualquier elemento de `distractors`.
Después de revisar una pregunta, cambia `review` a `approved` y ajusta `difficulty`
si corresponde. El simulador admite entre 4 y 100 distractores; el control del banco
de esta versión comprueba que se mantengan los 100 solicitados.

Los intentos ya guardados conservan una copia de sus preguntas y opciones: una
edición posterior del banco no cambia sus resultados. El navegador solo descarga
los archivos de las 100 preguntas seleccionadas, con ocho solicitudes simultáneas.

Cada nuevo intento hace tres sorteos con `crypto.getRandomValues`:

1. 100 preguntas distintas del banco completo.
2. Cuatro distractores distintos de los 100 propios de cada pregunta.
3. El orden de A–E, incluida la posición de la respuesta correcta.

Se usa Fisher–Yates y muestreo sin sesgo de módulo. Reanudar conserva el sorteo.
La selección global no impone cuotas por materia; no se proporcionaron esas cuotas.

## Perfiles e historial

El acceso usa **correo + contraseña de Supabase Auth**. Solo entran cuentas
existentes con correo confirmado. El registro público está desactivado en el
proyecto y no hay formulario de alta. Las cuentas se gestionan en **Supabase →
Authentication → Users**; al crearlas se puede marcar **Auto Confirm User** y
asignar una contraseña individual. No se necesitan códigos por correo ni SMTP.

El formulario llama a `signInWithPassword`; al entrar y al recargar se consulta
`getUser` para verificar la sesión contra el servidor. La sesión se mantiene en
sessionStorage por pestaña y el SDK renueva sus tokens. **Salir** cierra esa sesión.
Si falla el servicio, el acceso queda bloqueado; no se recurre a credenciales locales.

Los nombres DavidDuranIbañez y SoledadMachaca y sus claves locales anteriores ya no
permiten entrar. Esas cuentas no se crean automáticamente en Supabase: deben existir
allí con correo y contraseña. El historial usa el UUID remoto estable de cada cuenta,
con la clave `supabase:<UUID>` en IndexedDB. Web Locks evita modificar el mismo
examen desde dos pestañas al mismo tiempo.

Los perfiles e historiales anteriores se conservan intactos en el navegador,
pero no se vinculan automáticamente a un correo: es necesario definir esa migración
para evitar asignar datos a la persona equivocada. El archivo antiguo de perfiles
ya no se descarga ni se usa para autorizar el acceso.

Los exámenes y las estadísticas siguen guardándose **solo en este dispositivo**;
no hay sincronización entre equipos ni panel docente remoto. Se pueden exportar
copias JSON. Borrar los datos del sitio elimina el historial local. El banco y
las respuestas continúan siendo archivos públicos en GitHub Pages: Supabase Auth
verifica la cuenta, pero no vuelve privados los archivos estáticos.

El progreso se guarda después de cada interacción y cada cinco segundos. Cada nuevo
examen dura **60 minutos**, desde su inicio. El plazo continúa al salir, cambiar de
pestaña o recargar; al agotarse, se corrige automáticamente. Si el navegador estaba
cerrado, el resultado se guarda al volver a abrir el perfil. Los intentos antiguos
en curso reciben al reanudarse el resto de la hora, descontando su tiempo activo
ya guardado; se identifican como registros parciales. Las preguntas se pueden responder en cualquier
orden, marcar, borrar y revisar. Al terminar, las correctas aparecen en verde, las
incorrectas en rojo y las pendientes en ámbar. Las pendientes no cuentan como aciertos.

## Mis estadísticas

La navegación incorpora **Mis estadísticas**, con media, mediana, varianza,
desviación estándar, mejor puntuación, cambio desde el primer intento y tiempo
medio hasta responder. Cada indicador tiene una ayuda con `?`, disponible al pasar
el mouse, enfocar con teclado o tocar en celular.

Incluye serie temporal por fecha, progreso por número de intento con media móvil
de tres rondas, distribución de puntuaciones, frecuencia por día, gráficos de
correlación, aciertos por día y hora y desglose por tramo del temporizador.
Los gráficos tienen detalles interactivos y tablas con los datos originales.
La correlación no se calcula cuando faltan observaciones o las variables no varían.

Cada pregunta conserva sus visitas y un evento por selección, cambio o borrado:
instante en milisegundos, fecha/hora y desplazamiento UTC locales, tiempo visible,
minuto transcurrido y tiempo restante. Se separa el tiempo hasta la respuesta final
del tiempo visible total. No se fabrican tiempos para historiales anteriores.
Todo se calcula sobre el historial del perfil, en el navegador, sin subir datos.

Detalles de medidas, esquema y migración: [docs/ANALYTICS.md](docs/ANALYTICS.md).

## Diseño y accesibilidad

Interfaz adaptable a PC y celular, mapa lateral en PC y desplegable en celular.
Fuentes normales, geometría pixelada y fondo con el Juego de la Vida de Conway,
con controles de pausa y reinicio. Respeta la preferencia de movimiento reducido.
La interfaz no depende de fuentes remotas, imágenes ni bibliotecas de interfaz.
La conexión a Supabase carga su SDK desde un CDN y necesita Internet. Si falla,
se muestra un error de acceso y se conservan los datos locales. Alcance y configuración: [docs/SUPABASE.md](docs/SUPABASE.md).

Se consultó la skill Pixel Art Sprites de omer-metin/skills-for-antigravity:
https://skills.sh/omer-metin/skills-for-antigravity/pixel-art-sprites
La copia de la skill se encuentra fuera del repositorio, en la carpeta de trabajo.

## Comprobaciones

```sh
npm run check
npm test
```

El primer comando valida los 2.018 JSON, sus IDs, los 100 distractores y los tamaños.
Las pruebas cubren sorteos, posiciones correctas, corrección, reanudación y reglas
del Juego de la Vida, plazos, eventos de respuesta, compatibilidad con intentos
antiguos y cálculos estadísticos. La validez pedagógica requiere revisión humana.

`scripts/import-bank.py` conserva el procedimiento de extracción y generación.
Requiere Python y `pypdf` **solo si deseas regenerar el banco**, nunca para ejecutar
el sitio. El PDF original se conserva intacto y no se incorpora al repositorio.
La regeneración escribe en `tmp/importado`, para revisar antes de reemplazar `data`.
