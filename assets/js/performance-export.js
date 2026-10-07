import { getStatistics } from './statistics.js';
import { gradeExam, validExam, LETTERS } from './core.js';

export function performancePackage(user, profile, now = Date.now(), backupState = 'pending') {
  if (!profile.history.every(validExam)) throw new Error('El historial contiene datos inválidos.');
  const history = structuredClone(profile.history).sort((a,b) => a.completedAt - b.completedAt || a.id.localeCompare(b.id));
  const stats = getStatistics(history);
  return {
    format: 'cean-performance', version: 2, generatedAt: now,
    user: { name: user.name, email: user.username },
    backup: { state: backupState, scope: 'completed-attempts' },
    profile: { active: profile.active ? structuredClone(profile.active) : null, history },
    statistics: {
      scores: stats.scores, questionSeconds: stats.questionSeconds, improvement: stats.improvement,
      timeline: stats.attempts.map(({exam, ...attempt}) => attempt), rolling: stats.rolling,
      distribution: stats.bins, days: stats.days, stages: stats.stages,
      questionDays: stats.questionDays, hours: stats.hours,
      correlations: stats.correlations.map(({pairs, ...correlation}) => correlation)
    }
  };
}

const dateCell = at => Number.isFinite(at) ? { t: 'n', v: at / 86400000 + 25569, z: 'yyyy-mm-dd hh:mm:ss.000' } : null;
const metricCell = value => Number.isFinite(value) ? { t: 'n', v: value, z: '0.00' } : null;
const seconds = ms => Number.isFinite(ms) ? ms / 1000 : null;

export function performanceSheets(data) {
  const history = data.profile.history, stats = getStatistics(history);
  const rows = [], events = [];
  const timings = new Map(stats.questions.map(q => [`${q.examId}:${q.index}`, q]));
  for (const [round, exam] of history.entries()) {
    const grade = gradeExam(exam);
    exam.questions.forEach((q, i) => {
      const detail = timings.get(`${exam.id}:${i}`), time = exam.questionTimes?.[i];
      rows.push([round + 1, exam.id, i + 1, q.id, q.area, q.question,
        exam.answers[i] === null ? null : LETTERS[exam.answers[i]], LETTERS[q.correct],
        {correct:'Correcta',incorrect:'Incorrecta',unanswered:'Sin responder'}[grade.results[i].status],
        dateCell(detail?.at), detail?.seconds ?? null, seconds(time?.activeMs),
        detail?.minute ?? null, seconds(detail?.remainingMs), detail?.revisions ?? null,
        exam.timingCoverage || 'Sin registro']);
      for (const event of time?.events || []) {
        events.push([round + 1, exam.id, i + 1, q.id, event.kind === 'clear' ? 'Borrado' : 'Respuesta',
          event.answer === null ? null : LETTERS[event.answer], dateCell(event.at), event.at,
          event.localDay, event.weekday, event.hour, event.utcOffsetMinutes,
          seconds(event.activeMs), seconds(event.elapsedMs), seconds(event.remainingMs)]);
      }
    });
  }
  return [
    {name:'Resumen', widths:[35,30,18,82], rows:[
      ['Indicador','Valor','Unidad','Significado'],
      ['Alumno',data.user.name,null,null], ['Correo',data.user.email,null,null],
      ['Descargado el (UTC)',dateCell(data.generatedAt),null,'El archivo es una fotografía del historial al descargarlo.'],
      ['Respaldo de resultados',data.backup.state,null,'synced: confirmado; pending: copia local pendiente; syncing: subida en curso.'],
      ['Simulacros',stats.scores.count,'exámenes','Solo intentos finalizados.'],
      ['Media',metricCell(stats.scores.mean),'puntos / 100','Suma de puntuaciones dividida entre cantidad de exámenes.'],
      ['Mediana',metricCell(stats.scores.median),'puntos / 100','Valor central de las puntuaciones ordenadas.'],
      ['Desviación estándar',metricCell(stats.scores.sd),'puntos','Variabilidad de las puntuaciones alrededor de la media.'],
      ['Varianza',metricCell(stats.scores.variance),'puntos²','Promedio de las diferencias al cuadrado respecto de la media.'],
      ['Mejor resultado',stats.scores.max,'puntos / 100',null],
      ['Peor resultado',stats.scores.min,'puntos / 100',null],
      ['Cambio desde el inicio',stats.improvement,'puntos','Última puntuación menos la primera; vacío con menos de dos exámenes.'],
      ['Tiempo hasta responder',metricCell(stats.questionSeconds.mean),'segundos','Tiempo visible hasta la última elección conservada; excluye registros parciales.'],
      ['Registros de tiempo válidos',stats.questionSeconds.count,'preguntas',null],
      ['Examen en curso',data.profile.active ? 'Sí' : 'No',null,'El intento en curso está en el JSON completo y aún no forma parte de las estadísticas.'],
      ['Celdas vacías','Sin dato',null,'Los tiempos antiguos no registrados no se inventan ni se convierten en cero.'],
      ['Zona de fechas','UTC',null,'Eventos conserva además el día/hora y desplazamiento UTC originales.'],
      ['Interpretación','Práctica',null,'Las correlaciones no demuestran causalidad; preguntas y dificultad cambian entre rondas.'],
      ['Fuente','Historial de la cuenta',null,'Datos del navegador y del respaldo Supabase confirmado; mediciones no certificadas.']
    ]},
    {name:'Intentos',widths:[12,38,25,25,18,14,14,16,18,24,22,20],rows:[
      ['Intento','ID','Inicio (UTC)','Fin (UTC)','Puntuación / 100','Correctas','Incorrectas','Sin responder','Duración (s)','Finalización','Cobertura de tiempos','Media últimos 3'],
      ...stats.attempts.map((a,i) => {const g=gradeExam(a.exam);return [i+1,a.id,dateCell(a.startedAt),dateCell(a.at),a.score,g.correct,g.incorrect,g.unanswered,seconds(a.durationMs),{timeout:'Tiempo agotado',manual:'Manual'}[a.exam.finishReason] || 'Sin registro',a.exam.timingCoverage || 'Sin registro',metricCell(stats.rolling[i])];})
    ]},
    {name:'Preguntas',widths:[12,38,12,18,32,80,18,18,18,25,23,22,24,22,18,25],rows:[
      ['Intento','ID examen','Pregunta','ID pregunta','Materia','Enunciado','Respuesta A–E','Correcta A–E','Resultado','Respuesta final (UTC)','Hasta responder (s)','Visible total (s)','Minuto de respuesta','Tiempo restante (s)','Cambios','Cobertura de tiempos'],...rows
    ]},
    {name:'Eventos',widths:[12,38,12,18,18,18,25,22,18,20,20,24,22,22,22],rows:[
      ['Intento','ID examen','Pregunta','ID pregunta','Acción','Respuesta A–E','Instante (UTC)','Epoch UTC (ms)','Día local','Día semana 0=Dom','Hora local 0–23','Desplazamiento UTC (min)','Visible acumulado (s)','Transcurrido (s)','Restante (s)'],...events
    ]},
    {name:'Distribución',widths:[28,20],rows:[['Puntuación / 100','Cantidad de exámenes'],...stats.bins.map(b=>[b.label,b.count])]},
    {name:'Correlaciones',widths:[58,20,18,40],rows:[['Variables','Pearson r','Observaciones','Interpretación'],...stats.correlations.map(c=>[c.label,metricCell(c.r),c.n,c.r === null ? 'Sin variación o datos suficientes' : 'Asociación; no demuestra causa'])]}
  ];
}

export async function performanceWorkbook(data) {
  // Biblioteca mantenida, copia oficial local: no construir XML/ZIP a mano.
  const XLSX = await import('../vendor/xlsx-0.20.3.js');
  const workbook = XLSX.utils.book_new();
  for (const table of performanceSheets(data)) {
    if (table.rows.length > 1048576) throw new Error('El historial supera el máximo de filas de Excel. Descarga la copia JSON.');
    const sheet = XLSX.utils.aoa_to_sheet(table.rows);
    sheet['!cols'] = table.widths.map(wch => ({wch}));
    sheet['!autofilter'] = { ref: sheet['!ref'] };
    XLSX.utils.book_append_sheet(workbook,sheet,table.name);
  }
  workbook.Props = { Title:'Rendimiento CEAN', Subject:'Historial de simulacros de Derecho', Author:'CEAN', CreatedDate:new Date(data.generatedAt) };
  return { XLSX, workbook };
}

export async function downloadPerformanceExcel(data, filename) {
  const {XLSX,workbook} = await performanceWorkbook(data);
  XLSX.writeFileXLSX(workbook,filename,{compression:true});
}
