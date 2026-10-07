# Temporizador y estadísticas personales

## Decisiones de producto

- Registro público retirado del formulario, eventos y módulo de almacenamiento.
  Se conservan las cuentas ya existentes y las dos cuentas iniciales.
- Cada nuevo simulacro dura una hora desde su creación. El plazo no se pausa al
  navegar, ocultar/cerrar la pestaña o cerrar el navegador.
- Al llegar a cero se guarda el resultado automáticamente, aun con pendientes.
  Cuando el sitio estaba cerrado se realiza al volver al perfil, usando la hora
  original de vencimiento. No hay servicio que siga ejecutándose en el servidor.
- Finalizar y confirmar la finalización se muestran en rojo.
- Copia local en IndexedDB y respaldo Supabase de resultados terminados por UUID,
  sin borrar ni recalificar históricos. Google autentica; el banco sigue estático.
  No hay npm install ni proceso de build. Ver CLOUD_HISTORY.md.

## Dos tiempos diferentes

**Duración del examen:** tiempo de calendario consumido desde el inicio, limitado
a 3.600.000 ms. `deadlineAt` queda guardado y no se vuelve a calcular al recargar.
`observedAt` conserva la mayor hora observada para no regalar minutos si el reloj
retrocede durante la sesión. Un sitio estático no puede impedir la manipulación
del reloj/datos del dispositivo; no es un sistema de vigilancia de exámenes.

**Tiempo visible por pregunta:** milisegundos con esa pregunta abierta y el
documento visible. Se mide con `performance.now()`, acumula las visitas y no
incluye otras pantallas o pestañas ocultas. No demuestra atención humana: incluye
la inactividad con el documento visible. Se corta al vencer la hora.

**Tiempo hasta responder:** tiempo visible acumulado en el instante de la última
respuesta que queda seleccionada. El tiempo dedicado después a releer la pregunta
se conserva en el total visible, pero no altera este indicador. Un borrado deja
la pregunta pendiente y excluida de las correlaciones de respuestas.

## Esquema añadido al intento

`schemaVersion: 2`, `timingVersion: 1`, `timingCoverage: complete|partial`,
`timeLimitMs`, `deadlineAt`, `observedAt`, `timingStartedAt`, `startedCalendar`.
Al finalizar: `completedAt`, `durationMs` y `finishReason: manual|timeout`.

Cada elemento de `questionTimes` corresponde al mismo índice de `questions`:

```js
{
  activeMs, firstViewedAt, lastViewedAt,
  events: [{
    kind: 'answer', // o 'clear'
    answer: 0, // índice A–E, o null al borrar
    at, activeMs, elapsedMs, remainingMs,
    localDay, weekday, hour, utcOffsetMinutes
  }]
}
```

Los instantes son epoch UTC en milisegundos. El calendario y desplazamiento UTC se
capturan cuando ocurre el evento, evitando cambiar el día si después el usuario
consulta desde otra zona. El registro de preguntas muestra hora local original,
milisegundos y UTC. La exportación incluye todos los cambios, sin credenciales.

## Compatibilidad y guardado

Historial antiguo: se conserva íntegro; sus puntuaciones entran en las estadísticas,
sus tiempos desconocidos no se estiman. Inicio por día de semana se obtiene del
timestamp antiguo con la zona del navegador, porque no se guardó su zona original.

Intento antiguo en curso: se migra al reanudar y recibe `60 minutos - elapsedMs`
de plazo nuevo. Se marca parcial: no se inventa tiempo por pregunta pasado. Las
selecciones previas sin un evento nuevo no entran en mediciones de respuestas.
La media de tiempo, los promedios por tramo y la correlación tiempo/acierto excluyen
preguntas con cobertura parcial. Sus fechas y respuestas sí quedan en la tabla.

La cola de snapshots serializa los guardados cada interacción/cinco segundos.
Web Locks excluye otros editores del perfil. La finalización escribe el historial y
vacía `active` en una sola transacción. Mientras finaliza se bloquean las respuestas
y las nuevas escrituras periódicas. Si la escritura falla al vencer, se bloquean
las respuestas, se conserva la copia en memoria y se ofrece exportación/reintento.
Cerrar abruptamente puede perder hasta el último intervalo no confirmado.

## Métricas y gráficos

- Puntuación: porcentaje de aciertos (en 100 preguntas equivale a puntos/100).
- Media, mediana, mínimo/máximo y variación del último resultado respecto al primero.
- Varianza **poblacional** (divide por N) y desviación estándar (raíz de varianza).
  Con un intento ambas son cero; no se interpreta como estabilidad demostrada.
- Serie temporal ordenada por finalización, con eje de fechas reales.
- Progreso por orden de intento y media móvil de hasta los últimos tres intentos.
- Histograma: intervalos 0–9, 10–19, …, 90–100, incluyendo ambos extremos.
- Pearson: duración/puntuación, tiempo hasta respuesta/acierto, minuto de respuesta/
  acierto, número de intento/puntuación. Requiere al menos tres pares y variación
  en ambas variables. Se muestra «sin datos suficientes» en lugar de un cero falso.
- Días y horas son categorías: frecuencia de intentos por día; porcentaje de
  aciertos por día/hora local de respuesta. No se calcula Pearson con días numerados.
- Tramos 0–10 … 50–60 minutos, según la última respuesta conservada, con número,
  aciertos y tiempo hasta responder medio. Pendientes fuera de estos grupos.

Correlaciones exploratorias: no prueban causa, y cada ronda tiene preguntas de
dificultad distinta. No se presentan pruebas de significancia ni umbrales oficiales.
Los gráficos de dispersión agrupan posiciones cercanas; el detalle muestra el
número de observaciones y las métricas se calculan sobre los datos originales.

## Responsabilidades y mantenimiento

- `timing.js`: funciones de plazo, visitas, eventos y copia final, comprobables en Node.
- `statistics.js`: cálculos puros; no accede a almacenamiento ni cambia el historial.
- `charts.js`: SVG escapado, puntos enfocables y lectura de detalles.
- `statistics-view.js`: tarjetas, explicaciones, secciones y tablas.
- `app.js`: flujo, reloj, guardado, aislamiento y renderizado de la vista.
- `styles.css`: diseño, gráficos con scroll interno en celular y ayudas accesibles.

No hace falta cambiar versión de IndexedDB: son campos opcionales del valor ya
almacenado. El banco JSON y los sorteos se conservan. `npm test` verifica los nuevos
contratos. Leer este archivo al modificar tiempos, migraciones o métricas.

## Persistencia y descarga actual

El JSON completo conserva la materia prima de todas las métricas. Media, varianza,
distribución, progreso y correlaciones se recalculan con getStatistics(history)
al recuperar el historial. Se comprobó igualdad exacta antes y después de la
sincronización/serialización, incluyendo tiempos, calendarios y revisiones.
EXPORTS.md describe el paquete descargable y sus seis hojas Excel. No duplicar
las métricas en una segunda tabla remota que pueda quedar desactualizada.
