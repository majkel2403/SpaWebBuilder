
  function synth() { for (let i = 0; i < 60; i++) { const d = J.makeDecision(); if (d.dest === 'execute') return d; } return null; }
  function paintTicket(d) {
    const s = d.state, sol = d.symbol === 'SOL-PERP', notional = (CAP * d.size) / 100, sd = SIDE[d.action] || d.action, trade = d.action === 'buy' || d.action === 'sell', net = Math.abs(d.net || 0);
    txt(T.id, '#' + String(d.id).slice(0, 4)); txt(T.sym, d.symbol.toLowerCase()); txt(T.side, sd); if (T.side.dataset.s !== sd) T.side.dataset.s = sd; txt(T.dest, d.dest);
    txt(T.not, fmt(Math.round(notional))); txt(T.edge, trade ? '+' + net.toFixed(1) + 'bp edge' : 'reduce risk'); if (T.edge.className) T.edge.className = '';
    txt(T.sz, d.size + '%'); txt(T.px, fmt(s.price, sol ? 2 : 1)); txt(T.cf, d.conf.toFixed(2));
  }
  function renderTicket(d) {
    const notional = (CAP * d.size) / 100, net = Math.abs(d.net || 0);
    ST.ttl = J.ri(88, 132);
    const win = Math.random() < 0.58, mag = notional * (net * 1e-4 * rnd(0.5, 1.4) + 0.00006 + Math.random() * 0.00018);
    ST.pnl = win ? mag : -mag * rnd(0.5, 1.1);
    ST.alt ^= 1;
    if (live()) { paintTicket(d); T.tk.className = 'dkw-tk ' + (ST.alt ? 'fa' : 'fb'); if ((J.tier || 2) >= 2) J.animate(T.not, [{ transform: 'translateY(55%)', opacity: 0.1 }, { transform: 'none', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' }); } else dirty = true; // (the fly-in flash only plays while it can be seen)
  }
  function adopt() {
    let d = null;
    if (!J.S.killed) { for (let i = 0; i < J.recent.length; i++) if (J.recent[i].dest === 'execute') { d = J.recent[i]; break; } if (!d) d = synth(); }
    if (!d) d = ST.tk;
    if (!d) { for (let i = 0; i < J.recent.length; i++) if (J.recent[i].dest === 'execute') { d = J.recent[i]; break; } }
    if (!d) return false;
    ST.tk = d; renderTicket(d); return true;
  }
  let cpLast = '';
  function tickCd() {
    if (killed || ST.step < 0) return;
    const frac = clamp((performance.now() - ST.t0) / ST.dur, 0, 1), prog = Math.min(1, (ST.step + frac) / 6), left = Math.max(0, Math.round(ST.ttl * (1 - prog)));
    txt(T.cd, Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0')); const cp = (1 - prog).toFixed(3); if (cp !== cpLast) { cpLast = cp; T.cdf.style.setProperty('--cp', cp); }
  }
