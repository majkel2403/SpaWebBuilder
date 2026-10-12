/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Consumes: bus 'decision' -> d.action, d.size, d.venue, d.conf, d.riskOk, d.reason, d.dest. Rendering: one <span class="lab-jl" style="--i:N"> per line, class "type" on the <pre> plays the line-by-line typing.
 * Token classes: .k key .s string .n number .b boolean .p punctuation.
 */
JEV.mod('lab-handoff-json', () => {
  'use strict';
  const J = JEV, C = J.C, clamp = J.clamp, lerp = J.lerp;
  const HAS_WA = typeof Element.prototype.animate === 'function';
  const anim = (el, kf, o) => { if (!el || !HAS_WA || J.reduce) return null; try { return el.animate(kf, o); } catch (e) { return null; } };
  const fxa = (el, kf, o) => (J.hidden() ? null : anim(el, kf, o));
  const setTxt = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tierN = () => J.tier || 2;
  const lastD = () => { let d = J.recent && J.recent[0]; if (!d) { try { d = J.makeDecision(); } catch (e) { d = null; } } return d; };
  const root = J.$('#lab-hj'); if (!root) return;
  const jsEl = root.querySelector('#lab-js');
  let cur = null;
  const jS = (v) => '<span class="s">"' + esc(v) + '"</span>', jN = (v) => '<span class="n">' + v + '</span>', jB = (v) => '<span class="b">' + v + '</span>';
  function render(d, pop) {
    cur = d;
    const rowsJ = [['action', jS(d.action)], ['size', d.action === 'hold' ? jB('null') : jN(d.size)], ['venue', jS(d.venue || 'venue')], ['conf', jN(d.conf.toFixed(2))], ['risk_ok', jB(d.riskOk)], ['reason', jS(d.reason)], ['dest', jS(d.dest)]];
    let h = '<span class="lab-jl p" style="--i:0">{</span>';
    rowsJ.forEach((r, i) => { h += '<span class="lab-jl" style="--i:' + (i + 1) + '">  <u class="k">"' + r[0] + '"</u><span class="p">:</span> ' + r[1] + (i < rowsJ.length - 1 ? '<span class="p">,</span>' : '') + '</span>'; });
    h += '<span class="lab-jl p" style="--i:8">}</span>';
    jsEl.className = 'lab-js' + (pop && !J.reduce ? ' type' : '');
    jsEl.innerHTML = h;
  }
  const json = () => {
    const d = cur || lastD(); if (!d) return '{}';
    return JSON.stringify({ action: d.action, size: d.action === 'hold' ? null : d.size, venue: d.venue, conf: +d.conf.toFixed(2), risk_ok: d.riskOk, floor: +d.floor.toFixed(2), reason: d.reason, dest: d.dest, simulated: true }, null, 2);
  };

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
  wireCopy(root.querySelector('#lab-cp-json'), json, 'handoff json copied \u00b7 simulated');
  J.bus.on('decision', (d) => render(d, true));
  const d0 = lastD(); if (d0) render(d0, false);
});
