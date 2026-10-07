# Configuración única: entrar con Google

El código está preparado localmente. **No funcionará con Google hasta completar
estos ajustes y publicar los cambios.** No hace falta repartir contraseñas,
códigos ni dar de alta manualmente cada cuenta Auth. GitHub Pages se mantiene.

## 1. Preparar la autorización en Supabase

Proyecto: **SimulacroExamenDER** (`mnbfmmowmimkadtotvkz`).

1. Abrir **SQL Editor → New query**.
2. Copiar todo `supabase/google-access.sql` y ejecutar **Run**.
3. Abrir **Authentication → Hooks → Before User Created**. Seleccionar la función
   PostgreSQL `public.cean_before_user_created` y guardar/activar el hook.
4. Comprobar que el hook está activo **antes de habilitar nuevas altas**.

El script crea `public.cean_authorized_emails`, la comprobación `cean_has_access`
y la restricción de alta. La lista no se puede leer ni modificar desde la página.
Incluye únicamente el correo del docente proporcionado en la conversación:
`davidduranibanez@gmail.com`. No se inventó el correo de Soledad ni de los alumnos.

**Authentication → Users no es la lista de alumnos autorizados.** Esa sección
mostrará las cuentas después de entrar por Google. La autorización se administra
en **Table Editor → cean_authorized_emails**.

## 2. Crear la conexión en Google

Abrir [Google Auth Platform](https://console.cloud.google.com/auth/overview)
y crear/seleccionar un proyecto.

- En **Branding**, configurar nombre `ExamenSimulacroDER`, correo de soporte y
  correo de contacto del docente.
- En **Audience**, elegir **External** para admitir Gmail personal. En modo
  Testing Google exige agregar usuarios de prueba; para los alumnos, publicar
  la aplicación OAuth mediante **Publish app / In production**. Esto publica
  el consentimiento OAuth, no hace push del sitio.
- En **Data Access**, utilizar solamente los permisos básicos `openid`, email
  y perfil. No solicitar Drive, Gmail ni otros permisos.
- En **Clients → Create client**, elegir **Web application**.

**Authorized JavaScript origins** (sin la ruta del repositorio):

```text
https://davidduranibanez-max.github.io
http://localhost:4173
http://127.0.0.1:4173
```

**Authorized redirect URIs** (el retorno a Supabase):

```text
https://mnbfmmowmimkadtotvkz.supabase.co/auth/v1/callback
```

Guardar el **Client ID** y **Client Secret**. El secreto se pega exclusivamente
en Supabase; nunca en archivos, GitHub, esta conversación ni el JavaScript.

## 3. Habilitar Google en Supabase

En **Authentication → Sign In / Providers → Google** (el menú puede aparecer como
Providers), activar Google, pegar Client ID y Client Secret y guardar.
Mantener desactivados otros proveedores que no se usan, incluido Email/password
si se quiere que estas cuentas accedan exclusivamente mediante Google. No borrar
usuarios existentes: Google puede enlazar una cuenta existente con el mismo correo
verificado y conservar su UUID/historial local.

En **Authentication → URL Configuration**:

**Site URL**:

```text
https://davidduranibanez-max.github.io/ExamenSimulacroDER/
```

**Redirect URLs** (agregar las tres direcciones exactas):

```text
https://davidduranibanez-max.github.io/ExamenSimulacroDER/
http://localhost:4173/
http://127.0.0.1:4173/
```

En **Authentication → Settings / Sign In**, habilitar **Allow new users to sign up**
después de activar el hook. Es necesario para que el primer acceso de Google cree
la cuenta automáticamente. **No supone admitir cualquier correo**: el hook rechaza
las altas que no están en la lista, y la comprobación del simulador también rechaza
cuentas existentes no autorizadas. Mantener desactivado el acceso anónimo.

## 4. Cargar todos los alumnos juntos

Preparar en Excel/Google Sheets **una sola columna** con encabezado `email` y un
correo por fila. Exportar como CSV UTF-8. Ejemplo de formato:
`supabase/authorized-emails.example.csv` (son ejemplos, no alumnos autorizados).

Dos opciones, sin repartir claves:

- Importar ese CSV en **Table Editor → cean_authorized_emails → Insert / Import CSV**.
  Los correos deben estar en minúsculas y sin espacios. Las columnas restantes usan
  sus valores por defecto. Para nuevas filas, evitar correos ya existentes.
- Generar SQL portable para importar, eliminar duplicados y conservar bajas:

```sh
node scripts/prepare-access.mjs access-private/alumnos.csv access-private/alta.sql
```

Crear primero la carpeta local `access-private`, guardar allí la lista y ejecutar
el SQL generado en **SQL Editor**. La carpeta se ignora en Git. El script no
sobrescribe archivos existentes, no crea contraseñas y no reactiva correos dados
de baja. No subir listados privados de alumnos al repositorio público.

Para retirar acceso, cambiar `active` a `false` en la tabla; no hace falta borrar
la cuenta ni el historial. La baja se comprueba al entrar y al iniciar/reanudar
un examen. No hay expulsión inmediata de un examen ya abierto.

## 5. Probar y publicar

1. `npm start` y abrir **http://localhost:4173/**.
2. Pulsar **Entrar con Google** con el correo del docente ya autorizado.
3. Comprobar que aparece Comenzar. Recargar: se vuelve a pedir entrar con Google.
   Google puede recordar su propia sesión; CEAN siempre comprueba el permiso remoto.
4. Probar otro correo fuera de la lista: debe rechazar el acceso.
5. Hacer commit y push desde VS Code y esperar la publicación de GitHub Pages.
6. Repetir ambas comprobaciones en la dirección publicada.

El alumno entra a Google en la página de Google, nunca escribe su contraseña
personal en CEAN. Después de verificar su cuenta, Supabase revisa la autorización.
Compartir el enlace no concede acceso normal. Prestar la cuenta o una sesión sigue
siendo posible. Las preguntas estáticas siguen públicas; este cambio implementa
Google y la lista de acceso, no migra el banco a una base privada.

Referencias: [Google en Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google),
[hook de alta](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook),
[hooks disponibles en Free](https://supabase.com/docs/guides/auth/auth-hooks).
