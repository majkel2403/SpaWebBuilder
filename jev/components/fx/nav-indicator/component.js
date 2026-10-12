/* fx / nav-indicator - Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * Provides JEV.navBar(nav): moves .fx-navbar under the nav's .on link (left/width transition). Re-measures on resize.
 * Data: set the .on class from your scroll-spy or router. */
JEV.mod('fx-nav-indicator', () => {
  const J = JEV, nav = J.$('#fxNav');
  function navBar(n) {
    const bar = n && n.querySelector('.fx-navbar'), a = n && n.querySelector('a.on');
    if (!bar || !a) return;
    bar.style.left = a.offsetLeft + 'px'; bar.style.width = a.offsetWidth + 'px'; bar.classList.add('on');
  }
  J.navBar = navBar;
  if (!nav) return;
  const links = J.$$('a', nav);
  const set = (a) => { links.forEach((l) => l.classList.toggle('on', l === a)); navBar(nav); };
  links.forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); set(a); }));
  navBar(nav);
  addEventListener('resize', () => navBar(nav));
  let i = 0;
  J.bus.on('decision', () => { if (++i % 6 === 0 && !J.reduce) set(links[(links.indexOf(nav.querySelector('a.on')) + 1) % links.length]); });
});
