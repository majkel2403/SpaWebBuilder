/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Consumes: bus 'decision' -> d.dest ('execute'|'review'|'skip'), d.venue, d.size, d.killed; JEV.S.dest for the tally. data-c on .lab-dest = green|yellow|gray picks the colour.
 * Markup: <div class="lab-dest" data-c="green"><i class="lab-dest-r"></i><b class="lab-dest-t glitch" data-text="EXECUTE">EXECUTE</b><small>order -> venue</small></div>
 */
JEV.mod('lab-dest-badge', () => {
  'use strict';
  const J = JEV, C = J.C, clamp = J.clamp, lerp = J.lerp;
  const HAS_WA = typeof Element.prototype.animate === 'function';
  const anim = (el, kf, o) => { if (!el || !HAS_WA || J.reduce) return null; try { return el.animate(kf, o); } catch (e) { return null; } };
  const fxa = (el, kf, o) => (J.hidden() ? null : anim(el, kf, o));
  const setTxt = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tierN = () => J.tier || 2;
  const lastD = () => { let d = J.recent && J.recent[0]; if (!d) { try { d = J.makeDecision(); } catch (e) { d = null; } } return d; };
  const root = J.$('#lab-dbg'); if (!root) return;
  const wrap = root.querySelector('#lab-dwrap'), dest = root.querySelector('#lab-dest'), t = root.querySelector('#lab-dest-t'), s = root.querySelector('#lab-dest-s'), ring = root.querySelector('.lab-dest-r'), burst = root.querySelector('#lab-burst'), tally = root.querySelector('#lab-tally');
  const DC = { execute: 'green', review: 'yellow', skip: 'gray' };
  const RGB = { execute: '46,230,166', review: '255,193,61', skip: '184,178,194' };
  function doBurst(dst) {
    if (!HAS_WA || J.reduce || J.hidden() || tierN() < 2) return;
    const n = dst === 'execute' ? 18 : dst === 'review' ? 8 : 0;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i'); const a = (i / n) * Math.PI * 2 + Math.random() * 0.4, r = 70 + Math.random() * 60;
      p.style.cssText = 'position:absolute;left:50%;top:50%;width:5px;height:5px;margin:-2.5px;border-radius:50%;background:rgb(' + RGB[dst] + ');box-shadow:0 0 10px rgb(' + RGB[dst] + ');pointer-events:none';
      burst.appendChild(p);
      const an = p.animate([{ transform: 'translate(0,0) scale(1.4)', opacity: 1 }, { transform: 'translate(' + (Math.cos(a) * r).toFixed(0) + 'px,' + (Math.sin(a) * r * 0.7).toFixed(0) + 'px) scale(.2)', opacity: 0 }], { duration: 620 + Math.random() * 300, easing: 'cubic-bezier(.15,.7,.3,1)', delay: 120 });
      an.onfinish = () => p.remove();
    }
  }
  function paintTally() { const S = J.S.dest || {}; ['execute', 'review', 'skip'].forEach((k) => { const b = tally.querySelector('[data-d="' + k + '"] b'); setTxt(b, J.fmt(S[k] || 0, 0)); }); }
  function show(d, pop) {
    const T = d.dest.toUpperCase();
    dest.setAttribute('data-c', DC[d.dest]); wrap.setAttribute('data-c', DC[d.dest]); t.setAttribute('data-text', T);
    if (pop) J.scramble(t, T, 460); else setTxt(t, T);
    setTxt(s, d.dest === 'execute' ? 'order \u2192 ' + (d.venue || 'venue') + ' \u00b7 ' + d.size + '%' : d.dest === 'review' ? '\u2192 human review queue' : 'no order \u00b7 nothing sent');
    if (pop) {
      anim(dest, [{ transform: 'perspective(520px) rotateX(64deg) scale(1.45)', opacity: 0 }, { transform: 'perspective(520px) rotateX(0) scale(1)', opacity: 1 }], { duration: 460, easing: 'cubic-bezier(.2,1.3,.3,1)' });
      anim(ring, [{ opacity: 0.9, transform: 'scale(.9)' }, { opacity: 0, transform: 'scale(1.3)' }], { duration: 760, easing: 'ease-out' });
      doBurst(d.dest);
      if (d.killed && d.dest === 'review') anim(dest, [{ transform: 'translateX(0)' }, { transform: 'translateX(-9px) rotate(-.6deg)' }, { transform: 'translateX(8px) rotate(.5deg)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(-2px)' }, { transform: 'none' }], { duration: 460, delay: 440, easing: 'ease-out' });
      if (d.dest === 'skip') {
        fxa(dest, [{ filter: 'brightness(1)' }, { filter: 'brightness(.5) saturate(.3)', offset: 0.4 }, { filter: 'brightness(.8) saturate(.7)' }], { duration: 900, delay: 440, easing: 'ease-out' });
        fxa(t, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.8, .55)', opacity: 0.25, offset: 0.4 }, { transform: 'scale(1)', opacity: 1 }], { duration: 820, delay: 440, easing: 'cubic-bezier(.3,0,.3,1)' });
      }
      if (d.dest === 'execute' && !J.reduce) { dest.classList.remove('shim'); void dest.offsetWidth; dest.classList.add('shim'); clearTimeout(dest._sh); dest._sh = setTimeout(() => dest.classList.remove('shim'), 1500); }
    }
    paintTally();
  }
  J.bus.on('decision', (d) => show(d, true));
  const d0 = lastD(); if (d0) show(d0, false);
});
