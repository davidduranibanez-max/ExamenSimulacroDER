import test from 'node:test';
import assert from 'node:assert/strict';
import { createExam, gradeExam, validateBank, flattenBanks, validExam, randomInt } from '../assets/js/core.js';
import { stepLife } from '../assets/js/life.js';

const pool = Array.from({ length: 250 }, (_, i) => ({ version:2, id:`q-${i}`, number:i+1, page:5, area:'Derecho', question:`Pregunta ${i}?`, correct:`Respuesta ${i}`, distractors:Array.from({length:100},(_,j)=>`Distractor propio ${i}-${j}`) }));
function seeded(seed) { return max => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return Math.floor(seed / 2**32 * max); }; }

test('100 preguntas únicas, cuatro distractores propios y una correcta en cada intento', () => {
  for (let n=1;n<=100;n++) {
    const exam = createExam(pool, seeded(n));
    assert.equal(exam.questions.length, 100); assert.equal(new Set(exam.questions.map(q=>q.id)).size,100);
    assert.ok(validExam(exam));
    for(const q of exam.questions) {
      const original=pool.find(o=>o.id===q.id);
      assert.equal(q.options.length,5); assert.equal(new Set(q.options).size,5);
      assert.equal(q.options[q.correct],original.correct);
      assert.equal(q.options.filter(o=>original.distractors.includes(o)).length,4);
    }
  }
});
test('las cinco posiciones correctas se usan y cada ronda cambia preguntas e incisos', () => {
  const positions=new Set(), a=createExam(pool,seeded(12)), b=createExam(pool,seeded(13));
  for(let n=1;n<30;n++) for(const q of createExam(pool,seeded(n)).questions) positions.add(q.correct);
  assert.deepEqual([...positions].sort(),[0,1,2,3,4]);
  assert.notDeepEqual(a.questions.map(q=>q.id),b.questions.map(q=>q.id));
  const shared=a.questions.find(q=>b.questions.some(other=>other.id===q.id));
  assert.notDeepEqual(shared.options,b.questions.find(q=>q.id===shared.id).options);
});
test('la calificación distingue aciertos, errores y pendientes sin modificar el examen', () => {
  const exam=createExam(pool,seeded(42));
  for(let i=0;i<40;i++) exam.answers[i]=exam.questions[i].correct;
  for(let i=40;i<70;i++) exam.answers[i]=(exam.questions[i].correct+1)%5;
  const snapshot=structuredClone(exam), grade=gradeExam(exam);
  assert.equal(grade.correct,40);assert.equal(grade.incorrect,30);assert.equal(grade.unanswered,30);assert.equal(grade.percent,40);
  assert.deepEqual(exam,snapshot);
});
test('un examen guardado mantiene el sorteo, el orden y las respuestas', () => {
  const exam=createExam(pool,seeded(8));exam.answers[3]=2;exam.current=3;exam.marked[5]=true;
  const restored=JSON.parse(JSON.stringify(exam));assert.ok(validExam(restored));assert.deepEqual(restored,exam);
  restored.current=100;assert.equal(validExam(restored),false);
});
test('el banco rechaza duplicados, correctas incluidas en distractores y preguntas incompletas', () => {
  assert.throws(()=>validateBank({...pool[0],distractors:['a','a','b','c']}));
  assert.throws(()=>validateBank({...pool[0],distractors:[pool[0].correct,'a','b','c']}));
  assert.throws(()=>validateBank({...pool[0],question:''}));
  assert.throws(()=>flattenBanks([pool[0],pool[0]]));
  assert.throws(()=>createExam(pool.slice(0,99)));
});
test('el sorteo criptográfico respeta los límites y rechaza rangos inválidos', () => {
  for(const max of [1,5,100,2018]) for(let i=0;i<300;i++) { const n=randomInt(max);assert.ok(Number.isInteger(n)&&n>=0&&n<max); }
  for(const max of [0,-1,NaN,1.5]) assert.throws(()=>randomInt(max));
});
test('Juego de la Vida: un oscilador vuelve a su estado tras dos generaciones', () => {
  const cells=new Uint8Array(25);cells[11]=cells[12]=cells[13]=1;
  const next=stepLife(cells,5,5);assert.equal(next[7],1);assert.equal(next[12],1);assert.equal(next[17],1);
  assert.deepEqual(stepLife(next,5,5),cells);assert.equal(next.reduce((a,b)=>a+b,0),3);
});
