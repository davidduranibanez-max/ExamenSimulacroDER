import test from 'node:test';
import assert from 'node:assert/strict';
import { createExam, gradeExam, validExam } from '../assets/js/core.js';
import { completeAttempt } from '../assets/js/timing.js';
import { createRemoteExams } from '../assets/js/remote-exam.js';
const pool = Array.from({length:100}, (_,i)=>({id:`q${i}`, number:i+1,page:1,area:'Prueba',question:`Pregunta ficticia ${i}`,correct:'Correcta',distractors:['A','B','C','D']}));
function fixture() {
  const secret=createExam(pool), blind={...structuredClone(secret),remote:true,remoteRevision:0};
  blind.questions.forEach(q=>{q.correct=null;});
  return {secret,blind};
}
test('la sesión remota admite preguntas sin claves y rechaza corrección anticipada o resultados incompletos',()=>{
  const {blind}=fixture();assert.ok(validExam(blind));assert.throws(()=>gradeExam(blind),/Supabase/);
  assert.equal(validExam({...blind,completedAt:Date.now()}),false);
  assert.equal(validExam({...blind,remote:false}),false);
});
test('guardar envía solo progreso y controla revisión, frecuencia y confirmación del servidor',async()=>{
  const {blind}=fixture(),calls=[];
  const remote=createRemoteExams(async()=>({rpc(name,args){calls.push({name,args:structuredClone(args)});return {abortSignal:async()=>({data:name==='cean_start_exam'?structuredClone(blind):{revision:3,accepted:true}})};}}));
  const live=await remote.start();live.answers[1]=2;
  await remote.save(live,true);assert.equal(live.remoteRevision,3);
  const sent=calls.at(-1).args;assert.equal(sent.expected_revision,0);assert.equal(sent.progress.answers[1],2);
  for(const key of ['questions','correct','user_id','deadlineAt','startedAt'])assert.equal(Object.hasOwn(sent.progress,key),false);
  await remote.save(live);assert.equal(calls.length,2);
  await remote.save(live,true);assert.equal(calls.at(-1).args.expected_revision,3);
});
test('finalizar exige calificación remota completa; una respuesta fallida no modifica el intento local',async()=>{
  const {secret,blind}=fixture(),original=structuredClone(blind);
  const final={...completeAttempt(secret,Date.now()),remote:true,remoteRevision:1,serverVerified:true};
  let fail=true;
  const remote=createRemoteExams(async()=>({rpc(){return {abortSignal:async()=>fail?{error:{message:'offline'}}:{data:structuredClone(final)}};}}));
  await assert.rejects(remote.finish(blind),/offline/);assert.deepEqual(blind,original);
  fail=false;const result=await remote.finish(blind);assert.ok(validExam(result));assert.equal(result.serverVerified,true);assert.doesNotThrow(()=>gradeExam(result));
});
test('fallo de instalación, conflicto de otro dispositivo y plazo vencido se comunican sin abrir acceso local',async()=>{
  const {blind}=fixture();
  for(const [code,message] of [['PGRST202',/private-bank.sql/],['40001',/Otro dispositivo/]]) {
    const remote=createRemoteExams(async()=>({rpc:()=>({abortSignal:async()=>({error:{code}})})}));
    await assert.rejects(remote.start(),message);
  }
  const remote=createRemoteExams(async()=>({rpc:()=>({abortSignal:async()=>({data:{revision:0,accepted:false}})})}));
  await assert.rejects(remote.save(blind,true),/hora terminó/);
});
