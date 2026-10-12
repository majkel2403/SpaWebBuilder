  // draggable floor marker on the gate track (+ keyboard)
  let drag = null;
  const floorFromX = (x) => {
    const v = clamp(Math.round(((x - drag.left) / drag.width) * 100) / 100, FLOOR.min, FLOOR.max);
    if (v !== J.S.floor) J.setFloor(v);
  };
  const dragStart = (e) => { drag = gt.getBoundingClientRect(); fl.classList.add('drag'); try { fl.setPointerCapture(e.pointerId); } catch (_) { /* noop */ } };
  fl.addEventListener('pointerdown', (e) => { if (e.button) return; e.preventDefault(); dragStart(e); });
  gt.addEventListener('pointerdown', (e) => { if (e.target.closest('#lab-fl') || e.pointerType === 'touch' || e.button) return; dragStart(e); floorFromX(e.clientX); });
  fl.addEventListener('pointermove', (e) => { if (drag) floorFromX(e.clientX); });
  const dragEnd = (e) => {
    if (!drag) return;
    drag = null; fl.classList.remove('drag');
    try { fl.releasePointerCapture(e.pointerId); } catch (_) { /* noop */ }
    scheduleCommit(90, 'floor');
  };
  fl.addEventListener('pointerup', dragEnd); fl.addEventListener('pointercancel', dragEnd);
  fl.addEventListener('keydown', (e) => {
    const big = e.shiftKey ? 0.05 : 0.01; let v = J.S.floor;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v -= big; else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v += big;
    else if (e.key === 'PageDown') v -= 0.05; else if (e.key === 'PageUp') v += 0.05; else if (e.key === 'Home') v = FLOOR.min; else if (e.key === 'End') v = FLOOR.max; else return;
    e.preventDefault(); J.setFloor(clamp(Math.round(v * 100) / 100, FLOOR.min, FLOOR.max));
  });

