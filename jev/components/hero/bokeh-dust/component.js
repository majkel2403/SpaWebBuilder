/* hero / bokeh-dust — soft bokeh dust drifting in depth (z-scaled speed, size, alpha), pointer parallax, brief glow swell on each decision, red under the kill switch.
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * Data: none required; JEV.bus 'decision' swells the glow, 'kill' tints it red. Canvas = any element's background layer (position:absolute; inset:0). */
JEV.mod('hero-bokeh-dust', () => {
  'use strict';
  const J = JEV, cv = J.$('#hbdCv'), stage = J.$('#hbdStage');
  if (!cv || !stage) return;
  const TINT = [[255, 120, 176], [166, 107, 255], [255, 193, 61]], KILL = [255, 77, 94];
  const spr = (c) => { const s = document.createElement('canvas'); s.width = s.height = 64; const x = s.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(' + c.join(',') + ',.55)'); gr.addColorStop(.62, 'rgba(' + c.join(',') + ',.22)'); gr.addColorStop(.86, 'rgba(' + c.join(',') + ',.38)'); gr.addColorStop(1, 'rgba(' + c.join(',') + ',0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return s; };
  const SP = TINT.map(spr), SK = spr(KILL), N = 56, X = new Float32Array(N), Y = new Float32Array(N), Z = new Float32Array(N), P = new Float32Array(N), K = new Uint8Array(N);
  let f = null, killed = J.S.killed, swell = 0, ax = 0, ay = 0;
  const R = J.rng(99); for (let i = 0; i < N; i++) { X[i] = R(); Y[i] = R(); const r = R(); Z[i] = 0.1 + 0.9 * r * r; P[i] = R() * 6.28; K[i] = i % 7 === 0 ? 2 : i % 3 === 0 ? 1 : 0; }
  J.watch(cv, () => { f = J.fit(cv, 1.5); });
  J.bus.on('decision', () => { swell = 1; }); J.bus.on('kill', (k) => { killed = !!k; });
  stage.addEventListener('pointermove', (e) => { const r = stage.getBoundingClientRect(); ax = ((e.clientX - r.left) / r.width - 0.5) * 2; ay = ((e.clientY - r.top) / r.height - 0.5) * 2; }, { passive: true });
  J.task(stage, (t, dt) => {
    if (!f || !f.W) return; const g = f.g, W = f.W, H = f.H, L = W + 80, Lh = H + 80, dpx = J.narrow() ? 8 : 18; swell *= Math.exp(-dt * 1.6);
    g.setTransform(f.dpr, 0, 0, f.dpr, 0, 0); g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < N; i++) {
      const z = Z[i]; let x = (X[i] * L + t * (2 + 6 * z)) % L; x = (x < 0 ? x + L : x) - 40 - ax * z * dpx; let y = (Y[i] * Lh - t * (1.5 + 4 * z)) % Lh; y = (y < 0 ? y + Lh : y) - 40 - ay * z * dpx;
      const s = (K[i] === 2 ? 46 : K[i] === 1 ? 30 : 18) * (0.5 + z) * (1 + swell * 0.25), a = (0.18 + 0.5 * z) * (0.65 + 0.35 * Math.sin(t * 0.6 + P[i])) * (1 + swell * 0.8);
      g.globalAlpha = Math.min(1, a); g.drawImage(killed ? SK : SP[K[i]], x - s / 2, y - s / 2, s, s);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  });
});
