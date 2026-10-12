/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.clamp J.animate J.reduce J.S; bus 'decision' 'floor'.
 * Data: decision d.action d.conf d.size d.sizes[4] d.riskOk d.pRisk (see the main README).
 */
JEV.mod('builds-primitive-cards', () => {
const J = JEV, $ = J.$, $$ = J.$$, S = J.S, clamp = J.clamp, reduce = J.reduce;
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const maxOf = (a) => Math.max(a[0], a[1], a[2], a[3]);
  const wire = (el) => ({ el, v: $('.bld-v', el), c: $('.bld-c', el), m: $('.bld-m > i', el) });
  const FL_LIT = [{ offset: 0, filter: 'brightness(1.4)' }];
  const flash = (c) => { if (!reduce) J.animate(c.el, FL_LIT, { duration: 1000, easing: 'cubic-bezier(.2,.7,.2,1)' }); };
  const setConf = (c, p) => {
    setT(c.c, p.toFixed(2)); c.c.classList.toggle('lo', p < S.floor);
    if (c.m) { const s = 'scaleX(' + clamp(p, 0, 1).toFixed(3) + ')'; if (s !== c.ms) { c.ms = s; c.m.style.transform = s; } }
  };
  const lowOnFloor = (cards) => cards.forEach((c) => { const p = parseFloat(c.c.textContent); c.c.classList.toggle('lo', !isNaN(p) && p < S.floor); });

  const cards = $$('.bld-p').map(wire);
  function show(d, fx) {
    if (cards.length < 3) return;
    setT(cards[0].v, d.action); setConf(cards[0], d.conf);
    setT(cards[1].v, d.size + '%'); setConf(cards[1], maxOf(d.sizes));
    setT(cards[2].v, d.riskOk ? 'yes' : 'no'); setConf(cards[2], d.pRisk);
    if (fx) cards.forEach(flash);
  }
  if (J.recent[0]) show(J.recent[0], false);
  J.bus.on('decision', (d) => show(d, true));
  J.bus.on('floor', () => lowOnFloor(cards));
});
