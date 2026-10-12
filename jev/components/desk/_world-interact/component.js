
  /* ================================================================ interactions + bus ================================================================ */
  function setFocusRow(c) { focusCity = c; for (let i = 0; i < FD.length; i++) FD[i].el.classList.toggle('is-f', FD[i].city === c); }
  function focusVenue(c) {
    focusYaw = -CITIES[c].lon * D2R; focusHold = 4.2; kbi = c; yawVel = 0; setFocusRow(c); FL[c] = 1; if ((J.tier || 2) >= 2 && !killed) ripple(c, 3);
    const f = FDC[c]; if (liveEl && f) liveEl.textContent = 'facing ' + f.k + ' ' + CITIES[c].c.toLowerCase() + ', latency ' + Math.round(f.lat) + ' milliseconds, ' + J.sgn((f.price / J.market.price - 1) * 1e4, 1) + ' basis points versus oracle (simulated)';
    if (J.reduce) { yaw = focusYaw; redraw(); }
    if (!killed) for (let k = 0; k < ARC_BY_CITY[c].length; k++) { const ai = ARC_BY_CITY[c][k], A = ARCS[ai]; A.lit = 1; spawn(0, ai, (k + 2) % 4, 0.5, A.a !== c, 1.1); }
  }
  FD.forEach((f) => f.el.addEventListener('click', () => focusVenue(f.city)));
  Object.keys(TAB).forEach((k) => { TAB[k].el.addEventListener('click', () => togglePin(k)); ROW[k].el.addEventListener('click', () => togglePin(k)); OBK[k].el.addEventListener('click', () => togglePin(k)); });

  const liveEl = J.$('#dkw-live');
  function redraw() { if (J.reduce && g) { draw(J.time || 0, 0); orbits(J.time || 0, 0.2); } } // (under reduced motion the frame task is frozen: interactions repaint directly)
  function hit(e) {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / cks, y = (e.clientY - r.top) / cks; let best = -1, bd = (e.pointerType === 'mouse' ? 22 : 30) ** 2;
    for (let i = 0; i < CITIES.length; i++) { if (MZ[i] < 0.12) continue; const d2 = (MX[i] - x) * (MX[i] - x) + (MY[i] - y) * (MY[i] - y); if (d2 < bd) { bd = d2; best = i; } }
    return best;
  }
  function setHover(c) { if (c === hoverCity) return; hoverCity = c; grab.classList.toggle('is-hot', c >= 0); redraw(); }
  let lastX = 0, lastY = 0, lastT = 0, moved = 0, downX = 0, downY = 0;
  grab.addEventListener('pointerdown', (e) => { dragging = true; moved = 0; lastX = downX = e.clientX; lastY = downY = e.clientY; lastT = performance.now(); focusYaw = null; setFocusRow(-1); yawVel = 0; setHover(-1); try { grab.setPointerCapture(e.pointerId); } catch (_) { /* noop */ } });
  grab.addEventListener('pointermove', (e) => {
    if (!dragging) { if (e.pointerType === 'mouse') setHover(hit(e)); return; }
    const dx = e.clientX - lastX, now = performance.now(), dtm = Math.max(8, now - lastT) / 1000, dy = dx / (R * 0.9);
    if (e.pointerType === 'mouse') tiltOff = clamp(tiltOff + (e.clientY - lastY) / (R * 1.7), -0.4, 0.4); // (touch keeps vertical drags for page scroll; the tilt springs back on release)
    lastX = e.clientX; lastY = e.clientY; lastT = now; moved += Math.abs(dx); yaw += dy; yawVel = lerp(yawVel, dy / dtm, 0.4); redraw();
  });
  grab.addEventListener('pointerup', (e) => {
    if (!dragging) return; dragging = false;
    if (moved < 6 && Math.hypot(e.clientX - downX, e.clientY - downY) < 8) { const best = hit(e); if (best >= 0) focusVenue(best); }
    else yawVel = clamp(yawVel, -3, 3);
  });
  grab.addEventListener('pointercancel', () => { dragging = false; });
  grab.addEventListener('pointerleave', () => { if (!dragging) setHover(-1); });
  grab.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'ArrowRight') { focusYaw = null; setFocusRow(-1); yawVel = clamp(yawVel + (k === 'ArrowLeft' ? -1.5 : 1.5), -3, 3); if (J.reduce) { yaw += (k === 'ArrowLeft' ? -0.3 : 0.3); redraw(); } }
    else if (k === 'ArrowUp' || k === 'ArrowDown') { tiltOff = clamp(tiltOff + (k === 'ArrowUp' ? 0.2 : -0.2), -0.4, 0.4); redraw(); }
    else if (k === 'Enter' || k === ' ') { kbi = (kbi + 1) % CITIES.length; focusVenue(kbi); }
    else if (k === 'Escape') { focusYaw = null; setFocusRow(-1); }
    else return;
    e.preventDefault();
  });

  J.bus.on('tier', () => { lastSig = ''; if (g) layout(); });
  J.bus.on('tick', (m) => updateFeeds(m.price, cardIn));
  J.bus.on('decision', (d) => {
    if (killed || !cardIn) return; // (nothing here is visible off screen; a queued burst of packets on return would not be either)
    let f = null; for (let i = 0; i < FD.length; i++) if (FD[i].k === d.venue) { f = FD[i]; break; }
    if (!f) f = FD[(Math.random() * FD.length) | 0];
    FL[f.city] = Math.min(1, FL[f.city] + 0.7);
    const arcs = ARC_BY_CITY[f.city], ai = arcs[(Math.random() * arcs.length) | 0], A = ARCS[ai];
    spawn(0, ai, d.dest === 'execute' ? 2 : d.dest === 'review' ? 0 : 1, rnd(0.42, 0.66), A.a !== f.city, 1);
    A.lit = Math.min(1, A.lit + 0.5);
    if (d.dest === 'execute') { flash(f.el); if (BEAMS.length >= 7) spawn(1, (Math.random() * 7) | 0, 0, 0.7, false, 1); }
  });
  J.bus.on('kill', (v) => {
    killed = !!v;
    if (killed) { for (let i = 0; i < POOL.length; i++) POOL[i].on = 0; for (let i = 0; i < ARCS.length; i++) ARCS[i].lit = 0; for (let j = 3; j < 6; j++) setStatus(j, 'halted'); }
    else for (let j = 3; j < 6; j++) if (ST.status[j] === 'halted') setStatus(j, 'idle');
    if (live()) paintNow(); else dirty = true;
  });
  // the card (feeds, globe) and the tab strip under it are watched together: the agent surfaces repaint from state as soon as either comes back
  const vio = new IntersectionObserver((es) => {
    const wasCard = cardIn, wasLive = live();
    for (const e of es) { if (e.target === root) cardIn = e.isIntersecting; else tabsIn = e.isIntersecting; }
    if (cardIn && !wasCard) updateFeeds(J.market.price, true);
    if (!wasLive && live() && dirty) resync();
  }, { rootMargin: '120px' });
  vio.observe(root); vio.observe(tabsEl);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearTimeout(timer); timer = 0; return; } // a hidden tab gets no frames: stop stepping, resume without catch-up
    if (!timer) timer = setTimeout(runStep, 400);
    if (live() && dirty) resync();
  });
  // the reveal transform changes measured rects: re-measure once it settles
  root.addEventListener('transitionend', (e) => { if (e.target === root && e.propertyName === 'transform') layout(); });
