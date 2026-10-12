# typing-engine

The per-token typing engine behind the editor panes: it reveals code character by character with a caret that rides the text, free indentation, a short pause between lines and a speed multiplier. Every simulated decision is typed in as a new highlighted line (the last three stay).

## Reuse
Copy this folder (`component.html`, `component.css`, `component.js`, `component.json`) next to the shared runtime files `engine.js`, `core.js` and `base.css`, inline them in that order (css, html, then `engine.js` -> `core.js` -> `component.js`) and call `JEV.boot()` once. `build-components.mjs` does exactly this and writes `index.html` next to this README.

## Markup / classes / CSS variables
Build one `.cx-te-ln` per line with a `<span class="code-<c>">` per token (text node empty). The engine walks `li` (line) / `ti` (token) / `ci` (char), writes `nodeValue = t.slice(0, ci)` and moves one `.code-caret` after the current token. `.code-typing` on the pane stops the caret blinking while it types. Speed = `BASE * speed` chars per second; tweak `BASE`. Tokens come from the shared `hl()` highlighter (see `code/highlighter`).

## Data it consumes
Bus `decision` (`symbol action conf dest`). Respects `JEV.reduce` (types nothing, fills instantly) and is frame-gated by `JEV.task`.

## Swap in real data
Replace `SRC` with your own text, or call `addLine(text, true)` whenever your own backend produces a line (log line, model output, command); the engine types whatever lines exist.
