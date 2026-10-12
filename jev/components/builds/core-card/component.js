/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.clamp J.task J.watch J.animate J.pointer J.reduce J.tier J.S; J.bus 'decision' | 'kill'; J.recent[0] (seed).
 * Data: decision fields d.symbol d.action d.conf d.dest (the "last" line, action chip and halo strength); JEV.S.killed.
 * Optional: body.killed class (set by core on kill). Everything is simulated.
 */
/* builds / core-card: the glass JEV card (spinning rim, halo, rings, holographic wordmark with pointer tilt, action chip, last-answer line). Prefix bld-. */
JEV.mod('builds-core-card', () => {
  const J = JEV, $ = J.$, $$ = J.$$, clamp = J.clamp, S = J.S, reduce = J.reduce;
  const coreEl = $('#bld-core'), coreBox = $('#bld-core-box');
  if (!coreEl || !coreBox) return;
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const chipEl = $('#bld-chip'), dotEls = $$('.bld-dots i', coreEl), lastEl = $('#bld-last'), wm = $('#bld-wm'), flashEl = $('#bld-flash'), wmw = $('#bld-wmw') || wm, coreSt = $('#bld-core-st');
  const FL_CORE = [{ offset: 0, filter: 'brightness(1.5) saturate(1.25)' }], FL_WM = [{ offset: 0, textShadow: '0 0 14px #fff, 0 0 46px #ff5a96, 0 0 90px #ff2e6e' }], FL_DOT = [{ offset: 0, opacity: 1, scale: '1.9' }], FL_FADE = [{ opacity: 0.95 }, { opacity: 0 }], CHIP_POP = [{ offset: 0, scale: '1.35', filter: 'brightness(1.8)' }];

  /* one decision hits the card (fx=false: text only, used for the seed) */
  function stepCore(d, fx) {
    setT(lastEl, d.symbol + ' \u00b7 ' + d.action + ' \u00b7 ' + d.conf.toFixed(2) + ' \u2192 ' + d.dest); lastEl.dataset.d = d.dest;
    const k = clamp((d.conf - 0.5) / 0.5, 0, 1); // halo breathes harder on a confident answer
    coreEl.style.setProperty('--hi', (0.8 + 0.5 * k).toFixed(2)); coreEl.style.setProperty('--hs', (0.88 + 0.2 * k).toFixed(2));
    if (chipEl.dataset.a !== d.action) { chipEl.dataset.a = d.action; chipEl.textContent = d.action; if (fx && !reduce) J.animate(chipEl, CHIP_POP, { duration: 520, easing: 'cubic-bezier(.3,1.6,.5,1)' }); }
    if (!fx || reduce) return;
    J.animate(flashEl, FL_FADE, { duration: 900, easing: 'ease-out' });
    J.animate(coreBox, FL_CORE, { duration: 700, easing: 'ease-out' });
    J.animate(wm, FL_WM, { duration: 800, easing: 'ease-out' });
    dotEls.forEach((e) => J.animate(e, FL_DOT, { duration: 650, easing: 'ease-out' }));
  }
  const status = () => setT(coreSt, S.killed ? 'halted' : 'armed');

  /* wordmark tilt + caustic light follow the pointer (cached centre, writes only when it moved) */
  let tx = 0, ty = 0, cx0 = 0, cy0 = 0, ccx = 0, ccy = 0;
  const measure = () => { const r = coreBox.getBoundingClientRect(); ccx = r.left + r.width / 2 + window.scrollX; ccy = r.top + r.height / 2 + window.scrollY; };
  function tiltTo(rx, ry) {
    tx += (rx - tx) * 0.1; ty += (ry - ty) * 0.1;
    if (Math.abs(tx - cx0) + Math.abs(ty - cy0) < 0.04) return;
    cx0 = tx; cy0 = ty; wmw.style.setProperty('--rx', tx.toFixed(2) + 'deg'); wmw.style.setProperty('--ry', ty.toFixed(2) + 'deg');
    coreBox.style.setProperty('--cpx', (50 + ty / 13 * 40).toFixed(1) + '%'); coreBox.style.setProperty('--cpy', (40 - tx / 9 * 40).toFixed(1) + '%');
  }
  J.watch(coreEl, measure); window.addEventListener('load', measure, { once: true });
  J.task(coreEl, (t) => {
    const Pt = J.pointer, pxs = Pt.x + window.scrollX - ccx, pys = Pt.y + window.scrollY - ccy;
    const on = Pt.x > -5000 && Math.abs(pxs) < 700 && Math.abs(pys) < 500;
    if (on && !reduce) tiltTo(-clamp(pys / 260, -1, 1) * 9, clamp(pxs / 420, -1, 1) * 13);
    else if ((J.tier || 2) >= 2 && !reduce) tiltTo(Math.sin(t * 0.5) * 2.2, Math.cos(t * 0.37) * 3.5);
    else tiltTo(0, 0);
  });

  const seed = J.recent[0] || J.makeDecision();
  if (seed) stepCore(seed, false);
  status();
  J.bus.on('decision', (d) => stepCore(d, true));
  J.bus.on('kill', status);
});
