# fx / scroll-progress-and-headings
A pink scroll-progress hairline with one tick per section (lit once reached), split-letter `.h2` headings that rise in with a one-shot light sweep, and blur/translate `.rv` reveals staggered by `--i` with failsafes so nothing stays hidden.

Reuse: copy this folder plus `engine.js`, `core.js` and `base.css` (from `jev/src`), inline them with the folder files into one page (see `build-components.mjs` for the order: base.css + component.css, engine.js, core.js, component.js) and call `JEV.boot()` last. Mark sections with `data-fx-sec="label"`, headings with `<h2 class="h2">text <em>accent</em></h2>`, reveal blocks with `class="rv"`. Core splits headings and adds `.st-in` itself; this module adds the sweep and the `.in` reveals.

**Data it consumes:** none (scroll position and layout only). Reduced motion shows everything immediately.
