/* hour / mascots — the small character kit: Hermes (pixel robot with antenna + scanline glitch), Dots (blue orb) and Jev (pink orb) with breathing,
 * squash-and-stretch hops, ground shadows, orbiting sparks and landing dust. Jev flashes and prints the last typed answer; everyone turns red on the kill switch.
 * The orb itself (.orb .pink / .blue / .amber ... with .e eyes) comes from base.css, the pixel robot is the inline SVG in component.html.
 *
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod  J.$ J.$$ J.C J.TAU J.clamp  J.fit J.watch J.task J.onView  J.DPR J.reduce J.narrow J.tier  J.bus 'decision'(d.action d.symbol d.conf d.dest) · 'kill'(bool)  J.S.killed.
 * Everything is simulated.
 */
JEV.mod('hour-mascots', () => {
  const J = JEV, $ = J.$, $$ = J.$$, C = J.C, S = J.S, TAU = J.TAU, clamp = J.clamp;
  const root = $('#hr-m');
  if (!root) return;
  const reduce = J.reduce;
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  /* ---------- shared helpers ---------- */
  /** J.fit, corrected for ancestors that are mid-transform (.rv reveal scales the box, which would make getBoundingClientRect lie) */
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
  /** layout-space box of el inside the positioned ancestor `top` (transform-proof, unlike getBoundingClientRect) */
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
  let killed = !!S.killed;
  const stage = $('#hr-mst'), cv = $('#hr-mcv');
  const avEls = [$('#hr-av0'), $('#hr-av1'), $('#hr-av2')];
  const jevOrb = $('#hr-jev-orb'), jevAv = avEls[2], lastEl = $('#hr-last'), lastT = $('#hr-last-t');
  const M = { g: null, W: 0, H: 0, av: [], q: [], t: 0, lt: 0, nextH: 1.6, nextI: 0, ready: false };
  const tier = () => J.tier || 2;
  const shds = $$('.hr-shd', stage), hopN = [false, false, false], hopLast = [-9, -9, -9];
  /* pooled landing-dust particles (24 max, additive glow sprites) */
  const AS = Array.from({ length: 24 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, l: 0, m: 1, c: C.pink, s: 4 }));
  function emitA(x, y, vx, vy, l, hex, s) { for (let i = 0; i < AS.length; i++) { const p = AS[i]; if (p.l <= 0) { p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.l = p.m = l; p.c = hex; p.s = s; return; } } }
  /** squash-and-stretch hop (class swap restarts the identical keyframes, no forced layout) + a dust puff on landing */
  function hop(i, delay) {
    if (reduce || tier() < 2) return;
    if (delay) { if (M.q.length < 8) M.q.push({ at: M.t + delay, i }); return; }
    if (M.t - hopLast[i] < 1.1) return; hopLast[i] = M.t; hopN[i] = !hopN[i];
    for (const el of [avEls[i], shds[i]]) { if (!el) continue; el.classList.toggle('hr-hop-a', hopN[i]); el.classList.toggle('hr-hop-b', !hopN[i]); }
    if (M.q.length < 8) M.q.push({ at: M.t + 0.5, i, land: true });
  }
  function layout() {
    const f = fitC(cv); M.g = f.g; M.W = f.W; M.H = f.H;
    M.av = avEls.map((e) => { const o = offs(e, stage); return { x: o.x + o.w / 2, y: o.y + o.h / 2, r: o.w / 2 }; });
    M.ready = true;
    if (reduce) draw(J.time);
  }
  J.watch(stage, layout);
  function draw(t) {
    const g = M.g; if (!g || !M.ready) return;
    const W = M.W, H = M.H, sp = killed ? 0.3 : 1, tr = tier(), dt = clamp(t - M.lt, 0, 0.1), pc = killed ? C.red : C.pink; M.lt = M.t = t;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    if (tr >= 2) {
      for (let i = M.q.length - 1; i >= 0; i--) {
        const q = M.q[i]; if (t < q.at) continue; M.q.splice(i, 1);
        if (!q.land) { hop(q.i); continue; }
        const av = M.av[q.i]; if (!av) continue;
        for (let k = 0; k < 6; k++) { const d = k < 3 ? -1 : 1; emitA(av.x + d * av.r * 0.5, av.y + av.r * 0.92, d * (30 + Math.random() * 60), -(8 + Math.random() * 28), 0.5, q.i === 2 ? pc : q.i ? C.blue : C.orange, 3 + Math.random() * 2); }
      }
      /* orbiting sparks: a tilted ellipse around each head (two crossing rings at tier 3) */
      const n = tr >= 3 ? 4 : 2, hx = [C.orange, C.blue, pc];
      for (let i = 0; i < 3; i++) {
        const av = M.av[i]; if (!av) continue;
        for (let k = 0; k < n; k++) {
          const a = t * (1.1 + i * 0.22) * sp * (k & 1 ? -1 : 1) + k * TAU / n + i, tilt = k & 1 ? 0.5 : -0.35, R = av.r * (1.1 + 0.06 * (k & 1));
          const ex = Math.cos(a) * R, ey = Math.sin(a) * R * 0.34, ct = Math.cos(tilt), st2 = Math.sin(tilt), z = 0.65 + 0.35 * Math.sin(a);
          const x = av.x + ex * ct - ey * st2, y = av.y + ex * st2 + ey * ct;
          blit(g, hx[i], x, y, 5.5 * z + 1.5, 0.55 + 0.45 * z); blit(g, '#ffffff', x, y, 1.9 * z, 0.9 * z);
          if (tr >= 3) { const a2 = a - (k & 1 ? -0.22 : 0.22), ex2 = Math.cos(a2) * R, ey2 = Math.sin(a2) * R * 0.34; blit(g, hx[i], av.x + ex2 * ct - ey2 * st2, av.y + ex2 * st2 + ey2 * ct, 3.4 * z, 0.35 * z); }
        }
      }
      for (let i = 0; i < AS.length; i++) {
        const p = AS[i]; if (p.l <= 0) continue;
        p.l -= dt; if (p.l <= 0) continue;
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 180 * dt; const k = p.l / p.m;
        blit(g, p.c, p.x, p.y, p.s * (0.6 + k), k); blit(g, '#ffffff', p.x, p.y, 1.4, k);
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    if (t > M.nextH) { M.nextH = t + 2.4; hop(M.nextI); M.nextI = (M.nextI + 1) % 3; }
  }
  J.task(stage, (t) => draw(t));
  J.onView(stage, () => { if (reduce) return; M.q.push({ at: M.t + 0.15, i: 0 }, { at: M.t + 0.4, i: 1 }, { at: M.t + 0.65, i: 2 }); }, { threshold: 0.5 });
  /* tap / Enter on a head makes it hop */
  avEls.forEach((el, i) => {
    el.style.cursor = 'pointer'; el.tabIndex = 0; el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'make ' + ['hermes', 'dots', 'jev'][i] + ' hop');
    el.addEventListener('click', () => hop(i));
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hop(i); } });
  });

  /* live decisions: Jev hops, flashes and shows the typed answer */
  let flip = false;
  function landDecision(d) {
    hop(2);
    setT(lastT, J.narrow() ? d.action + ' > ' + d.dest : d.action + ' ' + d.symbol.split('-')[0] + ' ' + d.conf.toFixed(2) + ' > ' + d.dest);
    lastEl.dataset.d = d.dest;
    flip = !flip;
    lastEl.classList.toggle('hr-fl-a', flip); lastEl.classList.toggle('hr-fl-b', !flip);
    jevAv.classList.toggle('hr-flash-a', flip); jevAv.classList.toggle('hr-flash-b', !flip);
  }
  J.bus.on('decision', landDecision);
  function showKill(v) {
    killed = !!v;
    if (jevOrb) { jevOrb.classList.toggle('red', killed); jevOrb.classList.toggle('pink', !killed); }
  }
  J.bus.on('kill', showKill);
  showKill(S.killed);
});
