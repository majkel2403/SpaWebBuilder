  /* terminal matrix rain: heads only are drawn (pre-rendered glyph atlas), a 20 Hz destination-out fade makes the trails; tier >= 2 */
  const rc = $('.code-rain', zel), RCW = 9, RCH = 13, RG = '0123456789abcdef$%+-<>/=#{}', atl = doc.createElement('canvas');
  atl.width = RCW * RG.length; atl.height = RCH;
  { const g = atl.getContext('2d'); g.font = '700 11px ui-monospace, Menlo, Consolas, monospace'; g.textBaseline = 'middle'; g.fillStyle = '#ff8fbd'; for (let i = 0; i < RG.length; i++) g.fillText(RG[i], i * RCW + 1, RCH / 2 + 0.5); }
  let rg = null, rW = 0, rH = 0, ry = new Float32Array(0), rs = new Float32Array(0), rOn = false, rFade = 0, rBoost = 0;
  if (rc && !reduce) J.watch(rc, () => {
    const f = J.fit(rc, 1); rg = f.g; rW = f.W; rH = f.H; const n = Math.max(1, Math.floor(rW / RCW));
    ry = new Float32Array(n); rs = new Float32Array(n);
    for (let i = 0; i < n; i++) { ry[i] = -Math.random() * (rH / RCH); rs[i] = 5 + Math.random() * 9; }
  });
  function rainStep(dt) {
    if (!rg) return;
    if (T() < 2) { if (rOn) { rOn = false; rg.clearRect(0, 0, rW, rH); } return; }
    rOn = true; rBoost *= Math.exp(-dt * 2.2);
    rFade += dt;
    if (rFade >= 0.05) { rg.globalCompositeOperation = 'destination-out'; rg.fillStyle = 'rgba(0,0,0,' + (1 - Math.exp(-rFade * 1.5)).toFixed(3) + ')'; rg.fillRect(0, 0, rW, rH); rg.globalCompositeOperation = 'source-over'; rFade = 0; }
    const k = (1 + rBoost * 2.2) * dt, rows = rH / RCH;
    for (let i = 0; i < ry.length; i++) {
      const p = ry[i] | 0; ry[i] += rs[i] * k;
      if ((ry[i] | 0) !== p && ry[i] > 0) rg.drawImage(atl, ((Math.random() * RG.length) | 0) * RCW, 0, RCW, RCH, i * RCW, (ry[i] | 0) * RCH, RCW, RCH);
      if (ry[i] > rows + 2) { ry[i] = -Math.random() * 18; rs[i] = 5 + Math.random() * 9; }
    }
  }

