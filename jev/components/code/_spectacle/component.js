  /* =====================================================================
   * 4d. spectacle: scanner beam · header LEDs · compile-success ripple · terminal matrix rain
   * ===================================================================== */
  const Zp = { led: J.$$('.code-led i', zel), ledv: [0, 0, 0], okAt: 0, txAt: 0, rip: $('.code-rip', zel) };
  function scanStep(P, dt) { // bloom bar rides the line being typed; its hot spot rides the caret
    if (T() < 2 || P.skin === 'dark') return;
    const typing = P.mode === 'type';
    if (!typing && !P.scanOn) return;
    const ty = 8 + (P.cur + 1) * P.lh - P.sy - 22, k = 1 - Math.exp(-dt * 16);
    if (typing && !P.scanOn) { P.sby = ty; P.sx = 5 * P.cw; }
    P.scanOn = typing;
    P.sby += (ty - P.sby) * k;
    P.scan.style.transform = 'translate3d(0,' + P.sby.toFixed(1) + 'px,0)';
    const L = P.lines[P.li]; let n = 0;
    if (L && P.began) { for (let i = 0; i < P.ti && i < L.toks.length; i++) n += L.toks[i].t.length; n += P.ci; }
    P.sx += ((5 + n) * P.cw - P.sx) * k;
    P.scanB.style.transform = 'translate3d(' + P.sx.toFixed(1) + 'px,0,0)';
  }
  function ledSet(P, i, on) { const b = on ? 1 : 0; if (P.ledv[i] === b) return; P.ledv[i] = b; P.led[i].classList.toggle('on', !!b); }
  function ledStep(t) {
    for (let i = 0; i < 3; i++) {
      const P = PANES[i], typing = P.mode === 'type';
      ledSet(P, 0, typing && Math.sin(t * 41 + i * 2.3) > -0.25); ledSet(P, 1, t < P.okAt); ledSet(P, 2, t < P.txAt);
    }
    ledSet(Zp, 0, Z.hold || t - Z.lastPrint < 0.22 && Math.sin(t * 47) > -0.2); ledSet(Zp, 1, t < Zp.okAt); ledSet(Zp, 2, t < Zp.txAt);
  }
  const stLamp = $('.lamp', win), rips = []; let okUntil = 0;
  const RIPM = { execute: '#2ee6a6', review: '#ffc13d' };
  function ripple(dest, t) { // a decision executes: the handoff line lights the terminal, then the wavefront crosses the other three panes
    if (T() < 2 || reduce || J.hidden() || !RIPM[dest] || rips.length > 10) return;
    const wb = $('.code-wave b', win), nar = J.narrow();
    const seq = dest !== 'execute' ? [[Zp, 0]] : nar ? [[Zp, 0], [Q, 0.1], [S, 0.2], [D, 0.3]] : [[Zp, 0], [S, 0.14], [Q, 0.14], [D, 0.28]];
    for (const [P, d] of seq) rips.push({ at: t + d, P, col: RIPM[dest] });
    if (dest === 'execute' && wb) J.animate(wb, [{ transform: 'translateX(300%) skewX(-18deg)', opacity: 0 }, { opacity: 1, offset: 0.16 }, { opacity: 1, offset: 0.7 }, { transform: 'translateX(-130%) skewX(-18deg)', opacity: 0 }], { duration: nar ? 700 : 950, easing: 'cubic-bezier(.45,.05,.3,1)' });
  }
  function runRips(t) {
    for (let i = rips.length - 1; i >= 0; i--) {
      const r = rips[i]; if (r.at > t) continue;
      rips.splice(i, 1);
      if (t - r.at > 1.2 || !r.P.rip) continue;
      r.P.rip.style.setProperty('--rip', r.col); r.P.txAt = t + 0.8; r.P.okAt = Math.max(r.P.okAt, t + 0.5);
      J.animate(r.P.rip, [{ opacity: 0 }, { opacity: 1, offset: 0.16 }, { opacity: 0 }], { duration: 780, easing: 'ease-out' });
      if (r.P === Zp && stT && stLamp && r.col === RIPM.execute) { okUntil = t + 1.7; if (!lkKey) stT.textContent = 'build ok · gate passed · simulated'; stLamp.classList.add('ok'); }
    }
    if (okUntil && t > okUntil) { okUntil = 0; if (!lkKey && stT) stT.textContent = stTxt; if (stLamp) stLamp.classList.remove('ok'); }
  }

