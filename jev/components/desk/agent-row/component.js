/* desk/agent-row — six agent rows (spotter, prior, edge, kelly, taker, closer): on each decision they take turns, light up, fill a progress bar and show their answer
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Data: bus 'decision' (d.venue d.conf d.net d.size d.state.price d.action), 'kill' (rows halt). Click a row to pin it (aria-pressed).
 */
JEV.mod('desk-agent-row', () => {
  'use strict';
  const J = JEV;
  const rows = J.$$('.dkw-ar');
  if (!rows.length) return;
  const txt = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };
  const R = rows.map((el) => ({ el, v: J.$('.dkw-av', el), role: J.$('.dkw-an i', el), bar: J.$('.dkw-ab i', el), role0: J.$('.dkw-an i', el).textContent }));
  const STEP = 650;
  let seq = 0, pin = -1, killed = !!J.S.killed, cur = -1;
  const answers = (d) => [String(d.venue || 'sfo').slice(0, 5).toUpperCase(), 'p ' + d.conf.toFixed(2), J.sgn(d.net, 1) + 'bp', d.size + '%', J.fmt(d.state.price, 0), d.action];
  function setState(i, st, dur) {
    const r = R[i]; r.el.dataset.st = st;
    r.el.style.setProperty('--d', (dur || 0) + 's'); r.el.style.setProperty('--v', st === 'working' ? 1 : st === 'done' ? 1 : 0);
  }
  function mark() { R.forEach((r, i) => { const on = pin >= 0 ? i === pin : i === cur; r.el.classList.toggle('is-on', on); r.el.setAttribute('aria-pressed', i === pin ? 'true' : 'false'); }); }
  function run(d) {
    const id = ++seq, ans = answers(d);
    R.forEach((r, i) => { setState(i, 'idle', 0); r.el.style.setProperty('--v', 0); });
    R.forEach((r, i) => setTimeout(() => {
      if (id !== seq || J.hidden()) return;
      if (killed) { setState(i, 'halted', 0); txt(r.role, 'halted · kill switch'); return; }
      if (i) setState(i - 1, 'done', 0);
      cur = i; setState(i, 'working', STEP / 1000); txt(r.v, ans[i]); txt(r.role, r.role0); mark();
      J.animate(r.el, [{ filter: 'brightness(1.7)' }, { filter: 'none' }], { duration: 700 });
      if (i === 5) setTimeout(() => { if (id === seq) setState(5, 'done', 0); }, STEP);
    }, i * STEP));
  }
  rows.forEach((el, i) => el.addEventListener('click', () => { pin = pin === i ? -1 : i; mark(); }));
  J.bus.on('decision', run);
  J.bus.on('kill', (k) => { killed = !!k; if (killed) { R.forEach((r, i) => { setState(i, 'halted', 0); txt(r.role, 'halted · kill switch'); }); } else R.forEach((r) => txt(r.role, r.role0)); });
  if (J.recent && J.recent[0]) run(J.recent[0]);
});
