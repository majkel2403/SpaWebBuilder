/* Toggle switch kit (hud/toggle-kit)
   Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
   Markup: .sw[role=switch] > i.tg. Data: bus kill/floor; JEV.setKilled, JEV.setFloor.
*/
JEV.mod('hud-toggle-kit', () => {
  const J = JEV;
  const sws = J.$$('.sw[role="switch"]'); if (!sws.length) return;
  const log = document.getElementById('hx-sw-log');
  const put = (el, on) => { el.classList.toggle('on', on); el.setAttribute('aria-checked', String(on)); };
  const flip = (el) => {
    const on = !el.classList.contains('on'); put(el, on);
    const b = el.dataset.bind;
    if (b === 'kill') J.setKilled(on); else if (b === 'floor') J.setFloor(on ? 0.92 : 0.85);
    el.dispatchEvent(new CustomEvent('switch', { bubbles: true, detail: { on } }));
    if (log) log.textContent = (el.getAttribute('aria-label') || 'switch') + ' ' + (on ? 'on' : 'off');
  };
  for (const el of sws) {
    el.addEventListener('click', () => flip(el));
    el.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(el); } });
  }
  const sync = () => {
    for (const el of sws) {
      if (el.dataset.bind === 'kill') put(el, J.S.killed);
      if (el.dataset.bind === 'floor') put(el, J.S.floor >= 0.9);
    }
  };
  J.bus.on('kill', sync); J.bus.on('floor', sync); sync();
});
