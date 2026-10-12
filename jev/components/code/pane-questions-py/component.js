/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * JEV.* APIs relied on (all from core.js): JEV.mod, $, $$, clamp, reduce, tier, time, task, watch, fit, animate, hidden, bus.on, S, recent
 * Data: bus 'decision' (d.action d.conf d.size d.sizes d.riskOk d.pRisk d.dest d.reason d.ms d.id d.symbol d.floor d.killed d.state{...}), 'kill'(bool), 'floor'(number).
 * Optional: JEV.toast (fx module) is used for the copy toast when present. Everything is simulated. */
JEV.mod('code-pane-questions-py', () => {
  const J = JEV, $ = J.$, clamp = J.clamp, reduce = J.reduce, T = () => J.tier || 2;
  const win = $('#code-one'); if (!win) return;
  const doc = document;
  const DELAY = 0.9;

  const KW = new Set('import from def return if elif else and or not in is as for while with pass lambda True False None'.split(' '));
  const RE = /(#.*$)|(f?"(?:[^"\\]|\\.)*"?|f?'(?:[^'\\]|\\.)*'?)|(\d+(?:\.\d+)?)|([A-Za-z_]\w*)|(\s+)|(->|>=|<=|==|!=|[^\sA-Za-z_\d])/g;
  function hl(src) {
    const out = []; let m, prev = '';
    RE.lastIndex = 0;
    while ((m = RE.exec(src))) {
      const s = m[0]; let c = 'o';
      if (m[1]) c = 'c';
      else if (m[2]) c = 's';
      else if (m[3]) c = 'n';
      else if (m[4]) {
        const call = src.charAt(RE.lastIndex) === '(';
        if (KW.has(s)) c = 'k';
        else if (prev === 'def') c = 'fd';
        else if (/^[A-Z]/.test(s) && !/^[A-Z0-9_]+$/.test(s)) c = 'b';
        else if (call) c = 'f';
        else if (prev === '.') c = 'a';
        else if (/^[A-Z][A-Z0-9_]+$/.test(s)) c = 'ct';
        else c = 'v';
      } else if (m[5]) {
        if (out.length) { out[out.length - 1].t += s; continue; } // trailing space joins the previous token
        c = 'w';
      }
      if (c !== 'w' && m[5] === undefined) prev = s;
      const last = out[out.length - 1];
      if (last && last.c === c && (c === 'o' || c === 'v' || c === 'w') && last.t.trim().length === last.t.length) { last.t += s; continue; }
      out.push({ c, t: s });
    }
    return out;
  }

  const MMC = {
    light: { k: '#c10f58', s: '#08704c', n: '#a14f00', c: '#bfb5c9', f: '#1b4fd1', fd: '#1b4fd1', b: '#7b34d8', ct: '#a63c06', a: '#6f6480', o: '#8a1f55', v: '#6f6480', p: '#9a8fa8', jk: '#2a2033' },
    hot: { live: 'rgba(255,255,255,.95)', v: 'rgba(12,2,7,.7)' },
  };
  const panes = {};
  const mk = (k, cfg) => {
    const el = $('.code-pane[data-k="' + k + '"]', win), mm = $('.code-mm', el);
    const P = Object.assign({
      k, el, body: $('.code-body', el), doc: $('.code-doc', el), mmW: mm, mmC: $('canvas', mm), mmV: $('i', mm), skin: el.classList.contains('code-hot') ? 'hot' : 'light',
      mLn: $('.code-ln-n', el), mLnV: '', mTs: $('.code-ts-n', el), mTsV: '', dot: $('.code-pd', el),
      band: doc.createElement('i'), caret: doc.createElement('i'), lines: [], mode: 'idle', li: 0, ti: 0, ci: 0, began: false, pause: 0, carry: 0, wait: 0, rt: false,
      cur: 0, sy: 0, ty: 0, lh: 19, rows: 14, hv: 282, dh: 0, gm: null, seen: false, out: true, ts: 0, typedAt: -9,
    }, cfg);
    P.band.className = 'code-band'; P.band.setAttribute('aria-hidden', 'true'); P.caret.className = 'code-caret'; P.caret.setAttribute('aria-hidden', 'true');
    P.mmT = doc.createElement('b'); P.mmT.setAttribute('aria-hidden', 'true'); mm.appendChild(P.mmT); P.actI = -1; P.seekUntil = 0;
    P.scan = doc.createElement('i'); P.scan.className = 'code-scan'; P.scan.setAttribute('aria-hidden', 'true'); P.scanB = doc.createElement('b'); P.scan.appendChild(P.scanB);
    P.view = $('.code-view', el); P.view.insertBefore(P.scan, P.view.firstChild); P.sby = 0; P.sx = 0; P.cw = 7.2; P.scanOn = false;
    P.led = J.$$('.code-led i', el); P.ledv = [0, 0, 0]; P.okAt = 0; P.txAt = 0; P.rip = $('.code-rip', el);
    panes[k] = P;
    return P;
  };
  const P = mk('q', { cps: 190, delay: 0.38, base: 9.3, hop: { action: 5, size: 6, risk: 7, floor: 10, cap: 11, kill: 13, gate: 15 }, rest: 15, tab: 'q' });
  const PANES = [P];
  const HOPLIST = (d, t0) => [{ at: t0 + 0.12, i: P.hop.action }, { at: t0 + 0.3, i: P.hop.size }, { at: t0 + 0.48, i: P.hop.risk }, { at: t0 + 0.72, i: d.killed ? P.hop.kill : P.hop.gate }];

  function build(P, models) {
    const d = P.doc;
    d.textContent = ''; d.appendChild(P.band); P.actI = -1;
    P.lines = models.map((toks, i) => {
      const el = doc.createElement('div'), no = doc.createElement('span');
      el.className = 'code-ln'; no.className = 'code-no'; no.textContent = String(i + 1); el.appendChild(no);
      if (P.hop.kill === i) el.setAttribute('data-kill', '');
      const tk = toks.map((m) => { const s = doc.createElement('span'), tn = doc.createTextNode(''); s.className = 'code-' + m.c + (m.x ? ' ' + m.x : ''); s.appendChild(tn); el.appendChild(s); return { el: s, tn, c: m.c, t: m.t, live: !!m.live, x: m.x || '' }; });
      d.appendChild(el);
      return { el, no, toks: tk, on: false, done: false };
    });
    P.dh = P.lines.length * P.lh + 16;
  }
  const cls = (k) => { k.el.className = 'code-' + k.c + (k.x ? ' ' + k.x : ''); };
  function setModel(P, m) { m.forEach((toks, i) => toks.forEach((tk, j) => { const k = P.lines[i].toks[j]; k.t = tk.t; k.x = tk.x || ''; })); }
  function blank(P) {
    for (const L of P.lines) { L.on = L.done = false; L.el.classList.remove('on'); for (const k of L.toks) { k.tn.nodeValue = ''; cls(k); } }
    P.cur = 0; P.sy = P.ty = 0; P.li = P.ti = P.ci = 0; P.began = false; P.carry = 0; P.seekUntil = 0;
    applyScroll(P); band(P, 0);
  }
  function fillAll(P) {
    for (const L of P.lines) { L.on = L.done = true; L.el.classList.add('on'); for (const k of L.toks) { k.tn.nodeValue = k.t; cls(k); } }
    P.mode = 'idle'; P.el.classList.remove('code-typing');
    P.caretEnd = -2; band(P, P.rest); mm(P);
  }
  function act(P, i) { // active-line gutter glow + the minimap cursor tick
    if (P.actI === i) return;
    const o = P.lines[P.actI]; if (o) o.el.classList.remove('act');
    P.actI = i; const n = P.lines[i]; if (n) n.el.classList.add('act');
    P.mmT.style.transform = 'translate3d(0,' + (4 + i * 4).toFixed(1) + 'px,0)';
  }
  function band(P, i) {
    P.cur = i; P.band.style.transform = 'translate3d(0,' + (i * P.lh) + 'px,0)'; act(P, i);
    const L = P.lines[i];
    if (L) { const tk = L.toks, at = tk.length ? tk[tk.length - 1].el.nextSibling : null; if (P.caret.parentNode !== L.el || P.caretEnd !== i) { L.el.insertBefore(P.caret, at); P.caretEnd = i; } }
    follow(P, i);
  }
  function follow(P, i) {
    if (J.time < P.seekUntil) return; // the reader moved the view: do not fight them
    const y0 = 8 + i * P.lh, m = 2 * P.lh, max = Math.max(0, P.dh - P.hv);
    if (y0 < P.ty + m) P.ty = y0 - m; else if (y0 + P.lh > P.ty + P.hv - m) P.ty = y0 + P.lh - P.hv + m;
    P.ty = clamp(P.ty, 0, max);
  }
  function applyScroll(P) {
    P.doc.style.transform = 'translate3d(0,' + (-P.sy).toFixed(2) + 'px,0)';
    P.mmV.style.transform = 'translate3d(0,' + (4 + (P.sy / P.lh) * 4).toFixed(2) + 'px,0)';
  }
  function scroll(P, dt) {
    const d = P.ty - P.sy;
    if (Math.abs(d) < 0.04) { if (d !== 0) { P.sy = P.ty; applyScroll(P); } return; }
    P.sy += d * (1 - Math.exp(-dt * 9)); applyScroll(P);
  }

  /* minimap: coloured stubs per typed line (0.5 px per char, 4 px pitch) */
  function mm(P) {
    const m = P.gm; if (!m) return;
    const g = m.g; g.clearRect(0, 0, m.W, m.H);
    const pal = MMC[P.skin];
    for (let i = 0; i < P.lines.length; i++) {
      const L = P.lines[i]; if (!L.done && !P.rt) break;
      let x = 3;
      for (const k of L.toks) {
        const w = k.t.length * 0.5;
        if (k.c !== 'w' && k.t.trim()) { g.fillStyle = k.live ? pal.live : pal[k.c] || pal.v; g.fillRect(x, 4 + i * 4, Math.max(0.6, Math.min(w, m.W - x - 1)), 1.8); }
        x += w;
        if (x > m.W) break;
      }
    }
  }
  for (const P of PANES) {
    J.watch(P.mmW, () => { const f = J.fit(P.mmC); P.gm = f; mm(P); });
    J.watch(P.body, () => {
      const cs = getComputedStyle(win);
      P.lh = parseFloat(cs.getPropertyValue('--code-lh')) || 19; P.rows = parseFloat(cs.getPropertyValue('--code-rows')) || 14;
      P.cw = (parseFloat(cs.getPropertyValue('--code-fs')) || 12) * 0.6; P.hv = P.rows * P.lh + 16; P.dh = P.lines.length * P.lh + 16; P.mmV.style.height = (P.rows * 4 + 2) + 'px';
      band(P, P.cur); P.sy = P.ty = clamp(P.ty, 0, Math.max(0, P.dh - P.hv)); applyScroll(P);
    });
  }
  /* ---- typing engine: one line at a time, tokens in order; "live" tokens (json values) pop in whole with a flash ---- */
  function flash(el, hot) {
    if (reduce || !el.animate) return;
    if (hot && T() >= 2) { // state.json: the value blooms white-hot, then cools through a pink halo
      el.animate([{ backgroundColor: '#ffffff', boxShadow: '0 0 0 3px #fff, 0 0 30px 9px rgba(255,255,255,.95), 0 0 64px 20px rgba(255,150,195,.7)' },
        { offset: 0.3, backgroundColor: 'rgba(255,255,255,.78)', boxShadow: '0 0 0 3px rgba(255,255,255,.7), 0 0 22px 6px rgba(255,255,255,.55), 0 0 42px 12px rgba(255,150,195,.35)' }], { duration: 1150, easing: 'ease-out' });
      return;
    }
    el.animate([{ backgroundColor: '#ffffff', boxShadow: '0 0 0 3px #fff, 0 0 22px 6px rgba(255,255,255,.95)' }], { duration: 950, easing: 'ease-out' });
  }
  function beginLine(P, L) {
    if (P.rt) for (const k of L.toks) { k.tn.nodeValue = ''; cls(k); }
    L.on = true; L.done = false; L.el.classList.add('on');
    P.cur = P.li; P.band.style.transform = 'translate3d(0,' + (P.li * P.lh) + 'px,0)'; act(P, P.li);
    L.el.insertBefore(P.caret, L.no.nextSibling); P.caretEnd = -1;
    follow(P, P.li); P.began = true;
  }
  function endLine(P, L) {
    L.done = true; P.began = false; P.li++; P.ti = 0; P.ci = 0;
    const toks = L.toks.length;
    P.pause = (toks === 0 ? 0.05 : 0.035 + Math.random() * 0.07) * (P.rt ? 0.7 : 1);
    mm(P);
    if (P.li >= P.lines.length) finish(P);
  }
  function finish(P) {
    P.mode = 'idle'; P.rt = false; P.el.classList.remove('code-typing'); P.idleAt = J.time;
    P.caretEnd = -2; band(P, P.rest); mm(P);
  }
  function type(P, dt) {
    if (P.mode !== 'type') return;
    if (P.wait > 0) { P.wait -= dt; return; }
    if (P.pause > 0) { P.pause -= dt; return; }
    const b = P.cps * dt + P.carry; let n = Math.floor(b); P.carry = b - n;
    let guard = 160;
    while (n > 0 && P.mode === 'type' && guard-- > 0) {
      const L = P.lines[P.li];
      if (!L) { finish(P); break; }
      if (!P.began) beginLine(P, L);
      const k = L.toks[P.ti];
      if (!k) { endLine(P, L); if (P.pause > 0) break; continue; }
      if (k.live) { k.tn.nodeValue = k.t; flash(k.el, P.skin === 'hot'); if (k.df) { k.el.classList.add('code-df', k.df); k.df = ''; } L.el.insertBefore(P.caret, k.el.nextSibling); P.ti++; P.ci = 0; n -= 3; continue; }
      if (!k.t.trim()) { k.tn.nodeValue = k.t; P.ti++; P.ci = 0; continue; } // indentation is free
      const take = Math.min(n, k.t.length - P.ci);
      P.ci += take; n -= take; k.tn.nodeValue = k.t.slice(0, P.ci);
      if (P.ci >= k.t.length) { P.ti++; P.ci = 0; L.el.insertBefore(P.caret, k.el.nextSibling); }
    }
    if (P.mode === 'type' && P.lines[P.li] && P.lines[P.li].toks.length === 0 && P.began) endLine(P, P.lines[P.li]);
  }
  function start(P, o) {
    o = o || {};
    if (reduce) { fillAll(P); return; }
    P.rt = !!o.rt;
    if (!P.rt) blank(P); else { P.li = P.ti = P.ci = 0; P.began = false; P.carry = 0; P.ty = 0; }
    P.mode = 'type'; P.wait = o.delay || 0; P.cps = o.cps || P.cps; P.pause = 0; P.el.classList.add('code-typing'); P.typedAt = J.time;
  }

  const lineModels = (P) => $('.code-src', P.doc).textContent.replace(/\n$/, '').split('\n').map(hl);
  build(P, lineModels(P));
  /* ---- start / restart when the pane scrolls into view ---- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      for (const e of es) {
        if (e.intersectionRatio >= 0.3 && P.out) {
          P.out = false;
          start(P, { delay: P.delay });
        } else if (e.intersectionRatio === 0) P.out = true;
      }
    }, { threshold: [0, 0.3] });
    io.observe(P.el);
  } else fillAll(P);
  if (reduce) fillAll(P);

  function scanStep(P, dt) { // bloom bar rides the line being typed; its hot spot rides the caret
    if (T() < 2 || P.skin === 'dark') return;
    const typing = P.mode === 'type';
    if (!typing && !P.scanOn) return;
    const ty = 8 + (P.cur + 1) * P.lh - P.sy - 22, k = 1 - Math.exp(-dt * 16);
    if (typing && !P.scanOn) { P.sby = ty; P.sx = 5 * P.cw; }
    P.scanOn = typing;
    P.sby += (ty - P.sby) * k;
    P.scan.style.transform = 'translate3d(0,' + P.sby.toFixed(1) + 'px,0)';
    const L = P.lines[P.li]; let n = 0;
    if (L && P.began) { for (let i = 0; i < P.ti && i < L.toks.length; i++) n += L.toks[i].t.length; n += P.ci; }
    P.sx += ((5 + n) * P.cw - P.sx) * k;
    P.scanB.style.transform = 'translate3d(' + P.sx.toFixed(1) + 'px,0,0)';
  }
  function ledSet(P, i, on) { const b = on ? 1 : 0; if (P.ledv[i] === b) return; P.ledv[i] = b; P.led[i].classList.toggle('on', !!b); }
  function ledStep(t) { ledSet(P, 0, P.mode === 'type' && Math.sin(t * 41) > -0.25); ledSet(P, 1, t < P.okAt); ledSet(P, 2, t < P.txAt); }
  function sel(P) { // a hop selects its line for a beat (soft pink sweep that settles into the band)
    if (reduce || J.hidden()) return;
    J.animate(P.band, [{ boxShadow: 'inset 2px 0 0 var(--code-bandc), inset 0 0 0 40px var(--code-sel)' }, { boxShadow: 'inset 2px 0 0 var(--code-bandc), inset 0 0 0 40px rgba(255,255,255,0)' }], { duration: 640, easing: 'ease-out' });
  }
  function pop(el) { if (!reduce && el.animate) el.animate([{ transform: 'scale(1.9)' }, { transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
  const hops = []; let lastHop = -9;
  function planHops(d, t0) {
    if (hops.length > 40) hops.splice(0, hops.length - 12); // nobody is looking: never let the plan grow
    if (t0 - lastHop < 2.0) return; lastHop = t0;
    hops.push(...HOPLIST(d, t0));
  }
  function runHops(t) {
    for (let i = hops.length - 1; i >= 0; i--) {
      const h = hops[i]; if (h.at > t) continue;
      hops.splice(i, 1);
      if (t - h.at > 1.5) continue; // stale (frame stall / tab was hidden): skip instead of replaying
      if (P.mode === 'idle' && !P.out) { band(P, h.i); pop(P.dot); sel(P); P.okAt = t + 0.4; }
    }
  }
  const rips = [], RIPM = { execute: '#2ee6a6', review: '#ffc13d' };
  function ripple(dest, t) { if (T() < 2 || reduce || J.hidden() || !RIPM[dest] || rips.length > 10) return; rips.push({ at: t, P, col: RIPM[dest] }); }
  function runRips(t) {
    for (let i = rips.length - 1; i >= 0; i--) {
      const r = rips[i]; if (r.at > t) continue;
      rips.splice(i, 1);
      if (t - r.at > 1.2 || !r.P.rip) continue;
      r.P.rip.style.setProperty('--rip', r.col); r.P.txAt = t + 0.8; r.P.okAt = Math.max(r.P.okAt, t + 0.5);
      J.animate(r.P.rip, [{ opacity: 0 }, { opacity: 1, offset: 0.16 }, { opacity: 0 }], { duration: 780, easing: 'ease-out' });
    }
  }
  function meta(P, t) {
    const typing = P.mode === 'type';
    const ln = String(P.cur + 1), ts = typing ? (P.base + Math.sin(t * 3.1) * 0.45 + Math.sin(t * 7.3) * 0.25).toFixed(1) : '0.0';
    if (ln !== P.mLnV) { P.mLnV = ln; P.mLn.textContent = ln; }
    if (ts !== P.mTsV) { P.mTsV = ts; P.mTs.textContent = ts; }
  }
  // identifier linking: hover (or tap) FLOOR / gate / dest / "execute" ... and every other use lights up across the pane
  const IDC = /(?:^|\s)code-(?:v|ct|f|fa|fd|a|b|jk|s|t-dest|t-buy|t-sell|t-hold|t-close|t-flatten)(?:\s|$)/, LKS = '.code-doc span, .code-out span';
  let lkKey = '', lkOn = [];
  function keyOf(el) {
    if (!el || el.tagName !== 'SPAN' || !IDC.test(el.className)) return '';
    const t = el.textContent.trim().replace(/^f?["']|["']$/g, '');
    return /^[A-Za-z_][\w-]{1,24}$/.test(t) && !KW.has(t) ? t : '';
  }
  function link(el) {
    const raw = keyOf(el), key = raw.toLowerCase();
    if (key === lkKey) return;
    for (const e of lkOn) e.classList.remove('code-lk');
    lkOn = []; lkKey = key;
    if (!key) return;
    for (const e of win.querySelectorAll(LKS)) if (e.firstChild && keyOf(e).toLowerCase() === key) { e.classList.add('code-lk'); lkOn.push(e); }
  }
  win.addEventListener('pointerover', (e) => link(e.target));
  win.addEventListener('pointerleave', () => link(null));
  // copy: check-mark morph + toast (toast only when the fx module exists)
  const paneText = () => P.lines.map((L) => L.toks.map((x) => x.t).join('').replace(/\s+$/, '')).join('\n');
  function clip(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
    return new Promise((ok, no) => {
      const ta = doc.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      doc.body.appendChild(ta); ta.select(); let r = false; try { r = doc.execCommand('copy'); } catch (_) { /* blocked */ } ta.remove(); r ? ok() : no();
    });
  }
  function copyPane() {
    const k = 'questions.py', btn = $('.code-cp', win), txt = paneText(), n = txt ? txt.split('\n').length : 0;
    const done = (ok) => {
      if (btn) { clearTimeout(btn._t); btn.classList.toggle('done', ok); btn.setAttribute('aria-label', (ok ? 'copied ' : 'copy ') + k); if (ok) btn._t = setTimeout(() => { btn.classList.remove('done'); btn.setAttribute('aria-label', 'copy ' + k + ' (illustrative sample)'); }, 1700); }
      if (J.toast) J.toast(ok ? k + ' copied · ' + n + ' lines · illustrative sample' : 'copy blocked · select the text instead', ok ? 'ok' : 'info');
    };
    clip(txt).then(() => done(true), () => done(false));
  }
  win.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.code-cp'); if (b && win.contains(b)) copyPane(); });
  function mmDrag(w, fn) {
    let down = false;
    const go = (e) => fn((e.clientY - w.getBoundingClientRect().top - 4) / 4);
    w.addEventListener('pointerdown', (e) => { down = true; try { w.setPointerCapture(e.pointerId); } catch (_) { /* ok */ } w.classList.add('drag'); go(e); e.preventDefault(); });
    w.addEventListener('pointermove', (e) => { if (down) go(e); });
    const up = () => { down = false; w.classList.remove('drag'); };
    w.addEventListener('pointerup', up); w.addEventListener('pointercancel', up);
  }
  P.body.addEventListener('keydown', (e) => { // keyboard parity: arrows / page / home / end move the view, c copies
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const mx = Math.max(0, P.dh - P.hv), pg = Math.max(1, P.rows - 2) * P.lh; let ty = P.ty, k = e.key;
    if (k === 'c') { copyPane(); return; }
    if (k === 'ArrowUp') ty -= P.lh * 2; else if (k === 'ArrowDown') ty += P.lh * 2; else if (k === 'PageUp') ty -= pg; else if (k === 'PageDown') ty += pg; else if (k === 'Home') ty = 0; else if (k === 'End') ty = mx; else return;
    ty = clamp(ty, 0, mx); if (Math.abs(ty - P.ty) < 0.5) return;
    e.preventDefault(); P.ty = ty; P.seekUntil = J.time + 6;
  });
  mmDrag(P.mmW, (line) => { P.ty = clamp((line - P.rows / 2) * P.lh, 0, Math.max(0, P.dh - P.hv)); P.seekUntil = J.time + 6; });

  let lastMeta = 0, lastT = 0;
  J.task(win, (t) => {
    const dt = Math.min(0.3, t - lastT || 0.016); lastT = t; // wall-clock dt: typing keeps its pace even on a slow frame rate
    type(P, dt); scroll(P, dt);
    runHops(t); scanStep(P, dt); ledStep(t); runRips(t);
    if (t - lastMeta > 0.25) { lastMeta = t; meta(P, t); }
  });

  J.bus.on('decision', (d) => {
    const t = J.time;
    planHops(d, t); if (d.dest !== 'skip') ripple(d.dest, t + DELAY);
  });
  J.bus.on('kill', (on) => { if (P.mode === 'idle' && !P.out) band(P, on ? P.hop.kill : P.hop.gate); });
});
