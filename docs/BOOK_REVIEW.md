# Revisión de filosofía y ética

Edición local: 12 de octubre de 2026. Activación en Supabase pendiente.

## Lectura mínima

El procedimiento completo y los materiales docentes están fuera del repo:

    ../banco-privado/revision-libros-2026-10-12/LEEME.md
    ../banco-privado/revision-libros-2026-10-12/PRUEBAS.md

Para un ID, consultar su JSON vigente y su justificación privada. No publicar
preguntas, claves, originales, textos extraídos de libros ni SQL de datos.

## Alcance y método

245 preguntas de filosofía (CPU-1484…CPU-1728) y 77 de ética (CPU-1729…CPU-1805).
Cada registro guarda 100 distractores propios; 32200 en esta edición.
Las otras 1696 preguntas, incluida la edición constitucional, quedan intactas.

Los enunciados se amplían para exigir que todas las afirmaciones del inciso sean
correctas. Cada opción combina la identificación original con cuatro distinciones
de su contexto; cada distractor cambia una o dos condiciones conceptuales.
La clave previa se conserva en sourceRecord y los 322 originales completos se
respaldan. Se conserva numeración, materias y el sorteo de cuatro incisos A–E.

Hay contrastes entre métodos, categorías y teorías cercanas. La generación combina
contrastes editoriales; no representa 32200 redacciones manuales independientes.
Los textos finales se almacenan en cada JSON. No se añade catálogo compartido ni
se entrega el banco completo al navegador.

review permanece pending y difficulty target-high: la comprobación técnica no
certifica dificultad, validez semántica ni aprobación pedagógica de cada opción.

## Referencias y ediciones

- García Morente: PDF facilitado, Lecciones preliminares de filosofía,
  Losada, edición 2004. Se registra página física de PDF y hash.
- Gutiérrez Sáenz: PDF facilitado, Introducción a la ética, Esfinge, 1978.
- La bibliografía del curso, mostrada por el docente, señala México, 2007.
  Se localizó un [registro de octava edición/reimpresión 2007](https://www.scribd.com/document/849652751/Gutierrez-2007-IntroduccionALaEtica).
- Para terminología ausente de 1978 se contrastó una
  [consulta textual de quinta edición, Esfinge 2003](https://pdfcoffee.com/introduccion-a-la-etica-25-pdf-free.html).
  Se documenta como apoyo; no se afirma cotejo íntegro ni paginación de 2007.

Las afirmaciones se atribuyen a la exposición de los autores. Las clasificaciones
históricas de filosofía, intuición, hemisferios y neurosis no se presentan como
consenso científico actual ni como diagnóstico.

## Actualización y compatibilidad

17 bloques SQL privados con transacciones y comprobación del payload anterior.
Abortan ante fila ausente o edición remota distinta; aceptan repetición idéntica.
Conservan active, permisos, Auth y snapshots. VERIFICAR.sql devuelve 322/322/322.
La alternativa TODOS-322.sql reúne la actualización en una sola transacción grande.

La aplicación continúa estática en GitHub Pages y usa las mismas RPC. Commit/push
publica frontend/documentación; la actualización del banco requiere ejecutar SQL
privado en Supabase. No reimportar el CSV completo en una tabla ya poblada.

## Validación y límites

Se comprobó integridad del banco en shell normal WSL y 37 pruebas Node con
aislamiento de pruebas desactivado; las mismas 37 pasan con el runner estándar
de Windows. No se sustituyeron dependencias. Se conservaron los CRLF existentes
y git diff --check pasó con core.whitespace=cr-at-eol, sin cambiar configuración.
La prueba PostgreSQL usa PGlite existente y Node de Windows mediante interoperabilidad
aprobada; no demuestra por sí la ejecución normal, que se verificó por separado.

Se ejecutó el módulo JS real de exámenes contra las funciones SQL reales en una
base temporal: iniciar, responder 30, guardar, recuperar, finalizar 20/100 y
comparar historial/estadísticas después de serialización. Sin claves anticipadas.
También se verificaron 20 sorteos, los 17 bloques, repetición, conflicto, faltante,
bajas y conservación de una sesión anterior. Material privado: verificar-libros.mjs.

No se ejecutó esta migración en Supabase remoto ni se usaron cuentas reales.
No se verificó nuevamente la interfaz visual ni Google OAuth en producción;
no hubo cambios de interfaz, autenticación ni alojamiento en esta tarea.
La activación y la revisión pedagógica permanecen pendientes.
