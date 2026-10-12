# fx / camera-push
A one-shot zoom-blur streak burst with a chromatic text split that settles, as when the boot overlay lifts.

Two CSS animations on one class. `#fx-push::before` is a repeating conic gradient (pink and blue spokes) masked to a ring, scaled 0.6 to 1.7 while fading (zoom-blur streaks); the container's `text-shadow` red/cyan fringe steps down to nothing in 1 s. Toggle `.fx-intro` on a `.fx-cp` box for ~1.25 s via `JEV.cameraPush(el)`. On the page it fires when the boot overlay lifts (tier 2+). No data consumed.

Reuse: copy this folder plus `engine.js`, `core.js` and `base.css` (from `jev/src`); inline them with the folder files (see `build-components.mjs`: base.css + component.css, engine.js, core.js, component.js) and call `JEV.boot()` last.
