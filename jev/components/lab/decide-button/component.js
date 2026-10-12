/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Markup: <div class="lab-magw"><button class="lab-go"><span class="lab-go-t">decide</span><kbd class="lab-kbd">&crarr;</kbd><svg class="lab-go-i">..</svg></button></div>; add class "dirty" for the pulsing state.
 * Click / Enter calls JEV.fire() (emits a normal 'decision' on the bus) and JEV.pulse() when the fx module exists. Emits bus 'lab-decide' {n}.
 */
JEV.mod('lab-decide-button', () => {
  'use strict';
  const J = JEV, C = J.C, clamp = J.clamp, lerp = J.lerp;
  const HAS_WA = typeof Element.prototype.animate === 'function';
  const anim = (el, kf, o) => { if (!el || !HAS_WA || J.reduce) return null; try { return el.animate(kf, o); } catch (e) { return null; } };
  const fxa = (el, kf, o) => (J.hidden() ? null : anim(el, kf, o));
  const setTxt = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tierN = () => J.tier || 2;
  const lastD = () => { let d = J.recent && J.recent[0]; if (!d) { try { d = J.makeDecision(); } catch (e) { d = null; } } return d; };
  const root = J.$('#lab-db'); if (!root) return;
  const out = root.querySelector('#lab-db-out');
  let n = 0, vis = false;
  const AC = { buy: '#2ee6a6', sell: '#ff7a88', hold: '#d6d0df', close: '#ff9d5c', flatten: '#c39bff' };
  function ripple(go, x, y) {
    if (!HAS_WA || J.reduce || J.hidden()) return;
    const r = go.getBoundingClientRect(), rip = document.createElement('i');
    rip.className = 'lab-rip'; rip.style.left = (x == null ? r.width / 2 : x - r.left) + 'px'; rip.style.top = (y == null ? r.height / 2 : y - r.top) + 'px'; go.appendChild(rip);
    const a = rip.animate([{ transform: 'scale(.4)', opacity: 0.7 }, { transform: 'scale(14)', opacity: 0 }], { duration: 650, easing: 'ease-out' });
    a.onfinish = () => rip.remove();
  }
  function decide(go, x, y) {
    ripple(go, x, y);
    n++; go.classList.remove('dirty');
    try { J.fire(); } catch (e) { /* engine not ready */ }
    if (J.pulse) J.pulse(0.45);
    J.bus.emit('lab-decide', { n: n });
    out.querySelector('b').textContent = n;
  }
  root.querySelectorAll('.lab-magw').forEach((magw) => {
    const go = magw.querySelector('.lab-go'); let mr = null;
    go.addEventListener('click', (e) => decide(go, e.detail !== 0 ? e.clientX : null, e.detail !== 0 ? e.clientY : null));
    magw.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') mr = go.getBoundingClientRect(); });
    magw.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (!mr) mr = go.getBoundingClientRect();
      const dx = e.clientX - (mr.left + mr.width / 2), dy = e.clientY - (mr.top + mr.height / 2);
      go.style.setProperty('--tx', clamp(dx * 0.2, -9, 9).toFixed(1) + 'px'); go.style.setProperty('--ty', clamp(dy * 0.3, -6, 6).toFixed(1) + 'px');
      go.style.setProperty('--mx', (e.clientX - mr.left).toFixed(0) + 'px'); go.style.setProperty('--my', (e.clientY - mr.top).toFixed(0) + 'px');
    });
    magw.addEventListener('pointerleave', () => { mr = null; go.style.setProperty('--tx', '0px'); go.style.setProperty('--ty', '0px'); });
  });
  // Enter = decide while the component is on screen and no button / link has the focus
  addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.defaultPrevented || e.repeat || e.ctrlKey || e.metaKey || e.altKey || !vis) return;
    const t = e.target, tag = t && t.tagName;
    if (/^(A|TEXTAREA|SELECT|SUMMARY|INPUT|BUTTON)$/.test(tag)) return;
    e.preventDefault();
    const go = root.querySelector('.lab-go'); decide(go);
    go.classList.add('kp'); setTimeout(() => go.classList.remove('kp'), 160);
  });
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { vis = es[0].isIntersecting; }).observe(root); else vis = true;
  J.bus.on('decision', (d) => {
    out.innerHTML = 'you fired <b>' + n + '</b> decisions &middot; last on the bus <u style="text-decoration:none;font-weight:800;color:' + AC[d.action] + '">' + d.action + '</u>' + (d.action === 'hold' ? '' : ' ' + d.size + '%') + ' &rarr; ' + d.dest;
  });
});
