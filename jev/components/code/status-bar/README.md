# status-bar

The status bar of the jev-starter window: a lamp plus status text (flashes "build ok" when a decision executes), the current floor and kill-switch state, and three queue counters with a proportional bar that always show where simulated decisions landed. Counters bump when they change.

## Reuse
Copy this folder (`component.html`, `component.css`, `component.js`, `component.json`) next to the shared runtime files `engine.js`, `core.js` and `base.css`, inline them in that order (css, html, then `engine.js` -> `core.js` -> `component.js`) and call `JEV.boot()` once. `build-components.mjs` does exactly this and writes `index.html` next to this README.

## Markup / classes / CSS variables
`.code-status` > `.code-st-a` (lamp + `.code-st-t` text), `.code-st-b` (`.code-fl`, `.code-kl`), `.code-st-q` > three `.code-q` blocks with `.code-n-x/-r/-s` and `.code-qbar > i.x/.r/.s` (flex-grow = share). Colours are hard-coded black/white on the hot-pink gradient; under `body.killed` the bar turns orange-red.

## Data it consumes
`JEV.S.dest {execute, review, skip}`, `JEV.S.floor`, `JEV.S.killed`; bus `decision` (`dest`, `reason`), `kill`, `floor`.

## Swap in real data
Set the three counter numbers from your order router (`nX.textContent = filled`) and floor/kill from your risk service; the bar proportions follow the counts via `flex-grow`.
