# window-bar

The title bar of the jev-starter window: pink and white traffic-light dots, a breadcrumb of file tabs that light up one after another when a decision passes through, a hairline of light travelling along the bottom edge and a 16-bar audio glyph that breathes and jumps.

## Reuse
Copy this folder (`component.html`, `component.css`, `component.js`, `component.json`) next to the shared runtime files `engine.js`, `core.js` and `base.css`, inline them in that order (css, html, then `engine.js` -> `core.js` -> `component.js`) and call `JEV.boot()` once. `build-components.mjs` does exactly this and writes `index.html` next to this README.

## Markup / classes / CSS variables
`.code-bar` > `.code-dots`, `.code-title` (with `.code-tab[data-t]` entries) and `<canvas class="code-eq">`. Add `.hot` to a tab to light it; the module does that for 0.75 s per hop. The `.code-win` wrapper is only the demo frame. Under `body.killed` the frame and hairline turn red.

## Data it consumes
Bus `decision` (timing only, the payload is not read), `kill` (bool, via `JEV.S.killed`).

## Swap in real data
Call `tab("desk")` from your own events (a file opened, a job ran) and bump `act` (0..1) to make the bars jump with real throughput, e.g. `act = Math.min(1, msgsPerSecond / 50)` each second.
