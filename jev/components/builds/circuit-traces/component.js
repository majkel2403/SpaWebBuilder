/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Relies on: JEV.mod J.$ J.$$ J.fit J.watch J.task J.animate J.tier J.reduce J.BUILDS J.S; bus 'decision' 'kill'.
 * Data: decision d.build picks which stub gets the bright pulse; d.conf / d.dest fill the node text.
 */
JEV.mod('builds-circuit-traces', () => {
const J = JEV, $ = J.$, $$ = J.$$, S = J.S, B = J.BUILDS, reduce = J.reduce;
  const cv = $('#bld-tr'), wrap = $('#bld-ct'), nodesEl = $('#bld-ct-nodes');
  if (!cv || !wrap || !nodesEl) return;
  const COL = { pink: 'pink', gray: 'gray', green: 'green', blue: 'blue', yellow: 'yellow' };
  const show = B.slice(0, 4), idx = {};
  const nodes = show.map((b, i) => {
    idx[b.key] = i; const el = document.createElement('div'); el.className = 'bld-ctn'; el.dataset.c = COL[b.col] || b.col;
    el.innerHTML = '<b>' + b.name + '</b><span>' + b.v1 + '</span><i>' + b.prim + '</i>'; nodesEl.appendChild(el); return { el, v: el.children[1] };
  });
  const sprite = (rgb) => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(' + rgb + ',.85)'); r.addColorStop(1, 'rgba(' + rgb + ',0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); return c; };
  const SPR = [sprite('255,111,166'), sprite('255,77,94')];
  let g = null, W = 0, H = 0, dirty = true, kk = 0, now = 0, rx = 0, ry = 0;
  const TS = [], pulses = [];
  let busY = 0, trunkX = 0, busL = 0, busR = 0;
  function measure() {
    const f = J.fit(cv, 1.5); g = f.g; W = f.W; H = f.H; TS.length = 0;
    if (W < 10) return;
    trunkX = W / 2; busY = H * 0.46;
    nodes.forEach((n) => {
      const cx = n.el.offsetLeft + n.el.offsetWidth / 2, a = busY, b = H;
      TS.push([trunkX, 0, trunkX, a, cx, a, cx, b, a + Math.abs(cx - trunkX) + (b - a)]);
    });
    busL = Math.min(trunkX, ...TS.map((p) => p[4])); busR = Math.max(trunkX, ...TS.map((p) => p[4])); dirty = true;
  }
  function bitAt(p, d) { const l0 = p[3], l1 = Math.abs(p[4] - p[2]); if (d < l0) { rx = p[0]; ry = d; } else if (d < l0 + l1) { rx = p[2] + Math.sign(p[4] - p[2]) * (d - l0); ry = p[3]; } else { rx = p[4]; ry = p[5] + (d - l0 - l1); } }
  function draw(t, bits) {
    const sp = SPR[kk], col = kk ? '255,77,94' : '255,111,166';
    g.clearRect(0, 0, W, H);
    g.lineWidth = 1; g.strokeStyle = 'rgba(' + col + ',.26)'; g.beginPath();
    g.moveTo(trunkX, 0); g.lineTo(trunkX, busY); g.moveTo(busL, busY); g.lineTo(busR, busY);
    TS.forEach((p) => { g.moveTo(p[4], p[5]); g.lineTo(p[6], p[7]); });
    g.stroke();
    g.strokeStyle = 'rgba(' + col + ',.1)'; g.beginPath(); // twin hairline (reads as a bus pair)
    g.moveTo(trunkX + 4, 0); g.lineTo(trunkX + 4, busY + 4); g.moveTo(busL, busY + 4); g.lineTo(busR, busY + 4); g.stroke();
    g.fillStyle = 'rgba(' + col + ',.75)'; g.beginPath();
    g.rect(trunkX - 2, busY - 2, 4, 4); TS.forEach((p) => { g.rect(p[4] - 1.5, p[5] - 1.5, 3, 3); g.rect(p[6] - 2, p[7] - 3, 4, 3); });
    g.fill();
    if (!bits) return;
    g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < TS.length; k++) { const p = TS[k]; for (let b = 0; b < 2; b++) { bitAt(p, (t * 52 + b * p[8] * 0.5 + k * 23) % p[8]); g.globalAlpha = 0.9; g.drawImage(sp, rx - 6, ry - 6, 12, 12); } }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const q = pulses[i], p = TS[q.k], d = (t - q.t0) * 170;
      if (!p || d > p[8]) { pulses.splice(i, 1); if (p && !reduce) J.animate(nodes[q.k].el, [{ offset: 0, filter: 'brightness(1.6)' }], { duration: 700, easing: 'ease-out' }); continue; }
      bitAt(p, d); g.globalAlpha = 1; g.drawImage(sp, rx - 12, ry - 12, 24, 24);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  const fancy = () => (J.tier || 2) >= 2 && !reduce;
  J.watch(cv, () => { measure(); if (g && TS.length) draw(now, false); });
  J.task(cv, (t) => {
    now = t; if (!g || !TS.length) return;
    kk = S.killed ? 1 : 0;
    if (!fancy()) { if (dirty) { draw(0, false); dirty = false; } return; }
    draw(t, true);
  });
  J.bus.on('decision', (d) => {
    const i = idx[d.build] != null ? idx[d.build] : Math.floor(Math.random() * nodes.length);
    if (idx[d.build] != null) { nodes[i].v.textContent = d.action + ' \u00b7 ' + d.conf.toFixed(2); }
    if (fancy()) pulses.push({ k: i, t0: now }); else if (!reduce) J.animate(nodes[i].el, [{ offset: 0, filter: 'brightness(1.6)' }], { duration: 700, easing: 'ease-out' });
    if (pulses.length > 12) pulses.shift();
  });
  J.bus.on('kill', () => { dirty = true; });
});
