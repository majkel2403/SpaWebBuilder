/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Consumes: bus 'decision' -> d.action, d.size, d.conf, d.dest, d.reason; seeded from JEV.recent (newest first). Keeps the last 5.
 * Emits: bus 'lab-restore' {n, action, size, conf, dest, reason, state} when a row is clicked / activated with Enter or Space (use it to put a past decision's inputs back).
 * Row: <li><span>#a1</span><b class="lab-tp-a" data-a="buy">buy</b><span>1%</span><span class="lab-tp-c">0.93</span><i class="lab-tp-d" data-d="execute">execute</i><em>ok</em></li>
 */
JEV.mod('lab-decision-tape', () => {
  'use strict';
  const J = JEV, C = J.C, clamp = J.clamp, lerp = J.lerp;
  const HAS_WA = typeof Element.prototype.animate === 'function';
  const anim = (el, kf, o) => { if (!el || !HAS_WA || J.reduce) return null; try { return el.animate(kf, o); } catch (e) { return null; } };
  const fxa = (el, kf, o) => (J.hidden() ? null : anim(el, kf, o));
  const setTxt = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tierN = () => J.tier || 2;
  const lastD = () => { let d = J.recent && J.recent[0]; if (!d) { try { d = J.makeDecision(); } catch (e) { d = null; } } return d; };
  const root = J.$('#lab-dt'); if (!root) return;
  const tpEl = root.querySelector('#lab-tp'), pin = root.querySelector('#lab-dt-pin');
  const tape = [];
  let seq = 0;
  const hex2 = (n) => (n & 255).toString(16).padStart(2, '0');
  const rec = (d) => ({ n: ++seq, action: d.action, size: d.size, conf: d.conf, dest: d.dest, reason: d.reason, state: d.state || d.st || null });
  function render(fresh) {
    let h = '';
    tape.forEach((r, i) => {
      h += '<li' + (fresh && i === 0 ? ' class="fresh"' : '') + ' data-i="' + i + '" tabindex="0" role="button" aria-label="pin #' + hex2(r.n) + ': ' + r.action + ', ' + r.dest + '"><span>#' + hex2(r.n) + '</span><b class="lab-tp-a" data-a="' + r.action + '">' + r.action + '</b><span>' + (r.action === 'hold' ? '-' : r.size + '%') +
        '</span><span class="lab-tp-c">' + r.conf.toFixed(2) + '</span><i class="lab-tp-d" data-d="' + r.dest + '">' + r.dest + '</i><em>' + esc(r.reason) + '</em></li>';
    });
    tpEl.innerHTML = h;
    if (fresh) anim(tpEl, [{ transform: 'translateY(-28px)' }, { transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  function push(d, fresh) { tape.unshift(rec(d)); if (tape.length > 5) tape.pop(); render(fresh); }
  // seed with the 5 newest already on the bus (oldest first so the newest ends on top)
  const seed = (J.recent || []).slice(0, 5).reverse();
  if (seed.length) seed.forEach((d) => push(d, false)); else { const d0 = lastD(); if (d0) push(d0, false); }
  J.bus.on('decision', (d) => push(d, true));
  function activate(li) {
    const r = tape[+li.getAttribute('data-i')]; if (!r) return;
    pin.innerHTML = 'pinned <b>#' + hex2(r.n) + '</b> &middot; ' + r.action + (r.action === 'hold' ? '' : ' ' + r.size + '%') + ' &middot; conf ' + r.conf.toFixed(2) + ' &rarr; ' + r.dest;
    J.bus.emit('lab-restore', r);
  }
  tpEl.addEventListener('click', (e) => { const li = e.target.closest('li[data-i]'); if (li) activate(li); });
  tpEl.addEventListener('keydown', (e) => { if (e.key !== 'Enter' && e.key !== ' ') return; const li = e.target.closest('li[data-i]'); if (li) { e.preventDefault(); activate(li); } });

  function copyText(txt) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(txt);
    return new Promise((res, rej) => {
      const ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove(); ok ? res() : rej(new Error('copy blocked'));
    });
  }
  function wireCopy(btn, make, msg) {
    const lab = btn.querySelector('span:last-child'), orig = lab.textContent;
    btn.addEventListener('click', () => {
      copyText(make()).then(() => {
        btn.classList.add('ok'); lab.textContent = 'copied';
        if (J.toast) J.toast(msg, 'ok');
        clearTimeout(btn._t); btn._t = setTimeout(() => { btn.classList.remove('ok'); lab.textContent = orig; }, 1500);
      }).catch(() => { if (J.toast) J.toast('copy blocked by the browser', 'info'); });
    });
  }
  wireCopy(root.querySelector('#lab-cp-tape'), () => JSON.stringify(tape.map((r) => ({ id: hex2(r.n), action: r.action, size: r.action === 'hold' ? null : r.size, conf: +r.conf.toFixed(2), dest: r.dest, reason: r.reason, simulated: true })), null, 2), 'tape json copied \u00b7 simulated');
});
