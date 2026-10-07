import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { siteRoot, defaultBank } from './bank-files.mjs';
for (const name of ['data', 'banco-privado', 'scripts/import-bank.py', 'scripts/distractors.py']) {
  try { await access(path.join(siteRoot, name)); } catch { continue; }
  throw new Error(`No publicar contenido privado: ${name}`);
}
async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'tmp', 'test-results', 'access-private'].includes(entry.name)) continue;
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(filename)); else result.push(filename);
  }
  return result;
}
for (const filename of await files(siteRoot)) {
  if (!['.json', '.csv', '.sql'].includes(path.extname(filename))) continue;
  const value = await readFile(filename, 'utf8');
  if (/"distractors"\s*:|GOCSPX-|sb_secret_/.test(value)) throw new Error('Contenido privado en ' + path.relative(siteRoot, filename));
}
console.log('Publicación actual: sin banco, CSV ni secretos privados. Esto no limpia el historial Git.');
try { await access(path.join(defaultBank, 'manifest.json')); } catch {
  console.log('Banco privado no incluido en el clon público. Para revisarlo usa npm run check:bank -- RUTA_PRIVADA.'); process.exit(0);
}
await import('./check-bank.mjs');
