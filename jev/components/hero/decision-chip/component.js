/* hero / decision-chip — "latest decision" readout: symbol · action · conf · size · risk -> destination badge · ms, changed digits roll like an odometer.
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * Data: JEV.bus 'decision' (d.symbol d.action d.p d.conf d.size d.riskOk d.dest d.reason d.floor d.ms); body.killed (bus 'kill') recolours review badge red. */
JEV.mod('hero-decision-chip', () => {
  'use strict';
  const J = JEV, chipEl = J.$('#hero-chip');
  if (!chipEl) return;
  const CH = {}; for (const k of ['sym', 'act', 'conf', 'size', 'risk', 'dest', 'ms', 'why']) CH[k] = J.$('#hero-c-' + k);
  const chipV = {}, ODO = { conf: 1, size: 1, ms: 1 }, odS = {};
  const pct = (x) => Math.round(x * 100);
  function confShown(d) { const pa = d.p[d.action]; return d.reason.indexOf('conf') === 0 && pa >= d.floor ? Math.min(pa, d.conf) : pa; }
  function whyText(d, cs) {
    if (d.reason === 'ok') return ''; if (d.reason.indexOf('conf') !== 0) return d.reason;
    const f = d.floor.toFixed(2); let c = (pct(cs) / 100).toFixed(2); if (c === f) c = (Math.floor(cs * 1000 + 1e-9) / 1000).toFixed(3); return 'conf ' + c + ' < ' + f;
  }
  function odo(k, v) { // per-character roll: the old glyph slides up and out, the new one springs in from below
    const el = CH[k]; let sp = odS[k];
    if (!sp || sp.length !== v.length || sp[0].parentNode !== el) { el.textContent = ''; sp = odS[k] = []; for (let i = 0; i < v.length; i++) { const c = document.createElement('span'); c.className = 'hero-od'; c.textContent = v[i]; el.appendChild(c); sp.push(c); } return; }
    for (let i = 0; i < v.length; i++) {
      const c = sp[i], ov = c.firstChild ? c.firstChild.nodeValue : ''; if (ov === v[i]) continue;
      c.textContent = v[i]; const o = document.createElement('i'); o.className = 'hero-od-o'; o.setAttribute('aria-hidden', 'true'); o.textContent = ov; c.appendChild(o);
      const a = J.animate(o, [{ transform: 'translateY(0)', opacity: .8 }, { transform: 'translateY(-.7em)', opacity: 0 }], { duration: 240, easing: 'ease-in', fill: 'forwards' });
      if (a) { a.onfinish = () => o.remove(); J.animate(c, [{ transform: 'translateY(.6em)', opacity: .5 }, { transform: 'none', opacity: 1 }], { duration: 340, easing: 'cubic-bezier(.34,1.56,.64,1)' }); } else o.remove();
    }
  }
  function setC(k, v) { if (!CH[k] || chipV[k] === v) return; const first = chipV[k] === undefined; chipV[k] = v; if (ODO[k] && !J.reduce && !first) odo(k, v); else { CH[k].textContent = v; odS[k] = null; } }
  function update(d) {
    const cs = confShown(d);
    setC('sym', d.symbol); setC('act', d.action); setC('conf', (pct(cs) / 100).toFixed(2));
    setC('size', d.action === 'hold' ? '—' : (d.size < 1 ? '0.5' : d.size) + '%'); setC('risk', d.riskOk ? 'ok' : 'flag');
    if (CH.dest && chipV.dest !== d.dest) CH.dest.setAttribute('data-d', d.dest); setC('dest', d.dest); setC('ms', d.ms.toFixed(1)); setC('why', whyText(d, cs));
    if (!J.reduce) J.animate(chipEl, [{ borderColor: 'rgba(255,255,255,.95)', boxShadow: '0 0 46px rgba(255,46,110,.95), inset 0 0 18px rgba(255,120,170,.35)' }, {}], { duration: 560, easing: 'ease-out' });
  }
  const d0 = J.recent[0] || J.makeDecision(); if (d0) { update(d0); }
  J.bus.on('decision', update);
  const b = J.$('#hdcFire'); if (b) b.addEventListener('click', () => J.fire());
});
