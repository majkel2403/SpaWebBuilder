/* fx / cursor-ring - custom cursor (ring + dot, fine pointers only) and magnetic buttons.
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Markup: <div id="fx-cur"><i class="fx-cr"></i><i class="fx-cd"></i></div> (see component.html) and class "fx-mag" on any button that should lean toward the pointer (edit MAGNETS to change the selector).
 * JEV.* used: mod, $, clamp, reduce, task(el, fn(t,dt)), pointer {x,y,down}. No bus events, no data.
 * The system cursor is hidden only on plain surfaces (body/links/buttons); anything that brings its own CSS cursor (inputs, crosshair charts, grab handles) keeps it and the ring steps aside. */
JEV.mod('fx-cursor-ring', () => {
  const J = JEV, doc = document, root = doc.documentElement;
  const $ = J.$, clamp = J.clamp, reduce = J.reduce;
  const fine = !!(window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches);
  let scrollY = window.scrollY || 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY || 0; }, { passive: true });

  const curEl = $('#fx-cur'), ring = curEl && $('.fx-cr', curEl), dot = curEl && $('.fx-cd', curEl);
  const INTERACTIVE = 'a[href],button,[role="button"],[role="tab"],summary,label,select,input,[tabindex]:not([tabindex="-1"])';
  const MAGNETS = '.fx-mag';
  if (fine && !reduce && curEl && ring && dot) {
    const c = { x: -200, y: -200, rx: -200, ry: -200, dx: -200, dy: -200, seen: false, tgt: null, rect: null, cls: '', sy: scrollY, rt: 0 };
    const mags = new Map(); // el -> {x,y,tx,ty}
    const setCls = (v) => { if (v !== c.cls) { c.cls = v; curEl.className = v; } };
    const state = () => {
      if (!c.seen) return;
      const t = c.tgt;
      if (!t || t.nodeType !== 1) return setCls('on');
      let cs = ''; try { cs = getComputedStyle(t).cursor; } catch (e) { /* ignore */ }
      if (cs && cs !== 'none') { root.classList.add('fx-nat'); return setCls('on nat'); } // the page brought its own cursor here: show it
      root.classList.remove('fx-nat');
      const it = t.closest ? t.closest(INTERACTIVE) : null;
      c.rect = it && !/^(INPUT|TEXTAREA)$/.test(it.tagName) ? it.getBoundingClientRect() : null;
      setCls('on' + (it ? ' hov' : '') + (J.pointer.down ? ' down' : ''));
    };
    doc.addEventListener('pointerover', (e) => { if (e.pointerType === 'touch') return; c.tgt = e.target; state(); }, { passive: true });
    doc.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') { if (c.seen) { c.seen = false; root.classList.remove('fx-cur', 'fx-nat'); setCls(''); } return; }
      if (!c.seen) { c.seen = true; c.x = c.rx = c.dx = e.clientX; c.y = c.ry = c.dy = e.clientY; root.classList.add('fx-cur'); c.tgt = e.target; state(); }
      const m = e.target && e.target.closest ? e.target.closest(MAGNETS) : null; // magnet follows the pointer while inside it
      for (const [el, o] of mags) if (el !== m) { o.tx = 0; o.ty = 0; }
      if (m && !m.disabled) {
        let o = mags.get(m); if (!o) { o = { x: 0, y: 0, tx: 0, ty: 0 }; mags.set(m, o); }
        const r = m.getBoundingClientRect(), str = Math.min(1, 60 / Math.max(r.width, r.height));
        o.tx = clamp((e.clientX - (r.left + r.width / 2)) * 0.28 * str, -7, 7); o.ty = clamp((e.clientY - (r.top + r.height / 2)) * 0.34 * str, -5, 5);
      }
    }, { passive: true });
    doc.addEventListener('pointerdown', () => { if (c.seen && c.cls.indexOf('nat') < 0) setCls(c.cls.replace(' down', '') + ' down'); }, { passive: true });
    doc.addEventListener('pointerup', () => { if (c.seen) setCls(c.cls.replace(' down', '')); }, { passive: true });
    root.addEventListener('mouseleave', () => { if (c.seen) setCls(''); });
    root.addEventListener('mouseenter', () => { if (c.seen) state(); });
    doc.addEventListener('keydown', (e) => { if (c.seen && e.key === 'Tab') { c.seen = false; root.classList.remove('fx-cur', 'fx-nat'); setCls(''); } }, true); // keyboard user: hand the cursor back
    J.task(curEl, (t, dt) => {
      if (!c.seen) return;
      const p = J.pointer; c.x = p.x; c.y = p.y;
      if (c.rect && Math.abs(scrollY - c.sy) > 0.5) { c.sy = scrollY; if (c.tgt && c.tgt.closest) { const it = c.tgt.closest(INTERACTIVE); if (it) c.rect = it.getBoundingClientRect(); } }
      let tx = c.x, ty = c.y;
      if (c.rect && c.rect.width && c.cls.indexOf('hov') >= 0) { tx += (c.rect.left + c.rect.width / 2 - c.x) * 0.3; ty += (c.rect.top + c.rect.height / 2 - c.y) * 0.3; }
      const k = 1 - Math.exp(-dt * 15), kd = 1 - Math.exp(-dt * 48);
      c.rx += (tx - c.rx) * k; c.ry += (ty - c.ry) * k; c.dx += (c.x - c.dx) * kd; c.dy += (c.y - c.dy) * kd;
      ring.style.transform = 'translate3d(' + c.rx.toFixed(1) + 'px,' + c.ry.toFixed(1) + 'px,0)';
      dot.style.transform = 'translate3d(' + c.dx.toFixed(1) + 'px,' + c.dy.toFixed(1) + 'px,0)';
      if (mags.size) {
        const km = 1 - Math.exp(-dt * 12);
        for (const [el, o] of mags) {
          o.x += (o.tx - o.x) * km; o.y += (o.ty - o.y) * km;
          if (o.tx === 0 && o.ty === 0 && Math.abs(o.x) < 0.05 && Math.abs(o.y) < 0.05) { el.style.translate = ''; mags.delete(el); continue; }
          el.style.translate = o.x.toFixed(2) + 'px ' + o.y.toFixed(2) + 'px';
        }
      }
    });
  }
});
