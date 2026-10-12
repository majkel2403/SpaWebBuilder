    if (TIER >= 2) { g.lineWidth = 1; g.strokeStyle = km > 0.5 ? 'rgba(255,150,160,.1)' : 'rgba(170,200,255,.1)'; for (let r = 0; r < RINGS.length; r++) { const rg = RINGS[r]; g.beginPath(); g.ellipse(cx, cy, rg.k * R, rg.k * R * rg.m, rg.rot, Math.PI, TAU); g.stroke(); } }
    // ---- orbit track (back half goes under the globe)
    g.lineWidth = 1; g.setLineDash(DASH); g.strokeStyle = km > 0.5 ? 'rgba(255,150,160,.2)' : 'rgba(170,200,255,.2)';
    g.beginPath(); g.ellipse(OB_X, OB_Y, OB_RX, OB_RY, OB_ROT, Math.PI, TAU); g.stroke(); g.setLineDash(EMPTY);
    // ---- atmosphere + dark sphere body
    g.drawImage(LAY[0], cx - layB / 2, cy - layB / 2, layB, layB);
    if (km > 0.004) { if (!LAYOK[1]) paintLayer(1); g.globalAlpha = km; g.drawImage(LAY[1], cx - layB / 2, cy - layB / 2, layB, layB); g.globalAlpha = 1; }
    else if (LAYOK[1] && !killed) { LAYOK[1] = false; LAY[1].width = LAY[1].height = 1; } // kill switch released: give the red layer's pixels back
