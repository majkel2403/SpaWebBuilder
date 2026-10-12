# fx / boot-overlay
A terminal-style boot sequence: five lines type out with scrambling glyphs, the progress bar ticks per step, then the terminal drops and two shutter halves slide away with a light line and flash. Click or any key skips; reduced motion skips it.

Reuse: copy this folder plus `engine.js`, `core.js` and `base.css` (from `jev/src`), inline them with the folder files into one page (see `build-components.mjs` for the order: base.css + component.css, engine.js, core.js, component.js) and call `JEV.boot()` last. `JEV.playBoot()` replays it. The overlay markup is a `<template id="fx-boot-tpl">`; edit `LINES` in component.js for your own start-up checks.

**Data it consumes:** none (static `LINES`). It emits `JEV.bus 'boot'` when the wipe starts, so a page can start its own reveal then. **Real data:** make each LINES entry wait for a real check before marking it done.
