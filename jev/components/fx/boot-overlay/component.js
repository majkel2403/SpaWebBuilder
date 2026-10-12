/* fx / boot-overlay - cinematic boot sequence: five typed checks with scrambling glyphs, a progress bar that ticks per step, then a shutter wipe (two halves slide away, light line, flash).
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Markup: the overlay lives in <template id="fx-boot-tpl"> (component.html) and is cloned on every play(); put your own LINES in component.js.
 * JEV.* used: mod, $, clamp, reduce, task(el, fn(t,dt)) (frame loop gated by visibility; returns {stop()}).
 * Click / any key skips (fast wipe). Under prefers-reduced-motion the overlay is skipped entirely.
 * Data: LINES = [text, status] pairs; replace them with real start-up checks. Optional hook: JEV.bus 'boot' is emitted when the wipe starts.
 * Public: JEV.playBoot() replays it. */
JEV.mod('fx-boot-overlay', () => {
  const J = JEV, doc = document, $ = J.$, clamp = J.clamp, reduce = J.reduce;
  const tpl = $('#fx-boot-tpl');
  if (!tpl) return;
  let live = null;

  function play() {
    if (live) { live.finish(true); live.boot.remove(); }
    if (reduce) { J.bus.emit('boot'); return; }
    doc.body.appendChild(tpl.content.cloneNode(true));
    const boot = doc.body.lastElementChild;
    if (!boot || boot.id !== 'fx-boot') return;
    const LINES = [
      ['jev-1.13.0 > typed questions ...', 'ok'], ['hermes > strategy.yaml ...', 'ok'], ['dots > 4y candles ...', 'ok'],
      ['floor 0.85 | loss cap $2,000 | max pos 4% | kill switch', 'ARMED'], ['simulation only | no real orders | desk', 'online'],
    ];
      const starts = [0.04, 0.24, 0.44, 0.64, 0.84], durs = [0.19, 0.19, 0.19, 0.19, 0.17], OUT = 1.04;
      const logEl = boot.querySelector('#fx-blog'), fill = boot.querySelector('#fx-bfill'), pct = boot.querySelector('#fx-bpct');
      const rows = LINES.map((l) => {
        const row = doc.createElement('div'), a = doc.createElement('span'), b = doc.createElement('em');
        row.className = 'fx-bl'; row.append(a, b); logEl.appendChild(row);
        return { row, a, b, t: l[0], ok: l[1], n: -1, done: false };
      });
      let T0 = -1, over = false, lastPct = -1, tk = null, steps = 0;
    const GLYPHS = '#%/\\<>01=+*';
    const finish = (fast) => {
      if (over) return; over = true;
      if (tk) tk.stop();
      boot.classList.add('fx-out'); if (fast) boot.classList.add('fx-fast');
      J.bus.emit('boot');
      doc.removeEventListener('keydown', skip, true);
      setTimeout(() => { boot.remove(); }, fast ? 330 : 560);
      if (live && live.boot === boot) live = null;
    };
    const skip = () => finish(true);
    live = { boot, finish };
    boot.addEventListener('pointerdown', skip, { once: true });
    doc.addEventListener('keydown', skip, true);
      tk = J.task(boot, (t) => {
        if (over) return;
        if (T0 < 0) T0 = t;
        const e = t - T0; // wall clock: the overlay is gone <= 1.6 s after its first frame no matter how slow the frames are
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i], p = clamp((e - starts[i]) / durs[i], 0, 1), n = Math.floor(p * r.t.length);
          if (p > 0 && p < 1) { // typing: the head of the line is still resolving (a few glyphs scramble ahead of the caret)
            const ahead = Math.min(3, r.t.length - n); let g = '';
            for (let j = 0; j < ahead; j++) g += GLYPHS[(Math.random() * GLYPHS.length) | 0];
            r.n = n; r.a.textContent = r.t.slice(0, n) + g; r.row.classList.add('show');
          } else if (p >= 1 && r.n !== r.t.length) { r.n = r.t.length; r.a.textContent = r.t; r.row.classList.add('show'); }
          r.row.classList.toggle('cur', p > 0 && p < 1);
          if (p >= 1 && !r.done) { r.done = true; r.b.textContent = r.ok; r.row.classList.add('hit'); fill.classList.remove('tk'); void fill.offsetWidth; fill.classList.add('tk'); steps++; }
        }
        const f0 = clamp(e / (OUT - 0.02), 0, 1), f = f0 < 0.5 ? 2 * f0 * f0 : 1 - Math.pow(-2 * f0 + 2, 2) / 2, q = Math.round(f * 100); // ease-in-out
        fill.style.transform = 'scaleX(' + f.toFixed(3) + ')';
        if (q !== lastPct) { lastPct = q; pct.textContent = (q < 10 ? '0' : '') + q + '% - ' + steps + '/' + rows.length; }
        if (e >= OUT) finish(false);
      });
  }

  J.playBoot = play;
  const btn = doc.getElementById('fxdReplay');
  if (btn) btn.addEventListener('click', play);
  play();
});
