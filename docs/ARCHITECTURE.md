# Arquitectura

## Ejecución estática

El documento de entrada es `index.html`. Carga un CSS y `app.js` como módulo ES.
Este importa `core.js`, `storage.js` y `life.js`. Las URLs del banco se resuelven
con `new URL('../../data/...', import.meta.url)`, por lo que funcionan bajo un
prefijo de GitHub Pages. Todas las vistas viven en el mismo documento y no crean
rutas que requieran reescrituras del servidor.

`scripts/serve.mjs` sirve la raíz del repo por HTTP en 127.0.0.1:4173, bloquea
traversal y rutas ocultas, asigna MIME a módulos y JSON y no realiza persistencia.
También funciona un servidor HTTP estático de Python u otro proveedor.
`.nojekyll` mantiene el sitio como archivos estáticos al publicar desde una rama.

## Responsabilidades

**app.js** administra `auth`, `landing`, `exam`, `results` y `history`. Reutiliza
cabecera, pie, diálogo de confirmación y notificaciones. Renderiza textos externos
con escape HTML; las opciones usan radios nativos con etiquetas. Delegación de
click/change/submit en lugar de un listener por pregunta.

**core.js** carece de dependencias DOM. Define tamaño de examen, Fisher–Yates,
entero aleatorio mediante rechazo, selección de incisos, calificación, validación
de bancos e intentos y formato de tiempo. Sirve tanto al sitio como al validador
Node y las pruebas.

**storage.js** administra perfiles, PBKDF2, sesiones, IndexedDB y exclusión entre
pestañas. Traduce errores de lectura y escritura en mensajes visibles. No borrar
datos corruptos o viejos automáticamente.

`assets/data/profiles.json` contiene los dos perfiles iniciales pedidos por el usuario,
con sales y verificadores PBKDF2, sin contraseña en texto claro. Al iniciar se agregan
únicamente los usuarios faltantes bajo un bloqueo del registro. No reemplaza claves
o perfiles ya existentes. Los usuarios se normalizan a NFC y minúsculas españolas;
se admiten letras Unicode y números. Nombre de perfil y username son campos distintos.

**life.js** implementa la evolución B3/S23 con bordes periódicos. `stepLife` es
función pura comprobable. `initLife` dibuja celdas con tamaño entero de 12 px y
desactiva suavizado. Evoluciona cada 160 ms; no evoluciona con la pestaña oculta,
pausa explícita o preferencia de movimiento reducido. El canvas es decorativo y
no intercepta eventos.

## Estado de un intento

```js
{
  id, startedAt, updatedAt, elapsedMs, current,
  questions: [{ id, number, page, area, question, options: [/* cinco textos */], correct: 0 }],
  answers: [/* cien valores null o índices 0–4 */],
  marked: [/* cien booleanos */],
  completedAt // solo al finalizar
}
```

`correct` es el índice final después del sorteo, no una letra permanente del banco.
Una respuesta pendiente es `null`, nunca cero. Cada pregunta vale un punto; errores
y pendientes no suman. El resumen calcula porcentajes y aciertos por área. Los
filtros de resultados afectan la revisión, no la calificación.

## Persistencia

| Medio | Clave/objeto | Contenido |
|---|---|---|
| localStorage | `cean.exam.v1.users` | IDs, nombre, usuario, sal y hash |
| sessionStorage | `cean.exam.v1.session` | ID del usuario conectado en esa pestaña |
| IndexedDB | `cean-exam-v1` / `profiles` / clave userId | `{ active, history }` |
| Web Locks | `cean.exam.v1.<userId>` | Exclusión del examen mientras está abierto |

Las contraseñas se derivan usando Web Crypto; no se almacena el texto original.
El uso de localhost o HTTPS habilita las APIs necesarias. El acceso es local y
no protege el banco frente a quien puede leer el JavaScript o modificar el navegador.

La cola `saving` serializa snapshots para evitar que una escritura antigua venza
a la nueva. Se guarda en cada selección/navegación/marcado y cada cinco segundos.
`leaveExam` espera el guardado antes de liberar el bloqueo y navegar. Finalizar
escribe historial y limpia `active` en una sola transacción; si falla, el examen
continúa abierto y ofrece exportación. El guardado en `pagehide` es un esfuerzo
adicional: no sustituye los guardados frecuentes y confirmados.

El reloj registra tiempo activo con `performance.now` y guarda milisegundos
acumulados. Se pausa al salir del examen; no se incluye el tiempo entre sesiones.

## Diseño y accesibilidad

Tokens CSS en `:root`, fondo oscuro, verde lima, ámbar y rojo para estados.
Paneles con remates cuadrados, iconografía simple, fuentes de sistema y canvas
pixelado. Media queries a 1100, 800 y 480 px. Mapa lateral en PC; desplegable en móvil.
Hay enlace para saltar al contenido, etiquetas de formularios, tablist con flechas,
radios nativos, foco visible, `dialog` modal y estados anunciados con `aria-live`.

No hay servicios externos, SDK, CDN, analítica o fuentes descargadas.
Las exportaciones excluyen credenciales y contienen copias de los datos del examen.
La importación de copias todavía no está implementada.
