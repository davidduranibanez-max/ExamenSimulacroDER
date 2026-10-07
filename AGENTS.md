# CEAN — instrucciones para retomar el proyecto

## Lectura mínima

1. Leer `docs/CONTEXT.md`: estado, requisitos vigentes, decisiones y pendientes.
2. Consultar `docs/ARCHITECTURE.md` solo si cambia el comportamiento de la aplicación.
3. Consultar `docs/QUESTION_BANK.md` solo si cambia el banco o los sorteos.
4. Consultar `docs/TESTING.md` antes de verificar cambios.
5. Consultar `docs/ANALYTICS.md` si cambian temporizador, eventos o estadísticas.
6. Consultar `docs/SUPABASE.md` para Google OAuth y lista de correos autorizados en Supabase;
   los historiales siguen siendo locales.

No leer el banco completo ni el PDF para cambios de interfaz. Buscar un ID con `rg`
y abrir únicamente sus JSON. `data/manifest.json` permite localizar cualquier registro.

## Restricciones del usuario

- Página estática compatible con GitHub Pages, rutas relativas y ejecución local.
- El usuario hará la publicación. No hacer push ni desplegar sin una nueva solicitud.
- Usar la carpeta de este clon de CEAN; preservar originales del usuario.
- Estética 2D pixelada, **fuentes normales** y Juego de la Vida corriendo detrás.
- Exámenes de **100 preguntas distintas** sorteadas del banco completo.
- **100 distractores propios por pregunta**: sin catálogo compartido ni referencias
  a respuestas de otras preguntas. En cada intento seleccionar cuatro y mezclar A–E.
- Dificultad objetivo alta. Los incisos actuales son **borradores generados**; el usuario
  es el docente y se reservó la revisión. No afirmar que están pedagógicamente validados.
- Acceso Google OAuth + lista privada de correos en Supabase; datos locales por UUID remoto.
- Sin alta pública en CEAN; altas Google restringidas por hook a la lista privada. No aceptar claves locales.
- Guardado automático, reanudación e historial; conservar registros antiguos sin vincularlos automáticamente.
- Sin registro público. Mis estadísticas usa únicamente el historial del perfil.
- Plazo persistente de 60 minutos; no se reinicia ni pausa al salir o recargar.
- Conservar eventos de respuesta y tiempos; nunca inventar mediciones antiguas.
- PC y celular, mapa de 100 círculos y revisión verde/roja al terminar.
- Documentar cambios para permitir lectura progresiva en futuras sesiones.

## Trabajo y validación

- No agregar un backend, dependencia de CDN o proceso de build sin necesidad expresa.
- No sobrescribir incisos aprobados al regenerar: el importador escribe en `tmp/importado`.
- No cambiar las respuestas del PDF silenciosamente: documentar correcciones docentes.
- Preservar copias completas de intentos anteriores; no recalificarlos con el banco actual.
- Nunca ejecutar `localStorage.clear()` ni borrar IndexedDB en una sesión del usuario.
- No registrar contraseñas o hashes en logs. Exportar únicamente nombre y datos del examen.
- Después de cambios en banco: `npm run check`. En sorteos/corrección: `npm test`.
- Para cambios de flujo o CSS, probar el recorrido y celular/PC; consultar TESTING.md.
- Actualizar `docs/CONTEXT.md` y el documento específico después de cambios materiales.
- Respetar las reglas globales del usuario para archivos Office y capturas de pantalla.

## Arranque

`npm start` → http://localhost:4173. Node.js >=20, cero dependencias npm.
`README.md` contiene instrucciones de usuario y publicación manual en GitHub Pages.
