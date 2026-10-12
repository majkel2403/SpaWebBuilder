# code/phosphor-log

The terminal phosphor afterglow, CRT vignette and scanlines css (markup inside code/terminal).

**This is a chunk of the `code/full-section` section** (derived component, `"derived": true`). Its files hold the REAL source that the main page is built from; the section is the concatenation of these chunks, byte for byte identical to the original. Chunk kinds here: css.

## Use standalone
The chunks are pieces of one closure (`JEV.mod('code', ...)`), so they are not valid alone. Its `compose` list in `component.json` names every unit the standalone page needs (head, panes, hidden helper units, tail); `node jev/build-components.mjs --only code/phosphor-log` assembles them into `index.html`.
To reuse elsewhere copy this folder, the units listed in `compose` (all under `components/code/`) and the shared runtime `src/js/engine.js`, `src/js/core.js`, `src/css/base.css`; concatenate the chunks of each kind in the compose order and call `JEV.boot()`.
Note: the code is tightly coupled (one shared closure), so the standalone page shows the whole editor window, not only this piece.

Data consumed: `JEV.bus` events `decision`, `kill`, `floor`, `JEV.S`, `JEV.recent` (see code/code-window README).
Edit here: changes to these files change the main page after `node jev/build.mjs`.
