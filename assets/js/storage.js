import { validExam } from './core.js';
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
export async function getProfile(userId) {
  const db = await database();
  const profile = await new Promise((resolve, reject) => {
    const request = db.transaction('profiles', 'readonly').objectStore('profiles').get(userId);
    request.onsuccess = () => resolve(request.result || { active: null, history: [] });
    request.onerror = () => reject(new StorageError('No se pudo leer el historial de este perfil.'));
  });
  if (!profile || !Array.isArray(profile.history) || (profile.active && !validExam(profile.active)) || profile.history.some(exam => !validExam(exam))) throw new StorageError('El historial guardado tiene un formato no válido.');
  return profile;
}
export async function saveProfile(userId, profile) {
  const db = await database();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction('profiles', 'readwrite');
    transaction.objectStore('profiles').put(profile, userId);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(new StorageError('No se pudo guardar el progreso. Exporta una copia y comprueba el espacio del navegador.'));
    transaction.onabort = () => reject(new StorageError('El guardado se interrumpió. Exporta una copia antes de cerrar.'));
  });
}


// Prevent two tabs from modifying the same attempt concurrently.
export async function withProfileLock(userId, action) {
  if (!navigator.locks) throw new Error('Este navegador no permite proteger tu progreso entre pestañas. Usa una versión actual de Chrome, Edge, Firefox o Safari.');
  return navigator.locks.request(PREFIX + userId, { ifAvailable: true }, async lock => {
    if (!lock) throw new Error('Este perfil ya tiene un examen abierto en otra pestaña. Ciérralo allí para continuar.');
    return action();
  });
}
