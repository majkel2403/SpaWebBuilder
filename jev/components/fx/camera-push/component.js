/* fx / camera-push - Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot()
 * Provides JEV.cameraPush(el): adds .fx-intro to the .fx-cp container for 1.25 s. Plays once on load; button replays.
 * Data: none. Call it when your own loading overlay lifts. */
JEV.mod('fx-camera-push', () => {
  const J = JEV, box = J.$('#fxdCp');
  let t = 0;
  function cameraPush(el) {
    el = el || box;
    if (!el || J.reduce) return;
    clearTimeout(t); el.classList.remove('fx-intro');
    requestAnimationFrame(() => { el.classList.add('fx-intro'); t = setTimeout(() => el.classList.remove('fx-intro'), 1250); });
  }
  J.cameraPush = cameraPush;
  const pb = J.$('#fxdPlay');
  if (pb) pb.addEventListener('click', () => cameraPush());
  setTimeout(() => cameraPush(), 400);
});
