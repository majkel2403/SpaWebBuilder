/* hero / impact-ripples — impact effect: a beam flies from the source to the port of the decision's destination (execute pink / review amber / skip dim / kill red), then three ripple rings expand and a lens-flare streak flashes.
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * Data: JEV.bus 'decision' (d.dest), 'kill' (bool). Click or tap the stage to fire a simulated decision. Swap the port positions in layout() to put the effect on your own targets. */
JEV.mod('hero-impact-ripples', () => {
  'use strict';
  const J = JEV, cv = J.$('#hirCv'), stage = J.$('#hirStage');
  if (!cv || !stage) return;
  const RGB = [[255, 46, 110], [255, 193, 61], [196, 150, 178], [255, 77, 94]], DI = { execute: 0, review: 1, skip: 2 };
  const spr = (c) => { const s = document.createElement('canvas'); s.width = s.height = 64; const x = s.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.1, 'rgba(255,235,242,.96)'); gr.addColorStop(.3, 'rgba(' + c.join(',') + ',.6)'); gr.addColorStop(.65, 'rgba(' + c.join(',') + ',.14)'); gr.addColorStop(1, 'rgba(' + c.join(',') + ',0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return s; };
  const SP = RGB.map(spr);
  let f = null, killed = J.S.killed, px = 0, py = [0, 0, 0], sx = 0, sy = 0;
  const FN = 8, fT = new Float64Array(FN).fill(-9), fK = new Uint8Array(FN), fD = new Uint8Array(FN); let fi = 0, glow = new Float32Array(3);
  const lay = () => { f = J.fit(cv); if (!f.W) return; const w = f.W, h = f.H; px = w * 0.94 - 6; py = [h * 0.2, h * 0.5, h * 0.8]; sx = w * 0.1; sy = h * 0.5; };
  J.watch(cv, lay);
  J.bus.on('decision', (d) => { const t = performance.now() / 1000; fT[fi] = t; fD[fi] = DI[d.dest] || 0; fK[fi] = killed ? 3 : DI[d.dest] || 0; fi = (fi + 1) % FN; });
  J.bus.on('kill', (k) => { killed = !!k; });
  const TF = 0.55; // beam flight time
  J.task(stage, (t, dt) => {
    if (!f || !f.W) return; const g = f.g, W = f.W, H = f.H, tn = performance.now() / 1000; g.setTransform(f.dpr, 0, 0, f.dpr, 0, 0); g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    for (let d = 0; d < 3; d++) { g.globalAlpha = 0.5; g.strokeStyle = 'rgba(255,90,150,.25)'; g.lineWidth = 1; g.beginPath(); g.arc(px, py[d], 7, 0, J.TAU); g.stroke(); }
    g.globalAlpha = 0.9; g.drawImage(SP[killed ? 3 : 0], sx - 12, sy - 12, 24, 24);
    for (let i = 0; i < FN; i++) {
      const age = tn - fT[i]; if (age < 0 || age > 2.2) continue; const d = fD[i], c = fK[i], y1 = py[d];
      if (age < TF) { // beam flight on an S-curve with a short tail
        for (let tr = 0; tr < 7; tr++) { const k = Math.max(0, age / TF - tr * 0.035), s = k * k * (3 - 2 * k), xs = k * (1.5 - 1.5 * k + k * k); g.globalAlpha = (1 - tr / 7) * 0.9; const z = tr ? 16 : 26; g.drawImage(SP[c], sx + (px - sx) * xs - z / 2, sy + (y1 - sy) * s - z / 2, z, z); }
        continue;
      }
      const a = age - TF;
      for (let r = 0; r < 3; r++) { const u = (a - r * 0.18) / 1.1; if (u < 0 || u > 1) continue; const rad = 8 + 46 * (1 - (1 - u) * (1 - u)); g.globalAlpha = (1 - u) * 0.85; g.strokeStyle = 'rgba(' + RGB[c].join(',') + ',1)'; g.lineWidth = 2 - u * 1.2; g.beginPath(); g.arc(px, y1, rad, 0, J.TAU); g.stroke(); }
      const fu = a / 0.7; if (fu < 1) { // lens flare: soft core + horizontal streak + vertical hairline
        const k = (1 - fu) * (1 - fu); g.globalAlpha = k; g.drawImage(SP[c], px - 40, y1 - 40, 80, 80);
        const sg = g.createLinearGradient(px - 150, 0, px + 24, 0); sg.addColorStop(0, 'rgba(' + RGB[c].join(',') + ',0)'); sg.addColorStop(0.9, 'rgba(255,240,246,.9)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
        g.globalAlpha = k * 0.9; g.fillStyle = sg; g.fillRect(px - 150, y1 - 1.2, 174, 2.4); g.globalAlpha = k * 0.5; g.fillRect(px - 0.6, y1 - 34, 1.2, 68);
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  });
  stage.addEventListener('click', () => { const n = performance.now(); if (n - (stage._t || 0) > 160) { stage._t = n; J.fire(); } });
  { const d0 = J.recent[0] || J.makeDecision(); if (d0) { fT[0] = performance.now() / 1000 - 0.6; fD[0] = DI[d0.dest] || 0; fK[0] = killed ? 3 : fD[0]; fi = 1; } }
});
