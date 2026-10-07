import { createExam, gradeExam, flattenBanks, shuffle, formatTime, LETTERS } from './core.js';
import { initLife } from './life.js';
import * as store from './storage.js';
import * as auth from './auth.js';
import { initializeTiming, remainingTime, visitQuestion, accrueVisibleTime, recordResponse, completeAttempt } from './timing.js';
import { statisticsHtml } from './statistics-view.js';

const main = document.querySelector('#main'), nav = document.querySelector('#header-nav'), dialog = document.querySelector('#modal');
let user = null, profile = null, manifest = null;
let view = 'auth', active = null, review = null, reviewIndex = 0, filter = 'all';
let releaseLock = null, tickInterval = null, lastTick = null, saving = Promise.resolve(), toastTimer;
let saveFailed = false, busy = false, mapExpanded = false, reviewGrade = null;
let clockWasVisible = false, lastSaveTick = 0, expirySaveFailed = false;
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const button = (text, action, cls = '', extra = '') => `<button type="button" class="btn ${cls}" data-action="${action}" ${extra}>${text}</button>`;
const date = value => new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short' }).format(value);

function toast(message, error = false) {
  const element = document.querySelector('#toast');
  element.textContent = message; element.classList.toggle('error', error); element.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { element.hidden = true; }, error ? 9000 : 4500);
}
function setView(next) { view = next; document.body.dataset.view = next; renderNav(); }
function renderNav() {
  nav.innerHTML = user ? `<button type="button" class="nav-link ${view === 'landing' ? 'active' : ''}" data-action="home">Inicio</button><button type="button" class="nav-link ${view === 'history' ? 'active' : ''}" data-action="history">Mi historial</button><button type="button" class="nav-link ${view === 'statistics' ? 'active' : ''}" data-action="statistics">Mis estadísticas</button><div class="user-pill"><span class="avatar">${e(user.name[0].toUpperCase())}</span><span>${e(user.name)}</span></div><button type="button" class="nav-link" data-action="logout">Salir</button>` : '<span class="auth-nav"><span class="mini-dot"></span>TU PRÓXIMO PASO</span>';
}
function hero() {
  return `<section class="hero"><div class="eyebrow">PREPÁRATE PARA INGRESAR A DERECHO</div><h1>SIMULACRO<span>EXAMEN</span></h1><p class="hero-copy">Practica hoy. Llega con confianza.<br>Un nuevo examen cada vez que comienzas.</p><div class="hero-bottom"><div class="hero-stat"><strong>${manifest ? manifest.total.toLocaleString('es-BO') : '—'}</strong><span>preguntas en el banco</span></div><div class="hero-stat"><strong>100</strong><span>por simulacro</span></div><div class="hero-stat"><strong>5</strong><span>opciones · A–E</span></div></div><div class="hero-footnote"><span class="pixel-cross" aria-hidden="true"></span>Banco del curso preuniversitario · UMSA</div></section>`;
}
function renderAuth() {
  setView('auth');
  main.innerHTML = `<div class="hero-layout">${hero()}<section class="pixel-panel"><div class="panel-topline"><span>ESPACIO DEL POSTULANTE</span><span class="pixel-cross" aria-hidden="true"></span></div><div class="auth-card"><h2>Retoma tu preparación.</h2><p class="subtext auth-intro">Entra con el correo y la contraseña de tu cuenta habilitada en CEAN.</p><form id="auth-form" aria-label="Iniciar sesión"><label class="form-field">Correo electrónico<input name="email" type="email" autocomplete="username" placeholder="tu.correo@ejemplo.com" required maxlength="254" autocapitalize="none" spellcheck="false"></label><label class="form-field">Contraseña<div class="password-wrap"><input id="password" name="password" type="password" autocomplete="current-password" placeholder="Tu contraseña" required maxlength="200"><button type="button" class="show-password" data-action="password" aria-label="Mostrar contraseña">VER</button></div></label><p id="auth-error" class="form-message" role="alert" hidden></p><button class="btn btn-primary btn-full" type="submit">ENTRAR</button></form><p class="privacy-note"><strong>Tu historial vive en este navegador.</strong> Tus resultados se guardan en este dispositivo. Puedes exportar una copia desde tu historial o tus estadísticas.</p></div></section></div>`;
}
async function renderLanding() {
  await refreshProfile(); setView('landing');
  const history = profile.history, scores = history.map(exam => gradeExam(exam).percent);
  main.innerHTML = `<div class="hero-layout">${hero()}<section class="pixel-panel"><div class="panel-topline"><span>HOLA, ${e(user.name.toUpperCase())}</span><span class="pixel-cross" aria-hidden="true"></span></div><div class="session-card"><div class="icon-block" aria-hidden="true">✦</div><h2>${profile.active ? 'Tu examen te espera.' : 'Ponte a prueba.'}</h2><p class="subtext">${profile.active ? `Tienes ${profile.active.answers.filter(a => a !== null).length} de 100 preguntas respondidas. Continúa donde lo dejaste.` : '100 preguntas. Cinco alternativas.<br>Todo listo para tu siguiente intento.'}</p><dl class="session-specs"><div><dt>Selección</dt><dd>100 al azar</dd></div><div><dt>Alternativas</dt><dd>A · B · C · D · E</dd></div><div><dt>Duración</dt><dd>60 minutos</dd></div><div><dt>Progreso</dt><dd>Guardado automático</dd></div></dl><div class="landing-actions">${button(profile.active ? 'CONTINUAR EXAMEN' : 'COMENZAR', profile.active ? 'resume' : 'start', 'btn-primary btn-full')}</div><p class="session-rule" style="margin-top:24px">Tienes una hora desde que comienzas. El tiempo sigue corriendo al salir; al agotarse, el examen se corrige automáticamente.</p></div></section></div><div class="landing-lower"><div class="stat-card"><span class="label">Simulacros completados</span><div class="value">${history.length.toString().padStart(2, '0')}</div></div><div class="stat-card"><span class="label">Tu mejor resultado</span><div class="value">${scores.length ? Math.max(...scores) : '—'}<small>${scores.length ? ' / 100' : ''}</small></div></div><div class="stat-card"><span class="label">Promedio de aciertos</span><div class="value">${scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : '—'}<small>${scores.length ? ' %' : ''}</small></div></div></div><details class="bank-notice"><summary>Acerca del banco y las alternativas de práctica</summary><p>Las preguntas y sus respuestas proceden del PDF que proporcionó CEAN. Los 100 distractores propios de cada pregunta se elaboraron para practicar y están pendientes de revisión docente. Este simulador no establece un puntaje oficial de admisión. Cada intento sortea 100 preguntas, cuatro distractores por pregunta y el orden de A a E.</p></details>`;
}
async function loadBank() {
  const selected = shuffle(manifest.questions).slice(0, 100), banks = new Array(selected.length);
  let next = 0, completed = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (next < selected.length) {
      const index = next++, record = selected[index];
      const response = await fetch(new URL(`../../data/${record.file}`, import.meta.url));
      if (!response.ok) throw new Error(`No se pudo cargar ${record.id}. Comprueba tu conexión.`);
      banks[index] = await response.json();
      if (banks[index].id !== record.id) throw new Error(`El archivo de ${record.id} tiene otro identificador.`);
      completed++;
      const control = main.querySelector('[data-action="start"]');
      if (control) control.textContent = `PREPARANDO ${completed} / 100`;
    }
  }));
  return flattenBanks(banks);
}
async function enterExam(resume) {
  if (busy || releaseLock) return;
  busy = true;
  const control = main.querySelector('[data-action="start"], [data-action="resume"]');
  if (control) { control.disabled = true; control.textContent = resume ? 'RECUPERANDO…' : 'PREPARANDO EXAMEN…'; }
  try {
    const pool = resume ? null : await loadBank();
    void store.withProfileLock(user.id, async () => {
      profile = await store.getProfile(user.id);
      if (resume && !profile.active) throw new Error('Este examen ya finalizó en otra pestaña. Actualiza el inicio.');
      if (!resume && profile.active) throw new Error('Tienes un examen pendiente. Continúalo antes de comenzar otro.');
      active = initializeTiming(resume ? profile.active : createExam(pool));
      visitQuestion(active);
      profile.active = active; await store.saveProfile(user.id, profile);
      saveFailed = false; expirySaveFailed = false; mapExpanded = false; setView('exam'); renderExam(); busy = false;
      await new Promise(resolve => { releaseLock = resolve; startClock(); });
    }).catch(error => { busy = false; toast(error.message, true); if (view === 'landing') void renderLanding(); });
  } catch (error) { busy = false; toast(error.message, true); await renderLanding(); }
}
function accountTime() {
  if (!active || lastTick === null) return;
  const now = performance.now();
  accrueVisibleTime(active, clockWasVisible ? now - lastTick : 0);
  lastTick = now; clockWasVisible = !document.hidden;
}
function refreshClock() {
  if (!active) return;
  accountTime();
  const remaining = remainingTime(active), clock = document.querySelector('#exam-clock');
  if (clock) { clock.textContent = formatTime(remaining); clock.classList.toggle('timer-urgent', remaining <= 5 * 60000); }
  const warning = document.querySelector('#timer-warning');
  if (warning) { const text = remaining <= 5 * 60000 ? 'Quedan menos de 5 minutos. El examen finalizará al llegar a cero.' : 'La hora sigue corriendo aunque salgas o cierres la página.'; if (warning.textContent !== text) warning.textContent = text; }
  if (remaining === 0 && !busy && !expirySaveFailed) { void finishExam(true); return; }
  if (performance.now() - lastSaveTick >= 5000) { lastSaveTick = performance.now(); queueSave(); }
}
function startClock() {
  clearInterval(tickInterval); lastTick = performance.now(); clockWasVisible = !document.hidden;
  lastSaveTick = lastTick; tickInterval = setInterval(refreshClock, 250); refreshClock();
}
function stopClock() { accountTime(); clearInterval(tickInterval); tickInterval = null; lastTick = null; }
function queueSave() {
  if (!active || !user || view !== 'exam' || busy) return saving;
  profile.active = active;
  const snapshot = structuredClone(profile), userId = user.id;
  saving = saving.catch(() => {}).then(() => store.saveProfile(userId, snapshot)).then(() => {
    saveFailed = false;
    const status = document.querySelector('#save-status');
    if (status) { status.classList.remove('error'); status.textContent = '✓ Progreso guardado en este dispositivo'; }
  }).catch(error => {
    saveFailed = true;
    const status = document.querySelector('#save-status');
    if (status) { status.classList.add('error'); status.textContent = 'No se pudo guardar. Exporta una copia antes de cerrar.'; }
    toast(error.message, true); throw error;
  });
  void saving.catch(() => {}); return saving;
}
function releaseExam() { if (releaseLock) { releaseLock(); releaseLock = null; } active = null; }
function mapHtml(exam, results = null) {
  const answered = exam.answers.filter(a => a !== null).length, current = results ? reviewIndex : exam.current;
  const items = results ? results.results : exam.questions;
  return `<aside class="question-map ${mapExpanded ? 'expanded' : ''}" aria-label="Mapa de preguntas"><button type="button" class="map-toggle" data-action="map" aria-expanded="${mapExpanded}" aria-controls="map-body"><span>Mapa de preguntas <span aria-hidden="true">${mapExpanded ? '−' : '+'}</span></span><span class="mobile-map-summary">${results ? 'Ver corrección' : `${answered}/100 respondidas`}</span></button><div class="map-heading">${results ? 'Tus respuestas' : 'Tu progreso'}<span>${results ? '100 preguntas' : `${answered}/100`}</span></div><div class="progress-track" role="progressbar" aria-label="Preguntas respondidas" aria-valuenow="${answered}" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" style="width:${answered}%"></div></div><div id="map-body" class="map-body"><div class="question-grid">${items.map((q, i) => {
    const status = results ? q.status : exam.answers[i] !== null ? 'answered' : '';
    const text = results ? ({ correct: 'correcta', incorrect: 'incorrecta', unanswered: 'sin responder' }[status]) : status ? 'respondida' : 'pendiente';
    return `<button type="button" class="question-bubble ${status} ${current === i ? 'current' : ''} ${!results && exam.marked[i] ? 'marked' : ''}" data-action="${results ? 'review-question' : 'question'}" data-index="${i}" aria-label="Pregunta ${i + 1}, ${text}${!results && exam.marked[i] ? ', marcada para revisar' : ''}" ${current === i ? 'aria-current="step"' : ''}>${i + 1}</button>`;
  }).join('')}</div><div class="map-legend">${results ? '<span><i class="legend-square green"></i>Correcta</span><span><i class="legend-square red"></i>Incorrecta</span><span><i class="legend-square yellow"></i>Sin responder</span>' : '<span><i class="legend-square green"></i>Respondida</span><span><i class="legend-square"></i>Pendiente</span><span><i class="legend-square yellow"></i>Revisar</span>'}</div></div></aside>`;
}
function renderExam(focus = false) {
  const q = active.questions[active.current], index = active.current;
  main.innerHTML = `<div class="exam-top"><div><div class="eyebrow">SIMULACRO EN CURSO</div><h1>Una pregunta a la vez.</h1></div><div class="exam-meta"><div><span class="timer-label">TIEMPO RESTANTE</span><span id="exam-clock" class="timer">${formatTime(remainingTime(active))}</span></div>${button(remainingTime(active) ? 'Finalizar' : 'Guardar resultado', 'finish', 'btn-small btn-danger')}</div></div><p class="timer-notice" id="timer-warning" role="status">La hora sigue corriendo aunque salgas o cierres la página.</p><div class="exam-layout">${mapHtml(active)}<div><section class="question-card"><div class="question-card-top"><span class="area-label">${e(q.area)}</span><span class="question-counter">PREGUNTA ${String(index + 1).padStart(2, '0')} / 100</span></div><h2 id="question-title" tabindex="-1">${e(q.question)}</h2><p class="question-hint" id="question-hint">Selecciona una alternativa. Puedes cambiarla antes de finalizar.</p><div class="choices" role="radiogroup" aria-labelledby="question-title" aria-describedby="question-hint">${q.options.map((option, i) => `<label class="choice ${active.answers[index] === i ? 'selected' : ''}"><input type="radio" name="answer" value="${i}" ${active.answers[index] === i ? 'checked' : ''} ${remainingTime(active) === 0 ? 'disabled' : ''}><span class="choice-letter" aria-hidden="true">${LETTERS[i]}</span><span class="choice-text"><span class="sr-only">${LETTERS[i]}. </span>${e(option)}</span></label>`).join('')}</div><div class="question-tools"><button type="button" class="text-button ${active.marked[index] ? 'is-marked' : ''}" data-action="mark" aria-pressed="${active.marked[index]}">${active.marked[index] ? '◆ Marcada para revisar' : '◇ Marcar para revisar'}</button><button type="button" class="text-button" data-action="clear" ${active.answers[index] === null ? 'disabled' : remainingTime(active) === 0 ? 'disabled' : ''}>Borrar respuesta</button></div></section><div class="question-navigation">${button('Anterior', 'previous', '', index === 0 ? 'disabled' : '')}${index === 99 ? button('Finalizar examen', 'finish', 'btn-danger') : button('Siguiente', 'next', 'btn-primary')}</div><p id="save-status" class="autosave ${saveFailed ? 'error' : ''}" role="status">${saveFailed ? 'No se pudo guardar. Exporta una copia antes de cerrar.' : '✓ Progreso guardado en este dispositivo'}</p><div style="text-align:center">${button('Guardar copia', 'export-active', 'btn-small')}</div></div></div>`;
  if (focus) document.querySelector('#question-title').focus({ preventScroll: true });
}
function selectedReviewIndices() { return review.questions.map((q, i) => i).filter(i => filter === 'all' || reviewGrade.results[i].status === filter); }
function renderResults(focus = false) {
  setView('results'); reviewGrade = gradeExam(review);
  const g = reviewGrade, q = g.results[reviewIndex], indices = selectedReviewIndices(), pos = indices.indexOf(reviewIndex);
  main.innerHTML = `<div class="results-heading"><div class="eyebrow">SIMULACRO COMPLETADO</div><h1>Cada intento cuenta.</h1><p class="subtext">${date(review.completedAt)} · ${review.durationMs === undefined ? `${formatTime(review.elapsedMs)} de práctica activa` : `${formatTime(review.durationMs)} de duración · ${review.finishReason === 'timeout' ? 'Tiempo agotado' : 'Finalizado por ti'}`}</p></div><div class="scoreboard"><div class="scorebox"><span>TU RESULTADO</span><strong>${g.correct}<small> / 100</small></strong></div><div class="scorebox"><span>Correctas</span><strong style="color:var(--green)">${g.correct}</strong></div><div class="scorebox"><span>Incorrectas</span><strong style="color:var(--red)">${g.incorrect}</strong></div><div class="scorebox"><span>Sin responder</span><strong style="color:var(--yellow)">${g.unanswered}</strong></div></div><div class="area-breakdown">${Object.entries(g.areas).map(([area, score]) => `<div class="area-score"><div class="area-score-title">${e(area)}<span>${score.correct}/${score.total}</span></div><div class="progress-track"><div class="progress-fill" style="width:${score.correct / score.total * 100}%"></div></div></div>`).join('')}</div><div class="result-toolbar"><div class="filter-tabs" aria-label="Filtrar revisión">${[['all','Todas'],['incorrect','Incorrectas'],['unanswered','Sin responder'],['correct','Correctas']].map(([id,label]) => `<button type="button" class="filter-tab ${filter === id ? 'active' : ''}" data-action="filter" data-filter="${id}" aria-pressed="${filter === id}">${label}</button>`).join('')}</div><div style="display:flex;gap:12px;flex-wrap:wrap">${button('Guardar copia', 'export-review', 'btn-small')}${button('NUEVO SIMULACRO', 'new-exam', 'btn-primary btn-small')}</div></div><div class="exam-layout">${mapHtml(review, g)}<div>${indices.length ? `<section class="question-card"><div class="question-card-top"><span class="area-label">${e(q.area)}</span><span class="question-counter">PREGUNTA ${String(reviewIndex + 1).padStart(2,'0')} / 100</span></div><h2 id="question-title" tabindex="-1">${e(q.question)}</h2><p class="question-hint">${q.status === 'correct' ? '✓ Respuesta correcta.' : q.status === 'incorrect' ? '× Tu respuesta fue incorrecta.' : '— Dejaste esta pregunta sin responder.'}</p><div class="choices">${q.options.map((option, i) => `<div class="choice ${i === q.correct ? 'correct' : i === q.answer ? 'incorrect' : ''}"><span class="choice-letter">${LETTERS[i]}</span><span class="choice-text">${e(option)}</span>${i === q.correct || i === q.answer ? `<span class="choice-status">${i === q.correct ? 'CORRECTA' : 'TU RESPUESTA'}</span>` : ''}</div>`).join('')}</div><div class="review-answer"><h3>RESPUESTA DEL BANCO</h3><p>${e(q.options[q.correct])}</p><div class="source-note">Fuente: ${e(manifest.source)} · página ${q.page} · pregunta original ${q.number}.<br>Los distractores de práctica están pendientes de revisión docente.</div></div></section><div class="question-navigation">${button('Anterior', 'review-previous', '', pos <= 0 ? 'disabled' : '')}${button('Siguiente', 'review-next', 'btn-primary', pos >= indices.length - 1 ? 'disabled' : '')}</div>` : '<div class="empty-state"><h2>Nada que revisar aquí.</h2><p>No hay preguntas en este filtro. Prueba con otra categoría.</p></div>'}</div></div>`;
  if (focus) document.querySelector('#question-title')?.focus({ preventScroll: true });
}
async function renderHistory() {
  await refreshProfile(); setView('history');
  main.innerHTML = `<div class="page-title-row"><div><div class="eyebrow">TU PREPARACIÓN</div><h1>Mi historial</h1><p class="subtext" style="margin-top:10px">Cada simulacro, guardado en este dispositivo.</p></div>${button('Guardar historial', 'export-history', 'btn-small', profile.history.length ? '' : 'disabled')}</div>${profile.history.length ? `<div class="history-list">${[...profile.history].reverse().map(exam => {
    const g = gradeExam(exam);
    return `<article class="history-row"><span class="history-score">${g.percent}%</span><div><h2>Simulacro de Derecho</h2><p>${date(exam.completedAt)} · ${formatTime(exam.elapsedMs)}<br>${g.correct} correctas · ${g.incorrect} incorrectas · ${g.unanswered} sin responder</p></div>${button('Ver respuestas', 'history-review', 'btn-small', `data-id="${e(exam.id)}"`)}</article>`;
  }).join('')}</div>` : `<div class="empty-state"><h2>Tu primera ronda está por venir.</h2><p>Al finalizar un simulacro, aquí aparecerán tu resultado y tus respuestas.</p>${button('Ir al inicio', 'home', 'btn-primary')}</div>`}`;
}
function modal(title, text, action, label) {
  document.querySelector('#modal-body').innerHTML = `<h2>${e(title)}</h2><p>${e(text)}</p><div class="modal-actions">${button('Volver al examen', 'close-modal')}${button(label, action, 'btn-danger')}</div>`; dialog.showModal();
}
async function finishExam(automatic = false) {
  if (!active || busy) return; busy = true; dialog.close(); stopClock();
  try {
    await saving.catch(() => {});
    const completed = completeAttempt(active, Date.now(), automatic), next = { active: null, history: [...profile.history, completed] };
    await store.saveProfile(user.id, next);
    profile = next; review = completed; filter = 'all'; reviewIndex = 0; mapExpanded = false;
    releaseExam(); renderResults(); main.focus();
  } catch (error) { saveFailed = true; expirySaveFailed = remainingTime(active) === 0; toast(error.message, true); renderExam(); startClock(); }
  finally { busy = false; }
}
async function leaveExam() {
  if (!active) return true; stopClock();
  if (remainingTime(active) === 0) { await finishExam(true); return false; }
  try { await queueSave(); releaseExam(); return true; }
  catch (error) { startClock(); throw error; }
}
async function refreshProfile() {
  profile = await store.getProfile(user.id);
  if (profile.active?.timingVersion !== 1 || remainingTime(profile.active) > 0) return;
  await store.withProfileLock(user.id, async () => {
    profile = await store.getProfile(user.id);
    if (!profile.active || remainingTime(profile.active) > 0) return;
    const expired = completeAttempt(profile.active, Date.now(), true);
    const next = { active: null, history: [...profile.history, expired] };
    await store.saveProfile(user.id, next); profile = next;
    toast('La hora de tu examen terminó. Su resultado ya está en tu historial.');
  }).catch(error => toast(error.message, true));
}
async function renderStatistics() {
  await refreshProfile(); setView('statistics'); main.innerHTML = statisticsHtml(profile.history);
}
function exportData(content, filename) {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function handleAction(action, element) {
  if (busy && !['close-modal', 'password', 'map', 'export-active'].includes(action)) return;
  switch (action) {
    case 'password': { const input = document.querySelector('#password'), show = input.type === 'password'; input.type = show ? 'text' : 'password'; element.textContent = show ? 'OCULTAR' : 'VER'; element.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña'); break; }
    case 'start': await enterExam(false); break;
    case 'resume': await enterExam(true); break;
    case 'home': if (!(await leaveExam())) break; if (user) await renderLanding(); else renderAuth(); main.focus(); break;
    case 'statistics': if (!(await leaveExam())) break; await renderStatistics(); main.focus(); break;
    case 'history': if (!(await leaveExam())) break; await renderHistory(); main.focus(); break;
    case 'logout': if (!(await leaveExam())) break; await auth.logout(); user = null; profile = null; renderAuth(); main.focus(); break;
    case 'next': case 'previous': if (active) { accountTime(); if (remainingTime(active) === 0) { await finishExam(true); break; } active.current = Math.max(0, Math.min(99, active.current + (action === 'next' ? 1 : -1))); visitQuestion(active); queueSave(); renderExam(true); } break;
    case 'question': if (active) { accountTime(); if (remainingTime(active) === 0) { await finishExam(true); break; } active.current = Number(element.dataset.index); visitQuestion(active); queueSave(); renderExam(true); } break;
    case 'mark': active.marked[active.current] = !active.marked[active.current]; queueSave(); renderExam(); document.querySelector('[data-action="mark"]').focus(); break;
    case 'clear': accountTime(); if (!recordResponse(active, null)) { await finishExam(true); break; } queueSave(); renderExam(); break;
    case 'map': mapExpanded = !mapExpanded; document.querySelector('.question-map').classList.toggle('expanded', mapExpanded); element.setAttribute('aria-expanded', String(mapExpanded)); break;
    case 'finish': { accountTime(); if (remainingTime(active) === 0) { await finishExam(true); break; } const pending = active.answers.filter(a => a === null).length; modal('¿Finalizar el simulacro?', pending ? `Te quedan ${pending} preguntas sin responder. Se contabilizarán como pendientes. Al finalizar podrás ver la corrección completa.` : 'Respondiste las 100 preguntas. Al finalizar podrás revisar tu resultado y la respuesta correcta de cada una.', 'confirm-finish', 'Finalizar y corregir'); break; }
    case 'close-modal': dialog.close(); break;
    case 'confirm-finish': await finishExam(); break;
    case 'new-exam': await renderLanding(); await enterExam(Boolean(profile.active)); break;
    case 'history-review': review = profile.history.find(item => item.id === element.dataset.id); filter = 'all'; reviewIndex = 0; mapExpanded = false; renderResults(); main.focus(); break;
    case 'review-question': filter = 'all'; reviewIndex = Number(element.dataset.index); renderResults(true); break;
    case 'review-next': case 'review-previous': { const indices = selectedReviewIndices(); reviewIndex = indices[indices.indexOf(reviewIndex) + (action === 'review-next' ? 1 : -1)] ?? reviewIndex; renderResults(true); break; }
    case 'filter': filter = element.dataset.filter; reviewIndex = selectedReviewIndices()[0] ?? 0; renderResults(); document.querySelector(`[data-filter="${filter}"]`).focus(); break;
    case 'export-active': accountTime(); exportData({ version:1, user: { name:user.name, username:user.username }, exam:active }, `CEAN-en-curso-${active.id}.json`); break;
    case 'export-review': exportData({ version:1, user: { name:user.name, username:user.username }, exam:review, grade:gradeExam(review) }, `CEAN-resultado-${review.id}.json`); break;
    case 'export-history': exportData({ version:1, user: { name:user.name, username:user.username }, profile }, `CEAN-historial-${user.username}.json`); break;
    case 'retry': location.reload(); break;
  }
}
document.addEventListener('click', event => { const element = event.target.closest('[data-action]'); if (!element) return; event.preventDefault(); void handleAction(element.dataset.action, element).catch(error => toast(error.message, true)); });
main.addEventListener('change', event => {
  if (event.target.name !== 'answer' || !active || busy) return;
  accountTime(); if (!recordResponse(active, Number(event.target.value))) { void finishExam(true); return; } queueSave();
  const focused = Number(event.target.value); renderExam(); document.querySelector(`input[name="answer"][value="${focused}"]`).focus();
});
main.addEventListener('submit', async event => {
  if (event.target.id !== 'auth-form') return; event.preventDefault();
  const form = event.target, data = new FormData(form), control = form.querySelector('[type="submit"]');
  if (control.disabled) return; control.disabled = true; control.textContent = 'UN MOMENTO…';
  const errorElement = document.querySelector('#auth-error'); errorElement.hidden = true;
  try {
    user = await auth.authenticate(data.get('email'), data.get('password'));
    await renderLanding(); main.focus();
  } catch (error) { errorElement.textContent = error.message; errorElement.hidden = false; control.disabled = false; control.textContent = 'ENTRAR'; }
});
document.addEventListener('visibilitychange', () => { if (active) { refreshClock(); queueSave(); } });
addEventListener('pagehide', () => { if (active) { accountTime(); queueSave(); } });
addEventListener('beforeunload', event => { if (saveFailed) { event.preventDefault(); event.returnValue = ''; } });

async function boot() {
  initLife();
  try {
    if (!crypto.subtle || !crypto.randomUUID) throw new Error('Abre el simulador mediante localhost o HTTPS para habilitar el acceso y el sorteo.');
    store.checkStorage();
    const response = await fetch(new URL('../../data/manifest.json', import.meta.url));
    if (!response.ok) throw new Error('No se pudo cargar el catálogo de preguntas. Inicia un servidor local; no abras index.html directamente.');
    manifest = await response.json();
    let accessError;
    try { user = await auth.restoreSession(); }
    catch (error) { user = null; accessError = error.message; }
    if (user) await renderLanding(); else renderAuth();
    if (accessError) { const element = document.querySelector('#auth-error'); element.textContent = accessError; element.hidden = false; }
    void auth.onSessionEnded(async () => {
      if (!user) return;
      if (active) {
        accountTime(); stopClock();
        try { await queueSave(); } catch { toast('La sesión terminó y no se pudo guardar el último cambio.', true); }
        releaseExam();
      }
      user = null; profile = null; renderAuth();
      toast('Tu sesión terminó. Inicia sesión para continuar.');
    }).catch(() => {});
  } catch (error) { main.innerHTML = `<section class="error-card"><h1>No pudimos iniciar el simulador.</h1><p>${e(error.message)}</p>${button('Reintentar', 'retry', 'btn-primary')}</section>`; }
}
void boot();

// Chart details work with a mouse, touch and keyboard, without a chart library.
function showChartDetail(target) {
  const point = target.closest?.('[data-chart-point]');
  if (point) point.closest('.analytics-panel').querySelector('.chart-readout').textContent = point.dataset.chartPoint;
}
main.addEventListener('pointerover', event => showChartDetail(event.target));
main.addEventListener('focusin', event => showChartDetail(event.target));
main.addEventListener('click', event => {
  showChartDetail(event.target);
  const help = event.target.closest('[data-help-toggle]');
  if (help) help.parentElement.classList.toggle('help-open');
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') document.querySelectorAll('.help-open').forEach(el => el.classList.remove('help-open'));
});
