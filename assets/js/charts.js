// Self-contained SVG charts: no build, CDN, tracking or downloaded chart library.
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const round = n => Number(n.toFixed(2));
const W = 640, H = 250, L = 58, R = 20, T = 20, B = 56;
function frame(title, body, labels, maxY = 100, axes = {}) {
  const grid = Array.from({ length: 5 }, (_, i) => {
    const y = T + (H - T - B) * i / 4;
    return `<line class="chart-grid" x1="${L}" y1="${y}" x2="${W - R}" y2="${y}"/><text x="${L - 10}" y="${y + 4}" text-anchor="end">${round(maxY * (1 - i / 4))}</text>`;
  }).join('');
  const axisLabels = `${axes.xLabel ? `<text class="chart-axis-title" x="${(L + W - R) / 2}" y="${H - 3}" text-anchor="middle">${escapeHtml(axes.xLabel)}</text>` : ''}${axes.yLabel ? `<text class="chart-axis-title" transform="translate(13 ${(T + H - B) / 2}) rotate(-90)" text-anchor="middle">${escapeHtml(axes.yLabel)}</text>` : ''}`;
  return `<div class="chart-scroll" tabindex="0" aria-label="${escapeHtml(title)}. Desplaza el gráfico si es necesario."><svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHtml(title)}">${grid}${labels}${axisLabels}${body}</svg></div><p class="chart-readout" aria-live="polite">Pasa por un punto o selecciónalo con el teclado para ver el detalle.</p>`;
}
export function lineChart(points, title, second = null, options = {}) {
  if (!points.length) return '<div class="chart-empty">Tu primer simulacro aparecerá aquí.</div>';
  const min = points.reduce((n, p) => Math.min(n, p.x), Infinity), max = points.reduce((n, p) => Math.max(n, p.x), -Infinity);
  const x = value => max === min ? (L + W - R) / 2 : L + (value - min) / (max - min) * (W - L - R);
  const y = value => T + (100 - value) / 100 * (H - T - B);
  const path = data => data.map((p, i) => `${i ? 'L' : 'M'}${round(x(p.x))},${round(y(p.y))}`).join(' ');
  const labels = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])].map(i => `<text x="${x(points[i].x)}" y="${H - 30}" text-anchor="${i === 0 && points.length > 1 ? 'start' : i === points.length - 1 && points.length > 1 ? 'end' : 'middle'}">${escapeHtml(points[i].label)}</text>`).join('');
  const dots = points.map(p => `<g class="chart-point" tabindex="0" data-chart-point="${escapeHtml(p.detail)}" aria-label="${escapeHtml(p.detail)}"><circle class="chart-hit" cx="${x(p.x)}" cy="${y(p.y)}" r="10"/><circle cx="${x(p.x)}" cy="${y(p.y)}" r="4"/><title>${escapeHtml(p.detail)}</title></g>`).join('');
  return frame(title, `${second?.length ? `<path class="chart-line chart-secondary ${options.trend ? 'chart-trend' : ''}" d="${path(second)}"/>` : ''}${options.connectPoints === false ? '' : `<path class="chart-line" d="${path(points)}"/>`}${dots}`, labels, 100, options);
}
export function barChart(bins, title, value = b => b.count) {
  const max = Math.max(4, Math.ceil(Math.max(...bins.map(value)) / 4) * 4), step = (W - L - R) / bins.length;
  const bars = bins.map((b, i) => {
    const h = value(b) / max * (H - T - B), x = L + i * step + 5, y = H - B - h;
    const detail = b.detail || `${b.label}: ${value(b)}`;
    return `<g class="chart-point" tabindex="0" data-chart-point="${escapeHtml(detail)}" aria-label="${escapeHtml(detail)}"><rect class="chart-hit" x="${x}" y="${Math.min(y, H - B - 20)}" width="${Math.max(1, step - 10)}" height="${Math.max(20, h)}"/><rect class="chart-bar" x="${x}" y="${y}" width="${Math.max(1, step - 10)}" height="${h}"/><title>${escapeHtml(detail)}</title></g><text x="${x + (step - 10) / 2}" y="${H - 18}" text-anchor="middle">${escapeHtml(b.label)}</text>`;
  }).join('');
  return frame(title, bars, '', max);
}
export function scatterChart(pairs, title, units, binary = false) {
  if (!pairs.length) return '<div class="chart-empty">Todavía no hay tiempos registrados para este gráfico.</div>';
  const maxX = pairs.reduce((max, p) => Math.max(max, p[0]), 1), maxY = binary ? 1 : 100;
  // Aggregate identical/rounded positions; the count remains in the point tooltip.
  const clusters = new Map();
  for (const [vx, vy] of pairs) {
    const key = `${Math.round(vx / maxX * 100)}:${vy}`;
    const entry = clusters.get(key) || { x: vx, y: vy, n: 0 }; entry.n++; clusters.set(key, entry);
  }
  const dots = [...clusters.values()].map(p => {
    const cx = L + p.x / maxX * (W - L - R), cy = T + (1 - p.y / maxY) * (H - T - B);
    const detail = `${round(p.x)} ${units} · ${binary ? (p.y ? 'correcta' : 'incorrecta') : `${p.y}/100`} · ${p.n} observación(es)`;
    return `<g class="chart-point" tabindex="0" data-chart-point="${escapeHtml(detail)}" aria-label="${escapeHtml(detail)}"><circle class="chart-hit" cx="${cx}" cy="${cy}" r="10"/><circle class="chart-scatter" cx="${cx}" cy="${cy}" r="${Math.min(10, 3 + Math.sqrt(p.n))}"/><title>${escapeHtml(detail)}</title></g>`;
  }).join('');
  const labels = Array.from({ length: 5 }, (_, i) => `<text x="${L + i / 4 * (W - L - R)}" y="${H - 18}" text-anchor="middle">${round(maxX * i / 4)}</text>`).join('');
  return frame(title, dots, labels, maxY);
}
