  /* pointer tilt + glass reflection (fine pointers only): the window leans toward the cursor, a soft glare and a diagonal streak follow it */
  const stage = $('.code-stage', root), fineP = !!(window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches), gloss = $('.code-gloss', win);
  const tilt = { rx: 0, ry: 0, tx: 0, ty: 0, gx: 50, gy: 30, tgx: 50, tgy: 30, go: 0, r: null, dirty: true, on: false };
  if (fineP && !reduce && stage) {
    stage.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (tilt.dirty || !tilt.r) { tilt.r = stage.getBoundingClientRect(); tilt.dirty = false; }
      const r = tilt.r, nx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1), ny = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1), tr = T(), a = tr >= 3 ? 2 : tr >= 2 ? 1.6 : 1;
      tilt.tx = nx * 1.5 * a; tilt.ty = -ny * 1.1 * a; tilt.tgx = (nx + 1) * 50; tilt.tgy = (ny + 1) * 50; tilt.go = 1; tilt.on = true;
    }, { passive: true });
    stage.addEventListener('pointerleave', () => { tilt.tx = tilt.ty = 0; tilt.go = 0; });
    window.addEventListener('scroll', () => { tilt.dirty = true; }, { passive: true });
    window.addEventListener('resize', () => { tilt.dirty = true; }, { passive: true });
  }
  let goSet = -1;
  function tiltStep(dt) {
    if (!tilt.on) return;
    const k = 1 - Math.exp(-dt * 6);
    tilt.rx += (tilt.ty - tilt.rx) * k; tilt.ry += (tilt.tx - tilt.ry) * k;
    if (gloss && T() >= 2) {
      tilt.gx += (tilt.tgx - tilt.gx) * k; tilt.gy += (tilt.tgy - tilt.gy) * k;
      gloss.style.setProperty('--gx', tilt.gx.toFixed(1) + '%'); gloss.style.setProperty('--gy', tilt.gy.toFixed(1) + '%'); gloss.style.setProperty('--gs', (20 + tilt.gx * 0.6).toFixed(1) + '%');
      if (goSet !== tilt.go) { goSet = tilt.go; gloss.style.setProperty('--go', String(tilt.go)); }
    }
    if (!tilt.tx && !tilt.ty && Math.abs(tilt.rx) < 0.01 && Math.abs(tilt.ry) < 0.01) { tilt.rx = tilt.ry = 0; tilt.on = false; stage.style.transform = ''; return; }
    stage.style.transform = 'perspective(1500px) rotateX(' + tilt.rx.toFixed(3) + 'deg) rotateY(' + tilt.ry.toFixed(3) + 'deg)';
  }

