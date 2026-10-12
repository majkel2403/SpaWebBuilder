/* Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
 * Consumes: bus 'decision' -> replays a 1.3 s timeline (encode 0 ms, typed questions 290 ms, the gate 720 ms, code acts 990 ms, done 1300 ms). #lab-prog is scaled with transform (0..1), the pill text and lamp follow,
 * .lab-run on the wrapper makes the lamp beat fast. Emits bus 'lab-stage' {i, name} when the pulse reaches each stage (use it to ignite your own stage cards).
 */
JEV.mod('lab-pipeline-status', () => {
  'use strict';
  const J = JEV, C = J.C, clamp = J.clamp, lerp = J.lerp;
  const HAS_WA = typeof Element.prototype.animate === 'function';
  const anim = (el, kf, o) => { if (!el || !HAS_WA || J.reduce) return null; try { return el.animate(kf, o); } catch (e) { return null; } };
  const fxa = (el, kf, o) => (J.hidden() ? null : anim(el, kf, o));
  const setTxt = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tierN = () => J.tier || 2;
  const lastD = () => { let d = J.recent && J.recent[0]; if (!d) { try { d = J.makeDecision(); } catch (e) { d = null; } } return d; };
  const root = J.$('#lab-ps'); if (!root) return;
  const pph = root.querySelector('#lab-pph'), statT = root.querySelector('#lab-stat-t'), prog = root.querySelector('#lab-prog'), steps = Array.from(root.querySelectorAll('#lab-steps li'));
  const NAMES = ['encode', 'typed questions', 'the gate', 'code acts'], TL = [0, 290, 720, 990, 1300];
  let t0 = 0, running = false, hold = 0, ci = -1, n = 0;
  function stage(i) {
    if (i === ci) return; ci = i;
    steps.forEach((li, k) => { li.classList.toggle('on', k === i); li.classList.toggle('done', k < i); });
    if (i >= 0) { setTxt(statT, NAMES[i]); J.bus.emit('lab-stage', { i: i, name: NAMES[i] }); }
  }
  function start() {
    n++; t0 = performance.now(); running = true; ci = -1;
    pph.classList.add('lab-run'); clearTimeout(hold);
    if (J.reduce) finish();
  }
  function finish() {
    running = false; stage(3); steps.forEach((li) => { li.classList.remove('on'); li.classList.add('done'); });
    prog.style.transform = 'scaleX(1)'; pph.classList.remove('lab-run'); setTxt(statT, 'done \u00b7 #' + n);
    hold = setTimeout(() => { prog.style.transform = 'scaleX(0)'; steps.forEach((li) => li.classList.remove('done')); setTxt(statT, 'ready'); ci = -1; }, 1800);
  }
  J.bus.on('decision', start);
  J.task(root, () => {
    if (!running) return;
    const t = performance.now() - t0;
    prog.style.transform = 'scaleX(' + clamp(t / TL[4], 0, 1).toFixed(3) + ')';
    let i = 0; for (let k = 0; k < 4; k++) if (t >= TL[k]) i = k;
    stage(i);
    if (t >= TL[4]) finish();
  });
});
