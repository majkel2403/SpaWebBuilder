  // magnetic decide button (mouse only; the rect is cached on enter)
  let mr = null;
  magw.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') mr = go.getBoundingClientRect(); });
  magw.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!mr) mr = go.getBoundingClientRect();
    const dx = e.clientX - (mr.left + mr.width / 2), dy = e.clientY - (mr.top + mr.height / 2);
    go.style.setProperty('--tx', clamp(dx * 0.2, -9, 9).toFixed(1) + 'px'); go.style.setProperty('--ty', clamp(dy * 0.3, -6, 6).toFixed(1) + 'px');
    go.style.setProperty('--mx', (e.clientX - mr.left).toFixed(0) + 'px'); go.style.setProperty('--my', (e.clientY - mr.top).toFixed(0) + 'px');
  });
  magw.addEventListener('pointerleave', () => { mr = null; go.style.setProperty('--tx', '0px'); go.style.setProperty('--ty', '0px'); });

