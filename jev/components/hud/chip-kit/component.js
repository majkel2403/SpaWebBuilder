/* Lamp, pill and chip kit (hud/chip-kit)
   Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
   Data: JEV.S.dest / count / ms / killed; ids hx-ck-*.
*/
JEV.mod('hud-chip-kit', () => {
  const J = JEV;
  const set = (id, v) => { const e = document.getElementById(id); if (e && e.textContent !== v) e.textContent = v; };
  const med = (a) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
  const paint = () => {
    const S = J.S;
    set('hx-ck-ex', J.fmt(S.dest.execute)); set('hx-ck-rv', J.fmt(S.dest.review)); set('hx-ck-sk', J.fmt(S.dest.skip));
    set('hx-ck-n', J.fmt(S.count)); set('hx-ck-ms', med(S.ms).toFixed(1) + 'ms');
    set('hx-ck-st', S.killed ? 'halted' : 'armed');
    const p = document.getElementById('hx-ck-state'); if (p) { p.classList.toggle('bad', S.killed); p.classList.toggle('ok', !S.killed); }
  };
  J.bus.on('decision', paint); J.bus.on('kill', paint); paint();
});
