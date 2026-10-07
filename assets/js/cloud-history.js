import { validExam } from './core.js';

export function mergeHistory(local, remote) {
  const attempts = new Map(local.map(exam => [exam.id, exam]));
  for (const exam of remote) {
    if (!validExam(exam) || !Number.isFinite(exam.completedAt)) throw new Error('El respaldo contiene un examen inválido.');
    attempts.set(exam.id, exam);
  }
  return [...attempts.values()].sort((a, b) => a.completedAt - b.completedAt || a.id.localeCompare(b.id));
}

// Un estado por identidad, sin tokens ni datos de otros alumnos en disco.
export function createCloudHistory(getClient) {
  const states = new Map();
  return async function synchronize(userId, history, refresh = false) {
    if (!/^supabase:[0-9a-f-]{36}$/i.test(userId)) throw new Error('Perfil sin identidad Google.');
    const uid = userId.slice(9);
    const client = await getClient();
    if (!client) throw new Error('Sin conexión con Supabase.');
    const state = states.get(userId) || { loaded: false, exams: new Map() };
    states.set(userId, state);
    if (!state.loaded || refresh) {
      const downloaded = [];
      for (let offset = 0;; offset += 50) {
        const { data, error } = await client.from('cean_exam_attempts').select('id,exam')
          .eq('user_id', uid).order('id').range(offset, offset + 49).abortSignal(AbortSignal.timeout(15000));
        if (error) throw error;
        if (!Array.isArray(data)) throw new Error('Respuesta de respaldo inválida.');
        for (const row of data) {
          if (row.id !== row.exam?.id) throw new Error('Identificador de respaldo inválido.');
          downloaded.push(row.exam);
        }
        if (data.length < 50) break;
      }
      mergeHistory([], downloaded); // Validar antes de aceptar una página parcial.
      for (const exam of downloaded) state.exams.set(exam.id, exam);
      state.loaded = true;
    }
    for (const exam of history) {
      if (state.exams.has(exam.id)) continue;
      if (!validExam(exam) || !Number.isFinite(exam.completedAt)) throw new Error('Solo se respaldan exámenes terminados válidos.');
      const { data, error } = await client.rpc('cean_save_attempt', { attempt: exam }).abortSignal(AbortSignal.timeout(15000));
      if (error) throw error;
      if (data?.id !== exam.id || !validExam(data) || !Number.isFinite(data.completedAt)) throw new Error('Supabase no confirmó el guardado.');
      state.exams.set(exam.id, data);
    }
    return mergeHistory(history, [...state.exams.values()]);
  };
}
