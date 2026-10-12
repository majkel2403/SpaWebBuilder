/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.usd J.RULES J.S J.setKilled J.animate; bus 'decision' 'kill' 'floor'.
 * Data: J.S.floor J.S.killed J.RULES.{lossCap,maxPos}, decision d.reason d.dest d.size.
 */
JEV.mod('builds-rules-card', () => {
const J = JEV, $ = J.$, $$ = J.$$, S = J.S, reduce = J.reduce;
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const rc = {}; $$('.bld-rc').forEach((e) => (rc[e.dataset.r] = e));
  const rEls = ['floor', 'cap', 'pos', 'kill'].map((k) => $('#bld-r-' + k));
  function upd() {
    setT(rEls[0], S.floor.toFixed(2)); setT(rEls[1], J.usd(J.RULES.lossCap)); setT(rEls[2], J.RULES.maxPos + '%'); setT(rEls[3], S.killed ? 'halted' : 'armed');
  }
  const BAD = [{ offset: 0, background: 'rgba(255,193,61,.4)' }], OK = [{ offset: 0, background: 'rgba(46,230,166,.28)' }];
  function step(d) {
    if (reduce) return;
    let key = null;
    if (d.reason === 'kill switch') key = 'kill'; else if (d.reason === 'risk flag') key = 'cap'; else if (d.reason.indexOf('conf') === 0) key = 'floor'; else if (d.size >= 4) key = 'pos';
    if (key && rc[key]) J.animate(rc[key], d.dest !== 'execute' ? BAD : OK, { duration: 1100, easing: 'ease-out' });
  }
  const kb = $('#bld-kbtn'); if (kb) kb.addEventListener('click', () => J.setKilled(!S.killed));
  upd();
  J.bus.on('decision', step); J.bus.on('kill', upd); J.bus.on('floor', upd);
});
