# fx / background-shader
A fixed full-viewport WebGL background: domain-warped plasma, aurora ribbons, moving god-rays, a perspective grid and drifting motes. It renders in a worker on an OffscreenCanvas (main-thread fallback, CSS gradient when there is no WebGL) and adapts its resolution to the GPU.

Reuse: copy this folder plus `engine.js`, `core.js` and `base.css` (from `jev/src`), inline them with the folder files into one page (see `build-components.mjs` for the order: base.css + component.css, engine.js, core.js, component.js) and call `JEV.boot()` last. Put `<canvas id="fx-bg">` and `<div id="fx-bgf">` in the page (component.html).

**Data it consumes:** `JEV.bus` events `kill` (bool: sky turns red), `decision` (`d.dest`: execute = warm flash, review = amber ripple, skip = dim), `tick` (`{price}`: bps move drives the heat), `tint` and `tier`. It also reads `JEV.pointer` (light follows the cursor) and scroll position. `JEV.pulse(0..1)` fires a ripple.
**Real data:** emit the same events (`JEV.bus.emit('tick', {price})`, `JEV.bus.emit('decision', {dest:'execute'})`) from your feed.
