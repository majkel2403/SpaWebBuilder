/* hour / gantt-rail — six overlapping phase bars (--s / --e minutes) filling as the playhead passes; loops, tap to restart.
 *
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod  J.$ J.$$ J.clamp J.task J.watch J.onView J.reduce.
 * Everything is simulated.
 */
JEV.mod('hour-gantt-rail', () => {
  const J = JEV, $ = J.$, $$ = J.$$, C = J.C, S = J.S, TAU = J.TAU, clamp = J.clamp, fmt = J.fmt, rgba = J.rgba;
  const reduce = J.reduce;
  const MONO = (getComputedStyle(document.documentElement).getPropertyValue('--mono') || 'monospace').trim();
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const pad2 = (n) => (n < 10 ? '0' : '') + n;
  /** J.fit, corrected for ancestors that are mid-transform */
  function fitC(c) {
    const f = J.fit(c), cw = c.clientWidth, ch = c.clientHeight;
    if (cw > 0 && ch > 0 && (cw !== f.W || ch !== f.H)) {
      const w = Math.round(cw * J.DPR), h = Math.round(ch * J.DPR);
      if (c.width !== w) c.width = w;
      if (c.height !== h) c.height = h;
      f.g.setTransform(J.DPR, 0, 0, J.DPR, 0, 0); f.W = cw; f.H = ch;
    }
    return f;
  }
  /** layout-space box of el inside the positioned ancestor `top` (transform-proof) */
  function offs(el, top) {
    let x = 0, y = 0, e = el;
    const w = el.offsetWidth, h = el.offsetHeight;
    while (e && e !== top) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x, y, w, h };
  }
  const SPR = {};
  /** pre-rendered additive glow sprite (white core -> colour -> transparent) */
  function glow(hex) {
    if (SPR[hex]) return SPR[hex];
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.16, 'rgba(' + r + ',' + g + ',' + b + ',.95)');
    gr.addColorStop(0.5, 'rgba(' + r + ',' + g + ',' + b + ',.26)'); gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    return (SPR[hex] = c);
  }
  const blit = (g, hex, x, y, r, a) => { g.globalAlpha = a; g.drawImage(glow(hex), x - r, y - r, r * 2, r * 2); };
  function makePath(pts) {
    const n = pts.length, x = new Float32Array(n), y = new Float32Array(n), s = new Float32Array(n);
    let L = 0;
    for (let i = 0; i < n; i++) { x[i] = pts[i][0]; y[i] = pts[i][1]; if (i) L += Math.hypot(x[i] - x[i - 1], y[i] - y[i - 1]); s[i] = L; }
    return { x, y, s, n, len: L };
  }
  const PT = { x: 0, y: 0 };
  function at(p, d) {
    d = d < 0 ? 0 : d > p.len ? p.len : d;
    let lo = 0, hi = p.n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (p.s[m] > d) hi = m; else lo = m; }
    const k = (d - p.s[lo]) / (p.s[hi] - p.s[lo] || 1);
    PT.x = p.x[lo] + (p.x[hi] - p.x[lo]) * k; PT.y = p.y[lo] + (p.y[hi] - p.y[lo]) * k;
    return PT;
  }
  function bez(p0, p1, p2, p3, n) {
    const a = [];
    for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; a.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); }
    return a;
  }
  const tier = () => J.tier || 2;
  let killed = !!S.killed;
  const rail = $('#hr-gantt'); if (!rail) return;
  const rows = $$('.hr-g-r', rail), ph = $('#hr-g-ph'), box = $('#hr-g-rows'), ax = $$('.hr-g-axis span', rail), clock = $('#hr-g-clock');
  const GR = rows.map((r) => [+r.style.getPropertyValue('--s'), +r.style.getPropertyValue('--e')]), F = rows.map(() => -1);
  const PLAY = 12, REST = 4;
  let W = 0, clk = reduce ? PLAY : 0, rest = 0, m = 60, axN = -2, last = '';
  J.watch(box, () => { W = box.clientWidth; ph.style.transform = 'translateX(' + (m / 60 * W).toFixed(1) + 'px)'; });
  function render() {
    for (let i = 0; i < rows.length; i++) {
      const v = Math.round(clamp((m - GR[i][0]) / (GR[i][1] - GR[i][0]), 0, 1) * 100) / 100;
      if (v !== F[i]) { F[i] = v; rows[i].style.setProperty('--f', v); }
    }
    ph.style.transform = 'translateX(' + (m / 60 * W).toFixed(1) + 'px)';
    const a = Math.min(4, Math.floor(m / 15 + 0.0001));
    if (a !== axN) { axN = a; ax.forEach((s, i) => s.classList.toggle('on', i <= a && m > 0.01)); }
    const sec = Math.round(m * 60), s = pad2((sec / 60) | 0) + ':' + pad2(sec % 60);
    if (s !== last) { last = s; setT(clock, s); }
  }
  render();
  const restart = () => { clk = 0; rest = 0; m = 0; render(); };
  rail.addEventListener('click', restart);
  rail.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); restart(); } });
  J.onView(rail, () => { if (!reduce) restart(); }, { threshold: 0.4, once: true });
  J.task(rail, (t, dt) => {
    if (clk >= PLAY) { if (!reduce && (rest += dt) > REST) restart(); return; }
    clk += dt; m = clamp(clk / PLAY, 0, 1) * 60; render();
  });

});
