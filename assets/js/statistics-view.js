import { getStatistics } from './statistics.js';
import { lineChart, barChart, scatterChart, escapeHtml as e } from './charts.js';
import { formatTime } from './core.js';

const number = value => value === null ? '—' : new Intl.NumberFormat('es-BO', { maximumFractionDigits: 1 }).format(value);
const day = value => new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short' }).format(value);
const date = value => new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'medium' }).format(value);
const responseDate = q => {
  const offset = q.calendar.utcOffsetMinutes, local = new Date(q.at + offset * 60000).toISOString();
  const zone = `${offset >= 0 ? '+' : '−'}${String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')}:${String(Math.abs(offset) % 60).padStart(2, '0')}`;
  return `${local.slice(0, 10)} ${local.slice(11, 23)} (UTC${zone})`;
};
let helpId = 0;
function help(label, text) {
  const id = `stats-help-${++helpId}`;
  return `<span class="help-wrap"><button class="help-button" type="button" aria-label="¿Qué significa ${e(label)}?" aria-describedby="${id}" data-help-toggle>?</button><span class="help-panel" id="${id}" role="tooltip">${e(text)}</span></span>`;
}
function metric(label, value, unit, explanation) {
  return `<article class="stat-card metric-card"><div class="label">${e(label)}${help(label, explanation)}</div><div class="value">${e(value)}<small>${e(unit)}</small></div></article>`;
}
function section(title, subtitle, chart, extra = '') {
  return `<section class="analytics-panel"><div class="analytics-heading"><h2>${title}</h2><p>${subtitle}</p></div>${chart}${extra}</section>`;
}
export function statisticsHtml(history) {
  helpId = 0;
  const s = getStatistics(history), counts = s.attempts.length;
  const points = s.attempts.map(a => ({ x: a.at, y: a.score, label: day(a.at), detail: `Intento ${a.number} · ${date(a.at)} · ${a.score}/100` }));
  const progress = s.attempts.map(a => ({ x: a.number, y: a.score, label: `#${a.number}`, detail: `Intento ${a.number} · ${a.score}/100 · media reciente ${number(s.rolling[a.number - 1])}` }));
  const cards = [
    metric('Simulacros', counts, '', 'Número de exámenes finalizados, incluidos los que terminaron al agotarse la hora. Los intentos en curso aún no se incluyen.'),
    metric('Media de puntuación', number(s.scores.mean), ' / 100', 'Suma de las puntuaciones dividida entre el número de simulacros. Cada respuesta correcta vale un punto; las incorrectas y pendientes no suman.'),
    metric('Mediana', number(s.scores.median), ' / 100', 'Puntuación central al ordenar tus resultados. Con un número par de intentos se promedian los dos valores centrales.'),
    metric('Desviación estándar', number(s.scores.sd), ' puntos', 'Describe cuánto se alejan tus puntuaciones de la media. Un valor pequeño indica resultados más constantes. Se calcula sobre todos tus intentos guardados.'),
    metric('Varianza', number(s.scores.variance), ' puntos²', 'Promedio de las diferencias al cuadrado respecto de la media. Es otra medida de variabilidad: equivale a la desviación estándar elevada al cuadrado.'),
    metric('Mejor resultado', number(s.scores.max), ' / 100', 'La mayor puntuación entre tus simulacros finalizados.'),
    metric('Cambio desde el inicio', s.improvement === null ? '—' : `${s.improvement > 0 ? '+' : ''}${number(s.improvement)}`, ' puntos', 'Última puntuación menos la primera. Un valor positivo muestra una mejora entre esos dos intentos. Necesita al menos dos simulacros.'),
    metric('Tiempo hasta responder', number(s.questionSeconds.mean), ' s', 'Promedio del tiempo visible acumulado hasta la última respuesta conservada de cada pregunta. Incluye volver a leerla antes de cambiar la respuesta; excluye otras pantallas, pestañas ocultas y tiempo posterior a esa elección. Los registros parciales y los intentos anteriores sin registro se excluyen.')
  ].join('');
  const attemptRows = s.attempts.map(a => `<tr><td>#${a.number}</td><td>${e(date(a.startedAt))}</td><td>${a.score}/100</td><td>${a.answered}/100</td><td>${a.durationMs === null ? 'Sin registro' : formatTime(a.durationMs)}</td></tr>`).join('');
  const correlations = s.correlations.map(c => section(`${e(c.label)} ${help(c.label, 'Coeficiente de Pearson (r), de −1 a +1. Cerca de +1: asociación positiva; cerca de −1: negativa; cerca de 0: poca asociación lineal. Necesita al menos tres observaciones y variación en ambas variables. Asociación no demuestra causa; cada ronda sortea preguntas diferentes.')}`,
    `<strong>r = ${c.r === null ? 'sin datos suficientes' : c.r.toFixed(2)}</strong> · ${c.n} ${['question-time','stage'].includes(c.id) ? 'preguntas' : 'simulacros'} · eje horizontal: ${c.unit}${['question-time','stage'].includes(c.id) ? ' · vertical: acierto (1) / error (0)' : ' · vertical: puntos'}`,
    scatterChart(c.pairs, c.label, c.unit, ['question-time','stage'].includes(c.id)))).join('');
  const questionRows = s.questions.map(q => `<tr><td>#${q.attempt} · P${q.index + 1}</td><td>${e(responseDate(q))}</td><td>${number(q.seconds)} s${q.partial ? ' *' : ''}</td><td>${number(q.visibleSeconds)} s</td><td>${number(q.minute)} min</td><td>${formatTime(q.remainingMs)}</td><td>${q.revisions}</td><td>${q.correct ? 'Correcta' : 'Incorrecta'}</td></tr>`).join('');
  const groups = data => data.map(b => ({ ...b, percent: b.count ? b.correct / b.count * 100 : 0,
    detail: b.count ? `${b.label}: ${number(b.correct / b.count * 100)} % de aciertos · ${b.count} respuestas` : `${b.label}: sin respuestas registradas` }));
  const stageRows = s.stages.map(b => `<tr><td>${b.label}</td><td>${b.count}</td><td>${b.count ? `${number(b.correct / b.count * 100)} %` : '—'}</td><td>${number(b.seconds.length ? b.seconds.reduce((a, v) => a + v, 0) / b.seconds.length : null)} s</td></tr>`).join('');
  return `<div class="page-title-row"><div><div class="eyebrow">CADA INTENTO CUENTA</div><h1>Mis estadísticas</h1><p class="subtext">Tu preparación, vista a través de tus resultados.</p></div><div class="export-actions"><button type="button" class="btn btn-small" data-action="export-history" ${counts ? '' : 'disabled'}>Descargar JSON</button><button type="button" class="btn btn-small" data-action="export-excel" ${counts ? '' : 'disabled'}>Descargar Excel</button></div></div>
    <div class="metrics-grid">${cards}</div>${counts === 1 ? '<p class="analytics-note">Con un solo examen, la variabilidad es 0. Más intentos permitirán comparar tus resultados.</p>' : ''}
    <div class="analytics-grid">${section('Serie de tiempo', 'Cada punto es un examen finalizado. El eje horizontal representa su fecha; el vertical, los puntos obtenidos.', lineChart(points, 'Puntuación por fecha'))}
    ${section('Tu progreso', '<span class="chart-key"></span>Puntuación por intento <span class="chart-key secondary"></span>Media de hasta los últimos 3 intentos.', lineChart(progress, 'Progreso por número de intento', progress.map((p, i) => ({ ...p, y: s.rolling[i] }))))}</div>
    <details class="analytics-panel data-details"><summary>Ver fechas y resultados de todos los simulacros</summary><div class="table-scroll"><table><caption>Exámenes finalizados de este perfil</caption><thead><tr><th>Intento</th><th>Inicio</th><th>Puntos</th><th>Respondidas</th><th>Duración</th></tr></thead><tbody>${attemptRows || '<tr><td colspan="5">Aún no has finalizado un examen.</td></tr>'}</tbody></table></div></details>
    <div class="analytics-grid">${section('Distribución de puntuaciones', 'Número de simulacros en cada intervalo. El último incluye 100 puntos.', barChart(s.bins.map(b => ({ ...b, detail: `${b.label} puntos: ${b.count} simulacro(s)` })), 'Distribución de las puntuaciones'))}
    ${section('Tus días de práctica', 'Simulacros por día de la semana, según la fecha local de inicio registrada.', barChart(s.days.map(b => ({ ...b, detail: `${b.label}: ${b.count} simulacro(s) · media ${number(b.scores.length ? b.scores.reduce((a, v) => a + v, 0) / b.scores.length : null)}/100` })), 'Frecuencia por día de la semana'))}</div>
    <div class="analytics-section-title"><h2>Relaciones entre tus resultados y tus tiempos</h2><p>Son asociaciones de tus propios datos. El día de la semana se compara por grupos; no se convierte en un número para calcular una correlación. Las rondas tienen preguntas diferentes.</p></div>
    <div class="analytics-grid">${correlations}</div>
    <div class="analytics-grid">${section('Aciertos por día de respuesta', 'Porcentaje de respuestas correctas por día de la semana, según el registro local de cada elección. Los grupos sin respuestas aparecen vacíos.', barChart(groups(s.questionDays), 'Porcentaje de aciertos por día', b => b.percent))}
    ${section('Aciertos por hora de respuesta', 'Compara franjas de seis horas según la hora local registrada al responder. Cada punto de detalle indica cuántas respuestas incluye.', barChart(groups(s.hours), 'Porcentaje de aciertos por franja horaria', b => b.percent))}</div>
    ${section('¿En qué parte de la hora respondes?', 'Cada pregunta se asigna al minuto de su última respuesta conservada. Las preguntas pendientes no cuentan.', `<div class="table-scroll"><table><caption>Respuestas por tramo del temporizador</caption><thead><tr><th>Tramo</th><th>Preguntas</th><th>Aciertos</th><th>Tiempo hasta responder medio</th></tr></thead><tbody>${stageRows}</tbody></table></div>`)}
    <details class="analytics-panel data-details"><summary>Ver el registro por pregunta (${s.questions.length} respuestas)</summary><p class="subtext">Fecha y hora de la última respuesta con milisegundos y zona horaria original. Se distingue tiempo hasta responder y tiempo visible total, que incluye lecturas posteriores. El archivo exportado conserva todas las modificaciones. * Registro parcial: el intento empezó antes de esta versión.</p><div class="table-scroll"><table><caption>Tiempos de las preguntas respondidas</caption><thead><tr><th>Pregunta</th><th>Respondida el</th><th>Hasta responder</th><th>Visible total</th><th>Minuto del examen</th><th>Restante</th><th>Cambios</th><th>Resultado</th></tr></thead><tbody>${questionRows || '<tr><td colspan="8">Los nuevos simulacros generarán estos registros.</td></tr>'}</tbody></table></div></details>
    <p class="analytics-note">${counts - s.attempts.filter(a => a.durationMs !== null).length} simulacro(s) sin duración detallada · ${s.questions.length} respuestas con tiempos registrados. Los historiales anteriores se conservan sin inventar mediciones. Las estadísticas se calculan con el historial de tu cuenta; comprueba arriba el estado de su respaldo en Supabase.</p>`;
}
