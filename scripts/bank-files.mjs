import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateBank } from '../assets/js/core.js';
export const siteRoot = fileURLToPath(new URL('../', import.meta.url));
export const defaultBank = path.resolve(siteRoot, '../banco-privado/data');
export function outsideSite(directory) {
  const target = path.resolve(directory), relative = path.relative(siteRoot, target);
  if (!relative || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))) throw new Error('El banco y sus exportaciones deben quedar fuera de la carpeta pública CEAN.');
  return target;
}
export async function readBank(directory = defaultBank) {
  const root = outsideSite(directory);
  const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
  if (manifest.version !== 2 || manifest.questions.length !== manifest.total || manifest.total < 100) throw new Error('Catálogo incompleto.');
  const ids = new Set(), questions = [], counts = {};
  let bytes = 0, largest = 0;
  for (const record of manifest.questions) {
    if (ids.has(record.id) || !/^[a-z-]+\/CPU-\d{4}\.json$/.test(record.file)) throw new Error(`Registro inválido: ${record.id}`);
    const text = await readFile(path.join(root, record.file), 'utf8'), q = validateBank(JSON.parse(text));
    if (q.id !== record.id || q.area !== record.area || q.distractors.length !== 100 || !Number.isInteger(q.page) || !Number.isInteger(q.number)) throw new Error(`Metadatos inválidos: ${record.id}`);
    const normalized = [q.correct, ...q.distractors].map(value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, ''));
    if (new Set(normalized).size !== normalized.length) throw new Error(`Incisos equivalentes: ${record.id}`);
    ids.add(record.id); questions.push(q); counts[q.area] = (counts[q.area] || 0) + 1;
    const size = Buffer.byteLength(text); bytes += size; largest = Math.max(largest, size);
  }
  for (const area of manifest.areas) if (counts[area.name] !== area.count) throw new Error(`Conteo incorrecto: ${area.name}`);
  return { root, manifest, questions, bytes, largest };
}
