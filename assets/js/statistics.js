import { gradeExam } from './core.js';
import { calendarAt } from './timing.js';

export function summarize(values) {
  if (!values.length) return { count: 0, mean: null, median: null, variance: null, sd: null, min: null, max: null };
  const sorted = [...values].sort((a, b) => a - b), count = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / count;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / count;
  return { count, mean, median: count % 2 ? sorted[(count - 1) / 2] : (sorted[count / 2 - 1] + sorted[count / 2]) / 2,
    variance, sd: Math.sqrt(variance), min: sorted[0], max: sorted[count - 1] };
}
// Pearson r is undefined for constants or too few pairs; never display a fake zero.
export function pearson(pairs) {
  const data = pairs.filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (data.length < 3) return { n: data.length, r: null };
  const mx = summarize(data.map(p => p[0])).mean, my = summarize(data.map(p => p[1])).mean;
  let xy = 0, xx = 0, yy = 0;
  for (const [x, y] of data) { xy += (x - mx) * (y - my); xx += (x - mx) ** 2; yy += (y - my) ** 2; }
  return { n: data.length, r: xx > 0 && yy > 0 ? Math.max(-1, Math.min(1, xy / Math.sqrt(xx * yy))) : null };
}
export function distribution(scores) {
  const bins = Array.from({ length: 10 }, (_, i) => ({ label: `${i * 10}–${i === 9 ? 100 : i * 10 + 9}`, count: 0 }));
  scores.forEach(score => bins[Math.min(9, Math.floor(score / 10))].count++);
  return bins;
}
export function getStatistics(history) {
  const attempts = [...history].sort((a, b) => a.completedAt - b.completedAt || a.startedAt - b.startedAt).map((exam, i) => {
    const grade = gradeExam(exam), calendar = exam.startedCalendar || calendarAt(exam.startedAt);
    // Old attempts recorded active practice time, not their full wall-clock duration.
    return { id: exam.id, number: i + 1, at: exam.completedAt, startedAt: exam.startedAt,
      score: grade.percent, correct: grade.correct, answered: grade.total - grade.unanswered,
      durationMs: exam.timingVersion === 1 && Number.isFinite(exam.durationMs) ? exam.durationMs : null,
      calendar, exam };
  });
  const questions = [];
  for (const attempt of attempts) {
    const exam = attempt.exam;
    if (exam.timingVersion !== 1 || !Array.isArray(exam.questionTimes)) continue;
    exam.questions.forEach((q, index) => {
      const answer = exam.answers[index], time = exam.questionTimes[index];
      if (answer === null || !time || !time.events.length) return;
      const finalEvent = time.events.at(-1);
      if (finalEvent.kind !== 'answer' || finalEvent.answer !== answer) return;
      questions.push({ examId: exam.id, attempt: attempt.number, index, area: q.area,
        correct: answer === q.correct ? 1 : 0, seconds: finalEvent.activeMs / 1000, visibleSeconds: time.activeMs / 1000,
        minute: finalEvent.elapsedMs / 60000, at: finalEvent.at,
        firstAt: time.events.find(event => event.kind === 'answer')?.at,
        remainingMs: finalEvent.remainingMs, revisions: Math.max(0, time.events.filter(event => event.kind === 'answer').length - 1),
        calendar: { localDay: finalEvent.localDay, weekday: finalEvent.weekday, hour: finalEvent.hour, utcOffsetMinutes: finalEvent.utcOffsetMinutes },
        partial: exam.timingCoverage === 'partial' });
    });
  }
  const scores = attempts.map(a => a.score), rolling = scores.map((_, i) => summarize(scores.slice(Math.max(0, i - 2), i + 1)).mean);
  const days = Array.from({ length: 7 }, (_, i) => ({ label: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][i], count: 0, scores: [] }));
  attempts.forEach(attempt => { const d = days[attempt.calendar.weekday]; d.count++; d.scores.push(attempt.score); });
  const stages = Array.from({ length: 6 }, (_, i) => ({ label: `${i * 10}–${(i + 1) * 10} min`, count: 0, correct: 0, seconds: [] }));
  const questionDays = days.map(d => ({ label: d.label, count: 0, correct: 0 }));
  const hours = ['00–05 h', '06–11 h', '12–17 h', '18–23 h'].map(label => ({ label, count: 0, correct: 0 }));
  questions.forEach(q => { const s = stages[Math.min(5, Math.floor(q.minute / 10))]; s.count++; s.correct += q.correct; if (!q.partial) s.seconds.push(q.seconds); });
  questions.forEach(q => { for (const group of [questionDays[q.calendar.weekday], hours[Math.floor(q.calendar.hour / 6)]]) { group.count++; group.correct += q.correct; } });
  return { attempts, questions, scores: summarize(scores), bins: distribution(scores), rolling, days, stages, questionDays, hours,
    questionSeconds: summarize(questions.filter(q => !q.partial).map(q => q.seconds)),
    improvement: scores.length >= 2 ? scores.at(-1) - scores[0] : null,
    correlations: [
      { id: 'duration', label: 'Duración del examen y puntuación', unit: 'minutos', pairs: attempts.filter(a => a.durationMs !== null).map(a => [a.durationMs / 60000, a.score]) },
      { id: 'question-time', label: 'Tiempo por pregunta y acierto', unit: 'segundos', pairs: questions.filter(q => !q.partial).map(q => [q.seconds, q.correct]) },
      { id: 'stage', label: 'Minuto de respuesta y acierto', unit: 'minutos', pairs: questions.map(q => [q.minute, q.correct]) },
      { id: 'order', label: 'Número de intento y puntuación', unit: 'intento', pairs: attempts.map(a => [a.number, a.score]) }
    ].map(c => ({ ...c, ...pearson(c.pairs) })) };
}
