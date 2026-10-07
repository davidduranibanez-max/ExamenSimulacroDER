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
pública; el acceso se valida con Supabase Auth y los resultados terminados se respaldan en Supabase. `.nojekyll` permite servir los archivos
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

El acceso usa **Entrar con Google**, con una lista de correos autorizados en
Supabase. El alumno elige su cuenta Google; no se le pide ni entrega una contraseña
del simulador. El servidor valida la sesión y comprueba su autorización antes de
mostrar Comenzar. Los correos se pueden importar todos juntos desde CSV.

**Configuración de Google:** seguir [docs/GOOGLE_SETUP.md](docs/GOOGLE_SETUP.md)
para ejecutar el SQL, activar el hook, conectar Google y registrar las URLs exactas.
La clave pública sola no habilita Google. Authentication → Users muestra cuentas;
la lista de acceso es `cean_authorized_emails`, privada para los alumnos.

Cada apertura/recarga pide Entrar con Google. La sesión CEAN vive en memoria;
Google puede recordar su propia sesión. Al volver se canjea el código PKCE y se
comprueba `getUser` + permiso remoto. Si falla cualquiera, el acceso queda bloqueado.
Salir cierra esa sesión. El historial local se identifica por `supabase:<UUID>`.
Los accesos y perfiles locales antiguos no autorizan y sus datos se conservan.

Los **resultados terminados** se respaldan en Supabase y se recuperan al entrar
con la misma cuenta en otro dispositivo; se conserva una copia local. El examen
en curso sigue en este navegador. Activación y acceso docente a los resultados:
[docs/CLOUD_HISTORY.md](docs/CLOUD_HISTORY.md). Si un resultado está pendiente de
subir, borrar datos del sitio todavía puede perderlo. Se pueden exportar copias JSON. El banco y
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

## Descargar rendimiento

En **Mi historial** o **Mis estadísticas**, elegir **Descargar JSON** para el
paquete completo con historial, tiempos y métricas, o **Descargar Excel** para
convertirlo directamente en un XLSX con Resumen, Intentos, Preguntas, Eventos,
Distribución y Correlaciones. El alumno descarga su propio perfil. Cada archivo
refleja el momento de la descarga; puede generar uno nuevo al acumular exámenes.
No instala programas ni usa servicios de conversión. Detalles: [EXPORTS.md](docs/EXPORTS.md).
