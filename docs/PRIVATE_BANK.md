# Banco privado en Supabase

Preparado localmente el 7 de octubre de 2026. **Activación remota pendiente.**
El docente informó que ejecutó el SQL. Falta importar el banco y comprobar
un examen real; el asistente no ejecutó operaciones en el Supabase real. El docente hace su propio commit y push después de activar y comprobar.
Google, su lista de autorización y la dirección de GitHub Pages se conservan.

## Activación en el proyecto existente

1. En VS Code abrir supabase/private-bank.sql y copiar todo. En Supabase, proyecto
   SimulacroExamenDER, SQL Editor → New query, pegar y pulsar Run. Requiere
   google-access.sql y exam-history.sql, ya ejecutados por el docente. Es seguro
   volver a ejecutar private-bank.sql: no borra banco ni resultados existentes.
2. Table Editor → tabla cean_question_bank → Insert / Import data from CSV.
   Seleccionar ../banco-privado/importacion/cean_question_bank_SUPABASE.csv (fuera de CEAN).
   Tiene las columnas id, payload y active. Usar importación en una tabla vacía;
   una segunda importación de los mismos IDs produce duplicados de clave primaria.
3. En SQL Editor ejecutar: SELECT count(*) FROM public.cean_question_bank WHERE active;
   Debe devolver 2018. Con menos de 100 no se puede comenzar el examen.
4. Probar localmente con npm start y Google: iniciar, responder, salir y continuar;
   finalizar. Table Editor → cean_exam_attempts debe mostrar verification_source=server.
   Otro navegador con la misma cuenta debe recuperar historial y progreso confirmado.
5. Antes del commit: npm run check, npm test y git diff --check. Revisar que los
   cambios quitan data/ y los dos generadores del árbol público. Su copia se conserva
   intacta fuera del repo. Hacer commit/push; Pages sigue main / root.
6. Probar la publicación actual en una ventana nueva. No cambiar callback OAuth,
   proveedor Google, Site URL ni clave pública que ya funcionan.

Si falta SQL, el acceso al examen falla cerrado con un aviso. Si falta importar,
Supabase informa que el docente debe importar el banco. La clave publishable
permite utilizar las funciones, no administrar la base ni hacer la importación.
No publicar una service_role, secret key ni el secreto OAuth de Google.

## Qué queda en cada lugar

| Lugar | Contenido |
|---|---|
| Repositorio público / GitHub Pages | HTML, CSS, JS, biblioteca Excel, SQL sin datos, documentación y cantidades del banco |
| Carpeta local ../banco-privado | JSON originales, herramientas de generación, CSV y SQL de actualizaciones con preguntas |
| Supabase / cean_question_bank | Banco completo y 100 distractores propios por pregunta, sin lectura del alumno |
| Supabase / cean_live_exams | Intento, clave de corrección privada, plazo y progreso confirmado |
| Supabase / cean_exam_attempts | Resultado final inmutable, respuestas, eventos y snapshot corregido |
| Navegador | Copia local y cambios que todavía no se han confirmado en Supabase |

SQL/schema de funciones puede ser público: la protección son permisos del servidor,
no ocultar los nombres de tablas ni la clave publishable. No se usa Storage ni
Parquet; PostgreSQL guarda el banco y los paquetes de intento en JSONB.

## Funciones y garantías

- cean_current_exam devuelve solo el intento activo del UUID autorizado.
- cean_start_exam sortea 100 preguntas distintas, cuatro distractores propios de
  los 100 y las cinco posiciones A–E. Iniciar otra vez devuelve la misma sesión.
- cean_store_progress acepta únicamente respuestas, marcas, posición y métricas.
  Ignora preguntas, claves, dueño y plazo enviados por el navegador. Compara una
  revisión antes de escribir para impedir que otro dispositivo pise el progreso.
- cean_finish_exam corrige con el snapshot privado. Entrega las claves únicamente
  después de finalizar, guarda una fila inmutable y libera la sesión activa.
- Todas comprueban cean_has_access. RLS y revocación de SELECT impiden lectura
  directa del banco y sesiones incluso a alumnos autenticados. anon no ejecuta RPC.
- Una sesión activa por alumno y máximo 20 inicios nuevos por 24 horas. El límite
  reduce extracción masiva, no impide copiar contenido legítimamente recibido.
  El docente puede ajustar el 20 en private-bank.sql si su curso lo requiere.
- Resultado nuevo: serverVerified=true y verification_source=server. Históricos
  importados antes: legacy-client. cean_save_attempt no puede suplantar una sesión
  privada ni establecer el indicador de corrección remota.

## Conexión, tiempos y cambios de dispositivo

El plazo de una hora lo fija y aplica Supabase. Cambiar reloj, JSON o JavaScript
local no amplía el plazo aceptado por el servidor. La pantalla utiliza el reloj
del dispositivo; mantenerlo correcto para que la cuenta regresiva coincida.
Cada cambio se conserva localmente; durante uso continuo se intenta sincronizar
cada 15 segundos. Al salir se fuerza el último guardado y al finalizar se envían
las últimas respuestas antes del plazo. El examen requiere Internet para empezar
y obtener su corrección; no se añade una alternativa local al banco privado.

Al vencer solo se corrige el último progreso recibido a tiempo por Supabase.
Una caída prolongada puede dejar fuera respuestas que existan únicamente en el
navegador. Se conserva una copia y se ofrece exportar; no se asegura recepción de
un guardado al cerrar abruptamente. Cerrar no pausa el plazo. Si no se vuelve a
abrir la web, la sesión vencida permanece pendiente hasta que se solicite finalizar;
no se instaló un proceso programado de corrección en segundo plano.

Un cambio confirmado se recupera al entrar desde otro navegador. Si hay cambios
locales antiguos y el servidor tiene una revisión nueva, se conserva una copia
en recoveryCopies del paquete JSON antes de reanudar la versión del servidor.
Una colisión durante el examen se bloquea; exportar y volver al inicio o recargar.
Web Locks evita dos pestañas editoras del mismo navegador. Las mediciones de
lectura y eventos provienen del navegador: no son certificación contra fraude.

## Edición docente sin publicar preguntas

Editar ../banco-privado/data/<materia>/CPU-XXXX.json. Validar con npm run check:bank.
Para preparar CSV actualizado y SQL de una sola pregunta:

```sh
node scripts/prepare-bank.mjs ../banco-privado/data ../banco-privado/importacion CPU-0957
```

Ejecutar CPU-0957-actualizar.sql en SQL Editor. Su UPSERT actualiza esa pregunta;
no vuelve a importar un CSV completo sobre IDs existentes. Revisar el enunciado,
correcta y los 100 distractores. Los exámenes ya iniciados o terminados conservan
su snapshot y no cambian de nota por una edición posterior. Para retirar una
pregunta usar active=false en el dashboard, sin borrar los intentos.

npm run prepare:bank acepta rutas privadas distintas; rechaza banco o salida
dentro de CEAN y solo publica cantidades en assets/bank-info.json. El frontend
puede clonarse y ejecutarse sin disponer del banco local. La generación Python
original se conserva en ../banco-privado/herramientas, fuera del repo público.

## Lo que esta migración no puede retirar

Las preguntas ya estuvieron en un repositorio público. Quitarlas del commit
nuevo elimina sus URLs del despliegue actual, pero deja datos en commits antiguos,
forks, clones y descargas. **No considerar protegido el banco histórico solo por
este cambio.** No se reescribió Git ni se hizo force push desde esta sesión.

Para retirar el historial accesible del repositorio habría que preparar y revisar
una limpieza de historia Git y resolver el fork existente, o conservar la versión
vieja como archivo privado y publicar un repositorio nuevo con el mismo nombre.
Es una operación aparte; aun así no revoca las copias descargadas por terceros.
Las preguntas nuevas nunca deben entrar en un commit público. Un alumno autorizado
siempre puede copiar las preguntas/opciones que ve y su revisión final.

## Validación realizada

33 pruebas Node; PostgreSQL temporal con roles reales: banco y claves sin SELECT,
RPC sin permiso para anon, aislamiento por dueño, sorteo, revisión de concurrencia,
plazo, corrección idempotente y bloqueo de la RPC histórica para IDs privados.
Prueba aislada Edge con SDK real y backend PostgreSQL temporal: Google, acceso
rechazado, móvil 320 px, recuperación entre navegadores, fallo de red, resultado,
estadísticas y exportaciones, prefijo de Pages y ausencia de solicitudes a data/.
CSV completo comprobado por un lector CSV independiente y comparación de cada JSON.
No equivale a una prueba de carga de 100 alumnos ni a confirmar la activación real.

Si aparece DATA INCOMPATIBLE y columnas _1/_2, retirar el archivo seleccionado
y cargar cean_question_bank_SUPABASE.csv directamente. La vista previa correcta
contiene 2018filas y solamente id/payload/active. No guardar el CSV desde Excel.
