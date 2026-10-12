  const E = { op: J.$('#dkw-op'), opd: J.$('#dkw-opd'), oc: J.$('#dkw-oc'), disp: J.$('#dkw-disp') };
  let tickN = 0;
  function drawOracle() {
    if (!og) return;
    const h = J.market.hist, n = Math.min(h.length, 120), s = h.length - n;
    if (n < 4) return;
    let mn = 1e12, mx = -1e12; for (let i = 0; i < n; i++) { const v = h[s + i]; if (v < mn) mn = v; if (v > mx) mx = v; }
    const pad = 6, ih = OH - pad * 2, rg = mx - mn || 1;
    og.clearRect(0, 0, OW, OH); og.beginPath();
    for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * OW, y = pad + (1 - (h[s + i] - mn) / rg) * ih; if (i) og.lineTo(x, y); else og.moveTo(x, y); }
    og.lineJoin = 'round'; og.strokeStyle = 'rgba(140,185,255,.28)'; og.lineWidth = 5; og.stroke(); og.strokeStyle = '#b7d0ff'; og.lineWidth = 1.5; og.stroke();
    og.lineTo(OW, OH); og.lineTo(0, OH); og.closePath(); og.fillStyle = ogFill; og.fill();
    const ly = pad + (1 - (h[h.length - 1] - mn) / rg) * ih; og.fillStyle = '#fff'; og.beginPath(); og.arc(OW - 3, ly, 2.4, 0, TAU); og.fill();
  }
