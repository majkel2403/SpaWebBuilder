/* hero / floor-marker — confidence floor (default 0.85) as a spring-loaded dashed marker; the latest decision's confidence is a tick that turns amber below the floor. Buttons step the floor by 0.05.
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * Data: JEV.S.floor / JEV.bus 'floor' (number) · 'decision' (d.p[d.action], d.reason, d.floor). Write the floor with JEV.setFloor(v). */
JEV.mod('hero-floor-marker', () => {
  'use strict';
  const J = JEV, track = J.$('#hfmTrack'), flag = J.$('#hfmFlag'), rv = J.$('#hfmRv'), ex = J.$('#hfmEx'), tick = J.$('#hfmTick'), tv = J.$('#hfmTickV'), fv = J.$('#hfmFloorV'), read = J.$('#hfmRead');
  if (!track || !flag) return;
  let floor = J.S.floor, disp = floor, vel = 0, conf = 0.9, tw = track.clientWidth;
  const pct = (x) => Math.round(x * 100);
  function paint() {
    rv.style.width = (floor * 100).toFixed(1) + '%'; ex.style.width = ((1 - floor) * 100).toFixed(1) + '%'; fv.textContent = 'floor ' + floor.toFixed(2);
    tick.style.left = (conf * 100).toFixed(1) + '%'; tv.textContent = conf.toFixed(2); const low = conf < floor; tick.classList.toggle('is-low', low); read.textContent = low ? 'review' : 'execute'; read.classList.toggle('is-rv', low);
  }
  function seed(d) { const pa = d.p[d.action]; conf = d.reason.indexOf('conf') === 0 && pa >= d.floor ? Math.min(pa, d.conf) : pa; }
  J.watch(track, () => { tw = track.clientWidth; });
  J.bus.on('decision', (d) => { seed(d); paint(); });
  J.bus.on('floor', (f) => { floor = f; paint(); });
  const step = (dv) => J.setFloor(Math.round(Math.min(0.99, Math.max(0.5, floor + dv)) * 100) / 100);
  const dn = J.$('#hfmDn'), up = J.$('#hfmUp'), fire = J.$('#hfmFire');
  if (dn) dn.addEventListener('click', () => step(-0.05)); if (up) up.addEventListener('click', () => step(0.05)); if (fire) fire.addEventListener('click', () => J.fire());
  J.task(track, (t, dt) => { // damped spring toward the target floor
    const s = Math.min(dt, 0.033); vel += ((floor - disp) * 240 - vel * 15) * s; disp += vel * s; if (J.reduce || (Math.abs(vel) < 0.002 && Math.abs(floor - disp) < 0.0005)) { disp = floor; vel = 0; }
    flag.style.transform = 'translateX(' + (disp * tw).toFixed(1) + 'px)';
  });
  const d0 = J.recent[0]; if (d0) seed(d0); paint(); flag.style.transform = 'translateX(' + (disp * tw).toFixed(1) + 'px)';
});
