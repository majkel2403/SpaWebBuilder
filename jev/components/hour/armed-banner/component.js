/* hour / armed-banner — waiting -> ARMED banner with flash + particle burst + shockwave; loops, tap to re-arm.
 *
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod  J.$ J.$$ J.C J.TAU J.fit J.watch J.task J.onView J.DPR J.reduce J.pulse(optional)  J.bus 'kill'(bool) · 'floor'  J.S.killed J.S.floor.
 * Everything is simulated.
 */
JEV.mod('hour-armed-banner', () => {
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
  const panel = $('#hr-ab'), armEl = $('#hr-arm'), burstCv = $('#hr-burst'); if (!panel || !armEl || !burstCv) return;
  const cells = $$('.hr-cells s', armEl), armWt = $('#hr-arm-wt'), armB = $('#hr-arm-b'), armS = $('#hr-arm-s'), badge = $('#hr-ab-badge');
  const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];
  const BU = { g: null, W: 0, H: 0, live: false, shocks: [], x: 0, y: 0 };
  const PP = Array.from({ length: 200 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, l: 0, m: 1, s: 4, c: 0, k: 0, r: 0, vr: 0 }));
  const BCOL = [C.pink, C.pink2, C.amber, '#ffffff', C.orange, C.green, C.cyan];
  let n = 0, state = 'idle', clk = 0, flashN = false;
  function text() {
    const all = n === 6;
    armEl.dataset.s = all ? 'armed' : 'wait';
    setT(armWt, 'waiting on ' + WORDS[6 - n] + (6 - n === 1 ? ' switch' : ' switches'));
    setT(armB, killed ? 'HALTED' : 'ARMED');
    setT(armS, killed ? 'kill switch thrown · every order routes to human review' : 'gate open at floor ' + S.floor.toFixed(2) + ' · loss cap on · kill switch live');
    setT(badge, all ? (killed ? 'halted' : 'armed') : n + ' / 6');
  }
  function set(k) { n = k; cells.forEach((c, i) => c.classList.toggle('on', i < k)); text(); }
  /** particles: 0 glow spark · 1 tumbling confetti · 2 streak along its velocity */
  function burst(x, y, count, R) {
    let k = 0;
    for (let i = 0; i < PP.length && k < count; i++) {
      const p = PP[i]; if (p.l > 0) continue;
      const a = -Math.PI * (0.08 + 0.84 * Math.random()), s = 90 + Math.random() * 280;
      p.x = x; p.y = y; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s; p.m = p.l = 0.8 + Math.random() * 0.9; p.s = 3 + Math.random() * 5; p.c = (Math.random() * BCOL.length) | 0;
      p.k = k % 3; p.r = Math.random() * TAU; p.vr = (Math.random() - 0.5) * 16; if (p.k === 1) p.l = p.m = p.m * 1.25; k++;
    }
    BU.shocks.push({ x, y, t: 0, R }); if (BU.shocks.length > 3) BU.shocks.shift(); BU.live = true;
  }
  function step(dt) {
    const g = BU.g; if (!g || (!BU.live && !BU.shocks.length)) return;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, BU.W, BU.H);
    g.globalCompositeOperation = 'lighter';
    let live = 0;
    for (let i = 0; i < PP.length; i++) {
      const p = PP[i]; if (p.l <= 0) continue;
      p.l -= dt; if (p.l <= 0) continue; live++;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 230 * dt; p.vx *= 1 - 1.3 * dt;
      const k = p.l / p.m;
      if (p.k === 0) blit(g, BCOL[p.c], p.x, p.y, p.s * (0.7 + k), k);
      else if (p.k === 1) {
        p.r += p.vr * dt; const L = p.s * 0.9, Wd = p.s * 0.45 * Math.abs(Math.cos(p.r * 0.8)) + 0.4, ca = Math.cos(p.r), sa = Math.sin(p.r);
        const ux = ca * L, uy = sa * L, vx = -sa * Wd, vy = ca * Wd;
        g.globalAlpha = Math.min(1, k * 1.6); g.fillStyle = BCOL[p.c];
        g.beginPath(); g.moveTo(p.x - ux - vx, p.y - uy - vy); g.lineTo(p.x + ux - vx, p.y + uy - vy); g.lineTo(p.x + ux + vx, p.y + uy + vy); g.lineTo(p.x - ux + vx, p.y - uy + vy); g.closePath(); g.fill();
      } else {
        g.globalAlpha = k; g.strokeStyle = BCOL[p.c]; g.lineWidth = 1.4; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.045, p.y - p.vy * 0.045); g.stroke();
        blit(g, '#ffffff', p.x, p.y, 2.2, k);
      }
    }
    for (let i = BU.shocks.length - 1; i >= 0; i--) {
      const s = BU.shocks[i]; s.t += dt; const u = s.t / 0.9;
      if (u >= 1) { BU.shocks.splice(i, 1); continue; }
      g.globalAlpha = (1 - u) * (1 - u) * 0.9; g.lineWidth = 0.6 + 2.6 * (1 - u); g.strokeStyle = killed ? C.red : C.pink2; g.beginPath(); g.arc(s.x, s.y, 12 + s.R * (1 - Math.pow(1 - u, 3)), 0, TAU); g.stroke();
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    BU.live = live > 0;
    if (!live && !BU.shocks.length) g.clearRect(0, 0, BU.W, BU.H);
  }
  J.watch(panel, () => {
    const f = fitC(burstCv); BU.g = f.g; BU.W = f.W; BU.H = f.H;
    const o = offs(armEl, panel); BU.x = o.x + o.w / 2; BU.y = o.y + o.h / 2;
  });
  function arrive() {
    if (killed) return;
    if (!reduce) { burst(BU.x, BU.y, tier() >= 3 ? 150 : 92, 200); flashN = !flashN; armEl.classList.toggle('hr-fa', flashN); armEl.classList.toggle('hr-fb', !flashN); }
    if (J.pulse) J.pulse(0.6);
  }
  function restart() { state = 'play'; clk = 0; set(0); }
  armEl.addEventListener('click', restart);
  armEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); restart(); } });
  J.bus.on('kill', (v) => { killed = !!v; text(); });
  J.bus.on('floor', text);
  set(reduce ? 6 : 0);
  J.onView(panel, () => { if (!reduce) restart(); }, { threshold: 0.4, once: true });
  /* one cell lights every 0.7 s; the sixth arms the banner, which rests 4.5 s and starts over */
  J.task(panel, (t, dt) => {
    step(dt);
    if (state === 'play') {
      clk += dt; const k = Math.min(6, Math.floor(clk / 0.7));
      if (k !== n) { set(k); if (k === 6) { arrive(); state = 'rest'; clk = 0; } }
    } else if (state === 'rest') { clk += dt; if (clk > 4.5) restart(); }
  });

});
