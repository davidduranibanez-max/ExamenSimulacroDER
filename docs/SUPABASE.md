# Acceso mediante Supabase Auth

Actualizado: 7 de octubre de 2026, hora de Bolivia.

## Objetivo y alcance

El usuario aclaró que el objetivo de la conversación compartida es entrar con
**correo + contraseña individual comprobados por Supabase**, no solo cargar el SDK.
La implementación sustituye el acceso local. No crea cuentas ni envía correos.
No se hicieron commits, push ni despliegues; el usuario publica desde VS Code.

Proyecto: **SimulacroExamenDER**.
URL pública: `https://mnbfmmowmimkadtotvkz.supabase.co`.
La clave publishable autorizada está en `assets/js/supabase-config.js` y puede
publicarse. Nunca incluir secret, service_role o contraseñas de base de datos.

## Arquitectura

- `index.html` y `app.js` cargan módulos con rutas relativas.
- `supabase-client.js` exporta `supabaseReady`: SDK 2.117.2 por CDN jsDelivr,
  sin build ni npm install. Su sesión usa sessionStorage, clave
  `cean.supabase.auth.v1`, persistencia y renovación automática de tokens.
- `auth.js` llama a `signInWithPassword({email, password})` y después a `getUser`.
  Para restaurar una sesión primero consulta `getSession` y después verifica
  `getUser` con Auth. Exige ID, correo y `email_confirmed_at`.
- Los datos guardados en el navegador, incluyendo la sesión local antigua,
  no son una autorización. No hay fallback al acceso local si falla la red/CDN.
- `app.js` muestra errores genéricos de credenciales, correo no habilitado,
  exceso de intentos y conexión. No registra contraseñas ni tokens en logs.
  Se vuelve al formulario cuando el SDK notifica SIGNED_OUT.
- **Salir** guarda el examen local y ejecuta `signOut({scope:'local'})` para
  cerrar esa sesión, sin desconectar otros dispositivos.
- El UUID remoto identifica el historial local mediante `supabase:<UUID>`.
  No usar el email o el nombre editable como identificador ni como rol docente.

Los historiales y las estadísticas permanecen en IndexedDB. No se crearon
tablas ni políticas RLS porque este paso no sincroniza datos de estudiantes.
El banco y las respuestas siguen siendo archivos públicos de GitHub Pages.
La autenticación no protege esos archivos ni garantiza calificaciones locales
contra manipulación. Para protección de datos remotos, definir tablas y RLS.

## Lo que debe hacer el docente en Supabase

En **Authentication → Users**, comprobar que existe cada cuenta autorizada con
su correo y contraseña. Para crearla manualmente, usar **Add user / Create new
user**, asignar contraseña y marcar **Auto Confirm User**. Esa marca habilita el
correo administrativamente; no demuestra que el usuario controle ese buzón.
No hace falta SMTP, OTP ni configurar redirecciones para este acceso con contraseña.

Mantener el proveedor Email habilitado y **Allow new users to sign up** desactivado.
Se confirmó en la configuración pública que email está habilitado y el registro
está desactivado. No habilitar registro público como solución a un error de acceso.
La cuenta de David de la conversación anterior debería servir si cumple estas
condiciones. Las cuentas locales de David y Soledad no crean usuarios en Supabase.

No se solicitaron ni utilizaron contraseñas reales para probar. La prueba final
del usuario es entrar en localhost con su cuenta de Supabase existente.

## Compatibilidad de datos anteriores

No se borró localStorage, IndexedDB ni el archivo antiguo de perfiles. El código
ya no descarga ese archivo ni autentica con sus verificadores. Los históricos
antiguos siguen bajo sus claves originales y no se asignan automáticamente a un
UUID remoto. Una migración posterior debe definir y confirmar cada propietario,
conservando copias completas. Las cuentas nuevas empiezan con un historial local
propio. No afirmar que los datos se migraron o sincronizaron.

## Verificación y publicación

1. Ejecutar `npm start` y abrir http://localhost:4173.
2. Comprobar que aparece **Correo electrónico**, sin alta pública.
3. Entrar con la contraseña de la cuenta de Supabase, no con el username antiguo.
4. Recargar: la sesión debe validarse contra Auth y conservar el historial de ese UUID.
5. Pulsar Salir: vuelve al formulario. Probar contraseña incorrecta: debe bloquear.
6. Hacer commit y push desde VS Code. El cambio no llega a Pages hasta publicarlo.

Se verificaron el flujo y errores con el SDK real y respuestas Auth simuladas en
Edge aislado; también un rechazo real de credenciales ficticias contra Supabase.
Los detalles y límites están en `TESTING.md`.

Referencias oficiales: [acceso por contraseña](https://supabase.com/docs/reference/javascript/auth-signinwithpassword),
[verificación remota del usuario](https://supabase.com/docs/reference/javascript/auth-getuser),
[claves públicas](https://supabase.com/docs/guides/getting-started/api-keys).
