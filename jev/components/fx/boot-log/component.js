/* fx / boot-log - Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * Types LINES into #fx-blog (scrambled glyphs ahead of the caret), flashes a status per finished line, fills #fx-bfill and updates #fx-bpct.
 * Change LINES for your own checklist. Data: none (could show real health checks: set each status from a promise). */
JEV.mod('fx-boot-log', () => {
  const J = JEV, doc = document, clamp = J.clamp;
  const logEl = J.$('#fx-blog'), fill = J.$('#fx-bfill'), pct = J.$('#fx-bpct');
  if (!logEl || !fill || !pct) return;
  const LINES = [
    ['jev-1.13.0 > typed questions ...', 'ok'], ['hermes > strategy.yaml ...', 'ok'], ['dots > 4y candles ...', 'ok'],
    ['floor 0.85 | loss cap $2,000 | max pos 4% | kill switch', 'ARMED'], ['simulation only | no real orders | desk', 'online'],
  ];
  const starts = [0.04, 0.24, 0.44, 0.64, 0.84], durs = [0.19, 0.19, 0.19, 0.19, 0.17], END = 1.04;
  const GLYPHS = '#%/\\<>01=+*';
  let rows = [], T0 = -1, lastPct = -1, steps = 0, run = null;
  function build() {
    logEl.textContent = '';
    rows = LINES.map((l) => {
      const row = doc.createElement('div'), a = doc.createElement('span'), b = doc.createElement('em');
      row.className = 'fx-bl'; row.append(a, b); logEl.appendChild(row);
      return { row, a, b, t: l[0], ok: l[1], n: -1, done: false };
    });
    T0 = -1; lastPct = -1; steps = 0; fill.style.transform = 'scaleX(0)'; pct.textContent = '00% - 0/' + rows.length;
  }
  function frame(t) {
    if (T0 < 0) T0 = t;
    const e = t - T0;
    for (const r of rows) {
      const i = rows.indexOf(r), p = clamp((e - starts[i]) / durs[i], 0, 1), n = Math.floor(p * r.t.length);
      if (p > 0 && p < 1) {
        const ahead = Math.min(3, r.t.length - n); let g = '';
        for (let j = 0; j < ahead; j++) g += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        r.n = n; r.a.textContent = r.t.slice(0, n) + g; r.row.classList.add('show');
      } else if (p >= 1 && r.n !== r.t.length) { r.n = r.t.length; r.a.textContent = r.t; r.row.classList.add('show'); }
      r.row.classList.toggle('cur', p > 0 && p < 1);
      if (p >= 1 && !r.done) { r.done = true; r.b.textContent = r.ok; r.row.classList.add('hit'); fill.classList.remove('tk'); void fill.offsetWidth; fill.classList.add('tk'); steps++; }
    }
    const f0 = clamp(e / (END - 0.02), 0, 1), f = f0 < 0.5 ? 2 * f0 * f0 : 1 - Math.pow(-2 * f0 + 2, 2) / 2, q = Math.round(f * 100);
    fill.style.transform = 'scaleX(' + f.toFixed(3) + ')';
    if (q !== lastPct) { lastPct = q; pct.textContent = (q < 10 ? '0' : '') + q + '% - ' + steps + '/' + rows.length; }
    if (e >= END && run) { run.stop(); run = null; }
  }
  function play() {
    if (run) run.stop();
    build();
    if (J.reduce) { rows.forEach((r) => { r.a.textContent = r.t; r.b.textContent = r.ok; r.row.classList.add('show'); }); fill.style.transform = 'scaleX(1)'; pct.textContent = '100% - ' + rows.length + '/' + rows.length; return; }
    run = J.task(logEl, frame);
  }
  const rb = J.$('#fxdReplay');
  if (rb) rb.addEventListener('click', play);
  play();
});
