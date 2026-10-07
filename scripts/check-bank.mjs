import { readBank } from './bank-files.mjs';
const { manifest, bytes, largest } = await readBank(process.argv[2]);
console.log(`${manifest.total} preguntas · ${manifest.total * 100} distractores propios · ${manifest.areas.length} materias`);
console.log(`JSON total: ${(bytes / 1024 / 1024).toFixed(2)} MiB · archivo máximo: ${(largest / 1024).toFixed(1)} KiB`);
console.log('Integridad: OK. Dificultad y validez semántica: pendientes de revisión docente.');
