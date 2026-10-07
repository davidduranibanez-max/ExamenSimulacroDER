import { validExam } from './core.js';
import { createCloudHistory, mergeHistory } from './cloud-history.js';
import { remoteExams } from './remote-exam.js';
const PREFIX = 'cean.exam.v1.';
export class StorageError extends Error {}

function read(key, fallback) {
  let text;
  try { text = localStorage.getItem(PREFIX + key); }
  catch { throw new StorageError('El navegador bloquea el almacenamiento. Habilítalo para guardar tu progreso.'); }
  if (!text) return fallback;
  try { return JSON.parse(text); }
  catch { throw new StorageError('Los datos locales no se pueden leer. Conserva una copia antes de restablecer el almacenamiento.'); }
}

export function checkStorage() {
  try { localStorage.setItem(PREFIX + 'check', '1'); localStorage.removeItem(PREFIX + 'check'); }
  catch { throw new StorageError('Activa el almacenamiento del navegador para usar el simulador.'); }
}

export function getUsers() {
  const users = read('users', []);
  if (!Array.isArray(users)) throw new StorageError('El registro de perfiles locales no es válido.');
  return users;
}

let databasePromise;
function database() {
  databasePromise ||= new Promise((resolve, reject) => {
    const request = indexedDB.open('cean-exam-v1', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('profiles');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new StorageError('No se pudo abrir el historial. Habilita el almacenamiento del navegador.'));
    request.onblocked = () => reject(new StorageError('Cierra otras pestañas de CEAN para abrir el historial.'));
  });
  return databasePromise;
}
async function getLocalProfile(userId) {
  const db = await database();
  const profile = await new Promise((resolve, reject) => {
    const request = db.transaction('profiles', 'readonly').objectStore('profiles').get(userId);
    request.onsuccess = () => resolve(request.result || { active: null, history: [] });
    request.onerror = () => reject(new StorageError('No se pudo leer el historial de este perfil.'));
  });
  if (!profile || !Array.isArray(profile.history) || (profile.active && !validExam(profile.active)) || profile.history.some(exam => !validExam(exam))) throw new StorageError('El historial guardado tiene un formato no válido.');
  return profile;
}
async function putProfile(userId, profile, remoteOnly = false) {
  const db = await database();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction('profiles', 'readwrite');
    const profiles = transaction.objectStore('profiles');
    const request = profiles.get(userId);
    request.onsuccess = () => {
      const existing = request.result || { active: null, history: [] };
      // Una descarga tardía no debe sobrescribir respuestas en curso ni nuevos resultados.
      const next = remoteOnly ? { ...existing, history: mergeHistory(existing.history, profile.history) }
        : { ...profile, history: mergeHistory(existing.history, profile.history) };
      if (next.active?.remote && existing.active?.id === next.active.id) next.active.remoteRevision = Math.max(next.active.remoteRevision || 0,existing.active.remoteRevision || 0);
      profiles.put(next, userId);
    };
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(new StorageError('No se pudo guardar el progreso. Exporta una copia y comprueba el espacio del navegador.'));
    transaction.onabort = () => reject(new StorageError('El guardado se interrumpió. Exporta una copia antes de cerrar.'));
  });
}

const cloudSync = createCloudHistory(async () => (await import('./supabase-client.js')).supabaseReady);
const cloudStates = new Map(), initialLoads = new Map(), operations = new Map();
const syncedIds = new Map(), lastSync = new Map();
function cloudStatus(userId, state, message) {
  const status = { userId, state, message };
  cloudStates.set(userId, status);
  dispatchEvent(new CustomEvent('cean-cloud-status', { detail: status }));
}
export function getCloudStatus(userId) {
  return cloudStates.get(userId) || { userId, state: 'pending', message: 'Comprobando respaldo de resultados…' };
}
export async function syncHistory(userId, refresh = false) {
  if (operations.has(userId)) {
    await operations.get(userId);
    if (!refresh) return;
  }
  const operation = (async () => {
    lastSync.set(userId, Date.now());
    cloudStatus(userId, 'syncing', 'Sincronizando resultados…');
    try {
      const local = await getLocalProfile(userId);
      let history = await cloudSync(userId, local.history, refresh);
      await putProfile(userId, { history }, true);
      // Capturar finales guardados mientras una solicitud estaba en vuelo.
      const latest = await getLocalProfile(userId);
      const known = new Set(history.map(exam => exam.id));
      if (latest.history.some(exam => !known.has(exam.id))) {
        history = await cloudSync(userId, latest.history);
        await putProfile(userId, { history }, true);
      }
      syncedIds.set(userId, new Set(history.map(exam => exam.id)));
      cloudStatus(userId, 'synced', '✓ Resultados respaldados en Supabase. El progreso del examen se sincroniza mientras tienes conexión.');
    } catch (error) {
      const setup = ['42P01', 'PGRST205', 'PGRST202', '42883'].includes(error.code);
      cloudStatus(userId, 'pending', setup
        ? 'Respaldo pendiente: el docente debe ejecutar exam-history.sql en Supabase. La copia local está conservada.'
        : 'Respaldo pendiente: comprueba la conexión y vuelve a sincronizar. La copia local está conservada.');
    }
  })();
  operations.set(userId, operation);
  try { await operation; } finally { if (operations.get(userId) === operation) operations.delete(userId); }
}
export async function getProfile(userId) {
  if (!initialLoads.has(userId)) {
    initialLoads.set(userId, (async()=>{
      await syncHistory(userId);
      if (!userId.startsWith('supabase:')) return;
      const current = await remoteExams.current();
      const local = await getLocalProfile(userId);
      if (current && (!local.active || local.active.remote)) {
        if (local.active?.id === current.id && local.active.remoteRevision === current.remoteRevision) return;
        if (local.active) local.recoveryCopies = [...(local.recoveryCopies || []),local.active];
        local.active = current; await putProfile(userId,local);
      } else if (!current && local.active?.remote && local.history.some(exam=>exam.id===local.active.id)) {
        local.active = null; await putProfile(userId,local);
      }
    })());
  }
  try { await initialLoads.get(userId); }
  catch(error) { initialLoads.delete(userId); throw error; }
  return getLocalProfile(userId);
}
export async function saveProfile(userId, profile) {
  await putProfile(userId, profile);
  if (profile.active?.remote) {
    try { await remoteExams.save(profile.active); }
    catch(error) { if(error.code==='40001') initialLoads.delete(userId); throw error; }
    await putProfile(userId,profile);
  }
  // El progreso remoto se guarda por separado; no volver a subir todo el historial.
  if (profile.history.some(exam => !syncedIds.get(userId)?.has(exam.id))
    && (getCloudStatus(userId).state !== 'pending' || Date.now() - (lastSync.get(userId) || 0) >= 30000)) void syncHistory(userId);
}


// Prevent two tabs from modifying the same attempt concurrently.
export async function withProfileLock(userId, action) {
  if (!navigator.locks) throw new Error('Este navegador no permite proteger tu progreso entre pestañas. Usa una versión actual de Chrome, Edge, Firefox o Safari.');
  return navigator.locks.request(PREFIX + userId, { ifAvailable: true }, async lock => {
    if (!lock) throw new Error('Este perfil ya tiene un examen abierto en otra pestaña. Ciérralo allí para continuar.');
    return action();
  });
}
