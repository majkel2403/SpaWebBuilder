/* desk/planet-shade — the globe's body without dots: pre-rendered atmosphere + dark sphere + fresnel limb layers, a nested night crescent (terminator) and a drifting warm sun bloom
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot(). Draw dots / arcs on top of the same centre (cx, cy, R) to build a full globe.
 * Data: bus 'kill' (blue -> red cross-fade). Optional: the sun direction (sxv, syv) is a slow sine drift; set it from real UTC for a true terminator.
 */
JEV.mod('desk-planet-shade', () => {
  'use strict';
  const J = JEV, TAU = J.TAU, clamp = J.clamp;
  const cv = J.$('#dkx-planet');
  if (!cv) return;
  const WARM = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const q = c.getContext('2d'); const gr = q.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,214,150,.9)'); gr.addColorStop(0.35, 'rgba(255,170,90,.35)'); gr.addColorStop(1, 'rgba(255,140,70,0)'); q.fillStyle = gr; q.fillRect(0, 0, 64, 64); return c; })();
  const TN = 17, TC = new Float32Array(TN), TS = new Float32Array(TN);
  for (let i = 0; i < TN; i++) { const ph = Math.PI / 2 - (i / (TN - 1)) * Math.PI; TC[i] = Math.cos(ph); TS[i] = Math.sin(ph); }
  const LAY = [null, null];
  let g = null, W = 0, H = 0, cx = 0, cy = 0, R = 100, layB = 0, km = J.S.killed ? 1 : 0, kt = km, dpr = 1;
  function paintLayer(kv) {
    const sz = Math.max(2, Math.ceil(layB * dpr)), m = layB / 2;
    const c = LAY[kv] || (LAY[kv] = document.createElement('canvas')); c.width = c.height = sz;
    const q = c.getContext('2d'); q.setTransform(sz / layB, 0, 0, sz / layB, 0, 0); q.clearRect(0, 0, layB, layB);
    const rim = kv ? '255,74,94' : '59,224,255', out = kv ? '255,60,120' : '140,92,255';
    const r0 = R * 0.9, r1 = R * 1.5, S = (r) => (r * R - r0) / (r1 - r0), gl = q.createRadialGradient(m, m, r0, m, m, r1);
    gl.addColorStop(0, 'rgba(' + rim + ',0)'); gl.addColorStop(S(1.0), 'rgba(' + rim + ',.8)'); gl.addColorStop(S(1.035), 'rgba(' + rim + ',.36)');
    gl.addColorStop(S(1.1), 'rgba(' + out + ',.21)'); gl.addColorStop(S(1.22), 'rgba(' + out + ',.075)'); gl.addColorStop(1, 'rgba(' + out + ',0)');
    q.fillStyle = gl; q.fillRect(0, 0, layB, layB);
    q.save(); q.beginPath(); q.arc(m, m, R, 0, TAU); q.clip();
    const bd = q.createRadialGradient(m - R * 0.34, m - R * 0.4, R * 0.04, m, m, R * 1.04);
    bd.addColorStop(0, kv ? 'rgba(112,22,40,.8)' : 'rgba(34,84,176,.8)'); bd.addColorStop(0.42, kv ? 'rgba(54,10,20,.92)' : 'rgba(10,30,78,.92)'); bd.addColorStop(1, kv ? 'rgba(16,3,8,.98)' : 'rgba(3,8,26,.98)');
    q.fillStyle = bd; q.fillRect(m - R, m - R, R * 2, R * 2);
    const sh = q.createRadialGradient(m + R * 0.55, m + R * 0.5, R * 0.1, m + R * 0.55, m + R * 0.5, R * 1.25);
    sh.addColorStop(0, 'rgba(0,0,10,.52)'); sh.addColorStop(1, 'rgba(0,0,10,0)'); q.fillStyle = sh; q.fillRect(m - R, m - R, R * 2, R * 2);
    const fr = q.createRadialGradient(m, m, R * 0.74, m, m, R);
    fr.addColorStop(0, 'rgba(' + rim + ',0)'); fr.addColorStop(0.7, 'rgba(' + rim + ',.07)'); fr.addColorStop(1, 'rgba(' + rim + ',.5)');
    q.fillStyle = fr; q.fillRect(m - R, m - R, R * 2, R * 2); q.restore();
    q.lineWidth = 1.1; q.strokeStyle = 'rgba(' + (kv ? '255,170,180' : '170,240,255') + ',.55)'; q.beginPath(); q.arc(m, m, R * 1.003, 0, TAU); q.stroke();
    q.lineWidth = R * 0.05; q.strokeStyle = 'rgba(' + rim + ',.09)'; q.beginPath(); q.arc(m, m, R * 1.03, 0, TAU); q.stroke();
    q.lineWidth = R * 0.14; q.strokeStyle = 'rgba(' + out + ',.035)'; q.beginPath(); q.arc(m, m, R * 1.2, 0, TAU); q.stroke();
  }
  function layout() {
    const f = J.fit(cv, 1.5); g = f.g; W = f.W; H = f.H; dpr = f.dpr;
    R = Math.max(60, Math.min(W * 0.34, H * 0.36)); cx = W / 2; cy = H * 0.49; layB = Math.ceil(R * 3);
    paintLayer(0); paintLayer(1);
  }
  J.watch(cv, layout); layout();
  J.bus.on('kill', (k) => { kt = k ? 1 : 0; });
  J.task(cv, (t, dt) => {
    if (!g) return;
    km += (kt - km) * Math.min(1, dt * 2.6); if (Math.abs(km - kt) < 0.003) km = kt;
    g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.drawImage(LAY[0], cx - layB / 2, cy - layB / 2, layB, layB);
    if (km > 0.004) { g.globalAlpha = km; g.drawImage(LAY[1], cx - layB / 2, cy - layB / 2, layB, layB); g.globalAlpha = 1; }
    const alive = 1 - km, sxv = -0.62 + 0.3 * Math.sin(t * 0.18), syv = 0.4 + 0.2 * Math.sin(t * 0.131 + 1), szv = 0.62, sl = Math.hypot(sxv, syv, szv), kz = szv / sl, rr = R * 0.996;
    g.save(); g.translate(cx, cy); g.rotate(Math.atan2(-syv, sxv));
    for (let q = 0; q < 6; q++) {
      const k = kz + (1 - q * 0.4) * 0.17;
      g.globalAlpha = 0.075; g.beginPath(); g.arc(0, 0, rr, -Math.PI / 2, Math.PI / 2, true);
      for (let i = 0; i < TN; i++) g.lineTo(-k * rr * TC[i], rr * TS[i]);
      g.closePath(); g.fillStyle = km > 0.5 ? '#14000a' : '#02051a'; g.fill();
    }
    g.restore(); g.globalAlpha = 1; g.globalCompositeOperation = 'lighter';
    if (alive > 0.02) {
      const ang = Math.atan2(-syv, sxv), gs = R * 1.5, wx = cx + Math.cos(ang) * R * 0.88, wy = cy + Math.sin(ang) * R * 0.88;
      g.globalAlpha = 0.3 * alive; g.drawImage(WARM, wx - gs / 2, wy - gs / 2, gs, gs);
      g.lineWidth = 1.6; g.strokeStyle = 'rgba(255,214,160,' + (0.5 * alive).toFixed(2) + ')'; g.beginPath(); g.arc(cx, cy, R * 1.006, ang - 0.85, ang + 0.85); g.stroke();
      g.lineWidth = 6; g.strokeStyle = 'rgba(255,170,100,' + (0.1 * alive).toFixed(2) + ')'; g.beginPath(); g.arc(cx, cy, R * 1.012, ang - 0.7, ang + 0.7); g.stroke(); g.globalAlpha = 1;
    }
    g.globalCompositeOperation = 'source-over';
  });
});
