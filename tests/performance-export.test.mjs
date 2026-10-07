import test from 'node:test';
import assert from 'node:assert/strict';
import { performancePackage, performanceWorkbook } from '../assets/js/performance-export.js';
import { createExam } from '../assets/js/core.js';
import { recordResponse, accrueVisibleTime, completeAttempt } from '../assets/js/timing.js';
const pool = Array.from({length:100},(_,i)=>({id:`q${i}`,number:i+1,page:1,area:'Ética',question:`Pregunta ${i}: ¿qué significa?`,correct:'Correcta',distractors:['A','B','C','D']}));
function fixture() {
  const start=1790000000000,exam=createExam(pool,undefined,start);
  accrueVisibleTime(exam,1500,start+2000);
  recordResponse(exam,(exam.questions[0].correct+1)%5,start+2500);
  recordResponse(exam,exam.questions[0].correct,start+3000);
  return {active:null,history:[completeAttempt(exam,start+60000)]};
}
test('el paquete conserva eventos, estadísticas, versión y copia independiente sin credenciales',()=>{
  const profile=fixture(),before=structuredClone(profile);
  const pack=performancePackage({name:'Alumno',username:'alumno@example.com',access_token:'secret',password:'secret'},profile,1790000100000,'synced');
  assert.equal(pack.format,'cean-performance');assert.equal(pack.version,2);
  assert.equal(pack.statistics.scores.mean,1);
  assert.deepEqual(pack.profile,profile);assert.deepEqual(profile,before);
  assert.equal(JSON.stringify(pack).includes('secret'),false);
  pack.profile.history[0].answers[0]=null;
  assert.deepEqual(profile,before);
});
test('Excel real conserva números, milisegundos, acentos, eventos y textos sin ejecutarlos como fórmulas',async()=>{
  const pack=performancePackage({name:'=HYPERLINK("https://example.invalid")',username:'alumno@example.com'},fixture());
  const {XLSX,workbook}=await performanceWorkbook(pack);
  const bytes=XLSX.write(workbook,{type:'buffer',bookType:'xlsx',compression:true});
  const restored=XLSX.read(bytes,{type:'buffer',cellDates:false});
  assert.deepEqual(restored.SheetNames,['Resumen','Intentos','Preguntas','Eventos','Distribución','Correlaciones']);
  assert.equal(restored.Sheets.Resumen.B2.v,pack.user.name);assert.equal(restored.Sheets.Resumen.B2.t,'s');assert.equal(restored.Sheets.Resumen.B2.f,undefined);
  assert.equal(restored.Sheets.Intentos.E2.v,1);assert.equal(restored.Sheets.Intentos.I2.v,60);
  assert.equal(restored.Sheets.Preguntas.E2.v,'Ética');assert.equal(restored.Sheets.Preguntas.K2.v,1.5);
  assert.equal(restored.Sheets.Eventos.H3.v,pack.profile.history[0].questionTimes[0].events[1].at);
  assert.ok(Math.abs((restored.Sheets.Eventos.G3.v-25569)*86400000-restored.Sheets.Eventos.H3.v)<1);
  for (const sheet of Object.values(restored.Sheets)) for (const [key,cell] of Object.entries(sheet)) if(!key.startsWith('!')) assert.notEqual(cell.t,'e');
});
test('Excel deja tiempos desconocidos vacíos en intentos antiguos',async()=>{
  const profile=fixture();const old=profile.history[0];delete old.timingVersion;delete old.questionTimes;delete old.durationMs;delete old.timingCoverage;delete old.finishReason;
  const {workbook}=await performanceWorkbook(performancePackage({name:'Alumno',username:'alumno@example.com'},profile));
  assert.equal(workbook.Sheets.Intentos.I2,undefined);
  assert.equal(workbook.Sheets.Intentos.J2.v,'Sin registro');
  assert.equal(workbook.Sheets.Preguntas.K2,undefined);
});
