/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.clamp J.sgn J.recent J.BUILDS J.S; bus 'decision' 'floor'.
 * Data: J.BUILDS[i] {key,name,prim,col}; latest decision per build from J.recent / the bus.
 */
JEV.mod('builds-build-tooltip', () => {
const J = JEV, $ = J.$, $$ = J.$$, clamp = J.clamp, S = J.S, B = J.BUILDS;
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const short = (s) => s.split('-')[0];
  const COL = { pink: 'pink', gray: 'gray', green: 'green', blue: 'blue', yellow: 'yellow' };
  const host = $('#bld-tipw'), tip = $('#bld-tip'), box = $('#bld-tpb');
  if (!host || !tip || !box) return;
  function ans(k, d) {
    const a = d.action, st = d.state;
    switch (k) {
      case 'entry': return a === 'hold' ? 'hold' : a + ' ' + short(d.symbol);
      case 'sizer': return d.size + '% of capital';
      case 'guard': return 'risk_ok? ' + (d.riskOk ? 'yes' : 'no');
      case 'router': return d.venue;
      case 'exit': return a === 'close' ? 'close ' + short(d.symbol) : 'hold';
      case 'funding': return J.sgn(st.funding_bps, 1) + ' bps';
      case 'news': return a === 'hold' ? 'ignore' : 'trade';
      case 'mm': return st.spread_bps > 3.5 ? 'widen' : 'tighten';
      case 'liq': return a === 'flatten' ? 'flatten: yes' : 'flatten: no';
      case 'rebal': return short(d.symbol);
    }
    return a;
  }
  const last = {}; J.recent.slice().reverse().forEach((d) => (last[d.build] = d));
  const show = B.slice(0, 4); let cur = -1;
  show.forEach((b, i) => {
    const el = document.createElement('button'); el.type = 'button'; el.className = 'bld-tp'; el.dataset.c = COL[b.col] || b.col; el.textContent = b.name; el.setAttribute('aria-pressed', 'false'); el.setAttribute('aria-describedby', 'bld-tip');
    box.appendChild(el);
    el.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') open(i); }); el.addEventListener('focus', () => open(i)); el.addEventListener('click', () => open(i));
    el.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch' && document.activeElement !== el) close(); }); el.addEventListener('blur', close);
  });
  const btns = $$('.bld-tp', box);
  function fill(i) {
    const b = show[i], d = last[b.key];
    tip.dataset.c = btns[i].dataset.c;
    setT($('#bld-tip-n'), b.name); setT($('#bld-tip-p'), b.prim);
    const c = $('#bld-tip-c'), g = $('#bld-tip-g');
    if (!d) { setT($('#bld-tip-a'), '\u2014'); setT(c, '\u2014'); setT($('#bld-tip-m'), '\u2014'); setT(g, 'waiting'); g.removeAttribute('data-d'); c.classList.remove('lo'); return; }
    setT($('#bld-tip-a'), ans(b.key, d)); setT(c, d.conf.toFixed(2)); c.classList.toggle('lo', d.conf < S.floor);
    setT($('#bld-tip-m'), d.ms.toFixed(1) + ' ms'); setT(g, d.dest); g.dataset.d = d.dest;
  }
  function place(i) {
    const r = host.getBoundingClientRect(), b = btns[i].getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    const x = clamp(b.left - r.left + b.width / 2 - w / 2, 0, Math.max(0, r.width - w)), y = b.bottom - r.top + 10;
    tip.style.transform = 'translate(' + x.toFixed(0) + 'px,' + y.toFixed(0) + 'px)';
  }
  function open(i) { cur = i; btns.forEach((e, k) => e.setAttribute('aria-pressed', k === i ? 'true' : 'false')); fill(i); tip.classList.add('on'); tip.setAttribute('aria-hidden', 'false'); place(i); }
  function close() { cur = -1; btns.forEach((e) => e.setAttribute('aria-pressed', 'false')); tip.classList.remove('on'); tip.setAttribute('aria-hidden', 'true'); }
  document.addEventListener('pointerdown', (e) => { if (cur >= 0 && !host.contains(e.target)) close(); });
  J.bus.on('decision', (d) => { last[d.build] = d; if (cur >= 0 && show[cur].key === d.build) fill(cur); });
  J.bus.on('floor', () => { if (cur >= 0) fill(cur); });
});
