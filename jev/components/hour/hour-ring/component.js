/* hour / hour-ring — 60 phase-coloured ticks + progress ring + serif clock that loops 00:00 -> 60:00 and flashes when armed.
 *
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod  J.$ J.C J.TAU J.clamp J.task J.onView J.reduce  J.bus 'kill'(bool).
 * Everything is simulated.
 */
JEV.mod('hour-hour-ring', () => {
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
  const box = $('#hr-ringbox'); if (!box) return;
  const NS = 'http://www.w3.org/2000/svg';
  const ticksG = $('#hr-ticks'), rprog = $('#hr-rprog'), rglow = $('#hr-rglow'), rhead = $('#hr-rhead');
  const clockEl = $('#hr-clock'), clockL = $('#hr-clock-l'), badge = $('#hr-rg-badge'), flashEl = $('.hr-rflash', box);
  const PHS = [0, 8, 26, 41, 52, 58, 60], PCOL = [C.orange, C.blue, C.amber, C.green, C.cyan, C.pink], RC = TAU * 84;
  const phaseOf = (m) => { let i = 0; while (i < 5 && m >= PHS[i + 1]) i++; return i; };
  const ticks = [];
  for (let m = 0; m < 60; m++) {
    const a = m / 60 * TAU - Math.PI / 2, major = m % 5 === 0, r0 = major ? 92.5 : 95.5, r1 = 102;
    const e = document.createElementNS(NS, 'line');
    const at2 = { x1: (110 + r0 * Math.cos(a)).toFixed(2), y1: (110 + r0 * Math.sin(a)).toFixed(2), x2: (110 + r1 * Math.cos(a)).toFixed(2), y2: (110 + r1 * Math.sin(a)).toFixed(2), 'stroke-width': major ? 2.2 : 1.4, 'stroke-linecap': 'round', stroke: PCOL[phaseOf(m)] };
    for (const k in at2) e.setAttribute(k, at2[k]);
    ticksG.appendChild(e); ticks.push(e);
  }
  const paint = (m, lit) => ticks[m].setAttribute('stroke', lit ? PCOL[phaseOf(m)] : 'rgba(255,255,255,.16)');
  const PLAY = 12, REST = 4;
  let clk = reduce ? PLAY : 0, lit = 60, head = -1, last = '', flashN = false, done = true, rest = 0;
  function head2(h) {
    if (h === head) return;
    if (head >= 0) { const o = ticks[head]; o.setAttribute('stroke-width', head % 5 === 0 ? 2.2 : 1.4); if (head < lit) paint(head, true); }
    head = h;
    if (h >= 0) { const o = ticks[h]; o.setAttribute('stroke', '#fff'); o.setAttribute('stroke-width', h % 5 === 0 ? 3.4 : 2.6); }
  }
  function render(m) {
    const f = clamp(m / 60, 0, 1), off = (RC * (1 - f)).toFixed(1);
    rprog.setAttribute('stroke-dashoffset', off); rglow.setAttribute('stroke-dashoffset', off);
    rhead.setAttribute('transform', 'rotate(' + (f * 360).toFixed(2) + ' 110 110)');
    const n = Math.min(60, Math.floor(m + 0.0001));
    while (lit < n) paint(lit++, true);
    while (lit > n) paint(--lit, false);
    head2(n > 0 && n < 60 && !done ? n - 1 : -1);
    const sec = Math.round(m * 60), s = pad2((sec / 60) | 0) + ':' + pad2(sec % 60);
    if (s !== last) { last = s; setT(clockEl, s); setT(badge, s); }
    setT(clockL, m >= 60 ? (killed ? 'halted' : 'armed') : done ? 'minutes to armed' : 'minutes elapsed');
  }
  function restart() { clk = 0; done = false; rest = 0; lit = 60; for (let m = 0; m < 60; m++) paint(m, false); lit = 0; render(0); }
  function finish() {
    done = true; rest = 0; render(60);
    if (reduce || !flashEl) return;
    flashN = !flashN; flashEl.classList.toggle('hr-fa', flashN); flashEl.classList.toggle('hr-fb', !flashN);
    if (J.pulse) J.pulse(0.5);
  }
  box.addEventListener('click', restart);
  box.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); restart(); } });
  J.bus.on('kill', (v) => { killed = !!v; if (done) render(60); });
  render(60);
  J.onView(box, () => { if (!reduce) restart(); }, { threshold: 0.4, once: true });
  J.task(box, (t, dt) => {
    if (done) { if (!reduce && (rest += dt) > REST) restart(); return; }
    clk += dt; const m = clamp(clk / PLAY, 0, 1) * 60;
    if (m >= 60) { finish(); return; }
    render(m);
  });

});
