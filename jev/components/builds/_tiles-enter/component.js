  // entrance for tile internals
  [runEl, ownEl].forEach((e) => { if (!reduce) { e.classList.add('bld-pre'); setTimeout(() => e.classList.remove('bld-pre'), 9000); } J.onView(e, () => requestAnimationFrame(() => e.classList.remove('bld-pre')), { threshold: 0.3 }); });

