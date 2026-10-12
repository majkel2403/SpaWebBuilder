  /* =====================================================================
   * 4. chrome: tabs · hops · meta · status bar · audio-bars glyph
   * ===================================================================== */
  const tabs = {};
  for (const el of J.$$('.code-tab', win)) tabs[el.dataset.t] = { el, until: 0, on: false };
  function tab(k) { const o = tabs[k]; if (!o) return; o.until = J.time + 0.75; if (!o.on) { o.on = true; o.el.classList.add('hot'); } }
  function pop(el) { if (!reduce && el.animate) el.animate([{ transform: 'scale(1.9)' }, { transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
