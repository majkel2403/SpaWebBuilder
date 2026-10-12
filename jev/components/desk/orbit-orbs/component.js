/* desk/orbit-orbs — six agent orbs orbiting a central jev orb on a tilted ellipse: depth scaling + fading, eyes that look along the orbit, the working agent gets a halo
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot(). Orbs are plain DOM (.dkw-ob > .orb), positioned by transform each frame.
 * Data: bus 'decision' (agents light up one by one), 'kill' (orbs freeze and dim). Hover / focus an orb to hold the spin.
 */
JEV.mod('desk-orbit-orbs', () => {
  'use strict';
  const J = JEV, TAU = J.TAU, clamp = J.clamp;
  const root = J.$('#dkx-orbit');
  if (!root) return;
  const orbs = J.$$('.dkw-ob', root), jv = J.$('#dkx-jv'), track = J.$('#dkx-track');
  const OB_ROT = -0.27;
  let cx = 0, cy = 0, RX = 150, RY = 50, os = 44, ang = 0, killed = !!J.S.killed, spd = killed ? 0 : 1, hold = false, active = -1, seq = 0;
  function layout() {
    const r = root.getBoundingClientRect(), w = root.clientWidth, h = root.clientHeight, narrow = w < 480;
    os = orbs[0].offsetWidth || 44; cx = w / 2; cy = h * 0.5;
    RX = Math.max(90, Math.min(w / 2 - os * 0.9, h * 0.62)); RY = RX * (narrow ? 0.4 : 0.34);
    track.style.width = RX * 2 + 'px'; track.style.height = RY * 2 + 'px'; track.style.transform = 'translate(' + (cx - RX) + 'px,' + (cy - RY) + 'px) rotate(' + OB_ROT + 'rad)';
    jv.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
  }
  J.watch(root, layout); layout();
  orbs.forEach((o) => { o.addEventListener('pointerenter', () => { hold = true; }); o.addEventListener('pointerleave', () => { hold = false; }); o.addEventListener('focus', () => { hold = true; }); o.addEventListener('blur', () => { hold = false; }); });
  function light(i) { active = i; orbs.forEach((o, k) => o.classList.toggle('is-on', k === i)); }
  J.bus.on('kill', (k) => { killed = !!k; if (killed) light(-1); });
  J.bus.on('decision', () => {
    if (killed) return; const id = ++seq;
    for (let i = 0; i < 6; i++) setTimeout(() => { if (id === seq && !killed && !J.hidden()) light(i); }, i * 600);
    setTimeout(() => { if (id === seq) light(-1); }, 6 * 600);
  });
  J.task(root, (t, dt) => {
    spd += ((killed || hold ? 0 : 1) - spd) * Math.min(1, dt * 2.4); ang += dt * 0.28 * spd;
    const cr = Math.cos(OB_ROT), sr = Math.sin(OB_ROT);
    for (let i = 0; i < 6; i++) {
      const a = ang + (i / 6) * TAU, x = Math.cos(a) * RX, y = Math.sin(a) * RY, z = Math.sin(a), px = cx + x * cr - y * sr, py = cy + x * sr + y * cr, s = 0.78 + 0.22 * z;
      const o = orbs[i]; o.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0) scale(' + s.toFixed(3) + ')';
      o.style.opacity = (killed ? 0.45 : 0.55 + 0.45 * (0.5 + 0.5 * z)).toFixed(2); o.style.zIndex = z > 0 ? 6 : 0;
      const e = o.firstElementChild; if (e) { e.style.setProperty('--ex', clamp(-Math.sin(a) * 2, -2, 2) + 'px'); e.style.setProperty('--ey', clamp(Math.cos(a) * 1, -1, 1) + 'px'); }
    }
  });
});
