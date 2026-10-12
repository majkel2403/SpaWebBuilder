  /* =====================================================================
   * 2. panes (static code + json) : build · type · band · scroll · minimap
   * ===================================================================== */
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
  const D = mk('desk', { cps: 190, delay: 0, base: 9.3, hop: { ask: 9, gate: 12, skip: 14, write: 19 }, rest: 19, tab: 'desk' });
  const S = mk('state', { cps: 160, delay: 0.18, base: 9.4, hop: { id: 1, action: 13, size: 14, risk: 15, dest: 17 }, rest: 17, tab: 'state' });
  const Q = mk('q', { cps: 190, delay: 0.38, base: 9.3, hop: { action: 5, size: 6, risk: 7, floor: 10, cap: 11, kill: 13, gate: 15 }, rest: 15, tab: 'q' });

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
