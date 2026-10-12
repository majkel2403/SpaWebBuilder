  /* =====================================================================
   * 4c. details: selection sweep · identifier linking · copy · minimap seek · pane keyboard
   * ===================================================================== */
  function sel(P) { // a hop selects its line for a beat (soft pink sweep that settles into the band)
    if (reduce || J.hidden()) return;
    J.animate(P.band, [{ boxShadow: 'inset 2px 0 0 var(--code-bandc), inset 0 0 0 40px var(--code-sel)' }, { boxShadow: 'inset 2px 0 0 var(--code-bandc), inset 0 0 0 40px rgba(255,255,255,0)' }], { duration: 640, easing: 'ease-out' });
  }

