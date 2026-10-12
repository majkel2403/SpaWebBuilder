/* hero / title-card — JEV DECIDES card with letter-by-letter neon ignition and a pointer-follow holographic sheen.
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * Data: none required; reacts to JEV.bus 'kill' only through CSS (body.killed turns the spine and neon red). */
JEV.mod('hero-title-card', () => {
  'use strict';
  const J = JEV, stage = J.$('.htc-stage'), card = J.$('#htcCard'), title = J.$('#heroTitle'), btn = J.$('#htcReplay');
  if (!stage || !card || !title) return;
  const TXT = 'JEV DECIDES', tier = () => J.tier || 2;
  const letters = () => {
    title.parentNode.setAttribute('aria-label', TXT); title.textContent = '';
    for (let i = 0; i < TXT.length; i++) { const sp = document.createElement('span'); sp.className = 'hero-l'; sp.setAttribute('aria-hidden', 'true'); sp.style.setProperty('--i', i); sp.textContent = TXT[i] === ' ' ? ' ' : TXT[i]; title.appendChild(sp); }
  };
  const ignite = () => {
    if (tier() >= 2 && !J.reduce) { if (!title.firstChild || !title.firstChild.className) letters(); stage.classList.remove('hero-ign'); stage.classList.add('hero-pre'); void stage.offsetWidth; stage.classList.remove('hero-pre'); stage.classList.add('hero-ign'); }
    else J.scramble(title, TXT, 1100);
  };
  J.onView(stage, ignite, { once: true, threshold: 0.2 });
  if (btn) btn.addEventListener('click', ignite);
  let cr = null; // holographic sheen follows the pointer (mouse only, tier >= 2)
  card.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse' || tier() < 2) return; cr = card.getBoundingClientRect(); card.classList.add('is-holo'); });
  card.addEventListener('pointermove', (e) => { if (!cr) return; const x = e.clientX - cr.left, y = e.clientY - cr.top; card.style.setProperty('--hx', x.toFixed(0) + 'px'); card.style.setProperty('--hy', y.toFixed(0) + 'px'); card.style.setProperty('--hxn', (x / cr.width).toFixed(3)); }, { passive: true });
  card.addEventListener('pointerleave', () => { cr = null; card.classList.remove('is-holo'); });
});
