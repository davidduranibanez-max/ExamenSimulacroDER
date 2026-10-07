# Acceso con Google y lista de correos en Supabase

Actualizado: 7 de octubre de 2026. El usuario autorizó expresamente sustituir
correo/contraseña por **Entrar con Google**. Esta decisión reemplaza el acuerdo
anterior de la conversación compartida. Mantener GitHub Pages; no añadir OTP/SMTP.

## Estado y configuración

El docente confirmó Google funcionando después de configurar proveedor, hook y
URLs y hacer su commit/push. El respaldo de resultados ahora está preparado
localmente: ejecutar el SQL nuevo indicado en [CLOUD_HISTORY.md](CLOUD_HISTORY.md).
El asistente no administra el proyecto remoto ni publica.

Seguir **[GOOGLE_SETUP.md](GOOGLE_SETUP.md)**, con los valores exactos del proyecto,
Google Cloud, proveedor, URL Configuration, autorización e importación en bloque.
La clave pública y URL existentes siguen en `assets/js/supabase-config.js`. El
Client Secret de Google se guarda únicamente en Supabase, nunca en la página.

## Flujo y archivos

- `auth.js` conecta el SDK a `auth-service.js` y gestiona el callback en la misma
  página estática. Usa `signInWithOAuth` con Google y PKCE, `prompt=select_account`,
  y el origen/ruta actuales como redirectTo. No necesita una ruta de servidor.
- Al volver, retira código/errores de la URL, llama `exchangeCodeForSession`, valida
  con `getUser`, exige correo confirmado/identidad Google y consulta `cean_has_access`.
  Solo la respuesta booleana true concede acceso. No se pasa un correo editable
  a la función: obtiene UUID/correo de la sesión validada por Supabase.
- `auth-storage.js` conserva verificadores PKCE en sessionStorage durante el viaje
  a Google y los elimina al terminar/cancelar. Guarda tokens exclusivamente en
  memoria. El SDK usa persistSession=true con este adaptador; **no implica tokens
  persistentes en disco**. Recargar vuelve a mostrar el botón; Google puede recordar
  su propia sesión. La renovación automática mantiene la sesión de la pestaña.
- `google-access.sql` crea la lista privada con RLS y privilegios restringidos,
  el hook Before User Created y la RPC. Solo administra el docente mediante
  Dashboard/SQL; no existe formulario de registro público ni contraseña en CEAN.
  El hook solo permite nuevas cuentas Google cuyo correo esté activo en la lista.
  Hay que habilitarlo manualmente antes de activar altas OAuth.
- La RPC exige un JWT OAuth, un usuario confirmado, identidad Google con correo
  verificado coincidente y autorización activa. El alumno no puede leer/escribir
  la lista. La RPC también bloquea cuentas antiguas que no están autorizadas.
- Se comprueba autorización al entrar y al iniciar/reanudar un examen. No hay
  presencia en tiempo real ni expulsión inmediata por una baja durante el examen.
- `scripts/prepare-access.mjs` importa una columna CSV de correos a SQL, normaliza,
  deduplica, escapa valores y conserva bajas. `access-private/` está en .gitignore.

## Datos y límites

IndexedDB guarda la copia local por `supabase:<UUID>`; Supabase respalda resultados
terminados y permite recuperarlos en otro dispositivo. El nuevo progreso en curso
también se sincroniza al activar PRIVATE_BANK.md. El docente consulta `cean_exam_attempts` en el dashboard; no hay panel docente
propio. Leer CLOUD_HISTORY.md. Se preservan todos los perfiles/históricos
anteriores, sin vinculación automática. Si Google enlaza una cuenta Auth existente
con el mismo email verificado, conservará su UUID; verificar ese caso en el proyecto.

Para nuevos intentos, private-bank.sql mantiene banco y claves en Supabase.
Frontend/archivos estáticos siguen públicos; el alumno puede copiar preguntas
que recibe legítimamente. El banco viejo sigue en commits/forks anteriores.
No confundir autenticación con impedir prestar una cuenta Google o sesión.
Activación privada y límites en PRIVATE_BANK.md.

## Validación

33 pruebas Node del motor, tiempos, estadísticas, servicio de acceso, PKCE y RPC privadas.
PostgreSQL temporal: SQL idempotente, RLS/privilegios, OAuth autorizado, rechazo
de contraseña/baja/identidad distinta, anon y hook. Edge aislado con SDK real y
respuestas OAuth/Auth/RPC simuladas prueba el viaje PKCE, rechazos y el simulador.
Los detalles están en TESTING.md. El docente confirmó Google y ejecutó el SQL de
resultados. SQL privado/importación del banco siguen pendientes. En las pruebas
automatizadas no se usaron cuentas/contraseñas reales ni se modificó Supabase real.
