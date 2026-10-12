# builds / hub
**Derived atom, a real chunk of `builds/full-section`.** The whole decision hub: ten build cards, the JEV core card, particle ribbons, three typed questions, five answers and the hard-rules row.

This folder holds no chunks of its own, it is the assembly of the hidden hub units (_hub-html, _hub-css, _hub-pre, _ribbons, _hub-post, _rules-readout, _tail, _frame) plus the shared head/end. The files here are not hand-made copies: they are consecutive pieces of the section's original source (see `components/UNITS.md`). The main page (`node jev/build.mjs`) is built from these same chunks, so editing them changes the page; do not edit a copy.

## Standalone page
`compose`: `builds/_shim-latency` + `builds/_head` + `builds/_hub-html` + `builds/_hub-css` + `builds/_hub-pre` + `builds/_ribbons` + `builds/_hub-post` + `builds/_rules-readout` + `builds/_tail` + `builds/_frame` + `builds/_end` + `builds/_responsive` + `builds/_hub-spectacle` + `builds/_reduce` (`self` = the chunk files of this folder; `builds/_stub`, `builds/_one-col`, `builds/_drive`, `builds/_shim-latency` and `builds/_demo-odometer` are small harness units that exist only for standalone pages and are not part of the section).
Rebuild with `node jev/build-components.mjs --only builds/hub`.

## Reuse elsewhere
Copy this folder and every unit folder listed in `compose`, plus the shared runtime `src/js/engine.js`, `src/js/core.js`, `src/css/base.css` (and `fx.js` / `fx.css` when `needs.fx` is true: the `.rv` reveal is driven by it); join the chunks in `compose` order (html, css, js each joined with ''), put the js in one <script> and call `JEV.boot()`. Everything is simulated; feed real data with `JEV.bus.emit('decision', d)`.
