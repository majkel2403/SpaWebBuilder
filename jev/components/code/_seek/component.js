  // minimap: click or drag to move the view (code panes pin the view for a few seconds, the log scrolls back)
  function mmDrag(w, fn) {
    let down = false;
    const go = (e) => fn((e.clientY - w.getBoundingClientRect().top - 4) / 4);
    w.addEventListener('pointerdown', (e) => { down = true; try { w.setPointerCapture(e.pointerId); } catch (_) { /* ok */ } w.classList.add('drag'); go(e); e.preventDefault(); });
    w.addEventListener('pointermove', (e) => { if (down) go(e); });
    const up = () => { down = false; w.classList.remove('drag'); };
    w.addEventListener('pointerup', up); w.addEventListener('pointercancel', up);
  }
  for (const P of [D, S, Q]) {
    mmDrag(P.mmW, (line) => { P.ty = clamp((line - P.rows / 2) * P.lh, 0, Math.max(0, P.dh - P.hv)); P.seekUntil = J.time + 6; });
    P.body.addEventListener('keydown', (e) => { // keyboard parity: arrows / page / home / end move the view, c copies
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const mx = Math.max(0, P.dh - P.hv), pg = Math.max(1, P.rows - 2) * P.lh; let ty = P.ty, k = e.key;
      if (k === 'c') { copyPane(P === D ? 'desk.py' : P === S ? 'state.json' : 'questions.py'); return; }
      if (k === 'ArrowUp') ty -= P.lh * 2; else if (k === 'ArrowDown') ty += P.lh * 2; else if (k === 'PageUp') ty -= pg; else if (k === 'PageDown') ty += pg; else if (k === 'Home') ty = 0; else if (k === 'End') ty = mx; else return;
      ty = clamp(ty, 0, mx); if (Math.abs(ty - P.ty) < 0.5) return;
      e.preventDefault(); P.ty = ty; P.seekUntil = J.time + 6;
    });
  }
  mmDrag(zmmW, (line) => {
    const nd = zout.childNodes.length, first = clamp(line - Z.rows / 2, 0, Math.max(0, nd - Z.rows));
    Z.back = (Math.max(0, nd - Z.rows) - first) * Z.lh;
  });

