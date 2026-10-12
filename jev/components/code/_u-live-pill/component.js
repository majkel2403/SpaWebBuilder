  const zMax = () => Math.max(0, (zout.childNodes.length - Z.rows) * Z.lh);
  function zUi() { // the sticky LIVE pill: live / paused (hover, scroll-back) / pinned, with a '+N new' tally while held
    const st = Z.pin ? 'pin' : Z.back > 4 ? 'scroll' : Z.hover ? 'hover' : 'live';
    if (st !== Z.ps) { Z.ps = st; Z.pill.setAttribute('data-s', st); Z.pill.setAttribute('aria-pressed', Z.pin ? 'true' : 'false'); Z.pt.textContent = st === 'live' ? 'live' : st === 'pin' ? 'pinned' : 'paused'; }
    const n = Z.hold ? Z.q.reduce((a, e) => a + (e.dec && e.at <= J.time ? 1 : 0), 0) : 0;
    if (n !== Z.pc) { Z.pc = n; Z.pn.hidden = !n; Z.pn.textContent = '+' + n + ' new'; }
  }
  function zResume() { Z.pin = false; Z.back = 0; if (reduce) Z.bsy = 0; }
  if (zel) {
    const fine = (e) => e.pointerType === 'mouse';
    zbody.addEventListener('pointerenter', (e) => { if (fine(e)) Z.hover = true; }); // hover the log to freeze it; the header (and the run button) never freeze it
    zbody.addEventListener('pointerleave', (e) => { if (fine(e)) { Z.hover = false; if (!Z.pin && Z.back <= 4) Z.back = 0; } });
    $('.code-run', zel).addEventListener('click', () => { J.fire(); });
    Z.pill.addEventListener('click', () => { if (Z.hold) zResume(); else Z.pin = true; });
    zbody.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const mx = zMax(), pg = Math.max(1, Z.rows - 2) * Z.lh; let b = Z.back, k = e.key;
      if (k === 'Enter') { e.preventDefault(); if (Z.hold) zResume(); else Z.pin = true; return; }
      if (k === 'Escape') { if (Z.hold) { zResume(); e.preventDefault(); } return; }
      if (k === 'c') { copyPane('zsh'); return; }
      if (k === 'ArrowUp') b += Z.lh * 2; else if (k === 'ArrowDown') b -= Z.lh * 2; else if (k === 'PageUp') b += pg; else if (k === 'PageDown') b -= pg; else if (k === 'Home') b = mx; else if (k === 'End') b = 0; else return;
      b = clamp(b, 0, mx); if (Math.abs(b - Z.back) < 0.5) return;
      e.preventDefault(); Z.back = b;
    });
    zbody.addEventListener('wheel', (e) => { // only once the log has focus: otherwise the page keeps its wheel
      if (doc.activeElement !== zbody) return;
      const mx = zMax(), b = clamp(Z.back - e.deltaY * (e.deltaMode === 1 ? Z.lh : 1), 0, mx);
      if (Math.abs(b - Z.back) < 0.5) return;
      e.preventDefault(); Z.back = b;
    }, { passive: false });
  }
  function zFlush(t, dt) {
    if (Z.off > 0.05) Z.off *= Math.exp(-dt * 13); else Z.off = 0;
    const mx = zMax(); if (Z.back > mx) Z.back = mx;
    let moved = false;
    if (reduce) { if (Z.bsy !== Z.back) { Z.bsy = Z.back; moved = true; } }
    else if (Math.abs(Z.back - Z.bsy) > 0.05) { Z.bsy += (Z.back - Z.bsy) * (1 - Math.exp(-dt * 11)); moved = true; } else if (Z.bsy !== Z.back) { Z.bsy = Z.back; moved = true; }
    const y = Z.off + Z.bsy;
    if (Math.abs(y - Z.ly) > 0.02) { Z.ly = y; zout.style.transform = y > 0.02 ? 'translate3d(0,' + y.toFixed(2) + 'px,0)' : ''; }
    if (moved) zVp();
    Z.hold = Z.hover || Z.pin || Z.back > 4;
    if (!Z.hold) {
      let k = 0;
      while (k < Z.q.length && Z.q[k].at <= t) { const e = Z.q[k++]; if (t - e.at > 1.6) e.seed = true; zPrint(e, false); }
      if (k) { Z.q.splice(0, k); }
      if (Z.dirty) { Z.dirty = false; zMm(); }
    }
    if (Z.hold || Z.ps !== 'live' || Z.pc) zUi();
  }

