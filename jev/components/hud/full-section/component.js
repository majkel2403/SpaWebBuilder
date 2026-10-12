/* HUD section, complete (hud/full-section): the sticky bar exactly as on the page, plus a placeholder page with five anchored sections.
   Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
   Everything in the bar is driven by core.js through the ids #hud #mDec #mCost #mMed #mFloor #helpBtn #killBtn #killTxt (JEV.boot wires clicks, tooltips, odometers,
   the shortcuts dialog and the scroll hairline). JEV.* used: JEV.S · JEV.setKilled · JEV.setFloor · JEV.help · JEV.shortcut · bus 'decision' 'kill' 'floor'.
   This module only prints the last decision into the placeholder page and hides nav links whose section is missing. */
JEV.mod('hud-full-section', () => {
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
