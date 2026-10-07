export function stepLife(cells, width, height) {
  const next = new Uint8Array(cells.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let neighbors = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (dx || dy) neighbors += cells[((y + dy + height) % height) * width + (x + dx + width) % width];
    }
    next[y * width + x] = Number(neighbors === 3 || (cells[y * width + x] && neighbors === 2));
  }
  return next;
}

export function initLife() {
  const canvas = document.querySelector('#life-canvas');
  const context = canvas.getContext('2d', { alpha: true });
  const toggle = document.querySelector('#life-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width, height, cells, generation = 0, paused = reduced.matches, previous = 0;
  const pixel = 12;
  function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (!cells[y * width + x]) continue;
      context.fillStyle = (x + y) % 7 === 0 ? '#bcf76a' : '#54764a';
      context.fillRect(x * pixel, y * pixel, pixel - 3, pixel - 3);
    }
    document.querySelector('#life-label').textContent = `JUEGO DE LA VIDA · GEN ${String(generation).padStart(4, '0')}`;
  }
  function seed() {
    width = Math.ceil(innerWidth / pixel); height = Math.ceil(innerHeight / pixel);
    canvas.width = width * pixel; canvas.height = height * pixel;
    context.imageSmoothingEnabled = false;
    cells = Uint8Array.from({ length: width * height }, () => Number(Math.random() < .23));
    generation = 0; draw();
  }
  function updateButton() {
    toggle.textContent = paused ? 'REANUDAR' : 'PAUSAR';
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', `${paused ? 'Reanudar' : 'Pausar'} Juego de la Vida`);
  }
  function animate(time) {
    if (!paused && !document.hidden && time - previous >= 160) {
      cells = stepLife(cells, width, height); generation++; draw(); previous = time;
    }
    requestAnimationFrame(animate);
  }
  toggle.addEventListener('click', () => { paused = !paused; updateButton(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; updateButton(); });
  document.querySelector('#life-reset').addEventListener('click', seed);
  let resizeTimer;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(seed, 150); });
  seed(); updateButton(); requestAnimationFrame(animate);
}
