# Verificación

## Comandos portables del repositorio

```sh
npm run check
npm test
npm start
```

No requieren npm install. `check` recorre los JSON sin cargar el PDF. `test` usa
el runner estándar de Node. Ejecutar los checks pertinentes al cambio; no repetir
pruebas amplias si el código no cambió y ya se verificaron.

## Cobertura automatizada

`tests/core.test.mjs` cubre:

- Cien preguntas únicas y cinco opciones, con cuatro distractores propios.
- Variación entre rondas y uso de las cinco posiciones correctas.
- Conteo de correctas, incorrectas y pendientes sin mutar el intento.
- Copia/reanudación exacta e índices inválidos.
- Rechazo de bancos incompletos, duplicados y distractores iguales a la correcta.
- Límites del generador aleatorio.
- Oscilador de Conway que vuelve al estado inicial en dos generaciones.

## Prueba de navegador realizada el 6 de octubre de 2026

Navegador: Edge en modo headless mediante Playwright del runtime local. Contexto
aislado y desechable: no se modificaron perfiles reales del usuario.

Se probó registro y acceso, inicio, 100 círculos y cinco radios; 20 respuestas
correctas, 20 incorrectas y 60 pendientes; marcado; salida y recarga; reanudación
con las mismas preguntas/opciones/respuestas; bloqueo de una segunda pestaña;
confirmación de pendientes; resultado 20/100 y colores; filtros; historial;
segunda ronda con nueva selección y opciones; y perfil distinto sin historial ajeno.

Se comprobó además acceso con **DavidDuranIbañez** y **SoledadMachaca**, incluyendo
la ñ y rechazo de contraseña incorrecta. Los perfiles de prueba solo existieron en
el contexto desechable; los dos perfiles iniciales se crean en el navegador del
usuario al cargar o actualizar la página.

Se verificó ausencia de desbordamiento horizontal a 1440, 390 y 320 px. Hubo
capturas de acceso, landing, examen y resultados en `test-results/` (gitignored),
inspeccionadas visualmente. No se detectaron errores de JavaScript en ese recorrido.

La prueba de navegador usa un script local fuera del repo y Playwright del entorno;
no introduce dependencias de ejecución en la página. Para automatizarlo en otra
computadora, añadir Playwright como dependencia de desarrollo en una tarea posterior,
o repetir el recorrido manual descrito debajo.

## Recorrido manual mínimo después de cambios de flujo

1. Abrir localhost, crear un perfil y entrar.
2. Comenzar; comprobar 100 preguntas, cinco opciones y navegador de círculos.
3. Responder, cambiar, borrar y marcar; navegar a preguntas lejanas.
4. Volver al inicio, recargar y continuar; comprobar que nada se remezcló.
5. Abrir otra pestaña con ese perfil; verificar que bloquea la edición simultánea.
6. Finalizar con pendientes; confirmar resultado y respuestas señaladas.
7. Abrir historial, exportar una copia y revisar una ronda anterior.
8. Comenzar otro intento; comprobar variación y que el anterior sigue íntegro.
9. Entrar con un segundo perfil; comprobar historial separado.
10. Repetir a 390 y 320 px, incluida apertura del mapa móvil y preguntas largas.

Para GitHub Pages, servir la carpeta padre y abrir `/CEAN/` antes de publicar.
Verificar módulos, CSS, favicon y JSON bajo ese prefijo. Confirmar que el sitio no
requiere recursos con rutas absolutas ni una API de backend.

La prueba final confirmó acceso y descarga de las 100 preguntas bajo
`http://localhost:4180/CEAN/`; CSS, módulos y JSON se resolvieron correctamente.

## Límites de esta verificación

No certifica dificultad, corrección jurídica, ambigüedad ni pertinencia de los
201.800 candidatos. Eso corresponde al docente. Tampoco confirma publicación en
GitHub Pages; esta entrega es local. No se probó recuperación/sincronización porque
no existen esos servicios en esta versión.
