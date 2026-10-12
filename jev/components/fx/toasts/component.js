/* fx / toasts - JEV.toast(msg, kind) notification pills.
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Markup: <div id="fx-toasts" role="status" aria-live="polite"></div> (position:fixed, bottom centre; see component.css).
 * JEV.* used: mod, $, clamp, bus ('kill' bool -> kill / armed toast, 'floor' number -> "floor -> 0.90" toast), S.floor, S.killed, reduce.
 * Provides: JEV.toast(message, kind) with kind 'info' | 'ok' | 'kill'. Hover (mouse) pauses the 3 s countdown, tap / swipe / Esc dismiss, max 2 stacked, a repeated message replaces itself.
 * Data: none required - call JEV.toast from anywhere (an order fill, a risk breach); swap the bus listeners for your own events. */
JEV.mod('fx-toasts', () => {
  const J = JEV, doc = document;
  const $ = J.$, clamp = J.clamp;

  const toastHost = $('#fx-toasts'), toasts = [];
  const ICON = {
    info: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.2"/><path d="M8 7.2v3.6M8 5.1v.1"/></svg>',
    ok: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.2"/><path d="M5.2 8.2l2 2 3.6-4.1"/></svg>',
    kill: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.2 1.8h5.6l3.4 3.4v5.6l-3.4 3.4H5.2L1.8 10.8V5.2z"/><path d="M8 4.8v3.8M8 11v.1"/></svg>',
  };
  const TOAST_MS = 3000;
  function dismiss(t, fast) {
    if (t.gone) return;
    t.gone = true; clearTimeout(t.timer);
    const i = toasts.indexOf(t); if (i >= 0) toasts.splice(i, 1);
    t.el.classList.add('fx-t-out'); if (fast) t.el.classList.add('fast');
    t.el.style.pointerEvents = 'none';
    setTimeout(() => t.el.remove(), fast ? 170 : 400);
  }
  function arm(t) { clearTimeout(t.timer); t.since = performance.now(); t.timer = setTimeout(() => dismiss(t), Math.max(120, t.left)); }
  function wireToast(t) { // hover pauses (mouse), tap / swipe / Esc dismiss
    const el = t.el; let id = -1, x0 = 0, dx = 0, moved = false;
    el.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse' || t.gone) return; clearTimeout(t.timer); t.left -= performance.now() - t.since; el.classList.add('hold'); });
    el.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'mouse' || t.gone || !el.classList.contains('hold')) return; el.classList.remove('hold'); arm(t); });
    el.addEventListener('pointerdown', (e) => { if (t.gone) return; id = e.pointerId; x0 = e.clientX; dx = 0; moved = false; el.style.transition = 'none'; try { el.setPointerCapture(id); } catch (err) { /* ignore */ } });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      dx = e.clientX - x0; if (Math.abs(dx) > 6) moved = true;
      if (moved) { el.style.transform = 'translateX(' + dx.toFixed(0) + 'px)'; el.style.opacity = String(clamp(1 - Math.abs(dx) / 240, 0.15, 1)); }
    });
    const end = (e) => {
      if (e.pointerId !== id) return; id = -1;
      if (Math.abs(dx) > 56) { // fling out
        el.style.transition = 'transform .22s var(--ease), opacity .22s'; el.style.transform = 'translateX(' + (dx > 0 ? 130 : -130) + 'px)'; el.style.opacity = '0'; dismiss(t, true);
      } else if (!moved && e.type === 'pointerup') dismiss(t, true);
      else { el.style.transition = 'transform .3s var(--ease), opacity .3s'; el.style.transform = ''; el.style.opacity = ''; }
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  }
  /** bottom-centre glass pill with icon + countdown bar, auto-dismiss 3 s (hover holds), tap / swipe / Esc dismiss, max 2 stacked. kind: 'info' | 'ok' | 'kill' */
  J.toast = (msg, kind) => {
    if (!toastHost) return;
    kind = ICON[kind] ? kind : 'info';
    for (const o of toasts.slice()) if (o.msg === msg) dismiss(o, true);
    const el = doc.createElement('div'), ic = doc.createElement('i'), tx = doc.createElement('span'), bar = doc.createElement('b');
    el.className = 'fx-toast fx-t-' + kind; ic.className = 'fx-t-ic'; ic.innerHTML = ICON[kind]; bar.className = 'fx-t-bar'; tx.textContent = msg;
    el.title = 'tap, swipe or press esc to dismiss';
    el.append(ic, tx, bar); toastHost.appendChild(el);
    const t = { el, msg, gone: false, timer: 0, left: TOAST_MS, since: 0 };
    toasts.push(t); wireToast(t);
    while (toasts.length > 2) dismiss(toasts[0], true);
    arm(t);
  };
  doc.addEventListener('keydown', (e) => { if (e.key === 'Escape' && toasts.length && !(e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))) dismiss(toasts[toasts.length - 1]); });

  J.bus.on('kill', (on) => {
    if (on) J.toast('KILL SWITCH THROWN - every order now routes to human review', 'kill');
    else J.toast('ARMED - gate open at floor ' + J.S.floor.toFixed(2), 'ok');
  });
  let floorT = 0;
  J.bus.on('floor', (v) => { clearTimeout(floorT); floorT = setTimeout(() => J.toast('floor -> ' + (+v).toFixed(2)), 600); });

  /* demo buttons (optional DOM) */
  const on = (id, fn) => { const b = doc.getElementById(id); if (b) b.addEventListener('click', fn); };
  on('fxdOk', () => J.toast('ORDER FILLED - simulated, 1.0% BTC-PERP', 'ok'));
  on('fxdKillT', () => J.toast('RISK CAP HIT - daily loss cap reached, desk halted', 'kill'));
  on('fxdInfo', () => J.toast('backtest 4y complete - simulated', 'info'));
  on('fxdBus', () => J.setKilled(!J.S.killed));
  on('fxdFloor', () => J.setFloor(J.S.floor >= 0.95 ? 0.85 : J.S.floor + 0.05));
});
