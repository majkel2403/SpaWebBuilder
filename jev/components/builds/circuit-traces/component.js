  /* ---------- circuit traces: cap -> trunk -> bus -> a stub into the top of every first-row tile, with travelling bits ---------- */
  const trc = $('#bld-tr');
  if (trc) {
    let tg = null, tW = 0, tH = 0, tDirty = true;
    const TS = []; // per stub: [x0,y0, x1,y1, x2,y2, x3,y3, total]
    const tiles = $$('.bld-tile', root);
    let busY = 0, trunkX = 0, busL = 0, busR = 0;
    const trMeasure = () => {
      const f = J.fit(trc, 1.5); tg = f.g; tW = f.W; tH = f.H; TS.length = 0;
      if (!tiles.length || tW < 10) return;
      let top = 1e9; tiles.forEach((e) => { top = Math.min(top, e.offsetTop); });
      const row = tiles.filter((e) => Math.abs(e.offsetTop - top) < 4);
      trunkX = tW / 2; busY = tH * 0.46;
      row.forEach((e) => {
        const cx = e.offsetLeft + e.offsetWidth / 2, a = busY, b = tH;
        TS.push([trunkX, 0, trunkX, a, cx, a, cx, b, a + Math.abs(cx - trunkX) + (b - a)]);
      });
      busL = Math.min(trunkX, ...TS.map((p) => p[4])); busR = Math.max(trunkX, ...TS.map((p) => p[4]));
      tDirty = true;
    };
    const bitAt = (p, d) => { // point at distance d along trunk -> bus -> stub
      const l0 = p[3], l1 = Math.abs(p[4] - p[2]);
      if (d < l0) { rpx = p[0]; rpy = d; } else if (d < l0 + l1) { rpx = p[2] + Math.sign(p[4] - p[2]) * (d - l0); rpy = p[3]; } else { rpx = p[4]; rpy = p[5] + (d - l0 - l1); }
    };
    function drawTrace(t, bits) {
      tg.clearRect(0, 0, tW, tH);
      tg.lineWidth = 1; tg.strokeStyle = 'rgba(255,111,166,.26)'; tg.beginPath();
      tg.moveTo(trunkX, 0); tg.lineTo(trunkX, busY); tg.moveTo(busL, busY); tg.lineTo(busR, busY);
      TS.forEach((p) => { tg.moveTo(p[4], p[5]); tg.lineTo(p[6], p[7]); });
      tg.stroke();
      tg.strokeStyle = 'rgba(255,111,166,.1)'; tg.beginPath(); // twin hairline (reads as a bus pair)
      tg.moveTo(trunkX + 4, 0); tg.lineTo(trunkX + 4, busY + 4); tg.moveTo(busL, busY + 4); tg.lineTo(busR, busY + 4);
      tg.stroke();
      tg.fillStyle = 'rgba(255,111,166,.75)'; tg.beginPath();
      tg.rect(trunkX - 2, busY - 2, 4, 4); TS.forEach((p) => { tg.rect(p[4] - 1.5, p[5] - 1.5, 3, 3); tg.rect(p[6] - 2, p[7] - 3, 4, 3); });
      tg.fill();
      if (!bits) return;
      tg.globalCompositeOperation = 'lighter';
      for (let k = 0; k < TS.length; k++) {
        const p = TS[k];
        for (let b = 0; b < 2; b++) {
          const d = ((t * 52 + b * p[8] * 0.5 + k * 23) % p[8]);
          bitAt(p, d); tg.globalAlpha = 0.95; tg.drawImage(spr[0], rpx - 6, rpy - 6, 12, 12);
        }
      }
      tg.globalAlpha = 1; tg.globalCompositeOperation = 'source-over';
    }
    J.watch(trc, () => { trMeasure(); if (tg && TS.length) drawTrace(0, false); });
    J.task(trc, (t) => {
      if (!tg || !TS.length) return;
      const bits = (J.tier || 2) >= 2 && !reduce;
      if (!bits) { if (tDirty) { drawTrace(0, false); tDirty = false; } return; }
      drawTrace(t, true);
    });
  }

