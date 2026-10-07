import { validExam } from './core.js';
import { calendarAt } from './timing.js';
export function createRemoteExams(getClient) {
  const revisions = new Map(), lastSaves = new Map();
  async function rpc(name,args={}) {
    const client=await getClient();
    if(!client) throw new Error('Necesitas conexión con Supabase para iniciar, guardar y corregir el examen.');
    const {data,error}=await client.rpc(name,args).abortSignal(AbortSignal.timeout(20000));
    if(error) {
      if(['PGRST202','42883'].includes(error.code)) throw new Error('El docente debe instalar private-bank.sql e importar el banco en Supabase.');
      if(error.code==='40001') {
        const conflict = new Error('Otro dispositivo actualizó el examen. Guarda una copia y vuelve a entrar para recuperar la versión del servidor.');
        conflict.code='40001'; throw conflict;
      }
      throw new Error(error.message || 'Supabase no confirmó la operación. Conserva tu copia y reintenta.');
    }
    return data;
  }
  function accept(exam) {
    if(!validExam(exam) || exam.remote!==true || !Number.isInteger(exam.remoteRevision) || exam.remoteRevision<0
      || !Number.isFinite(exam.startedAt) || !/^[0-9a-f-]{36}$/i.test(exam.id)) throw new Error('Supabase devolvió un examen inválido.');
    revisions.set(exam.id,exam.remoteRevision);
    exam.startedCalendar ||= calendarAt(exam.startedAt);
    return exam;
  }
  function progress(exam) {
    return {answers:exam.answers,marked:exam.marked,current:exam.current,elapsedMs:exam.elapsedMs,
      questionTimes:exam.questionTimes,startedCalendar:exam.startedCalendar};
  }
  return {
    async current() {const exam=await rpc('cean_current_exam');return exam ? accept(exam) : null;},
    async start() {return accept(await rpc('cean_start_exam'));},
    async save(exam,force=false) {
      if(!exam.remote) return;
      if(!force && Date.now()-(lastSaves.get(exam.id)||0)<15000) return;
      const data=await rpc('cean_store_progress',{exam_id:exam.id,progress:progress(exam),expected_revision:revisions.get(exam.id) ?? exam.remoteRevision});
      if(!Number.isInteger(data?.revision) || typeof data.accepted!=='boolean') throw new Error('No se confirmó el progreso remoto.');
      revisions.set(exam.id,data.revision);exam.remoteRevision=data.revision;
      lastSaves.set(exam.id,Date.now());
      if(!data.accepted) throw new Error('La hora terminó. Finaliza para recuperar la corrección del servidor.');
    },
    async finish(exam) {
      const result=await rpc('cean_finish_exam',{exam_id:exam.id,progress:progress(exam),expected_revision:revisions.get(exam.id) ?? exam.remoteRevision});
      if(!result?.serverVerified || !Number.isFinite(result.completedAt)) throw new Error('No se confirmó la corrección remota.');
      return accept(result);
    }
  };
}
export const remoteExams = createRemoteExams(async()=> (await import('./supabase-client.js')).supabaseReady);
