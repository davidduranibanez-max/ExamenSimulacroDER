# Resultados y progreso en Supabase

Google y exam-history.sql fueron activados por el docente. El cambio de banco
privado requiere ejecutar private-bank.sql/importar CSV; aún no activado desde
esta sesión. Consultar PRIVATE_BANK.md antes de publicar.

## Guardado y consulta

- Nuevo intento remoto: copia local por interacción/cada cinco segundos; progreso
  en Supabase aproximadamente cada 15 segundos y al salir. Una revisión impide
  sobreescritura de otro dispositivo. La conexión es necesaria para comenzar/corregir.
- cean_finish_exam confirma y corrige con claves/plazo del servidor, guarda una
  fila inmutable en cean_exam_attempts y retorna resultado antes del archivado local.
  Se repite sin duplicar; al vencer solo usa progreso recibido a tiempo.
- cean_live_exams guarda sesión/progreso y se recupera al entrar en otro navegador.
  Datos locales más antiguos se conservan en recoveryCopies antes de reemplazar.
- Historial terminado se consulta con UUID, páginas de 50 y RLS; se une a copia
  local sin duplicados y sin pisar activo. Sincronizar historial busca nuevos finales.
- Datos anteriores de cliente: cean_save_attempt sigue disponible para importar
  con verification_source=legacy-client; no puede escribir IDs de sesiones privadas
  ni suplantar serverVerified. No son notas certificadas. Perfiles de username
  no se vinculan a Google automáticamente.
- Estadísticas se recalculan desde snapshots/eventos guardados; no se duplican
  resúmenes ni se reenvía un paquete completo del alumno por cada respuesta.
- Si falla red, se conserva la copia local y se ofrece exportar/reintentar. La
  sincronización del historial reintenta al volver, online o cada minuto pendiente.
  Borrar navegador antes de confirmar puede perder cambios/resultados pendientes.

## Acceso docente y permisos

Dashboard → Table Editor → cean_exam_attempts. Correo, fechas, aciertos, duración,
JSONB completo y verification_source. Dashboard administrativo ve todos; SELECT
del alumno está limitado a su UUID Google autorizado. No hay INSERT/UPDATE/DELETE
directo ni acceso anon. No se creó un panel docente dentro de la web.

Resultado nuevo: serverVerified y origen server. El cliente no puede cambiar
claves/plazo/nota de esa sesión. La lectura/eventos siguen medidos en el navegador
y pueden manipularse; no son vigilancia ni certificación antifraude. La copia local
es editable; al recuperar, prevalece resultado de Supabase. El administrador puede
modificar/borrar datos; eliminar un usuario Auth borra sus filas por cascada.

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

## Capacidad de la migración privada

Añade banco completo de unos 10,46 MiB de JSON antes de compresión/índices, una
sesión activa por alumno y progreso periódico. El tamaño de resultados no duplica
los 100 distractores por pregunta; snapshot activo se limpia al archivar resultado.
Solicitudes de progreso/lectura también consumen recursos/transferencia. No se hizo
prueba de carga de 100 concurrentes: supervisar Usage y conservar respaldo docente.

## Verificación

33 pruebas Node; PostgreSQL temporal con roles para permisos, aislamiento, sorteo,
plazo, CAS y corrección. Edge aislado con SDK real y backend PostgreSQL temporal,
recuperación entre navegadores, fallo de red, móvil/prefijo Pages y exportaciones.
CSV completo leído por Python y comparado con todos los JSON originales. No se
modificó Supabase real ni se hicieron commits/push desde esta sesión.
