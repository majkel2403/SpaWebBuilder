/* Odometer digit reels (hud/odometer)
   Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
   Data: JEV.S.count / cost / floor, JEV.market.price. Markup: any element with data-odo="count|cost|price|floor|manual".
*/
JEV.mod('hud-odometer', () => {
  const J = JEV;
  /* odometer: every digit is a 0-9 reel that rolls to its value; separators stay static; rebuilt only when the glyph layout changes */
  function odo(el, text) {
    if (!el || el.__od === text) return;
    el.__od = text;
    let wrap = el.__odw;
    const lay = text.replace(/\d/g, '0');
    if (!wrap || el.__odl !== lay) {
      el.__odl = lay; el.textContent = '';
      wrap = el.__odw = document.createElement('span'); wrap.className = 'od'; wrap.setAttribute('aria-hidden', 'true');
      for (const ch of text) {
        const c = document.createElement('span');
        if (ch >= '0' && ch <= '9') {
          c.className = 'od-d'; const r = document.createElement('span'); r.className = 'od-r'; r.style.setProperty('--d', ch);
          for (let i = 0; i < 10; i++) { const n = document.createElement('i'); n.textContent = i; r.appendChild(n); }
          c.appendChild(r);
        } else { c.className = 'od-s'; c.textContent = ch; }
        wrap.appendChild(c);
      }
      const sr = document.createElement('span'); sr.className = 'sr-only'; el.__ods = sr;
      el.append(wrap, sr);
    } else {
      let i = 0; for (const ch of text) { if (ch >= '0' && ch <= '9') wrap.children[i].firstChild.style.setProperty('--d', ch); i++; }
    }
    el.__ods.textContent = text;
  }
  const els = J.$$('[data-odo]');
  if (!els.length) return;
  const fmtOf = {
    count: () => J.fmt(J.S.count),
    cost: () => '$' + J.S.cost.toFixed(3),
    price: () => J.fmt(J.market ? J.market.price : 0, 2),
    floor: () => J.S.floor.toFixed(2),
  };
  const paint = () => { for (const el of els) { const f = fmtOf[el.dataset.odo]; if (f) odo(el, f()); } };
  for (const el of els) {
    if (el.dataset.odo === 'manual') odo(el, el.textContent.trim());
    el.addEventListener('odo', (e) => odo(el, String(e.detail)));
  }
  paint();
  J.bus.on('decision', paint); J.bus.on('tick', paint); J.bus.on('floor', paint);
  const rnd = document.getElementById('hx-od-rand');
  if (rnd) rnd.addEventListener('click', () => { const t = J.$('[data-odo="manual"]'); if (t) odo(t, J.fmt(Math.floor(1000 + Math.random() * 89000))); });
});
