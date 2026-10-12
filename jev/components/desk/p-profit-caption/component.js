/* desk/p-profit-caption — share of 140 simulated random walks that are in profit, with the pooled result over runs (everything here is SIMULATED)
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * JEV.* used: JEV.mod $ S clamp fmt gauss task animate reduce; kill via JEV.S.killed (the walk halts)
 * Safe without the rest of the page: every DOM lookup is guarded. */
JEV.mod('desk-p-profit-caption', () => {
  const J = JEV, $ = J.$, C = J.C, S = J.S, clamp = J.clamp, fmt = J.fmt, gauss = J.gauss, TAU = J.TAU;
  const MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace";
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  const sgn = (v, d) => (v >= 0 ? '+' : '-') + Math.abs(v).toFixed(d == null ? 1 : d);
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  /** soft additive glow sprite (drawn with 'lighter'; replaces shadowBlur) */
  const sprite = (rgb) => {
    const c = document.createElement('canvas'); c.width = c.height = 48;
    const g = c.getContext('2d'), gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
    gr.addColorStop(0, 'rgba(' + rgb + ',1)'); gr.addColorStop(.28, 'rgba(' + rgb + ',.35)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 48, 48); return c;
  };
  /** bake a pill label to a tiny sprite (text is the costly part of a canvas frame; re-baked only when the label changes) */
  const bake = (cv, txt, w, h, fill, stroke, color, font) => {
    cv.width = Math.round(w * J.DPR); cv.height = Math.round(h * J.DPR);
    const g = cv.getContext('2d'); g.setTransform(J.DPR, 0, 0, J.DPR, 0, 0);
    rr(g, 0.5, 0.5, w - 1, h - 1, 4); g.fillStyle = fill; g.fill(); g.strokeStyle = stroke; g.lineWidth = 1; g.stroke();
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = color; g.fillText(txt, w / 2, h / 2 + 3.4);
  };
  const onFonts = []; // canvas text needs the web font loaded; redraw static layers once it is
  try { if (document.fonts && document.fonts.load) Promise.all([document.fonts.load("700 9px 'JetBrains Mono'"), document.fonts.load("9px 'JetBrains Mono'")]).then(() => onFonts.forEach((f) => f())).catch(() => {}); } catch (e) { /* ignore */ }
  const erf = (x) => { const sg = x < 0 ? -1 : 1, a = Math.abs(x), t = 1 / (1 + 0.3275911 * a); return sg * (1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-a * a)); };
  const TIER = () => (J.tier || 2);
  const FX_ON = () => TIER() >= 2 && !J.reduce;
  const DASH = [3, 4], DOT = [1.5, 3.5], NODASH = [], F_TAG = '700 9px ' + MONO;
  /** cards reveal with a small scale (.rv): re-fit once the reveal settles */
  const afterReveal = (card, fn) => { card.addEventListener('transitionend', (e) => { if (e.target === card && e.propertyName === 'transform') fn(); }); J.onView(card, () => setTimeout(fn, 1300), { threshold: 0.05 }); };
  /** odometer: per-digit cells; a changed digit rolls in from below (up) or above (down) while the old one leaves */
  const odo = (el) => {
    let cells = [], cur = '';
    return (s) => {
      if (!el || s === cur) return;
      const up = parseFloat(s) >= parseFloat(cur || s);
      if (s.length !== cur.length) {
        el.textContent = ''; cells = [];
        for (let i = 0; i < s.length; i++) { const c = document.createElement('span'), t = document.createElement('i'); c.className = 'dkb-dg'; c.setAttribute('aria-hidden', 'true'); t.textContent = s[i]; c.appendChild(t); el.appendChild(c); cells.push(c); }
      } else {
        for (let i = 0; i < s.length; i++) {
          if (s[i] === cur[i]) continue;
          const c = cells[i], t = c.firstChild, old = t.textContent; t.textContent = s[i];
          if (J.reduce || s[i] === '.' || old === '.') continue;
          const gh = document.createElement('i'); gh.className = 'dkb-gh'; gh.textContent = old; c.appendChild(gh);
          const d = up ? 1 : -1;
          const a1 = J.animate(gh, [{ transform: 'translateY(0)', opacity: 0.9 }, { transform: 'translateY(' + -0.42 * d + 'em)', opacity: 0 }], { duration: 360, easing: 'cubic-bezier(.3,.7,.2,1)' });
          if (a1) a1.onfinish = () => gh.remove(); else gh.remove();
          J.animate(t, [{ transform: 'translateY(' + 0.42 * d + 'em)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.9,.25,1)' });
        }
      }
      cur = s; el.setAttribute('role', 'img'); el.setAttribute('aria-label', s);
    };
  };
  /** 140 random walks with a small positive drift (mu per step) and noise sigma; the colour of a value goes hot pink (loss) -> violet -> blue -> cyan -> green -> amber (big win) */
  const STOPS = [[-150, 255, 46, 110], [-50, 166, 107, 255], [40, 77, 141, 255], [120, 92, 225, 255], [190, 46, 230, 166], [290, 255, 193, 61], [420, 255, 226, 170]];
  const ramp = (v) => {
    let i = 1; while (i < STOPS.length - 1 && v > STOPS[i][0]) i++;
    const a = STOPS[i - 1], b = STOPS[i], f = clamp((v - a[0]) / (b[0] - a[0]), 0, 1);
    return ((a[1] + (b[1] - a[1]) * f) | 0) + ',' + ((a[2] + (b[2] - a[2]) * f) | 0) + ',' + ((a[3] + (b[3] - a[3]) * f) | 0);
  };
  const N = 140, T = 220, MU0 = 0.8, SG0 = 8.6, RATE = T / 7.2, HOLD = 3.2, PRE = 44;
  /** the simulation: every path's current value in V; steps at RATE per second, holds HOLD s when finished, then rolls a new run (paused while the kill switch is thrown) */
  const makeSim = () => {
    const V = new Float32Array(N), VS = new Float32Array(N);
    const Q = { V, mu: MU0, sg: SG0, step: 0, phase: 0, phT: 0, acc: 0, poolW: 0, poolN: 0, runs: 0, fresh: false };
    const roll = (pre) => {
      Q.mu = MU0 * (0.94 + Math.random() * 0.12); Q.sg = SG0 * (0.97 + Math.random() * 0.06);
      for (let i = 0; i < N; i++) { VS[i] = Q.sg * (0.82 + Math.random() * 0.36); V[i] = 0; }
      Q.step = 0; Q.acc = 0; Q.phase = 0; Q.phT = 0; Q.fresh = true;
      for (let k = 0; k < pre; k++) tick1();
    };
    const tick1 = () => { for (let i = 0; i < N; i++) V[i] += Q.mu + VS[i] * gauss(); Q.step++; };
    Q.wins = () => { let w = 0; for (let i = 0; i < N; i++) if (V[i] > 0) w++; return w; };
    Q.mean = () => { let s = 0; for (let i = 0; i < N; i++) s += V[i]; return s / N; };
    Q.advance = (dt, killed) => {
      if (J.reduce) { while (Q.step < T) tick1(); if (Q.phase === 0) { Q.phase = 1; Q.poolW += Q.wins(); Q.poolN += N; Q.runs++; } return; }
      if (killed) return;
      if (Q.phase === 0) {
        Q.acc += dt * RATE; let n = Math.min(Math.floor(Q.acc), T - Q.step); if (n > 0) { Q.acc -= n; while (n--) tick1(); }
        if (Q.step >= T) { Q.phase = 1; Q.phT = 0; Q.poolW += Q.wins(); Q.poolN += N; Q.runs++; }
      } else { Q.phT += dt; if (Q.phT > HOLD) roll(PRE); }
    };
    // the first run is pre-resolved from the endpoint distribution so the pooled caption never starts empty
    { let w = 0; for (let i = 0; i < N; i++) if (MU0 * T + SG0 * Math.sqrt(T) * gauss() > 0) w++; Q.poolW = w; Q.poolN = N; Q.runs = 1; }
    roll(PRE);
    return Q;
  };
  const card = $('#dkpp'); if (!card) return;
  const ePP = $('#dkpp-pp'), eTr = $('#dkpp-tr'), eMu = $('#dkpp-mu'), eSg = $('#dkpp-sg'), ePool = $('#dkpp-pool'), eRuns = $('#dkpp-runs'), eN = $('#dkpp-n');
  const sim = makeSim(), oP = odo(ePP); let domT = 9;
  setT(eN, String(N));
  J.task(card, (t, dt) => {
    sim.advance(dt, S.killed); domT += dt;
    if (domT < 0.25 && !J.reduce) return;
    domT = 0;
    oP(((sim.wins() / N) * 100).toFixed(1)); setT(eTr, String(sim.step));
    setT(eMu, sgn(sim.mu, 2) + 'bp'); setT(eSg, sim.sg.toFixed(1) + 'bp');
    setT(ePool, ((sim.poolW / sim.poolN) * 100).toFixed(1) + '%'); setT(eRuns, sim.runs + (sim.runs === 1 ? ' run' : ' runs'));
  });
});
