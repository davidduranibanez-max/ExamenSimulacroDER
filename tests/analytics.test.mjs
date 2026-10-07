import test from 'node:test';
import assert from 'node:assert/strict';
import { createExam, validExam } from '../assets/js/core.js';
import { initializeTiming, remainingTime, timerElapsed, visitQuestion, accrueVisibleTime, recordResponse, completeAttempt, EXAM_DURATION_MS } from '../assets/js/timing.js';
import { summarize, pearson, distribution, getStatistics } from '../assets/js/statistics.js';

const now = Date.UTC(2026, 9, 7, 12);
const pool = Array.from({ length: 100 }, (_, i) => ({ id: `test-${i}`, number: i, page: 1, area: 'Derecho', question: `Pregunta ${i}`, correct: `Correcta ${i}`, distractors: ['a', 'b', 'c', 'd'] }));
const exam = () => createExam(pool, () => 0, now);

test('la hora vence aunque se salga y una recarga no restablece el plazo', () => {
  const a = exam();
  assert.equal(remainingTime(a, now), EXAM_DURATION_MS);
  initializeTiming(a, now + 900000);
  assert.equal(a.deadlineAt, now + EXAM_DURATION_MS);
  assert.equal(remainingTime(structuredClone(a), now + 900000), 2700000);
  assert.equal(remainingTime(a, now + EXAM_DURATION_MS + 1000), 0);
  assert.equal(recordResponse(a, 1, now + EXAM_DURATION_MS), false);
  assert.equal(a.answers[0], null);
  const completed = completeAttempt(a, now + EXAM_DURATION_MS + 40000);
  assert.equal(completed.completedAt, a.deadlineAt);
  assert.equal(completed.durationMs, EXAM_DURATION_MS);
  assert.equal(completed.finishReason, 'timeout');
});
test('el registro conserva visitas, respuestas, cambios y borrado con milisegundos', () => {
  const a = exam(); visitQuestion(a, now);
  accrueVisibleTime(a, 2250, now + 2250);
  assert.ok(recordResponse(a, 1, now + 2250));
  accrueVisibleTime(a, 750, now + 3000);
  recordResponse(a, null, now + 3000);
  recordResponse(a, 2, now + 3100);
  assert.deepEqual(a.questionTimes[0].events.map(e => e.kind), ['answer', 'clear', 'answer']);
  assert.equal(a.questionTimes[0].events[0].at, now + 2250);
  assert.equal(a.questionTimes[0].events[0].remainingMs, EXAM_DURATION_MS - 2250);
  a.current = 1; visitQuestion(a, now + 3100);
  accrueVisibleTime(a, 0, now + 11000); // a hidden tab consumes the deadline, not study time
  assert.equal(a.questionTimes[1].activeMs, 0);
  assert.equal(a.elapsedMs, 3000);
  assert.equal(timerElapsed(a, now + 11000), 11000);
  assert.ok(validExam(a));
  const copy = structuredClone(a); copy.questionTimes[0].events[0].elapsedMs = -1;
  assert.equal(validExam(copy), false);
});
test('el tiempo visible se recorta al vencimiento y un reloj hacia atrás no regala minutos', () => {
  const a = exam(); a.observedAt = a.deadlineAt - 1000;
  accrueVisibleTime(a, 5000, a.deadlineAt + 4000);
  assert.equal(a.questionTimes[0].activeMs, 1000);
  assert.equal(remainingTime(a, now), 0);
});
test('un intento antiguo conserva sus respuestas y recibe solo el tiempo restante', () => {
  const old = { ...exam(), elapsedMs: 1200000 };
  for (const key of ['schemaVersion', 'timingVersion', 'questionTimes', 'deadlineAt', 'observedAt', 'timeLimitMs', 'timingCoverage', 'timingStartedAt', 'startedCalendar']) delete old[key];
  old.answers[0] = 2;
  const before = structuredClone(old.questions);
  initializeTiming(old, now + 10000000);
  assert.deepEqual(old.questions, before); assert.equal(old.answers[0], 2);
  assert.equal(old.timingCoverage, 'partial');
  assert.equal(remainingTime(old, now + 10000000), 2400000);
  assert.equal(old.questionTimes[0].events.length, 0);
  accrueVisibleTime(old, 1000, now + 10001000);
  recordResponse(old, 1, now + 10001000);
  const stats = getStatistics([completeAttempt(old, now + 10002000)]);
  assert.equal(stats.questions.length, 1);
  assert.equal(stats.questionSeconds.mean, null);
  assert.equal(stats.correlations.find(c => c.id === 'question-time').n, 0);
});
test('mediana, varianza poblacional y Pearson usan resultados conocidos', () => {
  assert.deepEqual(summarize([10, 20, 30, 40]), { count: 4, mean: 25, median: 25, variance: 125, sd: Math.sqrt(125), min: 10, max: 40 });
  assert.equal(summarize([9]).sd, 0); assert.equal(summarize([]).mean, null);
  assert.equal(pearson([[1, 1], [2, 2], [3, 3]]).r, 1);
  assert.equal(pearson([[1, 3], [2, 2], [3, 1]]).r, -1);
  assert.equal(pearson([[1, 1], [2, 1], [3, 1]]).r, null);
  assert.equal(pearson([[1, 2], [2, 3]]).r, null);
  const bins = distribution([0, 9, 10, 99, 100]);
  assert.equal(bins[0].count, 2); assert.equal(bins[1].count, 1); assert.equal(bins[9].count, 2);
});
test('estadísticas mezclan historial antiguo sin inventar tiempos ni contar respuestas borradas', () => {
  const a = exam(); visitQuestion(a, now); accrueVisibleTime(a, 1000, now + 1000);
  recordResponse(a, a.questions[0].correct, now + 1000);
  a.current = 1; recordResponse(a, 2, now + 2000); recordResponse(a, null, now + 2100);
  const completed = completeAttempt(a, now + 3000), old = structuredClone(completed);
  old.id = 'old'; old.completedAt = now - 10000; old.answers[0] = null;
  for (const key of ['timingVersion', 'questionTimes', 'durationMs']) delete old[key];
  const before = JSON.stringify([completed, old]), s = getStatistics([completed, old]);
  assert.equal(s.attempts[0].id, 'old'); assert.equal(s.scores.mean, 0.5);
  assert.equal(s.questions.length, 1); assert.equal(s.questions[0].correct, 1);
  assert.equal(s.questions[0].seconds, 1); assert.equal(s.correlations[0].n, 1);
  assert.equal(s.improvement, 1); assert.equal(s.rolling[1], 0.5);
  assert.equal(JSON.stringify([completed, old]), before);
});
