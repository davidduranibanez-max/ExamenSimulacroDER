import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloudHistory, mergeHistory } from '../assets/js/cloud-history.js';
import { createExam } from '../assets/js/core.js';
import { completeAttempt, accrueVisibleTime, visitQuestion, recordResponse } from '../assets/js/timing.js';
import { getStatistics } from '../assets/js/statistics.js';
const uid = 'a0000000-0000-4000-8000-000000000001', other = 'a0000000-0000-4000-8000-000000000002';
const pool = Array.from({length:100}, (_,i) => ({ id:`q${i}`, number:i+1, page:1, area:'Derecho', question:`Pregunta ${i}`, correct:'Correcta', distractors:['A','B','C','D'] }));
function attempt() { return completeAttempt(createExam(pool), Date.now()); }
function backend() {
  const rows = new Map(), calls = []; let fail = false;
  const client = {
    from(table) {
      assert.equal(table,'cean_exam_attempts');
      let owner, first, last;
      const query = {
        select() { return query; }, eq(key,value) { assert.equal(key,'user_id'); owner=value; return query; }, order() {return query;},
        range(a,b) {first=a;last=b;return query;},
        async abortSignal() { if(fail) return {error:{code:'offline'}}; calls.push(['read',owner]); return {data:[...(rows.get(owner)||new Map()).values()].slice(first,last+1).map(exam=>({id:exam.id,exam}))}; }
      }; return query;
    },
    rpc(name,{attempt:exam}) {
      assert.equal(name,'cean_save_attempt'); calls.push(['write',exam.id]);
      return {async abortSignal() {
        if(fail) return {error:{code:'offline'}};
        const mine=rows.get(uid)||new Map();rows.set(uid,mine);
        if(!mine.has(exam.id))mine.set(exam.id,structuredClone(exam));
        return {data:mine.get(exam.id)};
      }};
    }
  };
  return {client,rows,calls,setFail(value){fail=value;}};
}
test('respaldo idempotente, copia exacta y recuperación desde otro dispositivo',async()=>{
  const b=backend(), sync=createCloudHistory(async()=>b.client), exam=attempt(), original=structuredClone(exam);
  assert.deepEqual(await sync(`supabase:${uid}`,[exam]),[exam]);
  await sync(`supabase:${uid}`,[exam]);
  assert.equal(b.calls.filter(x=>x[0]==='write').length,1);
  assert.deepEqual(exam,original);
  assert.deepEqual(await createCloudHistory(async()=>b.client)(`supabase:${uid}`,[]),[exam]);
});
test('la consulta se limita al UUID y pagina historiales mayores de 50',async()=>{
  const b=backend(), exams=Array.from({length:51},attempt);b.rows.set(uid,new Map(exams.map(x=>[x.id,x])));
  const sync=createCloudHistory(async()=>b.client);
  assert.equal((await sync(`supabase:${uid}`,[])).length,51);
  assert.equal(b.calls.length,2);
  assert.deepEqual(await sync(`supabase:${other}`,[]),[]);
  assert.equal(b.calls.at(-1)[1],other);
});
test('fallo de red conserva originales y permite reintentar',async()=>{
  const b=backend(), sync=createCloudHistory(async()=>b.client), exam=attempt(), original=structuredClone(exam);
  b.setFail(true);await assert.rejects(sync(`supabase:${uid}`,[exam]));assert.deepEqual(exam,original);
  b.setFail(false);assert.equal((await sync(`supabase:${uid}`,[exam])).length,1);
});
test('rechaza respaldos corruptos y perfiles sin UUID; un resultado remoto prevalece sin duplicarse',async()=>{
  const b=backend(), sync=createCloudHistory(async()=>b.client), exam=attempt();
  await assert.rejects(sync('legacy-user',[exam]));
  b.rows.set(uid,new Map([[exam.id,{...exam,answers:[]}]]));
  await assert.rejects(sync(`supabase:${uid}`,[]));
  const local=structuredClone(exam);local.answers[0]=0;
  assert.deepEqual(mergeHistory([local],[exam]),[exam]);
});

test('recuperar JSON en otro dispositivo conserva todas las estadísticas y eventos',async()=>{
  const history = [20,40,60].map((correct, round) => {
    const start = 1790000000000 + round * 86400000;
    const exam = createExam(pool, undefined, start);
    for (let i = 0; i < 80; i++) {
      exam.current = i;
      const at = start + (i + 1) * 10000;
      visitQuestion(exam, at - 4000);
      accrueVisibleTime(exam, 1000 + i * 20, at - 1000);
      recordResponse(exam, (exam.questions[i].correct + 1) % 5, at);
      if (i < correct) recordResponse(exam, exam.questions[i].correct, at + 500);
    }
    exam.current = 90;
    visitQuestion(exam, start + 900000);
    recordResponse(exam, 0, start + 901000);
    recordResponse(exam, null, start + 902000);
    return completeAttempt(exam, start + 1000000 + round * 100000);
  });
  const b=backend();
  await createCloudHistory(async()=>b.client)(`supabase:${uid}`,history);
  // Igual que el transporte HTTP/JSONB: sin referencias compartidas en memoria.
  b.rows.set(uid,new Map(JSON.parse(JSON.stringify([...b.rows.get(uid)]))));
  const recovered=await createCloudHistory(async()=>b.client)(`supabase:${uid}`,[]);
  assert.deepEqual(getStatistics(recovered),getStatistics(history));
  assert.deepEqual(recovered.map(x=>x.questionTimes),history.map(x=>x.questionTimes));
  assert.equal(getStatistics(recovered).scores.mean,40);
  assert.equal(getStatistics(recovered).questions.length,240);
});
