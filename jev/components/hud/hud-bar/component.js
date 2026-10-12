/* HUD bar (hud/hud-bar)
   Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
   The bar itself is driven by the shared runtime: JEV.boot() wires #killBtn, the odometers (#mDec #mCost), #mMed, #mFloor, the tooltips (.m[data-tip]),
   the scroll hairline and the #helpBtn shortcuts dialog as soon as an element with id="hud" exists. Keep the ids in component.html.
   JEV.* used: JEV.S {count,cost,ms[],floor,killed} · JEV.setKilled(bool) · JEV.setFloor(v) · JEV.help() · bus 'decision' 'kill' 'floor' · JEV.hud() (re-render).
   This module only adds demo glue: it prints the last decision in the placeholder page and hides nav links whose section does not exist on your page. */
JEV.mod('hud-bar', () => {
  const J = JEV;
  for (const a of J.$$('#hud .nav a')) { const id = (a.getAttribute('href') || '').slice(1); if (id && !document.getElementById(id)) a.hidden = true; }
  const last = document.getElementById('hudxLast');
  if (last) J.bus.on('decision', (d) => { last.textContent = d.symbol + ' ' + d.action + ' ' + d.size + '% conf ' + d.conf.toFixed(2) + ' -> ' + d.dest + (d.reason !== 'ok' ? ' (' + d.reason + ')' : ''); });
  /* scrollspy as on the page (fx.js section 7): .on on the link of the section in view + sliding underline */
  const nav = J.$('#hud .nav');
  if (nav) {
    const links = J.$$('a[href^="#"]', nav).filter((a) => !a.hidden), secs = links.map((a) => document.getElementById(a.getAttribute('href').slice(1)));
    const bar = document.createElement('i'); bar.className = 'fx-navbar'; bar.setAttribute('aria-hidden', 'true'); nav.appendChild(bar);
    let cur = -1;
    const place = () => { const a = links[cur]; if (!a || !a.offsetWidth) { bar.classList.remove('on'); return; } bar.style.left = a.offsetLeft + 10 + 'px'; bar.style.width = Math.max(4, a.offsetWidth - 20) + 'px'; bar.classList.add('on'); };
    const mark = (i) => { if (i === cur) return; cur = i; links.forEach((a, j) => { a.classList.toggle('on', j === i); if (j === i) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); }); place(); };
    const io = new IntersectionObserver((es) => { es.forEach((e) => (e.isIntersecting ? band.add(e.target) : band.delete(e.target))); let idx = -1; secs.forEach((s, i) => { if (s && band.has(s)) idx = i; }); if (idx >= 0) mark(idx); }, { rootMargin: '-38% 0px -58% 0px', threshold: 0 });
    const band = new Set(); secs.forEach((s) => s && io.observe(s));
    if (scrollY < 80) mark(0);
    new ResizeObserver(place).observe(nav); if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  }
});
