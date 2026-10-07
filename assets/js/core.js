export const EXAM_SIZE = 100;
export const LETTERS = 'ABCDE';

// Rejection sampling avoids modulo bias. Randomness comes from the browser.
export function randomInt(max) {
  if (!Number.isSafeInteger(max) || max < 1 || max > 2 ** 32) throw new Error('Rango aleatorio inválido.');
  const limit = Math.floor(2 ** 32 / max) * max;
  const value = new Uint32Array(1);
  do { crypto.getRandomValues(value); } while (value[0] >= limit);
  return value[0] % max;
}

export function shuffle(values, pick = randomInt) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = pick(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function validateBank(q) {
  if (q.version !== 2 || !q.id || typeof q.question !== 'string' || !q.question.trim() || typeof q.correct !== 'string' || !q.correct.trim()) throw new Error(`Pregunta inválida: ${q.id || '?'}`);
  if (!Array.isArray(q.distractors) || q.distractors.length < 4 || q.distractors.length > 100) throw new Error(`Distractores inválidos: ${q.id}`);
  const choices = [q.correct, ...q.distractors];
  if (choices.some(text => typeof text !== 'string' || !text.trim()) || new Set(choices.map(text => text.trim().toLocaleLowerCase())).size !== choices.length) throw new Error(`Opciones repetidas o vacías: ${q.id}`);
  return q;
}

export function flattenBanks(banks) {
  const questions = banks.map(validateBank);
  if (new Set(questions.map(q => q.id)).size !== questions.length) throw new Error('Hay identificadores duplicados entre materias.');
  return questions;
}

export function createExam(pool, pick = randomInt, now = Date.now()) {
  if (pool.length < EXAM_SIZE) throw new Error(`El banco necesita al menos ${EXAM_SIZE} preguntas.`);
  const questions = shuffle(pool, pick).slice(0, EXAM_SIZE).map(q => {
    const wrong = shuffle(q.distractors, pick).slice(0, 4);
    const options = shuffle([q.correct, ...wrong], pick);
    return { id: q.id, number: q.number, page: q.page, area: q.area, question: q.question,
      options, correct: options.indexOf(q.correct) };
  });
  return { id: crypto.randomUUID(), startedAt: now, updatedAt: now, elapsedMs: 0, current: 0,
    questions, answers: Array(EXAM_SIZE).fill(null), marked: Array(EXAM_SIZE).fill(false) };
}

export function gradeExam(exam) {
  let correct = 0, incorrect = 0, unanswered = 0;
  const areas = {};
  const results = exam.questions.map((q, i) => {
    const answer = exam.answers[i];
    const status = answer === null ? 'unanswered' : answer === q.correct ? 'correct' : 'incorrect';
    if (status === 'correct') correct++;
    else if (status === 'incorrect') incorrect++;
    else unanswered++;
    areas[q.area] ||= { total: 0, correct: 0 };
    areas[q.area].total++;
    if (status === 'correct') areas[q.area].correct++;
    return { ...q, answer, status };
  });
  return { correct, incorrect, unanswered, total: exam.questions.length, percent: Math.round(correct / exam.questions.length * 100), areas, results };
}

export function validExam(exam) {
  if (!exam || !Array.isArray(exam.questions) || exam.questions.length !== EXAM_SIZE || !Array.isArray(exam.answers) || exam.answers.length !== EXAM_SIZE || !Array.isArray(exam.marked) || exam.marked.length !== EXAM_SIZE) return false;
  return Number.isInteger(exam.current) && exam.current >= 0 && exam.current < EXAM_SIZE && Number.isFinite(exam.elapsedMs) && exam.elapsedMs >= 0 &&
    new Set(exam.questions.map(q => q.id)).size === EXAM_SIZE && exam.questions.every(q => q.question && q.options?.length === 5 && Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 5) &&
    exam.answers.every(a => a === null || (Number.isInteger(a) && a >= 0 && a < 5));
}

export function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const h = Math.floor(seconds / 3600), m = Math.floor(seconds / 60) % 60, s = seconds % 60;
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}
