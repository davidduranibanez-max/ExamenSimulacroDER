import { readFile, stat } from 'node:fs/promises';
import { validateBank } from '../assets/js/core.js';
const root = new URL('../data/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
if (manifest.version !== 2 || manifest.questions.length !== manifest.total) throw new Error('Catálogo incompleto.');
const ids = new Set();
let bytes = 0, largest = 0, alternatives = 0;
const counts = {};
for (const record of manifest.questions) {
  if (ids.has(record.id) || !/^[a-z-]+\/CPU-\d{4}\.json$/.test(record.file)) throw new Error(`Registro inválido: ${record.id}`);
  ids.add(record.id);
  const url = new URL(record.file, root), text = await readFile(url, 'utf8');
  const q = validateBank(JSON.parse(text));
  if (q.id !== record.id || q.area !== record.area || q.distractors.length !== 100 || !Number.isInteger(q.page) || !Number.isInteger(q.number)) throw new Error(`Metadatos inválidos: ${record.id}`);
  const normalized = [q.correct, ...q.distractors].map(text => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, ''));
  if (new Set(normalized).size !== normalized.length) throw new Error(`Incisos equivalentes por formato: ${record.id}`);
  const info = await stat(url); bytes += info.size; largest = Math.max(largest, info.size); alternatives += q.distractors.length;
  counts[q.area] = (counts[q.area] || 0) + 1;
}
for (const area of manifest.areas) if (counts[area.name] !== area.count) throw new Error(`Conteo incorrecto: ${area.name}`);
if (bytes >= 1_000_000_000 || largest >= 100_000_000) throw new Error('El banco excede el presupuesto estático.');
console.log(`${ids.size} preguntas · ${alternatives} distractores propios · ${manifest.areas.length} materias`);
console.log(`JSON total: ${(bytes / 1024 / 1024).toFixed(2)} MiB · archivo máximo: ${(largest / 1024).toFixed(1)} KiB`);
console.log('Integridad y referencias: OK. Dificultad y validez semántica: pendientes de revisión docente.');
