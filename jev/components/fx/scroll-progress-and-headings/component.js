/* fx / scroll-progress-and-headings - scroll hairline + split-letter headings + reveal choreography.
 * Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Markup: <div id="fx-prog"><i class="fx-pf"></i></div> (fixed hairline), any number of sections marked [data-fx-sec="label"] (each gets a tick),
 *   headings as <h2 class="h2">Text <em>accent</em></h2> (core splits them into letters .st-c and adds .st-in when 30% in view; this module adds the one-shot light sweep),
 *   and blocks with class "rv" (blur/translate reveal, staggered through --i; this module adds .in when they enter the viewport, with failsafes so nothing stays hidden).
 * JEV.* used: mod, $, $$, clamp, reduce, splitText (called by core.boot for every .h2), no bus events, no data.
 * To tweak: the hairline sits at top:0 (CSS #fx-prog), the sweep is .fx-hsw in component.css. */
JEV.mod('fx-scroll-progress-and-headings', () => {
  const J = JEV, doc = document, root = doc.documentElement;
  const $ = J.$, $$ = J.$$, clamp = J.clamp, reduce = J.reduce;
  let winW = window.innerWidth, winH = window.innerHeight, scrollY = window.scrollY || 0, scrollMax = 1;

  /* scroll / resize bookkeeping (cached, never read per frame) */
  let scrollTimer = 0, resizeTimer = 0;
  const onScrollEnd = [], onResizeEnd = [];
  function measureDoc() { scrollMax = Math.max(1, root.scrollHeight - winH); placeTicks(); paintProg(); }
  let progRaf = 0;
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY || 0;
    if (!progRaf) progRaf = requestAnimationFrame(paintProg);
    clearTimeout(scrollTimer); scrollTimer = setTimeout(() => onScrollEnd.forEach((f) => f()), 160);
  }, { passive: true });
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { winW = window.innerWidth; winH = window.innerHeight; measureDoc(); onResizeEnd.forEach((f) => f()); }, 160);
  }, { passive: true });
  setTimeout(measureDoc, 600); setTimeout(measureDoc, 2600); onScrollEnd.push(measureDoc);

  /* scroll-progress hairline with a tick per section */
  const progEl = $('#fx-prog'), progFill = progEl && $('.fx-pf', progEl), progTicks = [];
  let progShown = false, progLast = -1;
  function placeTicks() {
    if (!progEl) return;
    if (!progTicks.length) {
      for (const sec of $$('[data-fx-sec]')) {
        const el = doc.createElement('i'); el.className = 'fx-tk'; el.title = (sec.getAttribute('data-fx-sec') || '').replace(/^\d+\s*/, '');
        progEl.appendChild(el); progTicks.push({ el, sec, f: 0, on: false });
      }
    }
    for (const k of progTicks) { k.f = clamp((k.sec.getBoundingClientRect().top + scrollY) / scrollMax, 0, 1); k.el.style.left = (k.f * 100).toFixed(2) + '%'; k.on = false; k.el.classList.remove('on'); }
  }
  function paintProg() {
    progRaf = 0;
    if (!progEl || !progFill) return;
    const f = clamp(scrollY / scrollMax, 0, 1), show = scrollY > 6;
    if (show !== progShown) { progShown = show; progEl.classList.toggle('show', show); }
    if (Math.abs(f - progLast) > 0.0004) { progLast = f; progFill.style.transform = 'scaleX(' + f.toFixed(4) + ')'; }
    for (const k of progTicks) { const on = f + 0.002 >= k.f && k.f > 0.001; if (on !== k.on) { k.on = on; k.el.classList.toggle('on', on); } }
  }
  setTimeout(() => { placeTicks(); paintProg(); }, 300);

  /* reveal: IntersectionObserver adds .in to .rv (stagger via --i); failsafes so nothing stays hidden */
  const seen = new WeakSet(), pend = new Set();
  let rio = null;
  function headSweep(els) { // one-shot light pass over a section heading when its reveal lands
  if (reduce) return;
  for (const e of els) {
  const h = e.classList && e.classList.contains('h2') ? e : e.querySelector && e.querySelector('.h2');
  if (!h || h.querySelector('.fx-hsw')) continue;
  const host = doc.createElement('i'), band = doc.createElement('i');
  host.className = 'fx-hsw'; host.setAttribute('aria-hidden', 'true'); host.appendChild(band); h.classList.add('fx-hs'); h.appendChild(host);
  band.addEventListener('animationend', () => host.remove(), { once: true });
  setTimeout(() => host.remove(), 2600);
  }
  }
  function landed(els) { headSweep(els); setTimeout(() => els.forEach((e) => e.classList.add('fx-done')), 1900); }
  function revealBatch(els) {
    els = els.filter((e) => !e.classList.contains('in'));
    if (!els.length) return;
    const rank = els.map((e) => (getComputedStyle(e).getPropertyValue('--i').trim() ? -1 : 1)); // honour --i set by the module itself
    let n = 0;
    els.forEach((e, i) => { if (rank[i] > 0) e.style.setProperty('--i', String(Math.min(n, 10))); n++; });
    els.forEach((e) => { e.classList.add('in'); pend.delete(e); if (rio) rio.unobserve(e); });
    landed(els);
  }
  const byPos = (a, b) => { const ra = a.boundingClientRect, rb = b.boundingClientRect; return Math.round(ra.top / 40) - Math.round(rb.top / 40) || ra.left - rb.left; };
  function scanRv() {
    for (const e of $$('.rv')) {
      if (seen.has(e)) continue; seen.add(e);
      if (e.classList.contains('in')) continue;
      if (reduce || !rio) { e.classList.add('in'); continue; }
      pend.add(e); rio.observe(e);
    }
  }
  function sweep(inView) { // failsafe: reveal what is above (and, when asked, within) the viewport
    const hit = [];
    for (const e of pend) { const r = e.getBoundingClientRect(); if (r.bottom < 0 || (inView && r.top < winH)) hit.push(e); }
    hit.forEach((e) => { e.classList.add('in'); pend.delete(e); if (rio) rio.unobserve(e); });
    if (hit.length) landed(hit);
  }
  if ('IntersectionObserver' in window && !reduce) {
    rio = new IntersectionObserver((es) => {
      const vis = es.filter((e) => e.isIntersecting).sort(byPos).map((e) => e.target);
      if (vis.length) revealBatch(vis);
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0 });
  }
  scanRv();
  onScrollEnd.push(() => sweep(false));
  setTimeout(() => sweep(true), 1500);
  if ('MutationObserver' in window) {
    let mt = 0;
    new MutationObserver(() => { if (!mt) mt = setTimeout(() => { mt = 0; scanRv(); }, 220); }).observe(doc.body, { childList: true, subtree: true });
  }
});
