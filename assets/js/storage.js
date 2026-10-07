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
function write(key, value) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); }
  catch { throw new StorageError('No se pudo guardar el progreso. El almacenamiento está lleno o bloqueado.'); }
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
const normalizeUsername = value => value.trim().normalize('NFC').toLocaleLowerCase('es');

export async function initializeProfiles() {
  const response = await fetch(new URL('../data/profiles.json', import.meta.url));
  if (!response.ok) throw new Error('No se pudieron cargar los perfiles iniciales.');
  const seeds = await response.json();
  if (!Array.isArray(seeds) || seeds.some(seed => !seed.id || !seed.name || !seed.username || seed.salt?.length !== 16 || seed.hash?.length !== 32)) throw new Error('Los perfiles iniciales tienen un formato inválido.');
  const merge = () => {
    const users = getUsers();
    const missing = seeds.filter(seed => !users.some(user => normalizeUsername(user.username) === normalizeUsername(seed.username)));
    if (missing.length) write('users', [...users, ...missing.map(seed => ({ ...seed, username: normalizeUsername(seed.username), createdAt: Date.now() }))]);
  };
  if (navigator.locks) await navigator.locks.request(PREFIX + 'registry', merge);
  else merge();
}
export function getSessionUser() {
  const id = sessionStorage.getItem(PREFIX + 'session');
  return getUsers().find(user => user.id === id) || null;
}
export function login(user) { sessionStorage.setItem(PREFIX + 'session', user.id); }
export function logout() { sessionStorage.removeItem(PREFIX + 'session'); }

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

async function derive(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bytes = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: Uint8Array.from(salt), iterations: 210000, hash: 'SHA-256' }, key, 256);
  return Array.from(new Uint8Array(bytes));
}
export async function registerUser(name, username, password) {
  username = normalizeUsername(username);
  name = name.trim();
  if (name.length < 2 || name.length > 50) throw new Error('El nombre debe tener entre 2 y 50 caracteres.');
  if (!/^[\p{L}\p{N}._-]{3,40}$/u.test(username)) throw new Error('Usa de 3 a 40 letras, números, puntos, guiones o guiones bajos para el usuario.');
  if (password.length < 8 || password.length > 200) throw new Error('La contraseña debe tener entre 8 y 200 caracteres.');
  const users = getUsers();
  if (users.some(user => user.username === username)) throw new Error('Ese usuario ya existe en este navegador.');
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await derive(password, salt);
  const user = { id: crypto.randomUUID(), name, username, salt, hash, createdAt: Date.now() };
  const persist = () => {
    const latest = getUsers();
    if (latest.some(u => u.username === username)) throw new Error('Ese usuario ya existe en este navegador.');
    write('users', [...latest, user]);
  };
  if (navigator.locks) await navigator.locks.request(PREFIX + 'registry', persist);
  else persist();
  login(user);
  return user;
}
export async function authenticate(username, password) {
  const user = getUsers().find(u => u.username === normalizeUsername(username));
  if (!user) throw new Error('Usuario o contraseña incorrectos.');
  const hash = await derive(password, user.salt);
  if (hash.some((v, i) => v !== user.hash[i])) throw new Error('Usuario o contraseña incorrectos.');
  login(user);
  return user;
}

// Prevent two tabs from modifying the same attempt concurrently.
export async function withProfileLock(userId, action) {
  if (!navigator.locks) throw new Error('Este navegador no permite proteger tu progreso entre pestañas. Usa una versión actual de Chrome, Edge, Firefox o Safari.');
  return navigator.locks.request(PREFIX + userId, { ifAvailable: true }, async lock => {
    if (!lock) throw new Error('Este perfil ya tiene un examen abierto en otra pestaña. Ciérralo allí para continuar.');
    return action();
  });
}
