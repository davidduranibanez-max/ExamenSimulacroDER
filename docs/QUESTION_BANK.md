# Banco e incisos: lectura y edición

**Edición constitucional 7/10/2026:** CPU-0957…CPU-1283 tienen una revisión local
con 100 contrastes normativos por pregunta y desarrollo de enunciados/claves según
CPE 2009. `sourceRecord` conserva procedencia y `constitutionalReview` los artículos;
los 327 originales completos y justificaciones quedan fuera del repo. El apartado
de generación lingüística de abajo describe el banco inicial y las otras materias.
Leer CONSTITUTION_REVIEW.md: activación remota manual pendiente, review=pending.

## Localizar una pregunta

`../banco-privado/data/manifest.json` enumera cada ID, materia y archivo. Los IDs conservan la
numeración del PDF (`CPU-0001` a `CPU-2018`). Para editar una pregunta específica:

```sh
rg --files ../banco-privado/data -g '*CPU-0957.json'
```

Abrir solo el archivo encontrado. No es necesario leer los otros 2.017 archivos.
El campo `page` indica la página física del PDF; `number` es su número de pregunta.

## Esquema v2

Cada JSON es un registro independiente:

| Campo | Uso |
|---|---|
| `version` | 2 |
| `id` | Identificador estable |
| `number`, `page` | Trazabilidad al PDF |
| `area` | Nombre visible de materia |
| `question` | Enunciado |
| `correct` | Texto de la respuesta correcta del banco |
| `distractors` | Array de 100 textos propios, sin referencias |
| `review` | `pending` o `approved` según revisión docente |
| `difficulty` | `target-high` inicialmente; objetivo, no certificación |
| `generation` | `linguistic-draft` para reconocer el origen inicial |

El JSON usa UTF-8. No poner comentarios, comas finales ni múltiples objetos
sueltos. No guardar letras A–E: se asignan de nuevo en cada intento.
Los incisos se guardan en el propio archivo; no existe catálogo compartido.

## Revisión docente

Los 100 candidatos se elaboraron automáticamente a partir de la propia respuesta
y familias de entidades/conceptos, sin extraer respuestas de otras preguntas.
Hay cambios de números, fechas, conceptos y combinaciones. Este método genera
borradores; no garantiza alta dificultad ni exclusividad semántica.

Las respuestas extensas se priorizan como mutaciones de su propio contexto y
combinaciones de cambios sustantivos; las familias generales pueden producir
candidatos poco pertinentes y deben sustituirse durante la revisión docente.

Revisar cada inciso por:

1. Pertinencia al enunciado y plausibilidad para un postulante preparado.
2. Una diferencia sustantiva respecto de la correcta, sin equivalencias.
3. Corrección gramatical, concordancia y datos internos verosímiles.
4. Dificultad: evitar pistas de longitud, categoría, redacción o imposibilidad obvia.
5. Exactamente una respuesta correcta entre la correcta y cualquier grupo de cuatro.

El sistema selecciona cualquier subconjunto de cuatro: una alternativa ambigua
puede aparecer aunque se revisaran otras. Marcar `approved` solamente después de
revisar los 100. El usuario se reservó esta validación como docente. La aplicación
acepta borradores para la primera revisión y prueba del flujo.

Para sustituir un distractor, editar su texto. Para cambiar una respuesta fuente,
registrar el motivo docente; no corregir discrepancias silenciosamente.
Mantener los IDs y actualizar manifest si se agregan o eliminan registros.

## Selección privada

Supabase sortea 100 preguntas distintas, cuatro distractores propios y cinco
posiciones. Entrega enunciados/opciones seleccionadas con correct:null; mantiene
la clave privada hasta corregir al finalizar. No se imponen cuotas por materia.
El alumno no tiene SELECT sobre cean_question_bank ni cean_live_exams. No se
entrega el catálogo ni los 100 distractores al navegador. Un alumno puede copiar
lo que ve; PRIVATE_BANK.md explica las copias antiguas en Git y la activación.

## Extracción y regeneración

`../banco-privado/herramientas/import-bank.py` utiliza pypdf y conserva el PDF original. Filtra encabezados,
pies y límites de área. Recupera preguntas que cruzan páginas. Se corrigieron
espacios de extracción en los números 1053 y 1241. Exige numeración 1…2018 sin
duplicados y respuestas no vacías. El rango de materias corresponde a este PDF.

`../banco-privado/herramientas/distractors.py` conserva la generación inicial reproducible. Las fechas
completas se mutan dentro de días válidos del calendario. Los borradores numéricos
e institucionales siguen requiriendo revisión. No regenerar archivos aprobados.

```sh
python ../banco-privado/herramientas/import-bank.py "RUTA_AL_PDF"
```

El resultado va a `../banco-privado/tmp/importado`; **no reemplaza el banco automáticamente**.
El PDF y pypdf no son necesarios para ejecutar la página.

## Validación técnica

`npm run check` verifica índice, identificadores, materia, páginas, respuestas,
100 distractores, textos únicos y tamaños. Es integridad técnica, no pedagógica.
`../banco-privado/data/informe-importacion.json` registra cantidades y procedencia de los candidatos.

## Importar y actualizar en Supabase

Ver PRIVATE_BANK.md. npm run prepare:bank genera el CSV inicial fuera de CEAN.
Para actualizar un ID, generar su archivo SQL con los tres argumentos (ruta de
banco, salida privada, ID) y ejecutar el UPSERT en SQL Editor. No importar el
CSV completo sobre una tabla ya poblada. Cambiar JSON local no cambia Supabase
hasta aplicar esa actualización. No hacer commits públicos de preguntas/incisos.
