  /* =====================================================================
   * 5. master tick (runs only while #code is on screen)
   * ===================================================================== */
  const PANES = [D, S, Q];
  let lastMeta = 0, lastT = 0;
  J.task(root, (t) => {
    const dt = Math.min(0.3, t - lastT || 0.016); lastT = t; // wall-clock dt: typing keeps its pace even on a slow frame rate
    for (let i = 0; i < 3; i++) { type(PANES[i], dt); scroll(PANES[i], dt); }
    if (S.mode === 'idle' && latest && !S.out && t - lastRetype >= 5 && latest.id !== S.last) { S.last = latest.id; retype(latest, t); }
    runHops(t);
    zFlush(t, dt);
    drawFx(dt); tiltStep(dt);
    for (let i = 0; i < 3; i++) scanStep(PANES[i], dt);
    ledStep(t); runRips(t); rainStep(dt);
    for (const k in tabs) { const o = tabs[k]; if (o.on && t > o.until) { o.on = false; o.el.classList.remove('hot'); } }
    for (const o of fnodes) if (o.on && t > o.until) { o.on = false; o.el.classList.remove('on'); }
    if (t - lastMeta > 0.25) { lastMeta = t; for (let i = 0; i < 3; i++) meta(PANES[i], t); zMeta(t); status(); }
  });

  /* =====================================================================
   * 6. bus
   * ===================================================================== */
  J.bus.on('decision', (d) => {
    latest = d;
    const t = J.time;
    zPush(zFormat(d), t + DELAY, false);
    planHops(d, t);
  });
  J.bus.on('kill', (on) => {
    const t = J.time;
    zPush([[[on ? 't-kill' : 't-arm', on ? ' KILL SWITCH - routing all to review ' : ' ARMED - gate open at floor ' + J.S.floor.toFixed(2) + ' ']]], t, false);
    if (Q.mode === 'idle' && !Q.out) { band(Q, on ? Q.hop.kill : Q.hop.gate); }
    tab('q'); eqAct = 1;
    status();
  });
  J.bus.on('floor', (v) => { zPush([[['td', '> '], ['t-warn', 'FLOOR set to ' + (+v).toFixed(2)]]], J.time, false); status(); });
  status();
});
