# builds / tile-code-owns
**Derived atom, a real chunk of `builds/full-section`.** The "what code owns" tile: five bars, the stop turns red under the kill switch.

This folder holds html, css and script of tile (6). The files here are not hand-made copies: they are consecutive pieces of the section's original source (see `components/UNITS.md`). The main page (`node jev/build.mjs`) is built from these same chunks, so editing them changes the page; do not edit a copy.

## Standalone page
`compose`: `builds/_head` + `builds/_stub` + `builds/_tiles-base` + `builds/value-bubble` + `builds/_tiles-open` + `self` + `builds/_tiles-close` + `builds/_drive` + `builds/_end` + `builds/_responsive` + `builds/_one-col` (`self` = the chunk files of this folder; `builds/_stub`, `builds/_one-col`, `builds/_drive`, `builds/_shim-latency` and `builds/_demo-odometer` are small harness units that exist only for standalone pages and are not part of the section).
Rebuild with `node jev/build-components.mjs --only builds/tile-code-owns`.

## Reuse elsewhere
Copy this folder and every unit folder listed in `compose`, plus the shared runtime `src/js/engine.js`, `src/js/core.js`, `src/css/base.css` (and `fx.js` / `fx.css` when `needs.fx` is true: the `.rv` reveal is driven by it); join the chunks in `compose` order (html, css, js each joined with ''), put the js in one <script> and call `JEV.boot()`. Everything is simulated; feed real data with `JEV.bus.emit('decision', d)`.
