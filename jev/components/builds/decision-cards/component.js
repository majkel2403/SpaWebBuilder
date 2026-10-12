/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.clamp J.animate J.reduce J.S; bus 'decision' 'floor'.
 * Data: decision d.action d.conf d.size d.sizes d.venue d.dest d.p.close d.p.flatten.
 */
JEV.mod('builds-decision-cards', () => {
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

  const cards = $$('.bld-d').map(wire);
  const act = (d) => (d.action === 'hold' ? [0] : d.action === 'buy' || d.action === 'sell' ? [0, 1, 2] : d.action === 'close' ? [3, 2] : [4, 2]);
  function show(d, fx) {
    if (cards.length < 5) return;
    const a = d.action, e = cards[0], z = cards[1], r = cards[2], x = cards[3], f = cards[4];
    setT(e.v, a === 'buy' || a === 'sell' ? a : 'hold'); setConf(e, d.conf);
    setT(z.v, d.size + '%'); setConf(z, maxOf(d.sizes));
    setT(r.v, d.venue); setT(r.c, d.dest); r.c.dataset.d = d.dest;
    setT(x.v, a === 'close' ? 'close' : 'hold'); setConf(x, d.p.close);
    setT(f.v, a === 'flatten' ? 'yes' : 'no'); setConf(f, d.p.flatten);
    if (fx) act(d).forEach((i) => flash(cards[i]));
  }
  if (J.recent[0]) show(J.recent[0], false);
  J.bus.on('decision', (d) => show(d, true));
  J.bus.on('floor', () => lowOnFloor(cards.filter((c) => !c.c.dataset.d)));
});
