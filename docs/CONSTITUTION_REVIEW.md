# Revisión constitucional e interfaz de examen

Fecha: 7/10/2026. Preparada y aplicada **localmente**, con actualización Supabase
pendiente de ejecución docente. El docente hace commit/push; no se publicó ni se
ejecutó SQL en el proyecto remoto.

## Lectura mínima para continuar

- Banco privado: ../banco-privado/revision-constitucion-2026-10-07/LEEME.md.
- Una pregunta: JSON vigente en ../banco-privado/data/constitucion/CPU-XXXX.json.
- Su contraste: justificacion/CPU-XXXX.json dentro de la revisión privada.
- No es necesario leer los 327 registros ni el PDF para modificar la interfaz.

## Alcance y fuente

327 preguntas constitucionales CPU-0957…CPU-1283, cada una con exactamente 100
distractores físicos. Las otras 1691 preguntas permanecen byte por byte intactas.
Se conservaron 327 originales completos y procedencia del enunciado/clave en cada
JSON. La fuente es el [texto de la CPE de 2009 del Ministerio de Obras Públicas](https://www.oopp.gob.bo/wp-content/uploads/2021/07/2009-Constitucion-Politica-del-Estado.pdf).

Se amplían enunciados y claves breves para evaluar la regla con condiciones conexas;
la alternativa debe ser verdadera en todas sus afirmaciones. Se corrigen ambigüedades
como idioma oficial único, mínimos numéricos y confusión entre carrera y servicio
público. Reelección se circunscribe expresamente a literalidad de CPE 2009.

El método usa reglas editoriales con contrastes sustantivos y combina uno o dos
errores por inciso. No genera un catálogo común de respuestas ni incorpora
referencias entre preguntas. Las reglas de un mismo artículo pueden coincidir en
registros distintos; cada registro conserva 100 incisos propios. No se afirma que
32700 alternativas hayan sido redactadas individualmente. review permanece pending:
validación técnica y trazabilidad jurídica no equivalen a aprobación pedagógica.

## Actualización privada

Los 17 SQL numerados actualizan sólo payload de registros existentes, conservan
active y abortan si la fila remota difiere del original esperado. Un bloque ya aplicado
se acepta de forma idempotente. Cada bloque tiene su propia transacción. El archivo
alternativo TODOS-327.sql es una transacción única grande. VERIFICAR.sql debe devolver
327 / 327 / 327. No volver a importar CSV sobre la tabla poblada.

No se modifica el esquema, RPC, sorteo, Auth ni historial. Cada nuevo examen recibe
sólo cuatro distractores seleccionados en Supabase, con A–E mezclados. Los snapshots
anteriores permanecen; no se recalifican.

Todo el material con preguntas/claves, justificaciones, originales, PDF y SQL de
datos queda fuera del repo CEAN. El commit/push sólo publica frontend y documentación.

## Interfaz

Retirados el botón Marcar para revisar, su indicador/leyenda de mapa y el aviso
La hora sigue corriendo bajo el temporizador. Borrar respuesta permanece en la fila
Anterior/Siguiente; se elimina la fila extra de herramientas. Temporizador, plazo
remoto, guardado, respuesta seleccionada y finalización roja se conservan.

El campo marked se mantiene en el formato de intentos para compatibilidad con los
registros guardados y las RPC existentes, aunque ya no haya control de marcas.
No borrar ni migrar datos antiguos para eliminar ese campo.

## Verificación

npm run check: publicación sin banco ni secretos; 2018 registros con 100 opciones.
npm test: 37 pruebas pasan. PostgreSQL temporal: actualizar 327 filas, repetir,
conflicto/falta de fila, bajas intactas y snapshot anterior intacto. Veinte sorteos
con el banco constitucional revisado: 100 IDs distintos, cuatro propios y una clave.
La prueba privada audita que las 32700 justificaciones coincidan con los textos.
No certifica automáticamente la validez semántica de cada contraste.

