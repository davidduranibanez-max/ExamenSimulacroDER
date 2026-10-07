# CEAN
Sistema y simulador de examen para practicar el ingreso a Derecho.

Frontend público en GitHub Pages; Google, banco privado, progreso y resultados en
Supabase. **Migración privada preparada localmente; falta activar el SQL e importar
el CSV antes de publicar.** Pasos en [PRIVATE_BANK.md](docs/PRIVATE_BANK.md).
No se hizo commit ni push desde esta sesión. El banco antiguo todavía está en Git.

Para retomar desarrollo: [CONTEXT.md](docs/CONTEXT.md) y [AGENTS.md](AGENTS.md).

## Ejecutar en cualquier computadora

Node.js 20 o posterior. Sin npm install ni build. Desde la carpeta del repositorio:

```sh
npm start
```

Abrir http://localhost:4173. Otro puerto: node scripts/serve.mjs 8080. También sirve python -m http.server 4173. Google requiere registrar el origen/callback correcto
en Supabase. No abrir index.html como archivo: módulos y SDK necesitan HTTP/HTTPS.
El banco local no es necesario para ejecutar el frontend; Supabase sí.

## GitHub Pages

HTML/CSS/JS con rutas relativas; publicación actual:
https://davidduranibanez-max.github.io/ExamenSimulacroDER/.
Mantener Settings → Pages → Deploy from a branch → main → /(root).
GitHub Free permite Pages en repositorios públicos. Repositorio/frontend público
contiene interfaz, módulos, biblioteca Excel y SQL sin datos; nunca el CSV/banco
ni secretos de administración. GitHub aloja código e interfaz; Supabase ejecuta
las funciones SQL, autentica y almacena datos. La clave publishable puede ser pública.

Quitamos data/ del árbol actual y conservamos JSON intactos en ../banco-privado.
**Esto no retira commits, forks, clones o descargas anteriores.** La limpieza de
historia Git requiere una operación aparte, revisada antes de reescribir/publicar.
No prometer que un alumno no podrá copiar preguntas que legítimamente ve.

## Banco e incisos

2018 preguntas, ocho materias, numeración/página del PDF original conservadas.
Cada JSON privado contiene la respuesta fuente y 100 distractores propios. Los
201800 candidatos son borradores lingüísticos, pendientes de revisión docente de
pertinencia, gramática, dificultad y respuesta única. No hay catálogo compartido.

Cada intento se sortea en Supabase: 100 preguntas distintas, 4 distractores propios
y 5 opciones A–E en orden aleatorio. La correcta queda en el servidor hasta finalizar.
Reanudar conserva preguntas/opciones/plazo; una edición no altera intentos anteriores.
Editar ../banco-privado/data/<materia>/CPU-XXXX.json y aplicar el SQL de actualización;
procedimiento en [QUESTION_BANK.md](docs/QUESTION_BANK.md).

## Acceso, guardado y resultados

Entrar con Google; lista privada en cean_authorized_emails. Users muestra cuentas,
no permisos. No se crean contraseñas del simulador ni registro público. Configuración
en [GOOGLE_SETUP.md](docs/GOOGLE_SETUP.md) y contrato [SUPABASE.md](docs/SUPABASE.md).
Cada recarga pide Google y verifica Auth+permiso. Tokens solo en memoria. Perfiles
antiguos se conservan sin vincularlos automáticamente.

Copia local tras cada interacción/cada 5 segundos; progreso remoto cada 15 segundos y al salir.
Plazo de 60 minutos fijado/aplicado por servidor, sigue al cerrar. Al vencer cuenta
último progreso recibido por Supabase a tiempo: mantener Internet. Para iniciar
u obtener nota hace falta conexión. Finalización guarda snapshot/eventos/nota y
recuperación en otro navegador. Solo el alumno ve sus filas; el docente ve todas
con el dashboard. [CLOUD_HISTORY.md](docs/CLOUD_HISTORY.md).

Mapa de 100 círculos, marcado/borrado/navegación libre. Finalizar rojo; revisión verde
correcta, roja incorrecta y ámbar pendiente. La nota nueva se calcula en Supabase;
los tiempos de lectura vienen del navegador y no son una certificación de identidad
ni vigilancia. Históricos anteriores tienen origen legacy-client.

## Mis estadísticas y descargas

Media/mediana/varianza/desviación/mejor nota/cambio/tiempo de respuesta con ayudas con ?
mouse/teclado/toque. Series temporales, progreso/media móvil, distribución, frecuencia,
Pearson, día/hora/tramo del reloj. Tablas y detalles; no inventar datos faltantes.
Se calculan con historial recuperado, sin guardar resúmenes duplicados en la base.
[ANALYTICS.md](docs/ANALYTICS.md).

Mi historial y Mis estadísticas → Descargar JSON / Descargar Excel. Paquete JSON v2
con datos y métricas; XLSX real con seis hojas (Resumen,Intentos,Preguntas,Eventos,
Distribución,Correlaciones), SheetJS CE 0.20.3 local/diferido. Son copias del momento,
no conexiones en vivo. [EXPORTS.md](docs/EXPORTS.md).

## Diseño y verificaciones

PC/celular, 2D pixelado con fuentes normales,Conway real detrás,pausa/reinicio,
foco visible,radios nativos,mapa móvil,movimiento reducido y textos escapados.
CDN solo SDK Supabase, sin fuentes ni conversores remotos. Arquitectura:
[ARCHITECTURE.md](docs/ARCHITECTURE.md).

```sh
npm run check
npm test
npm run prepare:bank
```

check verifica frontend sin banco/CSV/secretos y banco privado si está disponible;
check:bank acepta ruta privada explícita. prepare:bank genera CSV fuera del repo
para Table Editor. 33 pruebas Node y backend PostgreSQL/Edge aislados pasan; pruebas
de carga de 100 alumnos y activación real pendientes. [TESTING.md](docs/TESTING.md).
PDF original intacto fuera del repositorio; generadores originales preservados en
../banco-privado/herramientas,solo requieren Python/pypdf si se regenera el banco.
