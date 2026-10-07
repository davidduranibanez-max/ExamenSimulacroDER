import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { readBank, outsideSite, siteRoot } from './bank-files.mjs';
const { manifest, questions } = await readBank(process.argv[2]);
const output = outsideSite(process.argv[3] || path.resolve(siteRoot, '../banco-privado/importacion'));
await mkdir(output, { recursive: true });
const quote = value => '"' + value.replaceAll('"', '""') + '"';
const filename = 'cean_question_bank_SUPABASE.csv';
const csv = 'id,payload,active\r\n' + questions.map(q => [quote(q.id), quote(JSON.stringify(q)), 'true'].join(',')).join('\r\n');
await writeFile(path.join(output, filename), csv, 'utf8');
const info = { version: manifest.version, total: manifest.total, source: manifest.source, areas: manifest.areas };
await writeFile(path.join(siteRoot, 'assets/bank-info.json'), JSON.stringify(info, null, 2) + '\n', 'utf8');
const id = process.argv[4];
if (id) {
  const q = questions.find(record => record.id === id);
  if (!q) throw new Error('ID inexistente.');
  const literal = value => "'" + value.replaceAll("'", "''") + "'";
  const sql = `begin;\ninsert into public.cean_question_bank(id,payload,active) values (${literal(q.id)},${literal(JSON.stringify(q))}::jsonb,true)\non conflict(id) do update set payload=excluded.payload,active=excluded.active;\ncommit;\n`;
  await writeFile(path.join(output, id + '-actualizar.sql'), sql, 'utf8');
}
if (await readFile(path.join(output, filename), 'utf8') !== csv) throw new Error('Exportación incompleta.');
console.log(`CSV privado preparado: ${manifest.total} filas. Archivo: ${path.join(output, filename)}`);
console.log('Importar en Supabase → Table Editor → cean_question_bank → Import data from CSV. No publicar este CSV.');
