# fx / ambient-backdrop
The layered violet, magenta and indigo gradient wash with a dark vignette that flips to red under the kill switch.

CSS only (plus a demo kill button). Four stacked radial gradients (violet top-left, magenta right, indigo bottom, dark vignette) on `#05030a`; `body.killed` swaps them for a red/amber set. In the page the washes are dimmer (the WebGL plasma sits on top); alpha values here are raised so it stands alone. No data consumed beyond the body class set by `JEV.setKilled`.

Reuse: copy this folder plus `engine.js`, `core.js` and `base.css` (from `jev/src`); inline them with the folder files (see `build-components.mjs`: base.css + component.css, engine.js, core.js, component.js) and call `JEV.boot()` last.
