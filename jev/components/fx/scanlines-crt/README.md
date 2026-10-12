# fx / scanlines-crt
Fine CRT scanlines with a slow rolling light band that turns red when the kill switch is thrown.

CSS-only layer plus a tiny demo kill button. `.fx-scan` draws 1px dark lines every 3px; its child `<i>` is a soft light band rolling down on a transform animation (compositor only). Under `body.killed` (toggled by `JEV.setKilled`) the band turns red. Tune with `--scan`. In the page it is fixed and full-viewport; here it is absolute inside a box. No data consumed except the `kill` state via the body class.

Reuse: copy this folder plus `engine.js`, `core.js` and `base.css` (from `jev/src`); inline them with the folder files (see `build-components.mjs`: base.css + component.css, engine.js, core.js, component.js) and call `JEV.boot()` last.
