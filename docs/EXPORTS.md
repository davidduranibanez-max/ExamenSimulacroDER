# Descargas de rendimiento

Actualizado el 7 de octubre de 2026. En **Mi historial** y **Mis estadísticas**:
**Descargar JSON** y **Descargar Excel**, habilitados cuando existe al menos un
simulacro finalizado. Solo exportan el perfil que está autenticado.

## Paquete JSON

`assets/js/performance-export.js` construye el paquete `cean-performance`, versión 2:

- `generatedAt`: fecha de la descarga, epoch UTC en milisegundos.
- `user`: nombre y correo, sin tokens ni contraseñas.
- `backup`: estado observado de sincronización y alcance completed-attempts.
- `profile.history`: todos los exámenes terminados, con preguntas/opciones, respuestas,
  fechas y eventos originales. `profile.active` conserva la copia del examen en curso.
- `statistics`: puntuaciones resumidas, tiempo hasta responder, cambio desde el
  inicio, serie temporal, media reciente, distribución, días, horas, tramos y
  correlaciones. Son valores derivados del historial incluido en ese archivo.

Cada descarga refleja el historial acumulado **en ese momento**; los archivos
descargados anteriormente no se actualizan solos. Se guarda una copia independiente
del perfil para que la exportación no modifique el examen.

En Supabase se mantiene una fila JSONB por examen terminado. El paquete por alumno
se reúne al consultar/descargar; no se reescribe un archivo grande después de cada
respuesta. No se crean archivos dentro del repositorio cuando inicia sesión alguien.
Los permisos y recuperación entre dispositivos siguen en CLOUD_HISTORY.md.

El formato anterior de exportación completa era `{version:1,user,profile}`. Las
exportaciones de un examen activo/individual conservan ese formato. No existe
importación de paquetes ni restauración desde un archivo; no prometer esa función.

## Excel generado directamente

El navegador transforma el mismo paquete a un `.xlsx` real con seis hojas:

| Hoja | Contenido |
|---|---|
| Resumen | Alumno, fecha de descarga, estado del respaldo y métricas con unidades y explicaciones |
| Intentos | Fechas, puntuación, aciertos, errores, pendientes, duración, cobertura y media reciente |
| Preguntas | Las 100 por intento, enunciado, incisos elegidos/correctos y mediciones disponibles |
| Eventos | Cada selección/cambio/borrado, instante UTC, calendario original y tiempos |
| Distribución | Cantidad de exámenes por intervalo de puntuación |
| Correlaciones | Pearson r, observaciones y ausencia de datos cuando corresponde |

Números y fechas son celdas tipadas; fechas mostradas en UTC con milisegundos.
Eventos conserva además epoch UTC y día/hora/desplazamiento original. Celdas vacías
representan datos desconocidos, nunca tiempos inventados. Un intento en curso se
incluye en JSON, pero no entra en las tablas estadísticas del Excel.

Excel es un informe de valores calculados al descargar, no una conexión en vivo
con Supabase ni una herramienta para editar las notas de la plataforma. Cambiar
el Excel no cambia los resultados almacenados. Descargar otra vez actualiza el informe.
Una hoja no puede superar 1.048.576 filas; si se alcanza, la aplicación ofrece el
mensaje para descargar JSON. Archivos grandes consumen memoria del dispositivo.

## Biblioteca y compatibilidad

Se usa SheetJS CE 0.20.3, biblioteca estándar copiada sin modificaciones desde
[su CDN oficial](https://docs.sheetjs.com/docs/getting-started/installation/standalone/).
`assets/vendor/xlsx-0.20.3.js` es el módulo ESM oficial con extensión .js para
compatibilidad MIME con el servidor portable. Licencia Apache 2.0 incluida en
`assets/vendor/SHEETJS-LICENSE.txt`. No editar el código del proveedor a mano.

Carga dinámica solo al solicitar Excel, con ruta relativa. No se envían datos
a SheetJS ni se usa un servicio de conversión externo. No se añadió npm install,
compilación, servidor propio, plugin Office ni cambios en Google/Supabase para
exportar. El módulo ocupa ~1 MB y se sirve desde GitHub Pages. Para el respaldo
remoto sí debe instalarse exam-history.sql.

No se construye ni modifica manualmente XML/ZIP de Office. Se preservan los datos
originales. Los textos del alumno se escriben como texto, no como fórmulas.

## Verificación realizada

29 pruebas Node: paquete independiente sin credenciales, estadística después de
recuperar JSON, XLSX real de seis hojas con números/fechas/acento/eventos correctos,
texto parecido a fórmula conservado como texto y tiempos históricos desconocidos vacíos.
Edge aislado con Supabase simulado: descargas desde estadísticas y móvil, recuperación
en contexto nuevo y Excel bajo el prefijo /ExamenSimulacroDER/.

Archivo descargado de prueba abierto con openpyxl independiente y comprobación de
integridad ZIP solo de lectura; después apertura y guardado de una copia con Excel
nativo en instancia oculta. Archivos de prueba quedan en test-results/ ignorado;
no contienen datos reales del docente/alumnos y no se entregan como informes reales.

## Sesiones privadas y recuperación

El intento nuevo activo tiene correct:null y no exporta claves. Tras finalizar,
JSON/Excel incluyen claves/revisión devueltas por el servidor. profile.recoveryCopies
conserva copias locales desplazadas por una revisión remota distinta; solo en JSON,
no entra en cálculos de nota ni XLSX. Ver PRIVATE_BANK.md para conexión y plazo.
