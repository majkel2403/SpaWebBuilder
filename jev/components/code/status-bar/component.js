/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* used: JEV.mod, $, $$, task, time, animate, S{dest,floor,killed}, bus.on, fire, setKilled. Data: JEV.S.dest {execute,review,skip}, JEV.S.floor, JEV.S.killed; bus 'decision' (d.dest).
 * Everything is simulated. */
JEV.mod('code-status-bar', () => {
  const J = JEV, $ = J.$;
  const root = $('#cx-sb'), bar = root && $('.code-status', root); if (!bar) return;
  const nX = $('.code-n-x', bar), nR = $('.code-n-r', bar), nS = $('.code-n-s', bar), fl = $('.code-fl', bar), kl = $('.code-kl', bar), qb = J.$$('.code-qbar i', bar), lamp = $('.lamp', bar), txt = $('.code-st-t', bar);
  const base = txt.textContent, st = { x: -1, r: -1, s: -1, f: '', k: '' }; let revert = 0;
  const bump = (el) => J.animate(el, [{ transform: 'translateY(-2px) scale(1.25)' }, { transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.2,.8,.2,1)' });
  function status() {
    const c = J.S.dest;
    if (c.execute !== st.x) { if (st.x >= 0) bump(nX); st.x = c.execute; nX.textContent = c.execute; qb[0].style.flexGrow = Math.max(0.2, c.execute); }
    if (c.review !== st.r) { if (st.r >= 0) bump(nR); st.r = c.review; nR.textContent = c.review; qb[1].style.flexGrow = Math.max(0.2, c.review); }
    if (c.skip !== st.s) { if (st.s >= 0) bump(nS); st.s = c.skip; nS.textContent = c.skip; qb[2].style.flexGrow = Math.max(0.2, c.skip); }
    const f = J.S.floor.toFixed(2); if (f !== st.f) { st.f = f; fl.textContent = f; }
    const k = J.S.killed ? 'THROWN' : 'armed'; if (k !== st.k) { st.k = k; kl.textContent = k; }
  }
  J.bus.on('decision', (d) => {
    status();
    txt.textContent = d.dest === 'execute' ? 'build ok · gate passed · simulated' : d.dest === 'review' ? 'queued for human review · ' + d.reason : 'hold · nothing to send';
    lamp.classList.toggle('ok', d.dest === 'execute'); revert = J.time + 1.7;
  });
  J.bus.on('kill', status); J.bus.on('floor', status);
  J.task(bar, (t) => { if (revert && t > revert) { revert = 0; txt.textContent = base; lamp.classList.remove('ok'); } });
  $('.cx-sb-fire', root).addEventListener('click', () => J.fire());
  status();
});
