/* Nav with scrollspy (hud/nav-scrollspy)
   Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
   Markup: .spy a[href="#id"] + sections with those ids. No JEV data needed.
*/
JEV.mod('hud-nav-scrollspy', () => {
  const J = JEV;
  const nav = J.$('.spy'); if (!nav) return;
  const root = document.documentElement, bar = nav.parentElement;
  const links = J.$$('a[href^="#"]', nav);
  for (const a of links) { const id = a.getAttribute('href').slice(1); if (!id || !document.getElementById(id)) a.hidden = true; }
  const live = links.filter((a) => !a.hidden), secs = live.map((a) => document.getElementById(a.getAttribute('href').slice(1)));
  const ind = J.$('.spy-ind', nav);
  let cur = -1, raf = 0;
  const place = () => { const a = live[cur]; if (!a || !ind) return; nav.style.setProperty('--spy-x', a.offsetLeft + 'px'); nav.style.setProperty('--spy-w', a.offsetWidth + 'px'); };
  const set = (i) => {
    if (i === cur) return; cur = i;
    live.forEach((a, k) => { a.classList.toggle('on', k === i); if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    place();
    const a = live[i]; if (a && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: a.offsetLeft - nav.clientWidth / 2 + a.offsetWidth / 2, behavior: J.reduce ? 'auto' : 'smooth' });
  };
  const calc = () => {
    raf = 0; let at = 0; const line = innerHeight * 0.35 + (bar ? bar.offsetHeight * 0.5 : 0);
    for (let i = 0; i < secs.length; i++) if (secs[i].getBoundingClientRect().top <= line) at = i;
    set(at);
  };
  const req = () => { if (!raf) raf = requestAnimationFrame(calc); };
  if (bar && 'ResizeObserver' in window) new ResizeObserver(() => root.style.setProperty('--hud-h', bar.offsetHeight + 'px')).observe(bar);
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', () => { place(); req(); });
  calc();
});
