// The deadline is wall-clock time; question study time only counts visible activity.
export const EXAM_DURATION_MS = 60 * 60 * 1000;
export function calendarAt(at) {
  const d = new Date(at), pad = n => String(n).padStart(2, '0');
  return { localDay: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    weekday: d.getDay(), hour: d.getHours(), utcOffsetMinutes: -d.getTimezoneOffset() };
}
export function initializeTiming(exam, now = Date.now()) {
  if (exam.timingVersion === 1) return exam;
  const legacy = exam.schemaVersion !== 2;
  Object.assign(exam, { timingVersion: 1, timingCoverage: legacy ? 'partial' : 'complete',
    timeLimitMs: EXAM_DURATION_MS,
    deadlineAt: legacy ? now + Math.max(0, EXAM_DURATION_MS - exam.elapsedMs) : exam.startedAt + EXAM_DURATION_MS,
    observedAt: now, timingStartedAt: now, startedCalendar: calendarAt(exam.startedAt),
    questionTimes: exam.questions.map(() => ({ activeMs: 0, firstViewedAt: null, lastViewedAt: null, events: [] })) });
  return exam;
}
export function observedNow(exam, now = Date.now()) {
  exam.observedAt = Math.max(exam.observedAt || now, now);
  return exam.observedAt;
}
export function remainingTime(exam, now = Date.now()) {
  return Math.max(0, exam.deadlineAt - Math.max(exam.observedAt || now, now));
}
export function timerElapsed(exam, now = Date.now()) {
  return Math.min(exam.timeLimitMs, Math.max(0, exam.timeLimitMs - remainingTime(exam, now)));
}
export function visitQuestion(exam, now = Date.now()) {
  const at = Math.min(observedNow(exam, now), exam.deadlineAt), q = exam.questionTimes[exam.current];
  q.firstViewedAt ??= at; q.lastViewedAt = at;
}
export function accrueVisibleTime(exam, deltaMs, now = Date.now()) {
  const previous = exam.observedAt, at = observedNow(exam, now);
  const available = Math.max(0, exam.deadlineAt - previous);
  const delta = Math.min(Math.max(0, deltaMs), available);
  exam.elapsedMs += delta; exam.questionTimes[exam.current].activeMs += delta;
  exam.updatedAt = Math.min(at, exam.deadlineAt);
}
export function recordResponse(exam, answer, now = Date.now()) {
  const at = observedNow(exam, now);
  if (at >= exam.deadlineAt) return false;
  const q = exam.questionTimes[exam.current];
  if (exam.answers[exam.current] === answer) return true;
  q.events.push({ kind: answer === null ? 'clear' : 'answer', answer, at,
    activeMs: q.activeMs, elapsedMs: timerElapsed(exam, at), remainingMs: remainingTime(exam, at),
    ...calendarAt(at) });
  exam.answers[exam.current] = answer; exam.updatedAt = at;
  return true;
}
export function completeAttempt(exam, now = Date.now(), automatic = false) {
  const at = observedNow(exam, now), expired = automatic || remainingTime(exam, at) === 0;
  return { ...structuredClone(exam), completedAt: expired ? exam.deadlineAt : at,
    durationMs: timerElapsed(exam, at), finishReason: expired ? 'timeout' : 'manual' };
}
