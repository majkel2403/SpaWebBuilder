# lab / decision-tape

The TAPE card: last five lab decisions (click a row to restore its inputs) with copy-link and copy-json buttons.

**This is a chunk of the `lab/full-section` source, not a copy.** The lab page is assembled from the chunks of its units (see `components/UNITS.md`); editing this folder changes the page, and the standalone page below is built from the very same chunks.

* own chunks: html, css, js
* satellite chunks (hidden units that hold other pieces of this atom's code, kept apart only because the original file interleaves them): `lab/_tape-restore`, `lab/_copy`, `lab/_detail-tape`
* standalone page (`index.html`, built by `node jev/build-components.mjs --only lab/decision-tape`): the `order` lists in `component.json` give, per kind, the units it is made of: the shared head (`lab/_head`, `_config`, `_refs`, `_decision`, `_render`, `_tail` ...), the real chunks of this atom, and `lab/_demo` (cycles the scenarios so a lone atom is alive).
* The lab script is one closure over every part of the lab, so every standalone page runs the whole script; parts that are not this atom are present but wrapped in a hidden container (`lab/_hide-open` ... `lab/_hide-close`).

## Reuse elsewhere
Copy this folder, the folders of the units listed in `component.json` `order` (they are all under `components/lab/`) and the shared runtime `src/js/engine.js`, `src/js/core.js`, `src/css/base.css`, then call `JEV.boot()`.

## Data
Everything is simulated. The lab drives the real engine (`JEV.decide`) from its own sliders; it listens to the bus events `floor` and `kill` and publishes every committed decision as a `decision` event.
