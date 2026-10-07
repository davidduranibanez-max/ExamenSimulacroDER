# Respaldo de resultados en Supabase

Implementado localmente el 7 de octubre de 2026 para aproximadamente 100 alumnos.
Google ya funciona según la confirmación del docente. El 7/10/2026 a las 02:41
(Bolivia) confirmó la ejecución del SQL nuevo con una captura de Success. No rows
returned. Falta confirmar la publicación de estos archivos y el respaldo real de
un resultado. El docente hace su propio commit/push.

## Activación: una sola vez

1. Abrir `supabase/exam-history.sql`, copiar todo su contenido.
2. En el mismo proyecto Supabase: **SQL Editor → New query**, pegar y pulsar **Run**.
   Debe devolver `Success. No rows returned`. Guardar la consulta es opcional;
   ejecutar Run sí es necesario. Requiere `google-access.sql` ya instalado.
3. Hacer commit y push de los archivos del proyecto. No modificar las URLs Google,
   las claves ni el proveedor que ya funcionan.
4. Entrar con Google, terminar un examen y esperar el aviso **Resultados respaldados
   en Supabase**. En otro navegador, entrar con la misma cuenta y abrir Mi historial.
5. Para ver los alumnos: **Table Editor → cean_exam_attempts**. Cada fila contiene
   correo, fechas, aciertos, duración y el examen completo con respuestas/eventos.
   Solo el administrador del proyecto ve todos los alumnos desde el dashboard.

Si aparece «el docente debe ejecutar exam-history.sql», el guardado local sigue
funcionando; falta instalar la tabla/RPC. No otorgar acceso a anon para solucionarlo.

## Qué se guarda y cuándo

- Durante el examen: IndexedDB después de cada interacción y cada cinco segundos.
  El intento en curso **no se sincroniza entre dispositivos**.
- Al finalizar o archivar por vencimiento: primero se confirma la copia local,
  luego se sube una fila por intento a Supabase. Incluye las 100 preguntas, sus
  cinco opciones, respuestas y tiempos; no los 100 distractores completos.
- Al entrar: se descarga el historial del UUID Google y se une al local sin duplicar.
  Los historiales locales anteriores del mismo UUID también se respaldan. No se
  asignan perfiles viejos de username a cuentas Google automáticamente.
- Las estadísticas se recalculan con el historial combinado. No se duplica una
  tabla de estadísticas ni se vuelve a enviar el historial en cada respuesta.
- Si falla Internet, falta SQL o se agota la cuota: se conserva el resultado local
  y se muestra **Respaldo pendiente**. Botón **Sincronizar historial**, evento online
  y reintento cada minuto mientras la sesión sigue abierta. Si se cierra antes de
  subir, al volver a entrar se reintenta desde IndexedDB.
- Cambiar de navegador recupera solo lo que Supabase confirmó. Limpiar el navegador
  antes de subir pierde los resultados pendientes y el examen en curso.
- **Sincronizar historial** también busca resultados nuevos hechos en otro dispositivo.

## Seguridad y límites

RLS permite SELECT solo al UUID autenticado autorizado; anon no tiene acceso.
Los alumnos no tienen INSERT/UPDATE/DELETE directo. `cean_save_attempt` obtiene
el dueño y correo de Auth, comprueba `cean_has_access`, valida forma/tamaño y
calcula el resumen de aciertos. La clave pública existente es suficiente para
llamar la RPC, no para administrar tablas ni otros usuarios. No introducir secretos.

La clave primaria `(user_id,id)` evita duplicados. Un resultado ya recibido es
inmutable para el alumno: los reintentos devuelven la copia recibida originalmente.
Una respuesta de red tardía se une al historial en una transacción IndexedDB sin
sobrescribir el examen en curso. Descargas paginadas de 50 filas, filtradas por UUID.
Las solicitudes tienen un plazo de 15 segundos; SDK y memoria reutilizados.

El límite por intento es 512 KiB. Un exceso conserva la copia local, pero no sube;
exportar el JSON para investigar. Es un respaldo para práctica, **no una certificación
de calificaciones**: preguntas/correctas/eventos vienen del navegador y pueden
manipularse. RLS protege separación entre alumnos, no autenticidad de mediciones.
El banco sigue público. No hay presencia en vivo ni panel docente propio.
Eliminar un usuario de Auth elimina sus filas por cascada; exportar antes.

## Plan gratuito y capacidad

Según [precios oficiales](https://supabase.com/pricing), consultados el 7/10/2026:
$0/mes, 500 MB de base de datos por proyecto, 50.000 usuarios activos mensuales,
5 GB de transferencia saliente sin caché y otros 5 GB con caché, 1 GB de archivos,
dos proyectos activos y solicitudes API sin cuota numérica. Recursos y límites
de uso siguen aplicando. No se necesita Storage de archivos para este respaldo.

Muestra del banco real, 100 preguntas y 100 eventos: JSON UTF-8 de 83.081 bytes
(~81 KiB). Para 100 alumnos:

| Intentos por alumno | Total intentos | JSON aproximado sin compresión |
|---|---:|---:|
| 10 | 1.000 | 83 MB |
| 20 | 2.000 | 166 MB |

Son estimaciones, no cupos garantizados: longitud de preguntas, cambios de respuestas,
compresión JSONB, índices, Auth y otras tablas alteran el consumo. Una base nueva ya
ocupa aproximadamente 40–60 MB. Supervisar el uso desde el dashboard; al superar
500 MB Free puede pasar a solo lectura. Fuente: [tamaño de base y disco](https://supabase.com/docs/guides/platform/database-size).

Una descarga completa de 20 intentos ronda 1,7 MB de JSON por alumno. La interfaz
descarga al entrar o al solicitar una actualización, no cada cinco segundos.
El historial acumulado también consume transferencia: observar **Usage**.

Free puede pausarse tras una semana sin actividad y no incluye backups automáticos.
Mantener exportaciones JSON y respaldos administrativos de la base. No activar Pro
ni complementos para esta instalación; Pro empieza en US$25/mes. Si el plan gratuito
restringe el servicio, la aplicación no compra recursos: mantiene la copia local y
avisa del respaldo pendiente.

## Verificación

29 pruebas Node: motor, tiempos, Auth y sincronización (idempotencia, aislamiento de
consultas por UUID, paginación, reintento y rechazo de datos corruptos).
PostgreSQL temporal: ambos SQL repetidos, RLS entre dos alumnos, anon/bajas bloqueados,
escritura directa denegada, correo obtenido del servidor y resultados inmutables.
Edge aislado con SDK real y API simulada: fallo al subir, recuperación manual,
sin duplicados, navegador nuevo, estadísticas, móvil 320 px y prefijo Pages.
No se ejecutó el SQL ni se escribieron resultados en el Supabase remoto del docente.

## Descarga y estadísticas

Los datos completos conservados permiten reconstruir todas las métricas sin guardar
una copia redundante de cada gráfico. Se comprobó igualdad estadística antes/después
de recuperar tres intentos con eventos. Paquete JSON versión 2 y conversión XLSX
directa: ver EXPORTS.md. La descarga refleja el estado actual, incluidos resultados
locales pendientes de subir; el propio archivo indica ese estado.
