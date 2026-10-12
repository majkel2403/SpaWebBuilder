# fx / shockwave-ring
An expanding radial shockwave ring fired from any point: red on a kill, green on re-arm, with a trailing second wave.

A ring (radial-gradient disc scaled from 0 to the farthest corner) fired from a point, plus a delayed second wave on the red variant. `JEV.shockwave(x, y, {green, host})` appends `<i class="fx-ring">` to the `#fx-shock` host and removes it on animationend. Red = halt, `green` = re-arm. Size is the CSS var `--s` (scale), colour `--rc` (r,g,b). Trigger from any event: replace the `kill` bus listener with your own (a fill, a limit breach). Skipped under reduced motion.

Reuse: copy this folder plus `engine.js`, `core.js` and `base.css` (from `jev/src`); inline them with the folder files (see `build-components.mjs`: base.css + component.css, engine.js, core.js, component.js) and call `JEV.boot()` last.
