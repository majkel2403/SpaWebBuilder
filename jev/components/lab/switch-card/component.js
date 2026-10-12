/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Markup: <button class="lab-sw" type="button" role="switch" aria-checked="false" data-c="green" data-on="caption when on" data-off="caption when off"><i class="tg"></i><span class="lab-sw-t"><b>title</b><small>caption</small></span></button>
 *   .on = on look (set from aria-checked); .lab-kill = red variant; data-bind="kill" binds to JEV.setKilled / bus 'kill'.
 * Emits: bus 'lab-switch' {id, on}.
 */
JEV.mod('lab-switch-card', () => {
  'use strict';
  const J = JEV, C = J.C, clamp = J.clamp, lerp = J.lerp;
  const HAS_WA = typeof Element.prototype.animate === 'function';
  const anim = (el, kf, o) => { if (!el || !HAS_WA || J.reduce) return null; try { return el.animate(kf, o); } catch (e) { return null; } };
  const fxa = (el, kf, o) => (J.hidden() ? null : anim(el, kf, o));
  const setTxt = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tierN = () => J.tier || 2;
  const lastD = () => { let d = J.recent && J.recent[0]; if (!d) { try { d = J.makeDecision(); } catch (e) { d = null; } } return d; };
  const root = J.$('#lab-swc'); if (!root) return;
  const log = root.querySelector('#lab-swc-log');
  const sws = Array.from(root.querySelectorAll('.lab-sw'));
  function paint(b, on) {
    b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on));
    const s = b.querySelector('small'), t = on ? b.dataset.on : b.dataset.off;
    if (s && t) s.innerHTML = t;
  }
  sws.forEach((b) => {
    paint(b, b.getAttribute('aria-checked') === 'true');
    if (b.disabled) return;
    b.addEventListener('click', () => {
      const on = b.getAttribute('aria-checked') !== 'true';
      if (b.dataset.bind === 'kill') J.setKilled(on); else paint(b, on);
      const name = b.querySelector('b').textContent;
      J.bus.emit('lab-switch', { id: name, on: on });
      log.innerHTML = 'last change: <b>' + esc(name) + '</b> &rarr; ' + (on ? 'on' : 'off');
      fxa(b, [{ transform: 'scale(1)' }, { transform: 'scale(.97)', offset: 0.3 }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' });
    });
  });
  const kill = root.querySelector('[data-bind="kill"]');
  if (kill) { paint(kill, !!J.S.killed); J.bus.on('kill', (on) => paint(kill, !!on)); }
});
