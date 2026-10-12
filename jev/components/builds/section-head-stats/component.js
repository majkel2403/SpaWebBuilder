/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.fmt J.S J.animate J.reduce; bus 'decision' 'kill'.
 * Data: J.S.count (decisions), J.S.ms[] (typed-answer latencies, median shown), J.S.killed.
 */
JEV.mod('builds-section-head-stats', () => {
const J = JEV, $ = J.$, S = J.S, fmt = J.fmt, reduce = J.reduce;
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
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


  const decEl = $('#bld-s-dec'), medEl = $('#bld-s-med'), liveT = $('#bld-live-t');
  if (!decEl) return;
  const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[(s.length / 2) | 0] : 0; };
  const decO = odo(decEl, fmt(S.count));
  function upd() { decO.set(fmt(S.count)); setT(medEl, median(S.ms).toFixed(1) + 'ms'); setT(liveT, S.killed ? 'halted' : 'live'); }
  upd();
  J.bus.on('decision', upd); J.bus.on('kill', upd);
});
