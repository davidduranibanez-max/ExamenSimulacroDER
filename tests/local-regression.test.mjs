import test from 'node:test';
import assert from 'node:assert/strict';
import { localRegression } from '../assets/js/statistics.js';
import { lineChart } from '../assets/js/charts.js';

test('LOESS recupera una recta con fechas irregulares sin mutar los datos', () => {
  const origin = Date.UTC(2026, 9, 7), offsets = [0, 1, 2, 7, 11, 16, 20];
  const points = offsets.map(t => ({ x: origin + t * 86400000, y: 10 + 3 * t })).reverse();
  const before = structuredClone(points), curve = localRegression(points);
  assert.equal(curve.length, 81);
  for (const p of curve) assert.ok(Math.abs(p.y - (10 + 3 * (p.x - origin) / 86400000)) < 1e-7);
  assert.equal(curve[0].x, origin); assert.equal(curve.at(-1).x, origin + 20 * 86400000);
  assert.deepEqual(points, before);
});

test('LOESS exige tres fechas distintas y conserva una puntuación constante', () => {
  for (const points of [[], [{ x: 1, y: 5 }, { x: 2, y: 7 }], [{ x: 1, y: 5 }, { x: 1, y: 6 }, { x: 2, y: 7 }]]) {
    assert.deepEqual(localRegression(points), []);
  }
  const curve = localRegression([0, 1, 4, 10, 20].map(x => ({ x, y: 37 })));
  assert.ok(curve.every(p => Math.abs(p.y - 37) < 1e-8));
});

test('LOESS tolera fechas duplicadas, vecindarios empatados y observaciones inválidas', () => {
  const points = [...Array.from({ length: 90 }, () => ({ x: 0, y: 10 })), { x: 1, y: 50 }, { x: 2, y: 90 }, { x: NaN, y: 1 }];
  const curve = localRegression(points);
  assert.equal(curve.length, 81);
  assert.ok(curve.every(p => Number.isFinite(p.y) && p.y >= 0 && p.y <= 100));
  assert.equal(curve[0].y, 10);
});

test('LOESS sigue cambios locales y el SVG distingue observaciones de tendencia', () => {
  const points = Array.from({ length: 25 }, (_, x) => ({ x, y: 10 + 0.1 * x ** 2, label: `Día ${x}`, detail: `Nota ${x}` }));
  const curve = localRegression(points);
  assert.ok(curve.at(-1).y - curve[40].y > curve[40].y - curve[0].y);
  const svg = lineChart(points, 'Resultados', curve, { connectPoints: false, trend: true, xLabel: 'Fecha', yLabel: 'Puntos' });
  assert.match(svg, /chart-trend/); assert.match(svg, />Fecha</); assert.match(svg, />Puntos</);
  assert.equal((svg.match(/<path /g) || []).length, 1);
  assert.equal((svg.match(/class="chart-point"/g) || []).length, points.length);
  assert.doesNotMatch(svg, /NaN|Infinity/);
});
