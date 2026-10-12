/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.fmt J.S J.animate J.reduce J.onView; bus 'decision'.
 * Data: J.S.count, J.S.cost, J.S.ms[]. Also exposes J.odo(el, text, from?) -> {set(text, {quiet, stagger})} if absent.
 */
JEV.mod('builds-odometer', () => {
const J = JEV, $ = J.$, $$ = J.$$, S = J.S, fmt = J.fmt, reduce = J.reduce;
  const TICK = [{ offset: 0, color: '#fff' }];
  /* ---------- odometer: reels per digit, spare 0 so 9 -> 0 keeps rolling forward; readable copy in .sr-only ---------- */
  const REEL = '0123456789'.concat('0').replace(/./g, '<bld-n>$&</bld-n>');
  const otf = (p) => 'translateY(calc(var(--oh,1.2em) * ' + -p + '))';
  function odo(el, text, from) {
    const sr = document.createElement('span'), vis = document.createElement('span');
    sr.className = 'sr-only'; vis.className = 'bld-odo'; vis.setAttribute('aria-hidden', 'true');
    el.textContent = ''; el.append(sr, vis); sr.textContent = text;
    let cells = [], cur = '';
    const snap = (c, p) => { c.pos = p; c.r.style.transition = 'none'; c.r.style.transform = otf(p); void c.r.offsetWidth; c.r.style.transition = ''; };
    function build(s) {
      vis.textContent = ''; cells = []; cur = s;
      for (let k = 0; k < s.length; k++) {
        const ch = s[k];
        if (ch >= '0' && ch <= '9') {
          const w = document.createElement('span'), r = document.createElement('span'), d = +ch;
          w.className = 'bld-od'; r.className = 'bld-od-r'; r.innerHTML = REEL; r.style.transform = otf(d); w.appendChild(r); vis.appendChild(w); cells.push({ w, r, d, pos: d });
        } else { const q = document.createElement('span'); q.className = 'bld-op'; q.textContent = ch; vis.appendChild(q); cells.push(null); }
      }
    }
    vis.addEventListener('transitionend', (e) => { if (e.propertyName !== 'transform') return; const c = cells.find((x) => x && x.r === e.target); if (c && c.pos === 10) snap(c, 0); });
    function set(s, o) {
      if (s === cur) return;
      sr.textContent = s;
      if (s.length !== cur.length) { build(s); return; }
      const flash = !(o && o.quiet) && !reduce, st = o && o.stagger;
      for (let k = s.length - 1, n = 0; k >= 0; k--, n++) {
        const c = cells[k], ch = s[k];
        if (!c || ch < '0' || ch > '9') { if (ch !== cur[k]) { build(s); return; } continue; }
        const d = +ch; if (c.d === d) continue;
        if (c.pos === 10) snap(c, 0);
        c.d = d; c.pos = d === 0 && c.pos > 0 ? 10 : d;
        c.r.style.transitionDelay = st ? n * 70 + 'ms' : ''; c.r.style.transform = otf(c.pos);
        if (flash) J.animate(c.w, TICK, { duration: 700, easing: 'ease-out' });
      }
      cur = s;
    }
    build(from || text);
    return { set };
  }


  if (!J.odo) J.odo = odo;
  const el = {}; $$('[data-odo]').forEach((e) => (el[e.dataset.odo] = e));
  const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[(s.length / 2) | 0] : 0; };
  const f = { count: () => fmt(S.count), cost: () => '$' + S.cost.toFixed(4), med: () => median(S.ms).toFixed(1) + 'ms' };
  const o = {};
  Object.keys(f).forEach((k) => { if (el[k]) { const t = f[k](); o[k] = odo(el[k], t, t.replace(/[1-9]/g, '0')); J.onView(el[k], () => o[k].set(f[k](), { stagger: true, quiet: true }), { threshold: 0.4 }); } });
  let on = false; if (el.count) J.onView(el.count, () => { on = true; }, { threshold: 0.4, once: true });
  J.bus.on('decision', () => { if (on) Object.keys(o).forEach((k) => o[k].set(f[k]())); });
  // manual
  let n = 1200; const man = el.manual ? odo(el.manual, fmt(n)) : null;
  $$('[data-step]').forEach((b) => b.addEventListener('click', () => { n = Math.max(0, n + (+b.dataset.step)); man.set(fmt(n)); }));
});
