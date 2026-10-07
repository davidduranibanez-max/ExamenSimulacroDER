import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function accessSql(text) {
  // Exportar una sola columna con encabezado email desde Excel/Google Sheets.
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines[0]?.toLowerCase() === 'email') lines.shift();
  const emails = [...new Set(lines.map((line, i) => {
    const email = line.replace(/^"([^"\r\n]*)"$/, '$1').trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@,;"<>]+@[^\s@,;"<>]+\.[^\s@,;"<>]+$/.test(email)) {
      throw new Error(`Correo inválido en la fila ${i + 1}. Exporta solo la columna email.`);
    }
    return email;
  }))];
  if (!emails.length) throw new Error('La lista no contiene correos.');
  const values = emails.map(email => `  ('${email.replaceAll("'", "''")}')`).join(',\n');
  // Un correo dado de baja no se reactiva por una importación accidental.
  return `-- ${emails.length} correos únicos. Ejecutar en Supabase SQL Editor.\n-- Las bajas existentes se conservan; no se crean contraseñas.\nbegin;\ninsert into public.cean_authorized_emails (email) values\n${values}\non conflict (email) do nothing;\ncommit;\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [input, output] = process.argv.slice(2);
    if (!input || !output) throw new Error('Uso: node scripts/prepare-access.mjs lista.csv acceso.sql');
    if (resolve(input) === resolve(output)) throw new Error('La salida debe ser un archivo distinto del original.');
    const sql = accessSql(await readFile(input, 'utf8'));
    await writeFile(output, sql, { encoding: 'utf8', flag: 'wx' });
    console.log('Archivo SQL creado. Ejecútalo en Supabase; no subas la lista privada a GitHub.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
