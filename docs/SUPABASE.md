# Conexión inicial a Supabase

Actualizado: 7 de octubre de 2026, hora de Bolivia.

## Alcance de este paso

Se siguió la última instrucción de la conversación compartida por el usuario:
inicializar el cliente JavaScript, sin crear todavía un formulario de acceso remoto.
No se ejecutaron commits, push ni despliegues.

`index.html` carga `assets/js/supabase-client.js` mediante una ruta relativa.
Ese módulo importa la configuración pública de `assets/js/supabase-config.js`
y carga Supabase JS **2.117.2** desde jsDelivr como módulo ES, sin npm install
ni compilación. El usuario autorizó expresamente esta conexión externa.

Los futuros módulos pueden usar el mismo cliente:

```js
import { supabaseReady } from './supabase-client.js';
const client = await supabaseReady;
if (!client) throw new Error('Supabase no está disponible');
```

La promesa devuelve el cliente o `null` si falla la carga. El fallo no impide
acceder al simulacro local. El mensaje «Cliente de Supabase inicializado» confirma
la creación del cliente; no prueba por sí solo una petición al servidor.

## Configuración y estado

Proyecto: **SimulacroExamenDER**.
URL pública: `https://mnbfmmowmimkadtotvkz.supabase.co`.
La clave **publishable** proporcionada por el usuario está en el archivo de
configuración y puede publicarse con el sitio. Nunca añadir una clave secret,
service_role ni contraseñas de base de datos al repositorio.

Se verificó la URL y la clave mediante `GET /auth/v1/settings`: HTTP 200,
acceso por correo habilitado y altas públicas desactivadas. Solo se leyó la
configuración pública; no se modificó el proyecto de Supabase.

El acceso existente sigue usando perfiles locales. Los intentos, tiempos y
estadísticas siguen en IndexedDB; **no se envían datos de estudiantes a Supabase**.
Inicializar el SDK no migra cuentas ni historiales. Antes de implementar esa fase,
definir cuentas remotas, tablas, políticas RLS y permisos de consulta del docente.

## Verificación manual

1. Ejecutar `npm start` y abrir http://localhost:4173.
2. En la consola del navegador debe aparecer «Cliente de Supabase inicializado».
3. Confirmar que el acceso local y Mis estadísticas siguen funcionando.
4. Si falla la descarga del SDK, comprobar el aviso y que el simulacro sigue disponible.

El cliente requiere Internet para cargar el SDK y acceder a Supabase. GitHub Pages
sigue sirviendo los archivos estáticos; no aloja el servicio de Supabase.
