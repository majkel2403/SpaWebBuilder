/* desk/star-field — twinkling star field: two depth layers with pointer parallax, cross flares on the bright ones, shooting stars on each decision, red-shifts under the kill switch
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Data: bus 'decision' (shooting star), 'kill' (colour shift). JEV.pointer for parallax (falls back to a slow drift).
 */
JEV.mod('desk-star-field', () => {
  'use strict';
  const J = JEV, TAU = J.TAU;
  const cv = J.$('#dkx-stars');
  if (!cv) return;
  const r1 = J.rng(11), r2 = J.rng(12);
  const NEAR = Array.from({ length: 70 }, () => ({ u: r1(), v: r1(), ph: r1() * TAU, sp: 0.4 + r1() * 1.4, s: r1() < 0.15 ? 2 : 1 }));
  const FAR = Array.from({ length: 56 }, (_, i) => ({ u: r2(), v: r2(), ph: r2() * TAU, sp: 0.6 + r2() * 1.8, d: 0.5 + r2() * 1.6, f: i < 9 }));
  const SHOOT = [];
  let g = null, W = 0, H = 0, km = J.S.killed ? 1 : 0, kt = km, px = 0, py = 0;
  function layout() { const f = J.fit(cv, 1.5); g = f.g; W = f.W; H = f.H; }
  J.watch(cv, layout); layout();
  J.bus.on('kill', (k) => { kt = k ? 1 : 0; });
  J.bus.on('decision', () => {
    if (J.reduce || SHOOT.length > 3) return;
    const y = H * (0.1 + 0.4 * Math.random()), L = 70 + Math.random() * 60;
    SHOOT.push({ x: Math.random() * W * 0.7, y, vx: 380 + Math.random() * 160, vy: 120 + Math.random() * 90, t: 0, life: 0.9, L });
  });
  J.task(cv, (t, dt) => {
    if (!g) return;
    km += (kt - km) * Math.min(1, dt * 2.6);
    const p = J.pointer || { nx: 0, ny: 0 }, tx = p.nx || Math.sin(t * 0.15) * 0.5, ty = p.ny || Math.cos(t * 0.11) * 0.3;
    px += (tx - px) * Math.min(1, dt * 3); py += (ty - py) * Math.min(1, dt * 3);
    g.clearRect(0, 0, W, H);
    const cool = km > 0.5 ? '#ffb4bc' : '#cfe3ff', cool2 = km > 0.5 ? '#ffd0d4' : '#bcd4ff';
    g.fillStyle = cool;
    for (const s of NEAR) { const u = s.u + px * 0.01 * s.s; g.globalAlpha = 0.12 + 0.45 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph)); g.fillRect((u - Math.floor(u)) * W, s.v * H + py * 6 * s.s, s.s, s.s); }
    for (const s of FAR) {
      const tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph), u = s.u + px * 0.03 * s.d, x = (u - Math.floor(u)) * W, y = s.v * H + py * 26 * s.d;
      g.globalAlpha = 0.2 + 0.6 * tw; g.fillStyle = s.d > 1.4 ? '#fff' : cool2; g.fillRect(x, y, 1.6, 1.6);
      if (s.f && tw > 0.55) { const L = 3 + 7 * tw; g.globalAlpha = (tw - 0.5) * 1.2; g.fillRect(x + 0.8 - L, y + 0.5, L * 2, 0.6); g.fillRect(x + 0.5, y + 0.8 - L, 0.6, L * 2); }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'lighter';
    for (let i = SHOOT.length - 1; i >= 0; i--) {
      const s = SHOOT[i]; s.t += dt; if (s.t > s.life) { SHOOT.splice(i, 1); continue; }
      s.x += s.vx * dt; s.y += s.vy * dt; const a = Math.sin(Math.PI * s.t / s.life), n = Math.hypot(s.vx, s.vy), tx2 = s.x - s.vx / n * s.L, ty2 = s.y - s.vy / n * s.L;
      const gr = g.createLinearGradient(s.x, s.y, tx2, ty2); gr.addColorStop(0, 'rgba(255,255,255,' + a.toFixed(2) + ')'); gr.addColorStop(0.3, 'rgba(' + (km > 0.5 ? '255,140,150' : '255,122,179') + ',' + (a * 0.5).toFixed(2) + ')'); gr.addColorStop(1, 'rgba(255,122,179,0)');
      g.strokeStyle = gr; g.lineWidth = 1.6; g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(tx2, ty2); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
  });
});
