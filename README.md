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
servidor, secretos ni APIs externas. `.nojekyll` permite servir los archivos
directamente.

Cuando quieras publicar, sube los cambios y selecciona **Settings → Pages →
Deploy from a branch → main → /(root)** (o la rama que utilices). No hace falta
GitHub Actions. Esta versión se dejó local: no se hizo push ni publicación.

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

Hay dos accesos iniciales solicitados por el docente: **DavidDuranIbañez** y
**SoledadMachaca**. La contraseña es la acordada directamente con el usuario;
no se escribe en este repositorio. Se inicializan en cada navegador nuevo y no
reemplazan usuarios existentes. El acceso acepta ñ y no distingue mayúsculas.

El registro y el acceso son locales. Las contraseñas se derivan con PBKDF2-SHA256,
sal aleatoria y 210.000 iteraciones; no se guardan en texto claro. La sesión utiliza
sessionStorage y los intentos e historial se guardan por perfil en IndexedDB.
Web Locks evita modificar el mismo examen desde dos pestañas al mismo tiempo.

Este acceso **no es autenticación de servidor**: quien controla el navegador puede
modificar los datos; el banco y las respuestas son públicos en un sitio estático.
Los perfiles no se sincronizan entre dispositivos y no existe recuperación de
contraseñas por correo. Usa una contraseña exclusiva. Borrar los datos del sitio
elimina los perfiles e historial. Los botones **Guardar copia** y **Guardar historial**
permiten exportarlos a JSON; esta primera versión no importa esas copias.

El progreso se guarda después de cada interacción y cada cinco segundos. El reloj
mide el tiempo activo sin límite. Las preguntas se pueden responder en cualquier
orden, marcar, borrar y revisar. Al terminar, las correctas aparecen en verde, las
incorrectas en rojo y las pendientes en ámbar. Las pendientes no cuentan como aciertos.

## Diseño y accesibilidad

Interfaz adaptable a PC y celular, mapa lateral en PC y desplegable en celular.
Fuentes normales, geometría pixelada y fondo con el Juego de la Vida de Conway,
con controles de pausa y reinicio. Respeta la preferencia de movimiento reducido.
No depende de fuentes remotas, CDN, imágenes ni bibliotecas de interfaz.

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
del Juego de la Vida. La validez pedagógica requiere revisión humana.

`scripts/import-bank.py` conserva el procedimiento de extracción y generación.
Requiere Python y `pypdf` **solo si deseas regenerar el banco**, nunca para ejecutar
el sitio. El PDF original se conserva intacto y no se incorpora al repositorio.
La regeneración escribe en `tmp/importado`, para revisar antes de reemplazar `data`.
